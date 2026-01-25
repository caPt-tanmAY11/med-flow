import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: Request) {
    try {
        const session = await auth.api.getSession({ headers: req.headers });
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Find patient using UHID if available, otherwise Email
        const user = await prisma.user.findUnique({
            where: { id: session.user.id }
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        let patient;
        if ((user as any).uhid) {
            patient = await prisma.patient.findUnique({
                where: { uhid: (user as any).uhid }
            });
        }

        if (!patient) {
            patient = await prisma.patient.findFirst({
                where: { email: user.email }
            });
        }

        if (!patient) {
            return NextResponse.json({ error: "Patient record not found" }, { status: 404 });
        }

        const encounters = await prisma.encounter.findMany({
            where: {
                patientId: patient.id
            },
            include: {
                clinicalNotes: true,
                prescriptions: {
                    include: {
                        medications: true
                    }
                },
                orders: true, // Lab orders
                vitalSigns: true,
                diagnoses: true,
                patient: {
                    select: {
                        name: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        // Transform to a friendlier format if needed, or return as is
        const history = encounters.map(enc => ({
            id: enc.id,
            date: enc.createdAt,
            type: enc.type,
            title: enc.type === 'OPD' ? 'OPD Consultation' : enc.type === 'IPD' ? 'Inpatient Admission' : 'Emergency Visit',
            description: enc.diagnoses.map(d => d.description).join(", ") || "No diagnosis recorded",
            doctor: enc.primaryDoctorId ? "Dr. " + enc.primaryDoctorId : "Unknown Doctor", // Ideally fetch doctor name
            details: {
                notes: enc.clinicalNotes,
                prescriptions: enc.prescriptions,
                orders: enc.orders,
                vitals: enc.vitalSigns
            }
        }));

        return NextResponse.json(history);

    } catch (error) {
        console.error("Error fetching patient history:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
