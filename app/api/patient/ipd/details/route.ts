
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function GET(request: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session || !session.user || session.user.role !== 'PATIENT') {
            // @ts-ignore - better-auth types might not yet reflect the extra field without generation, but it exists at runtime
            console.log(`[IPD API] Unauthorized or role mismatch. Role: ${session?.user?.role}`);
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // @ts-ignore
        const userUhid = session.user.uhid;

        console.log(`[IPD API] Fetching details for user: ${session.user.email} with UHID: ${userUhid}`);

        if (!userUhid) {
             console.log(`[IPD API] No UHID found for user: ${session.user.email}. Cannot link to patient record.`);
             return NextResponse.json({ error: 'Patient account not linked to medical record.' }, { status: 404 });
        }

        // Find patient by UHID
        const patient = await prisma.patient.findUnique({
            where: {
                uhid: userUhid
            }
        });

        if (!patient) {
            console.log(`[IPD API] Patient record not found for UHID: ${userUhid}`);
            return NextResponse.json({ error: 'Patient record not found' }, { status: 404 });
        }
        
        console.log(`[IPD API] Found patient: ${patient.uhid} (${patient.id})`);

        // Find active IPD encounter
        const encounter = await prisma.encounter.findFirst({
            where: {
                patientId: patient.id,
                type: 'IPD',
                status: 'ACTIVE'
            },
            include: {
                bedAssignments: {
                    where: {
                        endTime: null // Active bed assignment
                    },
                    include: {
                        bed: true
                    },
                    orderBy: {
                        startTime: 'desc'
                    },
                    take: 1
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        if (!encounter) {
            return NextResponse.json({ message: 'No active IPD admission found' }, { status: 200 });
        }

        const bedAssignment = encounter.bedAssignments[0];
        
        return NextResponse.json({
            data: {
                encounterId: encounter.id,
                admissionDate: encounter.admissionTime,
                bed: bedAssignment ? {
                    number: bedAssignment.bed.bedNumber,
                    ward: bedAssignment.bed.ward,
                    floor: bedAssignment.bed.floor
                } : null,
                doctor: encounter.primaryDoctorId
            }
        });

    } catch (error) {
        console.error('Error fetching IPD details:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
