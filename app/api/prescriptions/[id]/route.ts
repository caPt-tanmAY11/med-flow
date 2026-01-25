import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET: Fetch prescription data for PDF generation (client will generate PDF)
export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth.api.getSession({ headers: req.headers });
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        const prescription = await prisma.prescription.findUnique({
            where: { id },
            include: {
                medications: true,
                patient: {
                    select: {
                        name: true,
                        uhid: true,
                        gender: true,
                        dob: true,
                        contact: true
                    }
                },
                encounter: {
                    select: {
                        type: true,
                        department: true,
                        createdAt: true,
                        primaryDoctorId: true
                    }
                }
            }
        });

        if (!prescription) {
            return NextResponse.json({ error: "Prescription not found" }, { status: 404 });
        }

        // Fetch doctor name if primaryDoctorId exists
        let doctorName = prescription.prescribedBy;
        if (prescription.encounter?.primaryDoctorId) {
            const doctor = await prisma.user.findUnique({
                where: { id: prescription.encounter.primaryDoctorId },
                select: { name: true }
            });
            if (doctor) {
                doctorName = doctor.name;
            }
        }

        // Return data structured for PDF generation
        return NextResponse.json({
            prescription: {
                id: prescription.id,
                createdAt: prescription.createdAt,
                prescribedBy: doctorName,
                status: prescription.status
            },
            patient: prescription.patient,
            encounter: prescription.encounter,
            medications: prescription.medications.map(med => ({
                name: med.medicationName,
                dosage: med.dosage,
                frequency: med.frequency,
                route: med.route,
                duration: med.duration,
                instructions: med.instructions
            }))
        });
    } catch (error) {
        console.error("Error fetching prescription for PDF:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
