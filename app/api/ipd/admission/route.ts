import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

// POST: Admit patient to IPD
export async function POST(req: Request) {
    try {
        const session = await auth.api.getSession({ headers: req.headers });
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { patientId, doctorId, bedId, diagnosis, notes } = body;

        if (!patientId || !doctorId || !bedId) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Check if bed is available
        const bed = await prisma.bed.findUnique({
            where: { id: bedId }
        });

        if (!bed || bed.status !== "AVAILABLE") {
            return NextResponse.json({ error: "Bed not available" }, { status: 400 });
        }

        // Create Encounter
        const encounter = await prisma.encounter.create({
            data: {
                patientId,
                type: "IPD",
                status: "ACTIVE",
                primaryDoctorId: doctorId,
                admissionTime: new Date(),
                bedAssignments: {
                    create: {
                        bedId: bedId,
                        startTime: new Date()
                    }
                },
                diagnoses: diagnosis ? {
                    create: {
                        codeSystem: "ICD-10", // Default or dynamic
                        code: "UNKNOWN", // Should be passed if available
                        description: diagnosis,
                        codedBy: session.user.id,
                        isPrimary: true
                    }
                } : undefined,
                clinicalNotes: notes ? {
                    create: {
                        patientId,
                        noteType: "ADMISSION_NOTE",
                        content: notes,
                        authorId: session.user.id,
                        authorRole: session.user.role
                    }
                } : undefined
            }
        });

        // Update Bed Status
        await prisma.bed.update({
            where: { id: bedId },
            data: { status: "OCCUPIED" }
        });

        return NextResponse.json(encounter);

    } catch (error) {
        console.error("Error admitting patient:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
