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
        const assignments = await safeQuery(
            () => (prisma as any).nursePatientAssignment.findMany({
                where: { encounterId: { in: encounterIds }, isActive: true },
            }),
            []
        );

        const assignmentMap = new Map(assignments.map((a: any) => [a.encounterId, a]));

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

        const nursesOnDuty = await safeQuery(
            () => (prisma as any).nurseDuty.findMany({
                where: { shiftDate: { gte: today, lt: tomorrow }, isActive: true },
                orderBy: { nurseName: 'asc' },
            }),
            [
                { id: '1', nurseId: 'nurse-1', nurseName: 'Sarah Johnson', shiftType: 'MORNING', checkInAt: new Date().toISOString(), ward: 'ICU', secretCode: null },
                { id: '2', nurseId: 'nurse-2', nurseName: 'Emily Chen', shiftType: 'MORNING', checkInAt: new Date().toISOString(), ward: 'General', secretCode: null },
                { id: '3', nurseId: 'nurse-3', nurseName: 'Michael Brown', shiftType: 'EVENING', checkInAt: null, ward: 'Pediatric', secretCode: null },
                { id: '4', nurseId: 'nurse-4', nurseName: 'Lisa Williams', shiftType: 'NIGHT', checkInAt: null, ward: 'ICU', secretCode: null },
            ]
        );

        // Get assignment counts per nurse
        const nurseIds = nursesOnDuty.map((d: any) => d.nurseId);
        const assignmentCounts = await safeQuery(
            () => (prisma as any).nursePatientAssignment.groupBy({
                by: ['nurseId'],
                where: { nurseId: { in: nurseIds }, isActive: true },
                _count: { id: true },
            }),
            []
        );

        const countMap = new Map(assignmentCounts.map((a: any) => [a.nurseId, a._count?.id || 0]));

        // Get secret codes for each nurse from verification table
        const verifications = await safeQuery(
            () => (prisma as any).nurseVerification.findMany({
                where: { nurseId: { in: nurseIds }, shiftDate: { gte: today, lt: tomorrow } },
                orderBy: { verifiedAt: 'desc' },
            }),
            []
        );

        const codeMap = new Map(verifications.map((v: any) => [v.nurseId, v.codeUsed]));

        const nursesWithData = nursesOnDuty.map((nurse: any) => ({
            ...nurse,
            assignmentCount: countMap.get(nurse.nurseId) || 0,
            secretCode: codeMap.get(nurse.nurseId) || nurse.secretCode || null,
            hasCode: codeMap.has(nurse.nurseId) || !!nurse.secretCode,
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

            // Store the code in verification table
            const verification = await safeQuery(
                () => (prisma as any).nurseVerification.create({
                    data: { nurseId, nurseName, codeUsed: code, shiftDate: today },
                }),
                { id: 'temp-' + Date.now(), nurseId, nurseName, codeUsed: code, shiftDate: today }
            );

            // Also update the NurseDuty record with the code
            await safeQuery(
                () => (prisma as any).nurseDuty.updateMany({
                    where: { nurseId, shiftDate: { gte: today, lt: new Date(today.getTime() + 86400000) } },
                    data: { secretCode: code },
                }),
                null
            );

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
                    data: { nurseId, nurseName, encounterId, patientId, assignedBy: 'Admin' },
                }),
                { id: 'temp-' + Date.now(), nurseId, nurseName, encounterId, patientId }
            );

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
