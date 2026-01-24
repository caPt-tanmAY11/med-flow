import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET: Fetch IPD patients for the logged-in doctor
export async function GET(req: Request) {
    try {
        const session = await auth.api.getSession({ headers: req.headers });
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const doctorId = session.user.id;

        // Find active IPD encounters where this doctor is primary
        const patients = await prisma.encounter.findMany({
            where: {
                primaryDoctorId: doctorId,
                type: "IPD",
                status: "ACTIVE"
            },
            include: {
                patient: {
                    select: {
                        id: true,
                        name: true,
                        uhid: true,
                        gender: true,
                        dob: true,
                        bloodGroup: true,
                        allergies: {
                            where: { isActive: true },
                            select: { allergen: true }
                        }
                    }
                },
                bedAssignments: {
                    where: { endTime: null }, // Current bed
                    include: {
                        bed: true
                    }
                },
                vitalSigns: {
                    orderBy: { recordedAt: 'desc' },
                    take: 1
                },
                diagnoses: {
                    where: { isPrimary: true }
                }
            },
            orderBy: {
                admissionTime: 'desc'
            }
        });

        // Transform data for frontend
        const formattedPatients = patients.map(p => ({
            encounterId: p.id,
            patientId: p.patientId,
            name: p.patient.name,
            uhid: p.patient.uhid,
            age: calculateAge(p.patient.dob),
            gender: p.patient.gender,
            bedNumber: p.bedAssignments[0]?.bed.bedNumber || "Unassigned",
            ward: p.bedAssignments[0]?.bed.ward || "N/A",
            diagnosis: p.diagnoses[0]?.description || "Under Evaluation",
            admissionDate: p.admissionTime,
            lastVitals: p.vitalSigns[0] || null,
            allergies: p.patient.allergies.map(a => a.allergen)
        }));

        return NextResponse.json(formattedPatients);

    } catch (error) {
        console.error("Error fetching doctor's patients:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

function calculateAge(dob: Date) {
    const diff = Date.now() - new Date(dob).getTime();
    const ageDate = new Date(diff);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
}
