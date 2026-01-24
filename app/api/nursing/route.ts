import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Generate a random 4-digit code
function generateCode(): string {
    return Math.floor(1000 + Math.random() * 9000).toString();
}

// GET /api/nursing - Admin Panel: Get all nurses, patients, assignments
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const nurseId = searchParams.get('nurseId');

        // Get active IPD encounters with patient info
        const encounters = await prisma.encounter.findMany({
            where: { status: 'ACTIVE', type: 'IPD' },
            include: {
                patient: { include: { allergies: { where: { isActive: true } } } },
                bedAssignments: { where: { endTime: null }, include: { bed: true } },
                vitalSigns: { orderBy: { recordedAt: 'desc' }, take: 1 },
                clinicalNotes: { orderBy: { createdAt: 'desc' }, take: 3, where: { authorRole: 'Doctor' } },
            },
        });

        // Get nurse-patient assignments
        const encounterIds = encounters.map(e => e.id);
        const assignments = await prisma.nursePatientAssignment.findMany({
            where: { encounterId: { in: encounterIds }, isActive: true },
        });

        const assignmentMap = new Map(assignments.map(a => [a.encounterId, a]));

        // Enrich encounters with assignments
        const enrichedEncounters = encounters.map(enc => ({
            ...enc,
            assignedNurse: assignmentMap.get(enc.id) || null,
        }));

        // Get all nurses on duty today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const nursesOnDuty = await prisma.nurseDuty.findMany({
            where: { shiftDate: { gte: today, lt: tomorrow }, isActive: true },
            orderBy: { nurseName: 'asc' },
        });

        // Get assignment counts per nurse
        const nurseIds = nursesOnDuty.map(d => d.nurseId);
        const assignmentCounts = await prisma.nursePatientAssignment.groupBy({
            by: ['nurseId'],
            where: { nurseId: { in: nurseIds }, isActive: true },
            _count: { id: true },
        });

        const countMap = new Map(assignmentCounts.map(a => [a.nurseId, a._count.id]));

        // Get secret codes for each nurse from verification table
        const verifications = await prisma.nurseVerification.findMany({
            where: { nurseId: { in: nurseIds }, shiftDate: { gte: today, lt: tomorrow } },
            orderBy: { verifiedAt: 'desc' },
        });

        // Use the active code from NurseDuty or the last used code from verification
        const codeMap = new Map();

        nursesOnDuty.forEach(duty => {
            if (duty.secretCode) {
                codeMap.set(duty.nurseId, duty.secretCode);
            }
        });

        const nursesWithData = nursesOnDuty.map(nurse => ({
            ...nurse,
            assignmentCount: countMap.get(nurse.nurseId) || 0,
            secretCode: nurse.secretCode || null,
            hasCode: !!nurse.secretCode,
        }));

        // Get care plans
        const carePlans = await prisma.carePlan.findMany({
            where: { encounterId: { in: encounterIds }, status: 'active' },
        });
        const carePlanMap = new Map(carePlans.map(cp => [cp.encounterId, cp]));

        // Get shift handovers
        const handovers = await prisma.shiftHandover.findMany({
            orderBy: { handoverAt: 'desc' },
            take: 10,
        });

        return NextResponse.json({
            data: {
                activePatients: enrichedEncounters.map(enc => ({
                    ...enc,
                    carePlan: carePlanMap.get(enc.id) || null,
                })),
                nursesOnDuty: nursesWithData,
                recentHandovers: handovers,
            },
        });
    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json({ error: 'Failed to fetch nursing data' }, { status: 500 });
    }
}

// POST /api/nursing - Handle various admin actions
export async function POST(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const action = searchParams.get('action');
        const body = await request.json();

        // Generate unique code for a nurse
        if (action === 'generate-code') {
            const { nurseId, nurseName } = body;
            const code = generateCode();

            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            // Update the NurseDuty record with the code
            const existingDuty = await prisma.nurseDuty.findFirst({
                where: { nurseId, shiftDate: { gte: today, lt: tomorrow } }
            });

            if (existingDuty) {
                await prisma.nurseDuty.update({
                    where: { id: existingDuty.id },
                    data: { secretCode: code }
                });
            } else {
                // Create a duty entry if one doesn't exist
                await prisma.nurseDuty.create({
                    data: {
                        nurseId,
                        nurseName,
                        shiftType: 'DAY', // Default
                        shiftDate: today,
                        secretCode: code,
                        isActive: true
                    }
                });
            }

            // Log event
            await prisma.auditEvent.create({
                data: {
                    entityType: 'NurseCode',
                    entityId: nurseId,
                    action: 'generate',
                    performedBy: 'Admin',
                    metadata: { nurseName },
                },
            });

            return NextResponse.json({ data: { code }, message: `Code ${code} generated for ${nurseName}` }, { status: 201 });
        }

        // Assign nurse to patient
        if (action === 'assign') {
            const { nurseId, nurseName, encounterId, patientId } = body;

            // Deactivate existing assignments for this patient
            await prisma.nursePatientAssignment.updateMany({
                where: { encounterId, isActive: true },
                data: { isActive: false, endTime: new Date() },
            });

            // Create new assignment
            const assignment = await prisma.nursePatientAssignment.create({
                data: { nurseId, nurseName, encounterId, patientId, assignedBy: 'Admin' },
            });

            await prisma.auditEvent.create({
                data: {
                    entityType: 'NursePatientAssignment',
                    entityId: assignment.id,
                    action: 'assign',
                    performedBy: 'Admin',
                    metadata: { nurseId, nurseName, patientId, encounterId },
                },
            });

            return NextResponse.json({ data: assignment, message: `${nurseName} assigned to patient` }, { status: 201 });
        }

        // Handover
        if (action === 'handover') {
            const handover = await prisma.shiftHandover.create({
                data: {
                    encounterId: body.encounterId,
                    outgoingNurse: body.outgoingNurse,
                    incomingNurse: body.incomingNurse,
                    patientSummary: body.patientSummary,
                    pendingTasks: body.pendingTasks || [],
                    alerts: body.alerts || [],
                    handoverNotes: body.handoverNotes,
                    criticalAlerts: body.criticalAlerts || [],
                },
            });

            return NextResponse.json({ data: handover }, { status: 201 });
        }

        // Administer medication
        if (action === 'administer') {
            const admin = await prisma.medicationAdministration.create({
                data: {
                    prescriptionMedicationId: body.medicationId,
                    encounterId: body.encounterId,
                    administeredBy: body.administeredBy,
                    dose: body.dose,
                    route: body.route,
                    site: body.site,
                    status: body.status,
                    notes: body.notes,
                },
            });

            return NextResponse.json({ data: admin }, { status: 201 });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
