import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/notifications - Fetch notifications for current user
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');
        const unreadOnly = searchParams.get('unreadOnly') === 'true';
        const limit = parseInt(searchParams.get('limit') || '20');

        if (!userId) {
            return NextResponse.json(
                { error: 'User ID is required' },
                { status: 400 }
            );
        }

        const where: { userId: string; isRead?: boolean } = { userId };
        if (unreadOnly) {
            where.isRead = false;
        }

        const [notifications, unreadCount] = await Promise.all([
            prisma.notification.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                take: limit,
            }),
            prisma.notification.count({
                where: { userId, isRead: false },
            }),
        ]);

        return NextResponse.json({
            data: notifications,
            unreadCount,
        });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        return NextResponse.json(
            { error: 'Failed to fetch notifications' },
            { status: 500 }
        );
    }
}

// POST /api/notifications - Create a notification
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { userId, title, message, type = 'info', link, encounterId, patientId } = body;

        if (!userId || !title || !message) {
            return NextResponse.json(
                { error: 'userId, title, and message are required' },
                { status: 400 }
            );
        }

        const notification = await prisma.notification.create({
            data: {
                userId,
                title,
                message,
                type,
                link,
                encounterId,
                patientId,
            },
        });

        return NextResponse.json({ data: notification }, { status: 201 });
    } catch (error) {
        console.error('Error creating notification:', error);
        return NextResponse.json(
            { error: 'Failed to create notification' },
            { status: 500 }
        );
    }
}
