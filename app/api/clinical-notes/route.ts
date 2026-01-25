import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET: Fetch notes for an encounter
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

        const notes = await prisma.clinicalNote.findMany({
            where: { encounterId },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(notes);
    } catch (error) {
        console.error("Error fetching notes:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// POST: Create new clinical note
export async function POST(req: Request) {
    try {
        const session = await auth.api.getSession({ headers: req.headers });
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { encounterId, patientId, noteType, content } = body;

        if (!encounterId || !patientId || !content) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const note = await prisma.clinicalNote.create({
            data: {
                encounterId,
                patientId,
                noteType: noteType || "general",
                content,
                authorId: session.user.id,
                authorRole: session.user.role || "DOCTOR",
            }
        });

        return NextResponse.json(note);
    } catch (error) {
        console.error("Error creating note:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
