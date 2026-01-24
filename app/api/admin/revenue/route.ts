/**
 * Admin Revenue Analytics API
 * 
 * GET: Fetch revenue breakdown by category, date range, department
 */

import { NextRequest, NextResponse } from 'next/server';
import { getRevenueAnalytics } from '@/lib/billing';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const startDateStr = searchParams.get('startDate');
        const endDateStr = searchParams.get('endDate');
        const detailed = searchParams.get('detailed') === 'true';

        const startDate = startDateStr ? new Date(startDateStr) : undefined;
        const endDate = endDateStr ? new Date(endDateStr) : undefined;

        const analytics = await getRevenueAnalytics(startDate, endDate);

        if (detailed) {
            // Get top performing tariffs
            const topTariffs = await prisma.billItem.groupBy({
                by: ['itemCode'],
                _sum: { totalPrice: true },
                _count: { id: true },
                orderBy: { _sum: { totalPrice: 'desc' } },
                take: 10
            });

            // Enrich with tariff details
            const enrichedTariffs = await Promise.all(
                topTariffs.map(async (t) => {
                    const tariff = t.itemCode ? await prisma.tariffMaster.findUnique({
                        where: { tariffCode: t.itemCode }
                    }) : null;
                    return {
                        tariffCode: t.itemCode,
                        description: tariff?.description || 'Unknown',
                        category: tariff?.category || 'MISC',
                        revenue: t._sum.totalPrice || 0,
                        count: t._count.id
                    };
                })
            );

            // Recent transactions
            const recentPayments = await prisma.payment.findMany({
                take: 20,
                orderBy: { receivedAt: 'desc' },
                include: {
                    bill: {
                        select: {
                            billNumber: true,
                            patient: { select: { name: true, uhid: true } }
                        }
                    }
                }
            });

            // Outstanding bills
            const outstandingBills = await prisma.bill.findMany({
                where: { balanceDue: { gt: 0 }, status: { not: 'draft' } },
                orderBy: { balanceDue: 'desc' },
                take: 10,
                include: {
                    patient: { select: { name: true, uhid: true } }
                }
            });

            return NextResponse.json({
                ...analytics,
                topTariffs: enrichedTariffs,
                recentPayments,
                outstandingBills
            });
        }

        return NextResponse.json(analytics);

    } catch (error) {
        console.error('Revenue analytics error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
