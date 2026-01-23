import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
    try {
        const now = new Date();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        // prisma.$transaction keeps connection usage low and stable
        const [
            bedStats,
            encounterStats,
            todayAdmissions,
            todayDischarges,
            pendingOrders,
            criticalAlerts,
            lowStockCount,
            staffOnDuty,
            recentIncidents,
            surgeriesToday,
        ] = await prisma.$transaction([
            prisma.bed.groupBy({
                by: ['status'], _count: { id: true },
                orderBy: undefined
            }),
            prisma.encounter.groupBy({
                by: ['type'], where: { status: 'ACTIVE' }, _count: { id: true },
                orderBy: undefined
            }),
            prisma.encounter.count({ where: { type: 'IPD', arrivalTime: { gte: today, lt: tomorrow } } }),
            prisma.encounter.count({ where: { dischargeTime: { gte: today, lt: tomorrow } } }),
            prisma.order.count({ where: { status: { in: ['ordered', 'collected', 'processing'] } } }),
            prisma.safetyAlert.count({ where: { severity: 'critical', acknowledgedAt: null } }),
            // Static threshold fallback (see note below)
            prisma.inventoryItem.count({ where: { currentStock: { lte: 10 } } }),
            prisma.staffShift.groupBy({
                by: ['shiftType'],
                where: { startTime: { lte: now }, endTime: { gte: now }, status: { in: ['scheduled', 'checked-in'] } },
                _count: { id: true },
                orderBy: undefined
            }),
            prisma.incident.count({ where: { reportedAt: { gte: sevenDaysAgo } } }),
            prisma.surgery.count({ where: { scheduledDate: { gte: today, lt: tomorrow } } }),
        ]);

        // 1. Helper with explicit type casting to satisfy the compiler
        const getCount = (arr: any[], key: string, val: string): number => {
            const item = arr.find(item => item[key] === val);
            // Cast _count to any or a specific shape to bypass the "true | object" union check
            const countObj = item?._count as { id?: number } | undefined;
            return countObj?.id ?? 0;
        };

        // 2. Updated bedSummary using the same casting logic for the total
        const bedSummary = {
            total: bedStats.reduce((sum, s) => {
                const c = s._count as { id?: number };
                return sum + (c?.id ?? 0);
            }, 0),
            available: getCount(bedStats, 'status', 'AVAILABLE'),
            occupied: getCount(bedStats, 'status', 'OCCUPIED'),
            cleaning: getCount(bedStats, 'status', 'CLEANING'),
            maintenance: getCount(bedStats, 'status', 'MAINTENANCE'),
            occupancyRate: 0,
        };

        // 3. Updated staffSummary
        const staffSummary = {
            morning: getCount(staffOnDuty, 'shiftType', 'morning'),
            evening: getCount(staffOnDuty, 'shiftType', 'evening'),
            night: getCount(staffOnDuty, 'shiftType', 'night'),
            total: staffOnDuty.reduce((sum, s) => {
                const c = s._count as { id?: number };
                return sum + (c?.id ?? 0);
            }, 0),
        };

        bedSummary.occupancyRate = bedSummary.total > 0
            ? Math.round((bedSummary.occupied / bedSummary.total) * 100)
            : 0;

        const encounterSummary = {
            opd: getCount(encounterStats, 'type', 'OPD'),
            ipd: getCount(encounterStats, 'type', 'IPD'),
            emergency: getCount(encounterStats, 'type', 'EMERGENCY'),
        };

        return NextResponse.json({
            data: {
                beds: bedSummary,
                encounters: encounterSummary,
                todayAdmissions,
                todayDischarges,
                pendingOrders,
                criticalAlerts,
                lowStockCount,
                staffOnDuty: staffSummary,
                recentIncidents,
                surgeriesToday,
                lastUpdated: now.toISOString(),
            },
        });
    } catch (error) {
        console.error('Dashboard Error:', error);
        return NextResponse.json({ error: 'Failed to load dashboard' }, { status: 500 });
    }
}