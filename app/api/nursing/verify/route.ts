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

// POST /api/nursing/verify - Verify nurse with their unique secret code
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { nurseId, nurseName, code, encounterId } = body;

        if (!nurseId || !code) {
            return NextResponse.json({ error: 'Nurse ID and code required' }, { status: 400 });
        }

        // Validate 4-digit code format
        if (code.length !== 4 || !/^\d{4}$/.test(code)) {
            return NextResponse.json({ error: 'Code must be exactly 4 digits' }, { status: 400 });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Check if this nurse is assigned to this patient (if encounterId provided)
        if (encounterId) {
            const assignment = await safeQuery(
                () => (prisma as any).nursePatientAssignment.findFirst({
                    where: { nurseId, encounterId, isActive: true },
                }),
                null
            );

            if (!assignment) {
                return NextResponse.json({
                    error: 'You are not assigned to this patient. Contact admin for assignment.',
                    isAssigned: false
                }, { status: 403 });
            }
        }

        // Get the nurse's secret code from today's verification/duty records
        const verification = await safeQuery<{ codeUsed: string } | null>(
            () => (prisma as any).nurseVerification.findFirst({
                where: { nurseId, shiftDate: { gte: today, lt: tomorrow } },
                orderBy: { verifiedAt: 'desc' },
            }),
            null
        );

        // Also check NurseDuty for secretCode
        const duty = await safeQuery<{ secretCode: string | null } | null>(
            () => (prisma as any).nurseDuty.findFirst({
                where: { nurseId, shiftDate: { gte: today, lt: tomorrow }, isActive: true },
            }),
            null
        );

        const storedCode = verification?.codeUsed || duty?.secretCode;

        if (!storedCode) {
            return NextResponse.json({
                error: 'No code generated for you today. Ask admin to generate your code.',
                hasCode: false
            }, { status: 400 });
        }

        // Validate the code
        if (code !== storedCode) {
            // Log failed attempt
            await prisma.auditEvent.create({
                data: {
                    entityType: 'NurseVerification',
                    entityId: nurseId,
                    action: 'verification_failed',
                    performedBy: nurseId,
                    metadata: { nurseName, attemptedCode: code },
                },
            });

            return NextResponse.json({ error: 'Invalid code. Please try again.' }, { status: 401 });
        }

        // Code is valid - log successful verification
        await prisma.auditEvent.create({
            data: {
                entityType: 'NurseVerification',
                entityId: nurseId,
                action: 'verify_success',
                performedBy: nurseId,
                metadata: { nurseName, encounterId },
            },
        });

        return NextResponse.json({
            isVerified: true,
            isAssigned: true,
            message: 'Verification successful. You can now record vitals.',
        });
    } catch (error) {
        console.error('Error verifying nurse:', error);
        return NextResponse.json({ error: 'Failed to verify' }, { status: 500 });
    }
}

// GET /api/nursing/verify - Check nurse verification status
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const nurseId = searchParams.get('nurseId');
        const encounterId = searchParams.get('encounterId');

        if (!nurseId) {
            return NextResponse.json({ error: 'Nurse ID required' }, { status: 400 });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Check if nurse has a code for today
        const duty = await safeQuery<{ secretCode: string | null } | null>(
            () => (prisma as any).nurseDuty.findFirst({
                where: { nurseId, shiftDate: { gte: today, lt: tomorrow }, isActive: true },
            }),
            null
        );

        const hasCode = !!(duty?.secretCode);

        // Check if assigned to patient (if encounterId provided)
        let isAssigned = true;
        if (encounterId) {
            const assignment = await safeQuery(
                () => (prisma as any).nursePatientAssignment.findFirst({
                    where: { nurseId, encounterId, isActive: true },
                }),
                null
            );
            isAssigned = !!assignment;
        }

        return NextResponse.json({ hasCode, isAssigned, nurseId });
    } catch (error) {
        console.error('Error checking verification:', error);
        return NextResponse.json({ error: 'Failed to check verification' }, { status: 500 });
    }
}
