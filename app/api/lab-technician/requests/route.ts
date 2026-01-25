import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/lab-technician/requests - All pending requests with patient info
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status') || 'pending';
        const priority = searchParams.get('priority');
        const type = searchParams.get('type'); // LAB or RADIOLOGY
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '50');

        // Build where clause
        const where: {
            status?: string | { in: string[] };
            priority?: 'STAT' | 'URGENT' | 'ROUTINE';
            LabTest?: { type: string };
        } = {};

        if (status === 'all') {
            where.status = { in: ['pending', 'sample_collected', 'processing', 'completed'] };
        } else {
            where.status = status;
        }

        if (priority) where.priority = priority as 'STAT' | 'URGENT' | 'ROUTINE';
        if (type) where.LabTest = { type };

        const [requests, total, stats] = await Promise.all([
            prisma.labTestOrder.findMany({
                where,
                orderBy: [
                    { priority: 'asc' }, // STAT first
                    { createdAt: 'asc' }, // Oldest first within same priority
                ],
                skip: (page - 1) * limit,
                take: limit,
                include: {
                    LabTest: {
                        include: {
                            LabTestResultField: {
                                orderBy: { sortOrder: 'asc' },
                            },
                        },
                    },
                    Patient: {
                        select: {
                            id: true,
                            uhid: true,
                            name: true,
                            gender: true,
                            dob: true,
                            contact: true,
                            allergies: {
                                where: { isActive: true },
                                select: {
                                    allergen: true,
                                    severity: true,
                                    reaction: true,
                                },
                            },
                            PatientImplant: true,
                        },
                    },
                },
            }),
            prisma.labTestOrder.count({ where }),
            prisma.labTestOrder.groupBy({
                by: ['status'],
                where: { status: { in: ['pending', 'sample_collected', 'processing', 'completed'] } },
                _count: { id: true },
            }),
        ]);

        // Format requests with safety alerts
        const formattedRequests = requests.map(req => ({
            ...req,
            safetyAlerts: {
                hasAllergies: req.hasAllergies || req.Patient.allergies.length > 0,
                allergies: req.Patient.allergies,
                hasImplants: req.hasImplants || req.Patient.PatientImplant.length > 0,
                implants: req.Patient.PatientImplant,
                isRadiology: req.LabTest.type === 'RADIOLOGY',
                requiresMRISafetyCheck: req.LabTest.code.includes('MRI') && (req.hasImplants || req.Patient.PatientImplant.length > 0),
            },
        }));

        return NextResponse.json({
            data: formattedRequests,
            stats: {
                byStatus: stats.reduce((acc, s) => ({ ...acc, [s.status]: s._count.id }), {}),
                total,
            },
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        });
    } catch (error) {
        console.error('Error fetching technician requests:', error);
        return NextResponse.json({ error: 'Failed to fetch requests' }, { status: 500 });
    }
}

// PATCH /api/lab-technician/requests - Update request status
export async function PATCH(request: NextRequest) {
    try {
        const body = await request.json();
        const { orderId, status, assignedTo, collectedBy } = body;

        if (!orderId) {
            return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
        }

        const updateData: {
            status?: string;
            assignedTo?: string;
            collectedBy?: string;
            collectedAt?: Date;
        } = {};

        if (status) updateData.status = status;
        if (assignedTo) updateData.assignedTo = assignedTo;
        if (collectedBy) {
            updateData.collectedBy = collectedBy;
            updateData.collectedAt = new Date();
        }

        const order = await prisma.labTestOrder.update({
            where: { id: orderId },
            data: updateData,
            include: {
                LabTest: true,
                Patient: {
                    select: { uhid: true, name: true },
                },
            },
        });

        return NextResponse.json({ data: order });
    } catch (error) {
        console.error('Error updating request:', error);
        return NextResponse.json({ error: 'Failed to update request' }, { status: 500 });
    }
}
