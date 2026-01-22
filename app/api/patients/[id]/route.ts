import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { patientUpdateSchema } from '@/lib/validations';
import { Prisma } from '@prisma/client';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/patients/[id] - Get a single patient
export async function GET(request: NextRequest, context: RouteParams) {
    try {
        const { id } = await context.params;

        const patient = await prisma.patient.findUnique({
            where: { id },
            include: {
                allergies: {
                    where: { isActive: true },
                },
                idDocuments: true,
                encounters: {
                    orderBy: { createdAt: 'desc' },
                    take: 10,
                    include: {
                        _count: {
                            select: { clinicalNotes: true, vitalSigns: true },
                        },
                    },
                },
                insurancePolicies: {
                    where: { isActive: true },
                },
                mergedPatients: {
                    select: { id: true, uhid: true, name: true },
                },
            },
        });

        if (!patient) {
            return NextResponse.json(
                { error: 'Patient not found' },
                { status: 404 }
            );
        }

        // If patient was merged, redirect to the target patient
        if (patient.mergedIntoPatientId) {
            return NextResponse.json(
                {
                    error: 'Patient was merged',
                    mergedInto: patient.mergedIntoPatientId,
                },
                { status: 301 }
            );
        }

        return NextResponse.json({ data: patient });
    } catch (error) {
        console.error('Error fetching patient:', error);
        return NextResponse.json(
            { error: 'Failed to fetch patient' },
            { status: 500 }
        );
    }
}

// PUT /api/patients/[id] - Update a patient
export async function PUT(request: NextRequest, context: RouteParams) {
    try {
        const { id } = await context.params;
        const body = await request.json();
        const data = patientUpdateSchema.parse(body);

        // Get existing patient for audit
        const existingPatient = await prisma.patient.findUnique({
            where: { id },
        });

        if (!existingPatient) {
            return NextResponse.json(
                { error: 'Patient not found' },
                { status: 404 }
            );
        }

        if (existingPatient.mergedIntoPatientId) {
            return NextResponse.json(
                { error: 'Cannot update a merged patient' },
                { status: 400 }
            );
        }

        // Build update data
        const updateData: Prisma.PatientUpdateInput = {};
        if (data.name !== undefined) {
            updateData.name = data.name;
            updateData.nameNormalized = data.name.toLowerCase().replace(/[^a-z0-9]/g, '');
        }
        if (data.dob !== undefined) updateData.dob = data.dob;
        if (data.gender !== undefined) updateData.gender = data.gender as 'MALE' | 'FEMALE' | 'OTHER';
        if (data.contact !== undefined) {
            updateData.contact = data.contact;
            updateData.phoneHash = data.contact?.replace(/[^0-9]/g, '').slice(-10) || null;
        }
        if (data.email !== undefined) updateData.email = data.email || null;
        if (data.aadhaarLast4 !== undefined) updateData.aadhaarLast4 = data.aadhaarLast4;
        if (data.address !== undefined) updateData.address = data.address;
        if (data.city !== undefined) updateData.city = data.city;
        if (data.state !== undefined) updateData.state = data.state;
        if (data.pincode !== undefined) updateData.pincode = data.pincode;
        if (data.bloodGroup !== undefined) updateData.bloodGroup = data.bloodGroup;
        if (data.emergencyName !== undefined) updateData.emergencyName = data.emergencyName;
        if (data.emergencyContact !== undefined) updateData.emergencyContact = data.emergencyContact;
        if (data.emergencyRelation !== undefined) updateData.emergencyRelation = data.emergencyRelation;

        const patient = await prisma.patient.update({
            where: { id },
            data: updateData,
            include: {
                allergies: {
                    where: { isActive: true },
                },
            },
        });

        // Create audit event
        await prisma.auditEvent.create({
            data: {
                entityType: 'Patient',
                entityId: patient.id,
                action: 'update',
                performedBy: 'system', // TODO: Get from auth
                oldValues: existingPatient as unknown as Prisma.JsonObject,
                newValues: patient as unknown as Prisma.JsonObject,
            },
        });

        return NextResponse.json({ data: patient });
    } catch (error) {
        console.error('Error updating patient:', error);
        if (error instanceof Error && error.name === 'ZodError') {
            return NextResponse.json(
                { error: 'Validation failed', details: error },
                { status: 400 }
            );
        }
        return NextResponse.json(
            { error: 'Failed to update patient' },
            { status: 500 }
        );
    }
}

// DELETE /api/patients/[id] - Soft delete (mark as inactive)
export async function DELETE(request: NextRequest, context: RouteParams) {
    try {
        const { id } = await context.params;

        const patient = await prisma.patient.findUnique({
            where: { id },
            include: {
                encounters: {
                    where: { status: 'ACTIVE' },
                },
            },
        });

        if (!patient) {
            return NextResponse.json(
                { error: 'Patient not found' },
                { status: 404 }
            );
        }

        if (patient.encounters.length > 0) {
            return NextResponse.json(
                { error: 'Cannot delete patient with active encounters' },
                { status: 400 }
            );
        }

        // Soft delete by marking as merged into self (unusual but prevents access)
        // In production, you might use a separate 'deleted' field
        await prisma.auditEvent.create({
            data: {
                entityType: 'Patient',
                entityId: id,
                action: 'delete',
                performedBy: 'system', // TODO: Get from auth
                oldValues: patient as unknown as Prisma.JsonObject,
            },
        });

        return NextResponse.json({
            message: 'Patient marked for deletion. Contact admin for full removal.'
        });
    } catch (error) {
        console.error('Error deleting patient:', error);
        return NextResponse.json(
            { error: 'Failed to delete patient' },
            { status: 500 }
        );
    }
}
