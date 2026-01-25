import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/pharmacy/orders - List prescriptions pending dispensing
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type'); // OPD, IPD, EMERGENCY
        const status = searchParams.get('status') || 'pending'; // pending, completed
        const patientId = searchParams.get('patientId');

        const where: any = {
            status: 'active',
            medications: {
                some: {
                    dispenseStatus: status === 'completed' ? 'completed' : { in: ['pending', 'partial'] },
                },
            },
        };

        if (patientId) {
            where.patientId = patientId;
        }

        if (type) {
            where.encounter = {
                type: type,
            };
        }

        const orders = await prisma.prescription.findMany({
            where,
            include: {
                patient: {
                    select: {
                        id: true,
                        name: true,
                        uhid: true,
                        gender: true,
                        dob: true,
                    },
                },
                encounter: {
                    select: {
                        id: true,
                        type: true,
                        department: true,
                        paymentStatus: true,
                    },
                },
                medications: {
                    where: {
                        dispenseStatus: status === 'completed' ? 'completed' : { in: ['pending', 'partial'] },
                    },
                },
            },
            orderBy: { prescribedAt: 'asc' }, // Oldest first
        });

        // Add calculated urgency or flags
        const formattedOrders = orders.map((order: any) => ({
            ...order,
            isEmergency: order.encounter.type === 'EMERGENCY',
            itemCount: order.medications.length,
        }));

        return NextResponse.json({
            data: formattedOrders,
            total: formattedOrders.length,
        });
    } catch (error) {
        console.error('Error fetching pharmacy orders:', error);
        return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
    }
}
