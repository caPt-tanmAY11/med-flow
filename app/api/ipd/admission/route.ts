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
        const { patientId, doctorId, bedId, diagnosis, notes, department, medicoLegalFlag, emergencyContact, autoAssignDoctor, type = "IPD" } = body;

        let assignedDoctorId = doctorId;

        // Auto-assign doctor logic
        if (autoAssignDoctor) {
            // User requested to pick ANY doctor, not just from the department.
            // We still check for department presence because it's required for the Encounter record.
            if (!department) {
                return NextResponse.json({ error: "Department is required for auto-assignment" }, { status: 400 });
            }

            // Find ANY doctor in the database
            const doctor = await prisma.user.findFirst({
                where: {
                    role: 'DOCTOR'
                }
            });

            if (!doctor) {
                return NextResponse.json({ error: `No doctors available in the system` }, { status: 400 });
            }
            assignedDoctorId = doctor.id;
        }

        if (!patientId || !assignedDoctorId) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        if (type === "IPD" && !bedId) {
            return NextResponse.json({ error: "Bed is required for IPD admission" }, { status: 400 });
        }

        // Check if bed is available (only for IPD)
        if (type === "IPD") {
            const bed = await prisma.bed.findUnique({
                where: { id: bedId }
            });

            if (!bed || bed.status !== "AVAILABLE") {
                return NextResponse.json({ error: "Bed not available" }, { status: 400 });
            }
        }

        // Update patient emergency contact if provided
        if (emergencyContact) {
            await prisma.patient.update({
                where: { id: patientId },
                data: {
                    emergencyName: emergencyContact.name,
                    emergencyContact: emergencyContact.phone,
                    emergencyRelation: emergencyContact.relation
                }
            });
        }

        // Create Encounter
        const encounter = await prisma.encounter.create({
            data: {
                patientId,
                type: type as any, // IPD or OPD
                status: "ACTIVE",
                primaryDoctorId: assignedDoctorId,
                department: department,
                medicoLegalFlag: medicoLegalFlag || false,
                admissionTime: new Date(),
                bedAssignments: type === "IPD" ? {
                    create: {
                        bedId: bedId,
                        startTime: new Date()
                    }
                } : undefined,
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
                } : undefined,
                // Create MLC record if flagged
                ...(medicoLegalFlag ? {
                    medicoLegalCase: {
                        create: {
                            caseType: "UNKNOWN", // Should be collected in UI
                            reportedBy: session.user.id,
                            mlcNotes: "Initiated during IPD admission"
                        }
                    }
                } : {})
            }
        });

        // Update Bed Status (only for IPD)
        if (type === "IPD") {
            await prisma.bed.update({
                where: { id: bedId },
                data: { status: "OCCUPIED" }
            });
        }

        return NextResponse.json(encounter);

    } catch (error) {
        console.error("Error admitting patient:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
