
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/admin/nursing/details
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const encounterId = searchParams.get('encounterId');
        const type = searchParams.get('type'); // 'emr', 'labs', 'notes'

        if (!encounterId) return NextResponse.json({ error: 'Missing encounterId' }, { status: 400 });

        let data: any = {};

        if (type === 'emr') {
            // Fetch Clinical Notes (Doctor notes, etc)
            data.notes = await prisma.clinicalNote.findMany({
                where: { encounterId },
                orderBy: { createdAt: 'desc' }
            });
            // Also Prescriptions?
            data.prescriptions = await prisma.prescription.findMany({
                where: { encounterId },
                include: { medications: true },
                orderBy: { prescribedAt: 'desc' }
            });
        }
        else if (type === 'labs') {
            // Fetch Lab Orders
            data.labs = await prisma.order.findMany({
                where: { encounterId, orderType: 'LAB' },
                include: { labResult: true },
                orderBy: { orderedAt: 'desc' }
            });
        }
        else if (type === 'notes') {
            // "Nurse Logs" / Audit Trails / Vitals
            // Fetch Vitals logged
            const vitals = await prisma.vitalSign.findMany({
                where: { encounterId },
                orderBy: { recordedAt: 'desc' },
            });

            // Fetch generic Audit Events for this encounter
            // Filtering JSON metadata by path in simplified manner or fetching all relevant and filtering in-memory if needed
            // For stability, we'll try basic contains or raw query, but standard findMany with JSON filter:
            const auditLogs = await prisma.auditEvent.findMany({
                where: {
                    OR: [
                        { entityId: encounterId },
                        // Check valid JSON filter syntax for your DB adapter (Postgres supports filtered, SQLite/MySQL vary)
                        // Safest is to rely on entityId if we populate it, otherwise we might miss some.
                        // Attempt simple path filter if supported, else omit metadata filter to avoid crash
                        { metadata: { path: ['encounterId'], equals: encounterId } }
                    ]
                },
                orderBy: { performedAt: 'desc' },
                take: 50
            });

            data.vitals = vitals;
            data.auditLogs = auditLogs;

            // Also fetching Handovers
            data.handovers = await prisma.shiftHandover.findMany({
                where: { encounterId },
                orderBy: { handoverAt: 'desc' }
            });
        }

        return NextResponse.json({ data });

    } catch (error) {
        console.error('Error fetching details:', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
