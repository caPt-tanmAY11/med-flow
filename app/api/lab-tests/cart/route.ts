import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/lab-tests/cart - Get patient's cart
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const patientId = searchParams.get('patientId');

        if (!patientId) {
            return NextResponse.json({ error: 'Patient ID is required' }, { status: 400 });
        }

        const cartItems = await prisma.labTestOrder.findMany({
            where: {
                patientId,
                status: 'cart',
            },
            include: {
                test: true,
            },
            orderBy: { createdAt: 'desc' },
        });

        // Calculate totals
        const subtotal = cartItems.reduce((sum, item) => {
            return sum + (item.test.discountedPrice || item.test.price);
        }, 0);

        const totalDiscount = cartItems.reduce((sum, item) => {
            return sum + (item.test.discountedPrice ? item.test.price - item.test.discountedPrice : 0);
        }, 0);

        return NextResponse.json({
            data: cartItems,
            summary: {
                itemCount: cartItems.length,
                subtotal: cartItems.reduce((sum, item) => sum + item.test.price, 0),
                discount: totalDiscount,
                total: subtotal,
            },
        });
    } catch (error) {
        console.error('Error fetching cart:', error);
        return NextResponse.json({ error: 'Failed to fetch cart' }, { status: 500 });
    }
}

// DELETE /api/lab-tests/cart - Remove from cart
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const orderId = searchParams.get('orderId');

        if (!orderId) {
            return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
        }

        const order = await prisma.labTestOrder.findUnique({
            where: { id: orderId },
        });

        if (!order) {
            return NextResponse.json({ error: 'Cart item not found' }, { status: 404 });
        }

        if (order.status !== 'cart') {
            return NextResponse.json({ error: 'Can only remove items from cart' }, { status: 400 });
        }

        await prisma.labTestOrder.delete({
            where: { id: orderId },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error removing from cart:', error);
        return NextResponse.json({ error: 'Failed to remove from cart' }, { status: 500 });
    }
}
