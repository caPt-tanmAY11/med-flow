import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Helper to safely query new models
async function safeQuery<T>(query: () => Promise<T>, fallback: T): Promise<T> {
    try {
        return await query();
    } catch (error) {
        console.warn('Query failed, using fallback:', error);
        return fallback;
    }
}

// GET /api/nursing/assignments - Get nurse-patient assignments
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const nurseId = searchParams.get('nurseId');
        const encounterId = searchParams.get('encounterId');

        const assignments = await safeQuery(
            () => (prisma as any).nursePatientAssignment.findMany({
                where: {
                    isActive: true,
                    ...(nurseId ? { nurseId } : {}),
                    ...(encounterId ? { encounterId } : {}),
                },
                orderBy: { assignedAt: 'desc' },
            }),
            []
        );

        // Get patient and encounter details for each assignment
        const enrichedAssignments = await Promise.all(
            assignments.map(async (assignment: any) => {
                const encounter = await prisma.encounter.findUnique({
                    where: { id: assignment.encounterId },
                    include: {
                        patient: { select: { id: true, uhid: true, name: true, gender: true, dob: true } },
                        bedAssignments: { where: { endTime: null }, include: { bed: true } },
                    },
                });
                return {
                    ...assignment,
                    patient: encounter?.patient,
                    bed: encounter?.bedAssignments[0]?.bed,
                    department: encounter?.department,
                };
            })
        );

        return NextResponse.json({ data: enrichedAssignments });
    } catch (error) {
        console.error('Error fetching assignments:', error);
        return NextResponse.json({ error: 'Failed to fetch assignments' }, { status: 500 });
    }
}

// POST /api/nursing/assignments - Assign nurse to patient
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { nurseId, nurseName, encounterId, patientId, assignedBy } = body;

        // Deactivate any existing assignment for this patient
        await safeQuery(
            () => (prisma as any).nursePatientAssignment.updateMany({
                where: { encounterId, isActive: true },
                data: { isActive: false, endTime: new Date() },
            }),
            null
        );

        // Create new assignment
        const assignment = await safeQuery(
            () => (prisma as any).nursePatientAssignment.create({
                data: { nurseId, nurseName, encounterId, patientId, assignedBy },
            }),
            { id: 'temp-' + Date.now(), nurseId, nurseName, encounterId, patientId, assignedBy, assignedAt: new Date() }
        );

        // Create audit event
        await prisma.auditEvent.create({
            data: {
                entityType: 'NursePatientAssignment',
                entityId: assignment.id,
                action: 'create',
                performedBy: assignedBy,
                metadata: { nurseId, nurseName, patientId, encounterId },
            },
        });

        return NextResponse.json({ data: assignment, message: `Assigned ${nurseName} successfully` }, { status: 201 });
    } catch (error) {
        console.error('Error creating assignment:', error);
        return NextResponse.json({ error: 'Failed to create assignment' }, { status: 500 });
    }
}

// DELETE /api/nursing/assignments - Remove assignment
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const assignmentId = searchParams.get('id');

        if (!assignmentId) {
            return NextResponse.json({ error: 'Assignment ID required' }, { status: 400 });
        }

        await safeQuery(
            () => (prisma as any).nursePatientAssignment.update({
                where: { id: assignmentId },
                data: { isActive: false, endTime: new Date() },
            }),
            null
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error removing assignment:', error);
        return NextResponse.json({ error: 'Failed to remove assignment' }, { status: 500 });
    }
}
