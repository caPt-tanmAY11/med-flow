import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET: Fetch current queue for a doctor (or department if implemented later)
export async function GET(req: Request) {
    try {
        const session = await auth.api.getSession({ headers: req.headers });
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const doctorId = searchParams.get("doctorId") || session.user.id;
        const status = searchParams.get("status") || "WAITING";

        const queue = await (prisma as any).oPDQueue.findMany({
            where: {
                doctorId: doctorId,
                status: status,
            },
            include: {
                Patient: {
                    select: {
                        id: true,
                        name: true,
                        uhid: true,
                        gender: true,
                        dob: true,
                    }
                }
            },
            orderBy: {
                tokenNumber: 'asc',
            }
        });

        return NextResponse.json(queue);

    } catch (error) {
        console.error("Error fetching OPD queue:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// POST: Add patient to queue (Check-in)
export async function POST(req: Request) {
    try {
        const session = await auth.api.getSession({ headers: req.headers });
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { patientId, doctorId } = body;

        if (!patientId || !doctorId) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Get last token number for today
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const lastEntry = await (prisma as any).oPDQueue.findFirst({
            where: {
                doctorId: doctorId,
                createdAt: {
                    gte: today
                }
            },
            orderBy: {
                tokenNumber: 'desc'
            }
        });

        const newTokenNumber = (lastEntry?.tokenNumber || 0) + 1;

        const newQueueEntry = await (prisma as any).oPDQueue.create({
            data: {
                id: crypto.randomUUID(),
                patientId,
                doctorId,
                tokenNumber: newTokenNumber,
                status: "WAITING"
            }
        });

        return NextResponse.json(newQueueEntry);

    } catch (error) {
        console.error("Error adding to OPD queue:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// PUT: Update queue status (Call In / End Visit)
export async function PUT(req: Request) {
    try {
        const session = await auth.api.getSession({ headers: req.headers });
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { id, status } = body;

        if (!id || !status) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const updatedEntry = await (prisma as any).oPDQueue.update({
            where: { id },
            data: { status }
        });

        return NextResponse.json(updatedEntry);

    } catch (error) {
        console.error("Error updating OPD queue:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
