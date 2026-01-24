/**
 * Insurance Claims API
 * 
 * POST: Submit a claim
 * GET: Get claim status and history
 * PATCH: Update claim status (for admin/TPA simulation)
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET - Fetch claims for a patient or specific claim details
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const patientId = searchParams.get('patientId');
        const claimId = searchParams.get('claimId');
        const policyId = searchParams.get('policyId');
        const status = searchParams.get('status');

        // Single claim detail
        if (claimId) {
            const claim = await prisma.insuranceClaim.findUnique({
                where: { id: claimId },
                include: {
                    bill: {
                        include: {
                            items: true,
                            patient: { select: { id: true, name: true, uhid: true } }
                        }
                    },
                    policy: true
                }
            });

            if (!claim) {
                return NextResponse.json({ error: 'Claim not found' }, { status: 404 });
            }

            return NextResponse.json({ claim });
        }

        // List claims for patient
        const where: any = {};
        if (patientId) {
            where.bill = { patientId };
        }
        if (policyId) {
            where.policyId = policyId;
        }
        if (status) {
            where.status = status;
        }

        const claims = await prisma.insuranceClaim.findMany({
            where,
            include: {
                bill: {
                    select: {
                        id: true,
                        billNumber: true,
                        totalAmount: true,
                        patient: { select: { id: true, name: true, uhid: true } }
                    }
                },
                policy: {
                    select: {
                        id: true,
                        insurerName: true,
                        policyNumber: true,
                        tpaName: true
                    }
                }
            },
            orderBy: { submittedAt: 'desc' }
        });

        return NextResponse.json({ claims });

    } catch (error) {
        console.error('Claims GET error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST - Submit new claim or perform actions
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { action } = body;

        switch (action) {
            case 'submit': {
                const { billId, policyId, documents } = body;

                if (!billId || !policyId) {
                    return NextResponse.json({ error: 'billId and policyId required' }, { status: 400 });
                }

                // Verify bill exists and get amount
                const bill = await prisma.bill.findUnique({
                    where: { id: billId },
                    include: { patient: true }
                });

                if (!bill) {
                    return NextResponse.json({ error: 'Bill not found' }, { status: 404 });
                }

                // Verify policy
                const policy = await prisma.insurancePolicy.findUnique({
                    where: { id: policyId }
                });

                if (!policy || !policy.isActive) {
                    return NextResponse.json({ error: 'Invalid or inactive policy' }, { status: 400 });
                }

                // Check policy validity
                const now = new Date();
                if (now < policy.validFrom || now > policy.validTo) {
                    return NextResponse.json({ error: 'Policy not valid for current date' }, { status: 400 });
                }

                // Check if claim amount exceeds sum insured
                if (bill.totalAmount > policy.sumInsured) {
                    return NextResponse.json({
                        warning: 'Claim amount exceeds sum insured',
                        claimableAmount: policy.sumInsured,
                        excessAmount: bill.totalAmount - policy.sumInsured
                    });
                }

                // Create the claim
                const claim = await prisma.insuranceClaim.create({
                    data: {
                        billId,
                        policyId,
                        claimAmount: bill.totalAmount,
                        status: 'submitted',
                        documents: documents || [],
                    }
                });

                // Create audit event
                await prisma.auditEvent.create({
                    data: {
                        entityType: 'InsuranceClaim',
                        entityId: claim.id,
                        action: 'claim_submitted',
                        performedBy: 'PATIENT',
                        metadata: {
                            billNumber: bill.billNumber,
                            claimAmount: claim.claimAmount,
                            insurerName: policy.insurerName,
                            tpaName: policy.tpaName
                        }
                    }
                });

                return NextResponse.json({
                    success: true,
                    claim,
                    message: `Claim submitted to ${policy.tpaName || policy.insurerName}`
                }, { status: 201 });
            }

            case 'update-status': {
                // For TPA/Admin to update claim status
                const { claimId, newStatus, approvedAmount, rejectionReason, updatedBy } = body;

                if (!claimId || !newStatus) {
                    return NextResponse.json({ error: 'claimId and newStatus required' }, { status: 400 });
                }

                const claim = await prisma.insuranceClaim.findUnique({ where: { id: claimId } });
                if (!claim) {
                    return NextResponse.json({ error: 'Claim not found' }, { status: 404 });
                }

                const updateData: any = { status: newStatus };

                if (newStatus === 'approved' || newStatus === 'partially_approved') {
                    updateData.approvedAmount = approvedAmount || claim.claimAmount;
                    updateData.settledAt = new Date();
                }

                if (newStatus === 'rejected') {
                    updateData.rejectionReason = rejectionReason;
                }

                const updatedClaim = await prisma.insuranceClaim.update({
                    where: { id: claimId },
                    data: updateData
                });

                // Create audit event for status change
                await prisma.auditEvent.create({
                    data: {
                        entityType: 'InsuranceClaim',
                        entityId: claimId,
                        action: 'status_update',
                        performedBy: updatedBy || 'TPA',
                        metadata: {
                            fromStatus: claim.status,
                            toStatus: newStatus,
                            approvedAmount,
                            rejectionReason
                        }
                    }
                });

                return NextResponse.json({ success: true, claim: updatedClaim });
            }

            default:
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

    } catch (error) {
        console.error('Claims POST error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
