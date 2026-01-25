import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

// Helper to generate barcode using Python script
async function generateBarcodeWithPython(
    labCode: string,
    patientId: string,
    testCode: string,
    sequence: number
): Promise<{ barcode: string; verification_hash: string; is_valid: boolean }> {
    const scriptPath = path.join(process.cwd(), 'scripts', 'generate_barcode.py');

    try {
        const { stdout } = await execAsync(
            `python "${scriptPath}" -l "${labCode}" -p "${patientId}" -t "${testCode}" -s ${sequence}`
        );

        const result = JSON.parse(stdout);
        return {
            barcode: result.barcode,
            verification_hash: result.verification_hash,
            is_valid: result.is_valid
        };
    } catch (error) {
        console.error('Python barcode generation failed, using fallback:', error);
        // Fallback to simple generation if Python fails
        const date = new Date();
        const dateStr = date.toISOString().slice(2, 10).replace(/-/g, '');
        const timeStr = date.toTimeString().slice(0, 8).replace(/:/g, '');
        const patientShort = patientId.replace(/\D/g, '').slice(-6).padStart(6, '0');
        const seq = String(sequence).padStart(4, '0');
        const barcode = `${labCode}-${dateStr}${timeStr}-${patientShort}-${testCode.toUpperCase().slice(0, 4)}-${seq}-0`;

        return { barcode, verification_hash: 'FALLBACK', is_valid: true };
    }
}

// POST /api/lab-technician/barcode - Generate unique barcode
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { orderId } = body;

        if (!orderId) {
            return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
        }

        const order = await prisma.labTestOrder.findUnique({
            where: { id: orderId },
            include: {
                test: true,
                patient: {
                    select: { uhid: true },
                },
            },
        });

        if (!order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        if (order.barcode) {
            return NextResponse.json({
                data: { barcode: order.barcode },
                message: 'Barcode already exists for this order',
            });
        }

        // Get sequence number for today
        const date = new Date();
        const todayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

        const todayCount = await prisma.labTestOrder.count({
            where: {
                barcode: { not: null },
                updatedAt: {
                    gte: todayStart,
                    lt: todayEnd,
                },
            },
        });

        const labCode = order.test.type === 'RADIOLOGY' ? 'RAD' : 'LAB';

        // Generate barcode using Python script
        const barcodeResult = await generateBarcodeWithPython(
            labCode,
            order.patient.uhid,
            order.test.code,
            todayCount + 1
        );

        // Update order with barcode
        const updatedOrder = await prisma.labTestOrder.update({
            where: { id: orderId },
            data: {
                barcode: barcodeResult.barcode,
                status: order.status === 'pending' ? 'sample_collected' : order.status,
            },
            include: {
                test: true,
                patient: {
                    select: { uhid: true, name: true },
                },
            },
        });

        return NextResponse.json({
            data: {
                barcode: barcodeResult.barcode,
                verification_hash: barcodeResult.verification_hash,
                is_valid: barcodeResult.is_valid,
                order: updatedOrder,
            },
            message: 'Barcode generated successfully',
        }, { status: 201 });
    } catch (error) {
        console.error('Error generating barcode:', error);
        return NextResponse.json({ error: 'Failed to generate barcode' }, { status: 500 });
    }
}

// GET /api/lab-technician/barcode - Lookup by barcode
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const barcode = searchParams.get('barcode');

        if (!barcode) {
            return NextResponse.json({ error: 'Barcode is required' }, { status: 400 });
        }

        const order = await prisma.labTestOrder.findUnique({
            where: { barcode },
            include: {
                test: {
                    include: {
                        resultFields: {
                            orderBy: { sortOrder: 'asc' },
                        },
                    },
                },
                patient: {
                    select: {
                        id: true,
                        uhid: true,
                        name: true,
                        gender: true,
                        dob: true,
                        allergies: {
                            where: { isActive: true },
                        },
                        implants: true,
                    },
                },
            },
        });

        if (!order) {
            return NextResponse.json({ error: 'Order not found for this barcode' }, { status: 404 });
        }

        return NextResponse.json({ data: order });
    } catch (error) {
        console.error('Error looking up barcode:', error);
        return NextResponse.json({ error: 'Failed to lookup barcode' }, { status: 500 });
    }
}
