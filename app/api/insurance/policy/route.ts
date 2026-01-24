/**
 * Insurance Policy Management API
 * 
 * GET: Fetch patient's policies
 * POST: Add new policy
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Common TPA list for India
const TPA_LIST = [
    { code: 'MEDI_ASSIST', name: 'Medi Assist', type: 'TPA' },
    { code: 'PARAMOUNT', name: 'Paramount Health Services', type: 'TPA' },
    { code: 'VIDAL', name: 'Vidal Health TPA', type: 'TPA' },
    { code: 'RAKSHA', name: 'Raksha TPA', type: 'TPA' },
    { code: 'GOOD_HEALTH', name: 'Good Health TPA', type: 'TPA' },
    { code: 'HERITAGE', name: 'Heritage Health TPA', type: 'TPA' },
    { code: 'ERICSON', name: 'Ericson Insurance TPA', type: 'TPA' },
    { code: 'MD_INDIA', name: 'MD India', type: 'TPA' },
    { code: 'HEALTH_INDIA', name: 'Health India TPA', type: 'TPA' },
    { code: 'SAFEWAY', name: 'Safeway Insurance TPA', type: 'TPA' },
];

// Common Insurers
const INSURER_LIST = [
    { code: 'STAR', name: 'Star Health Insurance' },
    { code: 'HDFC_ERGO', name: 'HDFC ERGO' },
    { code: 'ICICI_LOMBARD', name: 'ICICI Lombard' },
    { code: 'MAX_BUPA', name: 'Max Bupa' },
    { code: 'BAJAJ', name: 'Bajaj Allianz' },
    { code: 'CARE', name: 'Care Health Insurance' },
    { code: 'NIVA_BUPA', name: 'Niva Bupa' },
    { code: 'MANIPAL_CIGNA', name: 'ManipalCigna' },
    { code: 'SBI', name: 'SBI General Insurance' },
    { code: 'TATA_AIG', name: 'Tata AIG' },
    { code: 'AYUSHMAN', name: 'Ayushman Bharat (PMJAY)' },
    { code: 'CGHS', name: 'CGHS' },
    { code: 'ESIC', name: 'ESIC' },
];

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const patientId = searchParams.get('patientId');
        const policyId = searchParams.get('policyId');
        const listOptions = searchParams.get('options');

        // Return TPA and Insurer options for dropdowns
        if (listOptions === 'true') {
            return NextResponse.json({
                tpaList: TPA_LIST,
                insurerList: INSURER_LIST
            });
        }

        // Single policy detail
        if (policyId) {
            const policy = await prisma.insurancePolicy.findUnique({
                where: { id: policyId },
                include: {
                    claims: {
                        orderBy: { submittedAt: 'desc' },
                        take: 5
                    }
                }
            });

            if (!policy) {
                return NextResponse.json({ error: 'Policy not found' }, { status: 404 });
            }

            return NextResponse.json({ policy });
        }

        // List patient's policies
        if (patientId) {
            const policies = await prisma.insurancePolicy.findMany({
                where: { patientId },
                include: {
                    claims: {
                        select: { id: true, status: true, claimAmount: true, approvedAmount: true }
                    }
                },
                orderBy: { validTo: 'desc' }
            });

            // Separate active and expired
            const now = new Date();
            const activePolicies = policies.filter(p => p.isActive && p.validTo >= now);
            const expiredPolicies = policies.filter(p => !p.isActive || p.validTo < now);

            return NextResponse.json({
                policies,
                activePolicies,
                expiredPolicies,
                hasActivePolicy: activePolicies.length > 0
            });
        }

        return NextResponse.json({ error: 'patientId required' }, { status: 400 });

    } catch (error) {
        console.error('Policy GET error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            patientId,
            insurerCode,
            insurerName,
            policyNumber,
            policyType,
            sumInsured,
            validFrom,
            validTo,
            tpaCode,
            tpaName
        } = body;

        if (!patientId || !policyNumber || !insurerName) {
            return NextResponse.json({
                error: 'patientId, policyNumber, and insurerName required'
            }, { status: 400 });
        }

        // Check for duplicate policy number
        const existing = await prisma.insurancePolicy.findFirst({
            where: { patientId, policyNumber }
        });

        if (existing) {
            return NextResponse.json({
                error: 'Policy with this number already exists for patient'
            }, { status: 409 });
        }

        // Find TPA name from code if not provided
        let finalTpaName = tpaName;
        if (tpaCode && !tpaName) {
            const tpa = TPA_LIST.find(t => t.code === tpaCode);
            finalTpaName = tpa?.name;
        }

        const policy = await prisma.insurancePolicy.create({
            data: {
                patientId,
                insurerId: insurerCode || insurerName.toUpperCase().replace(/\s+/g, '_'),
                insurerName,
                policyNumber,
                policyType: policyType || 'Individual',
                sumInsured: parseFloat(sumInsured) || 500000,
                validFrom: new Date(validFrom || Date.now()),
                validTo: new Date(validTo || Date.now() + 365 * 24 * 60 * 60 * 1000),
                tpaCode,
                tpaName: finalTpaName,
                isActive: true
            }
        });

        return NextResponse.json({
            success: true,
            policy,
            message: 'Policy added successfully'
        }, { status: 201 });

    } catch (error) {
        console.error('Policy POST error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
