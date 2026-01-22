import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/dashboard - Get dashboard data
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type') || 'operations';

        // Get today's date range
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Parallel queries for dashboard data
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
        ] = await Promise.all([
            // Bed statistics
            prisma.bed.groupBy({
                by: ['status'],
                _count: { id: true },
            }),

            // Active encounters by type
            prisma.encounter.groupBy({
                by: ['type'],
                where: { status: 'ACTIVE' },
                _count: { id: true },
            }),

            // Today's admissions
            prisma.encounter.count({
                where: {
                    type: 'IPD',
                    arrivalTime: { gte: today, lt: tomorrow },
                },
            }),

            // Today's discharges
            prisma.encounter.count({
                where: {
                    dischargeTime: { gte: today, lt: tomorrow },
                },
            }),

            // Pending orders
            prisma.order.count({
                where: {
                    status: { in: ['ordered', 'collected', 'processing'] },
                },
            }),

            // Critical unacknowledged alerts
            prisma.safetyAlert.count({
                where: {
                    severity: 'critical',
                    acknowledgedAt: null,
                },
            }),

            // Low stock items
            prisma.inventoryItem.count({
                where: {
                    currentStock: { lte: prisma.inventoryItem.fields.reorderLevel },
                },
            }),

            // Staff on duty today
            prisma.staffShift.groupBy({
                by: ['shiftType'],
                where: {
                    startTime: { lte: new Date() },
                    endTime: { gte: new Date() },
                    status: { in: ['scheduled', 'checked-in'] },
                },
                _count: { id: true },
            }),

            // Recent incidents (last 7 days)
            prisma.incident.count({
                where: {
                    reportedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
                },
            }),

            // Surgeries today
            prisma.surgery.count({
                where: {
                    scheduledDate: { gte: today, lt: tomorrow },
                },
            }),
        ]);

        // Process bed stats
        const bedSummary = {
            total: bedStats.reduce((sum, s) => sum + s._count.id, 0),
            available: bedStats.find(s => s.status === 'AVAILABLE')?._count.id || 0,
            occupied: bedStats.find(s => s.status === 'OCCUPIED')?._count.id || 0,
            cleaning: bedStats.find(s => s.status === 'CLEANING')?._count.id || 0,
            maintenance: bedStats.find(s => s.status === 'MAINTENANCE')?._count.id || 0,
            occupancyRate: 0,
        };
        bedSummary.occupancyRate = bedSummary.total > 0
            ? Math.round((bedSummary.occupied / bedSummary.total) * 100)
            : 0;

        // Process encounter stats
        const encounterSummary = {
            opd: encounterStats.find(s => s.type === 'OPD')?._count.id || 0,
            ipd: encounterStats.find(s => s.type === 'IPD')?._count.id || 0,
            emergency: encounterStats.find(s => s.type === 'EMERGENCY')?._count.id || 0,
        };

        // Process staff stats
        const staffSummary = {
            morning: staffOnDuty.find(s => s.shiftType === 'morning')?._count.id || 0,
            evening: staffOnDuty.find(s => s.shiftType === 'evening')?._count.id || 0,
            night: staffOnDuty.find(s => s.shiftType === 'night')?._count.id || 0,
            total: staffOnDuty.reduce((sum, s) => sum + s._count.id, 0),
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
                lastUpdated: new Date().toISOString(),
            },
        });
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        return NextResponse.json(
            { error: 'Failed to fetch dashboard data' },
            { status: 500 }
        );
    }
}
