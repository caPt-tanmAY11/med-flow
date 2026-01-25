import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/lab-tests/orders - Get patient's orders with status
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const patientId = searchParams.get('patientId');
        const status = searchParams.get('status');

        if (!patientId) {
            return NextResponse.json({ error: 'Patient ID is required' }, { status: 400 });
        }

        const where: {
            patientId: string;
            status?: { not?: string; equals?: string };
        } = {
            patientId,
            status: { not: 'cart' }, // Exclude cart items
        };

        if (status) {
            where.status = { equals: status };
        }

        const orders = await prisma.labTestOrder.findMany({
            where,
            include: {
                LabTest: {
                    include: {
                        LabTestResultField: {
                            orderBy: { sortOrder: 'asc' },
                        },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        // Group by status for summary
        const statusCounts = orders.reduce((acc: Record<string, number>, order) => {
            acc[order.status] = (acc[order.status] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        // Define status flow for progress tracking
        const statusFlow = ['pending', 'sample_collected', 'processing', 'completed'];

        // Get patient's pending bills to check payment status
        const patientBills = await prisma.bill.findMany({
            where: { patientId },
            select: { id: true, status: true, balanceDue: true, items: { select: { itemCode: true } } },
        });

        // Add progress info and payment status to each order
        const ordersWithProgress = orders.map(order => {
            // Check if this test's bill is paid
            const relatedBill = patientBills.find(bill =>
                bill.items.some((item: { itemCode: string | null }) => item.itemCode === order.LabTest.code)
            );
            const isPaid = relatedBill ? relatedBill.status === 'paid' || relatedBill.balanceDue <= 0 : false;

            return {
                ...order,
                isPaid,
                progress: {
                    current: order.status,
                    currentStep: statusFlow.indexOf(order.status) + 1,
                    totalSteps: statusFlow.length,
                    percentage: ((statusFlow.indexOf(order.status) + 1) / statusFlow.length) * 100,
                    steps: statusFlow.map((status, index) => ({
                        name: status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
                        completed: statusFlow.indexOf(order.status) >= index,
                        current: order.status === status,
                    })),
                },
                canDownloadReport: order.status === 'completed' && isPaid,
            };
        });

        return NextResponse.json({
            data: ordersWithProgress,
            summary: {
                total: orders.length,
                byStatus: statusCounts,
            },
        });
    } catch (error) {
        console.error('Error fetching orders:', error);
        return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
    }
}
