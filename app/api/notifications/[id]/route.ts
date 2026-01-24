import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// PUT /api/notifications/[id] - Mark notification as read
export async function PUT(request: NextRequest, context: RouteParams) {
    try {
        const { id } = await context.params;
        const body = await request.json();
        const { isRead } = body;

        const notification = await prisma.notification.update({
            where: { id },
            data: {
                isRead: isRead ?? true,
                readAt: isRead ? new Date() : null,
            },
        });

        return NextResponse.json({ data: notification });
    } catch (error) {
        console.error('Error updating notification:', error);
        return NextResponse.json(
            { error: 'Failed to update notification' },
            { status: 500 }
        );
    }
}

// DELETE /api/notifications/[id] - Delete a notification
export async function DELETE(request: NextRequest, context: RouteParams) {
    try {
        const { id } = await context.params;

        await prisma.notification.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting notification:', error);
        return NextResponse.json(
            { error: 'Failed to delete notification' },
            { status: 500 }
        );
    }
}
