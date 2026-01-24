import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Critical vital thresholds
const CRITICAL_THRESHOLDS = {
    pulse: { low: 40, high: 150 },
    bpSystolic: { low: 80, high: 200 },
    bpDiastolic: { low: 40, high: 120 },
    spO2: { low: 90, high: null },
    temperature: { low: 35, high: 40 },
    respRate: { low: 8, high: 35 },
};

function checkCriticalVitals(vitals: {
    pulse?: number | null;
    bpSystolic?: number | null;
    bpDiastolic?: number | null;
    spO2?: number | null;
    temperature?: number | null;
    respRate?: number | null;
}): { isCritical: boolean; criticalValues: string[] } {
    const criticalValues: string[] = [];

    if (vitals.pulse) {
        if (vitals.pulse < CRITICAL_THRESHOLDS.pulse.low) criticalValues.push(`Pulse too low: ${vitals.pulse}`);
        if (vitals.pulse > CRITICAL_THRESHOLDS.pulse.high) criticalValues.push(`Pulse too high: ${vitals.pulse}`);
    }
    if (vitals.bpSystolic) {
        if (vitals.bpSystolic < CRITICAL_THRESHOLDS.bpSystolic.low) criticalValues.push(`BP Systolic too low: ${vitals.bpSystolic}`);
        if (vitals.bpSystolic > CRITICAL_THRESHOLDS.bpSystolic.high) criticalValues.push(`BP Systolic too high: ${vitals.bpSystolic}`);
    }
    if (vitals.bpDiastolic) {
        if (vitals.bpDiastolic < CRITICAL_THRESHOLDS.bpDiastolic.low) criticalValues.push(`BP Diastolic too low: ${vitals.bpDiastolic}`);
        if (vitals.bpDiastolic > CRITICAL_THRESHOLDS.bpDiastolic.high) criticalValues.push(`BP Diastolic too high: ${vitals.bpDiastolic}`);
    }
    if (vitals.spO2) {
        if (vitals.spO2 < CRITICAL_THRESHOLDS.spO2.low) criticalValues.push(`SpO2 too low: ${vitals.spO2}%`);
    }
    if (vitals.temperature) {
        if (vitals.temperature < CRITICAL_THRESHOLDS.temperature.low) criticalValues.push(`Temperature too low: ${vitals.temperature}°C`);
        if (vitals.temperature > CRITICAL_THRESHOLDS.temperature.high) criticalValues.push(`Temperature too high: ${vitals.temperature}°C`);
    }
    if (vitals.respRate) {
        if (vitals.respRate < CRITICAL_THRESHOLDS.respRate.low) criticalValues.push(`Resp Rate too low: ${vitals.respRate}`);
        if (vitals.respRate > CRITICAL_THRESHOLDS.respRate.high) criticalValues.push(`Resp Rate too high: ${vitals.respRate}`);
    }

    return { isCritical: criticalValues.length > 0, criticalValues };
}

// GET /api/nursing/vitals - Get vitals for patient/encounter
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const encounterId = searchParams.get('encounterId');
        const patientId = searchParams.get('patientId');

        const vitals = await prisma.vitalSign.findMany({
            where: {
                ...(encounterId ? { encounterId } : {}),
                ...(patientId ? { patientId } : {}),
            },
            orderBy: { recordedAt: 'desc' },
            take: 50,
        });

        return NextResponse.json({ data: vitals });
    } catch (error) {
        console.error('Error fetching vitals:', error);
        return NextResponse.json({ error: 'Failed to fetch vitals' }, { status: 500 });
    }
}

// POST /api/nursing/vitals - Log vitals
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            encounterId,
            patientId,
            nurseId,
            nurseName,
            temperature,
            pulse,
            respRate,
            bpSystolic,
            bpDiastolic,
            spO2,
            weight,
            height,
            painScore,
            gcs,
            notes,
        } = body;

        // Check for critical values
        const { isCritical, criticalValues } = checkCriticalVitals({
            pulse,
            bpSystolic,
            bpDiastolic,
            spO2,
            temperature,
            respRate,
        });

        // Create vital sign record
        const vital = await prisma.vitalSign.create({
            data: {
                encounterId,
                patientId,
                recordedBy: nurseName,
                temperature,
                pulse,
                respRate,
                bpSystolic,
                bpDiastolic,
                spO2,
                weight,
                height,
                painScore,
                gcs,
                notes: isCritical ? `${notes || ''} [CRITICAL: ${criticalValues.join(', ')}]` : notes,
            },
        });

        // If critical, create safety alert
        if (isCritical) {
            const patient = await prisma.patient.findUnique({
                where: { id: patientId },
                select: { name: true, uhid: true },
            });

            await prisma.safetyAlert.create({
                data: {
                    alertType: 'CRITICAL_VITAL',
                    severity: 'critical',
                    patientId,
                    encounterId,
                    message: `Critical vitals detected for ${patient?.name} (${patient?.uhid}): ${criticalValues.join(', ')}`,
                    context: { reportedBy: nurseName, vitalId: vital.id },
                },
            });

            // Create audit event for escalation
            await prisma.auditEvent.create({
                data: {
                    entityType: 'VitalSign',
                    entityId: vital.id,
                    action: 'critical_escalation',
                    performedBy: nurseId,
                    metadata: { patientId, criticalValues, nurseName },
                },
            });
        }

        // Create audit event for vital logging
        await prisma.auditEvent.create({
            data: {
                entityType: 'VitalSign',
                entityId: vital.id,
                action: 'create',
                performedBy: nurseId,
            },
        });

        return NextResponse.json({
            data: vital,
            isCritical,
            criticalValues,
            message: isCritical
                ? 'CRITICAL: Vitals logged and escalated to on-call doctor'
                : 'Vitals logged successfully',
        }, { status: 201 });
    } catch (error) {
        console.error('Error logging vitals:', error);
        return NextResponse.json({ error: 'Failed to log vitals' }, { status: 500 });
    }
}
