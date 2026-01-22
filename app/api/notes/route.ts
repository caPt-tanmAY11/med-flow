import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/notes - Get clinical notes
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const encounterId = searchParams.get('encounterId');
        const patientId = searchParams.get('patientId');
        const noteType = searchParams.get('noteType');

        const where: Record<string, unknown> = {};
        if (encounterId) where.encounterId = encounterId;
        if (patientId) where.patientId = patientId;
        if (noteType) where.noteType = noteType;

        const notes = await prisma.clinicalNote.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: 50,
        });

        return NextResponse.json({ data: notes });
    } catch (error) {
        console.error('Error fetching notes:', error);
        return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 });
    }
}

// POST /api/notes - Create clinical note
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { encounterId, patientId, noteType, content, authorId, authorRole } = body;

        if (!encounterId || !patientId || !noteType || !content) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const note = await prisma.clinicalNote.create({
            data: {
                encounterId,
                patientId,
                noteType,
                content,
                authorId,
                authorRole,
            },
        });

        // Create audit event
        await prisma.auditEvent.create({
            data: {
                entityType: 'ClinicalNote',
                entityId: note.id,
                action: 'create',
                performedBy: authorId || 'system',
            },
        });

        return NextResponse.json({ data: note }, { status: 201 });
    } catch (error) {
        console.error('Error creating note:', error);
        return NextResponse.json({ error: 'Failed to create note' }, { status: 500 });
    }
}
