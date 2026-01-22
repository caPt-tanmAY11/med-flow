import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { vitalSignSchema } from '@/lib/validations';
import { Prisma } from '@prisma/client';

// GET /api/vitals - List vital signs
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const encounterId = searchParams.get('encounterId');
        const patientId = searchParams.get('patientId');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '50');

        if (!encounterId && !patientId) {
            return NextResponse.json(
                { error: 'Either encounterId or patientId is required' },
                { status: 400 }
            );
        }

        const where: Prisma.VitalSignWhereInput = {};
        if (encounterId) where.encounterId = encounterId;
        if (patientId) where.patientId = patientId;

        const [vitals, total] = await Promise.all([
            prisma.vitalSign.findMany({
                where,
                orderBy: { recordedAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.vitalSign.count({ where }),
        ]);

        return NextResponse.json({
            data: vitals,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('Error fetching vitals:', error);
        return NextResponse.json(
            { error: 'Failed to fetch vitals' },
            { status: 500 }
        );
    }
}

// POST /api/vitals - Record vital signs
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const data = vitalSignSchema.parse(body);

        // Check encounter exists
        const encounter = await prisma.encounter.findUnique({
            where: { id: data.encounterId },
        });

        if (!encounter) {
            return NextResponse.json(
                { error: 'Encounter not found' },
                { status: 404 }
            );
        }

        const vitalSign = await prisma.vitalSign.create({
            data: {
                encounterId: data.encounterId,
                patientId: data.patientId,
                recordedBy: data.recordedBy,
                temperature: data.temperature,
                pulse: data.pulse,
                respRate: data.respRate,
                bpSystolic: data.bpSystolic,
                bpDiastolic: data.bpDiastolic,
                spO2: data.spO2,
                weight: data.weight,
                height: data.height,
                painScore: data.painScore,
                gcs: data.gcs,
                notes: data.notes,
            },
        });

        // Check for critical values and create alerts
        const alerts: { type: string; message: string; value: number | null }[] = [];

        if (data.temperature && (data.temperature < 35 || data.temperature > 39)) {
            alerts.push({
                type: 'vital-abnormality',
                message: `Critical temperature: ${data.temperature}°C`,
                value: data.temperature,
            });
        }

        if (data.pulse && (data.pulse < 50 || data.pulse > 120)) {
            alerts.push({
                type: 'vital-abnormality',
                message: `Critical pulse: ${data.pulse} bpm`,
                value: data.pulse,
            });
        }

        if (data.spO2 && data.spO2 < 90) {
            alerts.push({
                type: 'vital-abnormality',
                message: `Critical SpO2: ${data.spO2}%`,
                value: data.spO2,
            });
        }

        if (data.bpSystolic && (data.bpSystolic < 90 || data.bpSystolic > 180)) {
            alerts.push({
                type: 'vital-abnormality',
                message: `Critical BP: ${data.bpSystolic}/${data.bpDiastolic} mmHg`,
                value: data.bpSystolic,
            });
        }

        // Create safety alerts for critical values
        for (const alert of alerts) {
            await prisma.safetyAlert.create({
                data: {
                    patientId: data.patientId,
                    encounterId: data.encounterId,
                    alertType: alert.type,
                    severity: 'critical',
                    message: alert.message,
                    context: { vitalSignId: vitalSign.id, value: alert.value },
                },
            });
        }

        return NextResponse.json({
            data: vitalSign,
            alerts: alerts.length > 0 ? alerts : undefined,
        }, { status: 201 });
    } catch (error) {
        console.error('Error recording vitals:', error);
        if (error instanceof Error && error.name === 'ZodError') {
            return NextResponse.json(
                { error: 'Validation failed', details: error },
                { status: 400 }
            );
        }
        return NextResponse.json(
            { error: 'Failed to record vitals' },
            { status: 500 }
        );
    }
}
