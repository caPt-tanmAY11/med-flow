import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/nursing - Get nursing tasks and assignments
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const encounterId = searchParams.get('encounterId');
        const nurseId = searchParams.get('nurseId');
        const shift = searchParams.get('shift');

        // Get active encounters with pending tasks
        const encounters = await prisma.encounter.findMany({
            where: {
                status: 'ACTIVE',
                type: 'IPD',
            },
            include: {
                patient: {
                    include: { allergies: { where: { isActive: true } } },
                },
                bedAssignments: {
                    where: { endTime: null },
                    include: { bed: true },
                },
                vitalSigns: { orderBy: { recordedAt: 'desc' }, take: 1 },
                prescriptions: {
                    where: { status: 'active' },
                    include: { medications: { where: { isDispensed: true } } },
                },
            },
        });

        // Get pending medication administrations
        const pendingMeds = await prisma.prescriptionMedication.findMany({
            where: {
                isDispensed: true,
                prescription: { status: 'active' },
            },
            include: {
                prescription: {
                    include: {
                        patient: { select: { uhid: true, name: true } },
                        encounter: {
                            include: {
                                bedAssignments: { where: { endTime: null }, include: { bed: true } },
                            },
                        },
                    },
                },
                medicationAdministrations: { orderBy: { administeredAt: 'desc' }, take: 1 },
            },
        });

        // Get shift handovers
        const recentHandovers = await prisma.shiftHandover.findMany({
            orderBy: { handoverAt: 'desc' },
            take: 10,
        });

        return NextResponse.json({
            data: {
                activePatients: encounters,
                pendingMedications: pendingMeds,
                recentHandovers,
            },
        });
    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}

// POST /api/nursing - Create shift handover or administer medication
export async function POST(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const action = searchParams.get('action');
        const body = await request.json();

        if (action === 'handover') {
            const handover = await prisma.shiftHandover.create({
                data: {
                    encounterId: body.encounterId,
                    outgoingNurse: body.outgoingNurse,
                    incomingNurse: body.incomingNurse,
                    patientSummary: body.patientSummary,
                    pendingTasks: body.pendingTasks || [],
                    alerts: body.alerts || [],
                },
            });
            return NextResponse.json({ data: handover }, { status: 201 });
        }

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
