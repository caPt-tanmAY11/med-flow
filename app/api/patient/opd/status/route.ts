import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: Request) {
    try {
        const session = await auth.api.getSession({ headers: req.headers });
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Find patient
        const user = await prisma.user.findUnique({ where: { id: session.user.id } });
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        let patient;
        if ((user as any).uhid) {
            patient = await prisma.patient.findUnique({ where: { uhid: (user as any).uhid } });
        }

        if (!patient) {
            patient = await prisma.patient.findFirst({ where: { email: user.email } });
        }

        if (!patient) return NextResponse.json({ error: "Patient record not found" }, { status: 404 });

        // Find active OPD queue entry
        const queueEntry = await prisma.oPDQueue.findFirst({
            where: {
                patientId: patient.id,
                status: "WAITING",
                createdAt: {
                    gte: new Date(new Date().setHours(0, 0, 0, 0)) // Today
                }
            },
            include: {
                patient: true
            }
        });

        if (!queueEntry) {
            return NextResponse.json(null); // No active appointment
        }

        // Get current token being served (or the one just before this if none served yet)
        // Actually, we need to know which token is currently "IN_PROGRESS" or "COMPLETED" to estimate wait.
        // Let's assume the "current token" is the lowest token number that is still WAITING or IN_PROGRESS.

        const currentTokenEntry = await prisma.oPDQueue.findFirst({
            where: {
                doctorId: queueEntry.doctorId,
                status: { in: ["WAITING", "IN_PROGRESS"] },
                createdAt: {
                    gte: new Date(new Date().setHours(0, 0, 0, 0))
                }
            },
            orderBy: {
                tokenNumber: 'asc'
            }
        });

        const currentToken = currentTokenEntry?.tokenNumber || queueEntry.tokenNumber;
        const peopleAhead = queueEntry.tokenNumber - currentToken;
        const estimatedWaitTime = peopleAhead * 10; // 10 mins per patient

        // Get Doctor Name
        // Assuming doctorId is a User ID, we fetch the name
        const doctor = await prisma.user.findUnique({
            where: { id: queueEntry.doctorId },
            select: { name: true }
        });

        return NextResponse.json({
            myToken: queueEntry.tokenNumber,
            currentToken: currentToken,
            estimatedWaitTime: Math.max(0, estimatedWaitTime),
            doctorName: doctor?.name || "Unknown Doctor",
            department: "OPD", // Could fetch from doctor details if available
            status: queueEntry.status
        });

    } catch (error) {
        console.error("Error fetching OPD status:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
