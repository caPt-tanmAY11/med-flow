
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET: Fetch active IPD/Emergency patients + current assignments
export async function GET(request: NextRequest) {
    try {
        const patients = await prisma.encounter.findMany({
            where: {
                status: 'ACTIVE',
                // We typically want IPD or Emergency patients who need nursing care
                type: { in: ['IPD', 'EMERGENCY'] }
            },
            include: {
                patient: {
                    select: {
                        id: true,
                        name: true,
                        uhid: true,
                        gender: true,
                        dob: true,
                        bloodGroup: true,
                        allergies: true,
                    }
                },
                bedAssignments: {
                    orderBy: { startTime: 'desc' },
                    take: 1,
                    include: { bed: true }
                },
                // We can't directly include NursePatientAssignment on Encounter easily if the relation isn't direct in schema
                // But the schema says NursePatientAssignment has encounterId.
                // Let's check relation. The schema has no inverse relation on Encounter to NursePatientAssignment.
                // So we'll fetch assignments separately or do a manual join logic if needed.
                // Actually, let's fetch assignments and map them.
            },
            orderBy: { arrivalTime: 'desc' }
        });

        // Fetch active assignments
        const activeAssignments = await prisma.nursePatientAssignment.findMany({
            where: {
                isActive: true,
                encounterId: { in: patients.map(p => p.id) }
            }
        });

        const assignmentMap = new Map(activeAssignments.map(a => [a.encounterId, a]));

        // Combine
        const data = patients.map(p => ({
            id: p.id, // encounterId
            patient: p.patient,
            bed: p.bedAssignments[0]?.bed || null,
            status: p.status,
            type: p.type,
            admissionTime: p.admissionTime,
            assignedNurse: assignmentMap.get(p.id) || null
        }));

        return NextResponse.json({ data });

    } catch (error) {
        console.error('Error fetching assignments:', error);
        return NextResponse.json({ error: 'Failed to fetch patients' }, { status: 500 });
    }
}

// POST: Assign a nurse to a patient
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { nurseId, nurseName, encounterId, patientId, shiftType } = body;

        if (!nurseId || !encounterId || !patientId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // 1. Deactivate existing active assignment for this encounter
        // (Assuming 1 nurse per patient for simplicity, or we can allow multiple)
        // Usually better to have one primary nurse.
        await prisma.nursePatientAssignment.updateMany({
            where: { encounterId, isActive: true },
            data: { isActive: false, endTime: new Date() }
        });

        // 2. Create new assignment
        const assignment = await prisma.nursePatientAssignment.create({
            data: {
                nurseId,
                nurseName,
                encounterId,
                patientId,
                assignedBy: 'ADMIN', // Or get from session
                isActive: true,
            }
        });

        // 3. Just to be safe, update the nurse duty to reflect they have a patient? 
        // Not strictly enforced by schema relation, but good to know.
        // Schema doesn't track "count" directly except in API view logic.

        return NextResponse.json({ data: assignment, message: 'Nurse assigned successfully' });

    } catch (error) {
        console.error('Error assigning nurse:', error);
        return NextResponse.json({ error: 'Failed to assign nurse' }, { status: 500 });
    }
}
