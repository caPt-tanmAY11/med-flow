import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// POST /api/notifications/mark-all-read - Mark all notifications as read for a user
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { userId } = body;

        if (!userId) {
            return NextResponse.json(
                { error: 'User ID is required' },
                { status: 400 }
            );
        }

        await prisma.notification.updateMany({
            where: { userId, isRead: false },
            data: {
                isRead: true,
                readAt: new Date(),
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        return NextResponse.json(
            { error: 'Failed to mark notifications as read' },
            { status: 500 }
        );
    }
}
