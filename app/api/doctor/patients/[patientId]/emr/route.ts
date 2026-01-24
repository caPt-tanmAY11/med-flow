import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/doctor/patients/[patientId]/emr - Get complete EMR for a patient
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ patientId: string }> }
) {
    try {
        const { patientId } = await params;

        // Verify patient exists
        const patient = await prisma.patient.findUnique({
            where: { id: patientId },
            include: {
                allergies: {
                    where: { isActive: true },
                    orderBy: { createdAt: 'desc' },
                },
            },
        });

        if (!patient) {
            return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
        }

        // Get all encounters with details
        const encounters = await prisma.encounter.findMany({
            where: { patientId },
            orderBy: { arrivalTime: 'desc' },
            include: {
                bedAssignments: {
                    where: { endTime: null },
                    include: {
                        bed: {
                            select: { id: true, bedNumber: true, ward: true, type: true },
                        },
                    },
                },
                clinicalNotes: {
                    orderBy: { createdAt: 'desc' },
                    take: 20,
                    select: {
                        id: true,
                        noteType: true,
                        content: true,
                        authorId: true,
                        authorRole: true,
                        createdAt: true,
                        updatedAt: true,
                    },
                },
                prescriptions: {
                    orderBy: { prescribedAt: 'desc' },
                    include: {
                        medications: true,
                    },
                },
                vitalSigns: {
                    orderBy: { recordedAt: 'desc' },
                    take: 10,
                },
                orders: {
                    orderBy: { orderedAt: 'desc' },
                    include: {
                        labResult: true,
                        radiologyResult: true,
                    },
                },
            },
        });

        // Collect all lab results
        const labResults = encounters.flatMap(enc =>
            enc.orders
                .filter(order => order.orderType === 'lab' && order.labResult)
                .map(order => ({
                    orderId: order.id,
                    orderCode: order.orderCode,
                    orderName: order.orderName,
                    priority: order.priority,
                    orderedAt: order.orderedAt,
                    status: order.status,
                    encounterId: enc.id,
                    encounterType: enc.type,
                    result: order.labResult,
                }))
        );

        // Collect all radiology results
        const radiologyResults = encounters.flatMap(enc =>
            enc.orders
                .filter(order => order.orderType === 'radiology' && order.radiologyResult)
                .map(order => ({
                    orderId: order.id,
                    orderCode: order.orderCode,
                    orderName: order.orderName,
                    priority: order.priority,
                    orderedAt: order.orderedAt,
                    status: order.status,
                    encounterId: enc.id,
                    encounterType: enc.type,
                    result: order.radiologyResult,
                }))
        );

        // Collect all clinical notes across encounters
        const clinicalNotes = encounters.flatMap(enc =>
            enc.clinicalNotes.map(note => ({
                ...note,
                encounterId: enc.id,
                encounterType: enc.type,
            }))
        );

        // Collect all prescriptions
        const prescriptions = encounters.flatMap(enc =>
            enc.prescriptions.map(prescription => ({
                ...prescription,
                encounterType: enc.type,
            }))
        );

        // Collect recent vitals
        const vitalSigns = encounters.flatMap(enc =>
            enc.vitalSigns.map(vital => ({
                ...vital,
                encounterType: enc.type,
            }))
        ).slice(0, 20);

        return NextResponse.json({
            data: {
                patient: {
                    id: patient.id,
                    uhid: patient.uhid,
                    name: patient.name,
                    dob: patient.dob,
                    gender: patient.gender,
                    bloodGroup: patient.bloodGroup,
                    contact: patient.contact,
                    allergies: patient.allergies,
                },
                encounters: encounters.map(enc => ({
                    id: enc.id,
                    type: enc.type,
                    status: enc.status,
                    department: enc.department,
                    arrivalTime: enc.arrivalTime,
                    admissionTime: enc.admissionTime,
                    dischargeTime: enc.dischargeTime,
                    createdAt: enc.createdAt,
                    updatedAt: enc.updatedAt,
                    currentBed: enc.bedAssignments[0]?.bed || null,
                })),
                clinicalNotes,
                prescriptions,
                labResults,
                radiologyResults,
                vitalSigns,
            },
        });
    } catch (error) {
        console.error('Error fetching patient EMR:', error);
        return NextResponse.json({ error: 'Failed to fetch patient EMR' }, { status: 500 });
    }
}
