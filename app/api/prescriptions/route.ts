import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET: Fetch active prescription for an encounter
export async function GET(req: Request) {
    try {
        const session = await auth.api.getSession({ headers: req.headers });
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const encounterId = searchParams.get("encounterId");

        if (!encounterId) {
            return NextResponse.json({ error: "Missing encounterId" }, { status: 400 });
        }

        const prescription = await prisma.prescription.findFirst({
            where: {
                encounterId,
                status: 'active'
            },
            include: {
                medications: true
            }
        });

        return NextResponse.json(prescription);
    } catch (error) {
        console.error("Error fetching prescription:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// POST: Add medication to prescription (creates prescription if needed)
export async function POST(req: Request) {
    try {
        const session = await auth.api.getSession({ headers: req.headers });
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { encounterId, patientId, medicationName, dosage, frequency, duration, instructions } = body;

        if (!encounterId || !patientId || !medicationName) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Find or create active prescription
        let prescription = await prisma.prescription.findFirst({
            where: {
                encounterId,
                status: 'active'
            }
        });

        if (!prescription) {
            prescription = await prisma.prescription.create({
                data: {
                    encounterId,
                    patientId,
                    prescribedBy: session.user.name || "Unknown",
                    status: 'active'
                }
            });
        }

        // Add medication
        const medication = await prisma.prescriptionMedication.create({
            data: {
                prescriptionId: prescription.id,
                medicationName,
                dosage: dosage || "As directed",
                frequency: frequency || "OD",
                route: "Oral", // Default
                duration: duration || "5 days",
                instructions
            }
        });

        return NextResponse.json(medication);
    } catch (error) {
        console.error("Error adding medication:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
