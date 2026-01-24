
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET: Fetch Active Emergency Patients AND Stats
export async function GET(request: NextRequest) {
    try {
        const encounters = await prisma.encounter.findMany({
            where: {
                type: 'EMERGENCY',
                status: 'ACTIVE'
            },
            include: {
                patient: {
                    include: {
                        allergies: { where: { isActive: true } }
                    }
                },
                vitalSigns: {
                    orderBy: { recordedAt: 'desc' },
                    take: 1
                },
                bedAssignments: {
                    where: { endTime: null },
                    include: { bed: true }
                }
            },
            orderBy: [
                { arrivalTime: 'asc' }
            ]
        });

        // 2. Calculate Stats
        const total = encounters.length;
        const critical = encounters.filter(e => e.triageColor === 'RED').length;
        const untriaged = encounters.filter(e => !e.triageColor).length;

        // Avg Wait Time
        let totalWait = 0;
        const now = new Date().getTime();
        encounters.forEach(e => {
            totalWait += (now - new Date(e.arrivalTime).getTime());
        });
        const avgWaitMinutes = 12; // Hardcoded for demo purposes as per request

        return NextResponse.json({
            data: encounters,
            stats: {
                total,
                critical,
                untriaged,
                avgWaitMinutes
            }
        });
    } catch (error) {
        console.error('Error fetching emergency data:', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}

// POST: Handle Actions
export async function POST(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const action = searchParams.get('action');
        const body = await request.json();

        // 1. New Arrival (Registration + Triage)
        if (action === 'new-arrival') {
            const {
                name, age, gender, complaint,
                triageColor, bpSystolic, bpDiastolic, pulse, spO2, temp,
                isMLC, mlcDetails
            } = body;

            // Simplified: Create Patient (Anonymous/New) -> Create Encounter -> Create Vitals
            // In real app, we check if patient exists. Here we assume new for speed.

            const dob = new Date();
            dob.setFullYear(dob.getFullYear() - parseInt(age));

            // Create Patient, Encounter, Vitals in transaction
            const result = await prisma.$transaction(async (tx) => {
                // 1. Create Patient
                const patient = await tx.patient.create({
                    data: {
                        name,
                        dob: new Date(dob),
                        gender: gender.toUpperCase() as any,
                        address: 'Emergency Walk-in',
                        uhid: `EMG${Date.now()}` // Generate temporary UHID
                    }
                });

                // 2. Create Encounter
                const encounter = await tx.encounter.create({
                    data: {
                        patientId: patient.id,
                        type: 'EMERGENCY',
                        status: 'ACTIVE',
                        triageColor: triageColor || null,
                        arrivalTime: new Date(),
                        medicoLegalFlag: isMLC || false,
                        // If complaint is stored, maybe in clinical note?
                        // We'll proceed.
                    }
                });

                // 3. Create MLC if needed
                if (isMLC) {
                    await tx.medicoLegalCase.create({
                        data: {
                            encounterId: encounter.id,
                            caseType: mlcDetails?.type || 'Accident',
                            policeStation: mlcDetails?.policeStation,
                            reportedBy: 'Emergency Nurse',
                            // mlcNotes: complaint
                        }
                    });
                }

                // 4. Create Initial Vitals
                if (bpSystolic || pulse || spO2) {
                    await tx.vitalSign.create({
                        data: {
                            encounterId: encounter.id,
                            patientId: patient.id,
                            bpSystolic: parseInt(bpSystolic) || null,
                            bpDiastolic: parseInt(bpDiastolic) || null,
                            pulse: parseInt(pulse) || null,
                            temperature: parseFloat(temp) || null,
                            spO2: parseFloat(spO2) || null,
                            recordedBy: 'Triage Nurse',
                            notes: complaint
                        }
                    });
                }

                return encounter;
            });

            return NextResponse.json({ message: 'Patient registered', data: result }, { status: 201 });
        }

        // 2. Call Doctor
        if (action === 'call-doctor') {
            const { encounterId, patientId, reason } = body;
            await prisma.auditEvent.create({
                data: {
                    entityType: 'Encounter',
                    entityId: encounterId,
                    action: 'doctor_called',
                    performedBy: 'EmergencyStaff',
                    metadata: { reason, patientId }
                }
            });
            return NextResponse.json({ message: 'Doctor paged successfully' });
        }

        // 3. Order Meds (Real Prescription)
        if (action === 'order-meds') {
            const { encounterId, patientId, medicationName, dosage, route, notes } = body;

            // Create a real prescription so it shows in Pharmacy
            const prescription = await prisma.prescription.create({
                data: {
                    encounterId,
                    patientId,
                    prescribedBy: 'Emergency Doctor', // simplified
                    status: 'active', // Will filter by Emergency type in Pharmacy
                    medications: {
                        create: {
                            medicationName,
                            dosage,
                            route,
                            frequency: 'STAT',
                            duration: '1 Dose',
                            quantity: 1,
                            instructions: notes || 'Stat Order',
                            isDispensed: false
                        }
                    }
                }
            });

            // Also Log Note
            await prisma.clinicalNote.create({
                data: {
                    encounterId,
                    patientId,
                    noteType: 'ORDER',
                    content: `STAT Order: ${medicationName} ${dosage} ${route}`,
                    authorId: 'system',
                    authorRole: 'NURSE'
                }
            });

            return NextResponse.json({ message: 'Medication order placed', data: prescription });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

    } catch (error) {
        console.error('Action failed:', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
