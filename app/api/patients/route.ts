import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { patientCreateSchema, patientSearchSchema } from '@/lib/validations';
import { Prisma } from '@prisma/client';
import { auth } from '@/lib/auth';

// Helper to generate UHID
function generateUHID(): string {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    return `UHID-${year}-${random}`;
}

// Helper to normalize name for duplicate detection
function normalizeName(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

// Helper to hash phone for duplicate detection
function hashPhone(phone: string): string {
    // Simple hash for demo - in production use proper hashing
    return phone.replace(/[^0-9]/g, '').slice(-10);
}

// GET /api/patients - List/search patients
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const params = patientSearchSchema.parse({
            query: searchParams.get('query'),
            uhid: searchParams.get('uhid'),
            phone: searchParams.get('phone'),
            type: searchParams.get('type'),
            bloodGroup: searchParams.get('bloodGroup'),
            page: searchParams.get('page'),
            limit: searchParams.get('limit'),
        });

        const { query, uhid, phone, type, bloodGroup, page, limit } = params;
        const skip = (page - 1) * limit;

        const where: Prisma.PatientWhereInput = {
            mergedIntoPatientId: null, // Exclude merged patients
        };

        if (type === 'temporary') {
            where.isTemporary = true;
        } else if (type === 'permanent') {
            where.isTemporary = false;
        }

        if (bloodGroup) {
            where.bloodGroup = bloodGroup;
        }

        if (uhid) {
            where.uhid = { contains: uhid, mode: 'insensitive' };
        }

        if (phone) {
            where.contact = { contains: phone };
        }

        if (query) {
            where.OR = [
                { name: { contains: query, mode: 'insensitive' } },
                { uhid: { contains: query, mode: 'insensitive' } },
                { contact: { contains: query, mode: 'insensitive' } },
            ];
        }

        const [patients, total] = await Promise.all([
            prisma.patient.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    _count: {
                        select: { encounters: true },
                    },
                    allergies: {
                        where: { isActive: true },
                        select: {
                            id: true,
                            allergen: true,
                            allergenType: true,
                            severity: true,
                            reaction: true,
                        },
                    },
                    idDocuments: {
                        select: {
                            id: true,
                            documentType: true,
                            documentNumber: true,
                            verified: true,
                        },
                    },
                },
            }),
            prisma.patient.count({ where }),
        ]);

        return NextResponse.json({
            data: patients,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('Error fetching patients:', error);
        return NextResponse.json(
            { error: 'Failed to fetch patients', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}

// POST /api/patients - Create a new patient
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const data = patientCreateSchema.parse(body);

        // Generate UHID
        let uhid = generateUHID();

        // Ensure UHID is unique
        let attempts = 0;
        while (attempts < 10) {
            const existing = await prisma.patient.findUnique({ where: { uhid } });
            if (!existing) break;
            uhid = generateUHID();
            attempts++;
        }

        // Check for potential duplicates by name + dob
        const duplicates: { id: string; uhid: string; name: string; similarity: string }[] = [];

        if (data.contact) {
            const phoneDuplicates = await prisma.patient.findMany({
                where: { contact: data.contact, mergedIntoPatientId: null },
                select: { id: true, uhid: true, name: true },
            });
            phoneDuplicates.forEach(p => {
                if (!duplicates.find(d => d.id === p.id)) {
                    duplicates.push({ ...p, similarity: 'phone' });
                }
            });
        }

        const nameDuplicates = await prisma.patient.findMany({
            where: {
                name: { contains: data.name, mode: 'insensitive' },
                dob: data.dob,
                mergedIntoPatientId: null,
            },
            select: { id: true, uhid: true, name: true },
        });
        nameDuplicates.forEach(p => {
            if (!duplicates.find(d => d.id === p.id)) {
                duplicates.push({ ...p, similarity: 'name+dob' });
            }
        });

        // Normalize name and hash phone for duplicate detection
        const nameNormalized = data.name.toLowerCase().replace(/[^a-z0-9]/g, '');
        const phoneHash = data.contact ? data.contact.replace(/[^0-9]/g, '').slice(-10) : null;

        // Create patient with ALL fields from the schema
        const patient = await prisma.patient.create({
            data: {
                uhid,
                name: data.name,
                dob: data.dob,
                gender: data.gender as 'MALE' | 'FEMALE' | 'OTHER',
                contact: data.contact,
                email: data.email || null,
                aadhaarLast4: data.aadhaarLast4,
                // Extended demographics
                address: data.address,
                city: data.city,
                state: data.state,
                pincode: data.pincode,
                bloodGroup: data.bloodGroup,
                // Emergency contact
                emergencyName: data.emergencyName,
                emergencyContact: data.emergencyContact,
                emergencyRelation: data.emergencyRelation,
                // Duplicate detection fields
                phoneHash,
                nameNormalized,
                // Temporary registration
                isTemporary: data.isTemporary,
                tempExpiresAt: data.isTemporary ? new Date(Date.now() + 24 * 60 * 60 * 1000) : null, // 24 hours
            },
        });

        // Create allergies if provided
        const createdAllergies = [];
        if (data.allergies && data.allergies.length > 0) {
            for (const allergy of data.allergies) {
                const created = await prisma.allergy.create({
                    data: {
                        patientId: patient.id,
                        allergen: allergy.allergen,
                        allergenType: allergy.allergenType,
                        severity: allergy.severity,
                        reaction: allergy.reaction,
                    },
                });
                createdAllergies.push(created);
            }
        }

        // Create ID document if provided
        if (data.idType && data.idNumber) {
            await prisma.patientIdDocument.create({
                data: {
                    patientId: patient.id,
                    documentType: data.idType,
                    documentNumber: data.idNumber,
                    verified: false,
                },
            });
        }

        // --- Automate Patient User Account Creation ---
        try {
            const uhidLast6 = uhid.slice(-6);
            const patientEmail = `${uhidLast6}@medflow.com`;
            const patientPassword = "123456789";

            await auth.api.signUpEmail({
                body: {
                    email: patientEmail,
                    password: patientPassword,
                    name: data.name,
                    role: "PATIENT"
                }
            });
            console.log(`Created user account for patient ${uhid} with email ${patientEmail}`);
        } catch (authError) {
            console.error('Failed to create user account for patient:', authError);
            // We do NOT block the patient creation response if auth fails, but simply log it
        }
        // ----------------------------------------------

        // Create audit event
        await prisma.auditEvent.create({
            data: {
                entityType: 'Patient',
                entityId: patient.id,
                action: 'create',
                performedBy: 'system',
                newValues: { uhid, name: data.name, isTemporary: data.isTemporary },
            },
        });

        return NextResponse.json({
            data: { ...patient, allergies: createdAllergies },
            duplicates: duplicates.length > 0 ? duplicates : undefined,
            message: duplicates.length > 0
                ? 'Patient created with potential duplicates detected'
                : 'Patient created successfully',
        }, { status: 201 });
    } catch (error) {
        console.error('Error creating patient:', error);
        if (error instanceof Error && error.name === 'ZodError') {
            return NextResponse.json(
                { error: 'Validation failed', details: error },
                { status: 400 }
            );
        }
        return NextResponse.json(
            { error: 'Failed to create patient', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
