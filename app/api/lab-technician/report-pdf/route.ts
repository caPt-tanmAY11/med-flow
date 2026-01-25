import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// POST /api/lab-technician/report-pdf - Generate PDF data for report
// Note: This returns structured data for client-side PDF generation using jsPDF
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
                LabTest: {
                    include: {
                        LabTestResultField: {
                            orderBy: { sortOrder: 'asc' },
                        },
                    },
                },
                Patient: {
                    select: {
                        id: true,
                        uhid: true,
                        name: true,
                        gender: true,
                        dob: true,
                        contact: true,
                        address: true,
                    },
                },
            },
        });

        if (!order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        if (!order.resultData) {
            return NextResponse.json({ error: 'No result data available for this order' }, { status: 400 });
        }

        // Calculate age from DOB
        const dob = new Date(order.Patient.dob);
        const ageDiff = Date.now() - dob.getTime();
        const ageDate = new Date(ageDiff);
        const age = Math.abs(ageDate.getUTCFullYear() - 1970);

        // Format result data with normal ranges and flags
        const resultData = order.resultData as Record<string, unknown>;
        const formattedResults = order.LabTest.LabTestResultField.map(field => {
            const value = resultData[field.fieldName];
            let status = 'normal';

            if (field.fieldType === 'number' && field.normalMin !== null && field.normalMax !== null) {
                const numValue = parseFloat(String(value));
                if (!isNaN(numValue)) {
                    if (numValue < field.normalMin) status = 'low';
                    else if (numValue > field.normalMax) status = 'high';
                }
            }

            return {
                name: field.fieldLabel,
                value: value,
                unit: field.unit || '',
                normalRange: (field.normalMin !== null && field.normalMax !== null)
                    ? `${field.normalMin} - ${field.normalMax}`
                    : '-',
                status,
            };
        });

        // Build PDF data structure
        const reportData = {
            header: {
                labName: 'MedFlow Diagnostics',
                address: 'Main Hospital Campus, Medical Road',
                phone: '+91 1234567890',
                email: 'lab@medflow.health',
                accreditationNo: 'NABL-XXX-XXXX',
            },
            patient: {
                name: order.Patient.name,
                uhid: order.Patient.uhid,
                age: `${age} years`,
                gender: order.Patient.gender,
                contact: order.Patient.contact || 'N/A',
            },
            test: {
                name: order.LabTest.name,
                code: order.LabTest.code,
                category: order.LabTest.category,
                barcode: order.barcode || 'N/A',
            },
            sample: {
                type: order.LabTest.sampleType || 'N/A',
                collectedAt: order.collectedAt?.toISOString() || 'N/A',
                collectedBy: order.collectedBy || 'N/A',
            },
            results: formattedResults,
            meta: {
                orderId: order.id,
                resultedAt: order.resultedAt?.toISOString() || new Date().toISOString(),
                resultedBy: order.resultedBy || 'Lab Technician',
                verifiedAt: order.verifiedAt?.toISOString(),
                verifiedBy: order.verifiedBy,
                isCritical: order.isCritical,
                reportGeneratedAt: new Date().toISOString(),
            },
            footer: {
                disclaimer: 'This report is generated electronically and is valid without signature. Please correlate clinically.',
                note: order.isCritical ? '⚠️ CRITICAL VALUES DETECTED - Please consult physician immediately.' : '',
            },
        };

        return NextResponse.json({
            data: reportData,
            message: 'Report data generated successfully',
        });
    } catch (error) {
        console.error('Error generating report data:', error);
        return NextResponse.json({ error: 'Failed to generate report data' }, { status: 500 });
    }
}
