import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';

// POST /api/lab-tests/checkout - Submit order with allergy/implant info
const checkoutSchema = z.object({
    patientId: z.string().uuid(),
    prescriptionUrl: z.string().url().nullish().or(z.literal('')),
    hasAllergies: z.boolean(),
    allergyNotes: z.string().optional(),
    hasImplants: z.boolean(),
    implantDetails: z.string().optional(),
    scheduledDate: z.string().datetime().optional(),
});

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const data = checkoutSchema.parse(body);

        // Get cart items
        const cartItems = await prisma.labTestOrder.findMany({
            where: {
                patientId: data.patientId,
                status: 'cart',
            },
            include: {
                test: true,
            },
        });

        if (cartItems.length === 0) {
            return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
        }

        // Check for radiology tests that may conflict with implants
        if (data.hasImplants) {
            const radiologyTests = cartItems.filter(item => item.test.type === 'RADIOLOGY');
            const mriCTTests = radiologyTests.filter(item =>
                item.test.code.includes('MRI') || item.test.code.includes('CT')
            );

            if (mriCTTests.length > 0 && !data.implantDetails) {
                return NextResponse.json({
                    error: 'Implant details are required for MRI/CT scans. Please provide details for safety assessment.',
                    requiresImplantDetails: true,
                    affectedTests: mriCTTests.map(t => t.test.name),
                }, { status: 400 });
            }
        }

        // Update all cart items to pending
        const updatedOrders = await prisma.$transaction(
            cartItems.map(item =>
                prisma.labTestOrder.update({
                    where: { id: item.id },
                    data: {
                        status: 'pending',
                        prescriptionUrl: data.prescriptionUrl,
                        hasAllergies: data.hasAllergies,
                        allergyNotes: data.allergyNotes,
                        hasImplants: data.hasImplants,
                        implantDetails: data.implantDetails,
                        scheduledDate: data.scheduledDate ? new Date(data.scheduledDate) : null,
                    },
                    include: {
                        test: true,
                    },
                })
            )
        );

        // Save implant details to patient record if provided
        if (data.hasImplants && data.implantDetails) {
            // Parse implant details and save
            try {
                const implantTypes = data.implantDetails.split(',').map(s => s.trim());
                for (const implantType of implantTypes) {
                    await prisma.patientImplant.create({
                        data: {
                            patientId: data.patientId,
                            type: implantType,
                            location: 'Not specified',
                            mriSafe: null, // Needs medical review
                            details: data.implantDetails,
                        },
                    });
                }
            } catch (implantError) {
                console.error('Error saving implant details (non-fatal):', implantError);
            }
        }

        // Calculate total
        const total = cartItems.reduce((sum, item) => {
            return sum + (item.test.discountedPrice || item.test.price);
        }, 0);

        // Create bill for lab tests in PaisaTracker
        let billId: string | null = null;
        try {
            // Create a lab encounter for billing
            const encounter = await prisma.encounter.create({
                data: {
                    patientId: data.patientId,
                    encounterType: 'LAB',
                    status: 'in_progress',
                    department: 'LAB_SERVICES',
                    chiefComplaint: `Lab Tests: ${cartItems.map(i => i.test.name).join(', ')}`,
                    startTime: new Date(),
                },
            });

            // Generate bill number
            const date = new Date();
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
            let billNumber = `LAB-${year}${month}-${random}`;

            // Check for existing bill number
            let attempts = 0;
            while (attempts < 10) {
                const existing = await prisma.bill.findUnique({ where: { billNumber } });
                if (!existing) break;
                billNumber = `LAB-${year}${month}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
                attempts++;
            }

            // Create bill with nested items
            const bill = await prisma.bill.create({
                data: {
                    billNumber,
                    patientId: data.patientId,
                    encounterId: encounter.id,
                    status: 'pending',
                    subtotal: total,
                    discountAmount: 0,
                    taxAmount: 0,
                    totalAmount: total,
                    paidAmount: 0,
                    balanceDue: total,
                    items: {
                        create: cartItems.map(item => ({
                            category: 'lab',
                            department: item.test.type === 'RADIOLOGY' ? 'RADIOLOGY' : 'LAB_SERVICES',
                            itemCode: item.test.code,
                            description: item.test.name,
                            quantity: 1,
                            unitPrice: item.test.discountedPrice || item.test.price,
                            totalPrice: item.test.discountedPrice || item.test.price,
                        })),
                    },
                },
            });

            billId = bill.id;

            // Update lab orders with billId for payment tracking
            await prisma.labTestOrder.updateMany({
                where: {
                    patientId: data.patientId,
                    status: 'pending',
                    id: { in: cartItems.map(i => i.id) }
                },
                data: {
                    // Store billId reference (we'll add this field to the schema if needed)
                }
            });

            console.log(`Bill ${billNumber} created for ${cartItems.length} lab tests, total: ₹${total}`);
        } catch (billingError) {
            console.error('Error creating bill:', billingError);
            // Don't fail the checkout if billing fails
        }

        return NextResponse.json({
            success: true,
            data: {
                orders: updatedOrders,
                orderCount: updatedOrders.length,
                total,
            },
            message: `${updatedOrders.length} test(s) submitted successfully`,
        }, { status: 201 });
    } catch (error) {
        console.error('Error during checkout:', error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 });
        }
        return NextResponse.json({ error: 'Failed to complete checkout' }, { status: 500 });
    }
}
