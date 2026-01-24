import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Helper to generate 4-digit code
function generateCode(): string {
    return Math.floor(1000 + Math.random() * 9000).toString();
}

// GET /api/admin/nurses - Get all users with NURSE role
export async function GET(request: NextRequest) {
    try {
        // Fetch specific roles
        const nurses = await prisma.user.findMany({
            where: {
                role: { in: ['NURSE', 'NURSING_ADMIN', 'ADMIN'] }
            },
            select: {
                id: true,
                name: true,
                email: true,
                image: true,
                createdAt: true,
                role: true,
            },
            orderBy: { name: 'asc' },
        });

        // Also get their current active duty if any
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const activeDuties = await prisma.nurseDuty.findMany({
            where: {
                shiftDate: { gte: today, lt: tomorrow },
                isActive: true,
            },
        });

        const dutyMap = new Map(activeDuties.map(d => [d.nurseId, d]));

        const nursesWithStatus = nurses.map(nurse => ({
            ...nurse,
            currentDuty: dutyMap.get(nurse.id) || null,
        }));

        return NextResponse.json({ data: nursesWithStatus });
    } catch (error) {
        console.error('Error fetching nurses:', error);
        return NextResponse.json({ error: 'Failed to fetch nurses' }, { status: 500 });
    }
}

// POST /api/admin/nurses - Create a new nurse directly in DB
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name } = body;

        // Minimal validation
        if (!name) {
            return NextResponse.json({ error: 'Name is required' }, { status: 400 });
        }

        // Generate fake email if not provided to satisfy unique constraint
        const email = body.email || `nurse_${Date.now()}@medflow.local`;

        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return NextResponse.json({ error: 'User with this identifier already exists' }, { status: 400 });
        }

        // Create User directly
        // We set a default dummy password if the schema requires it, though authentication
        // will now be handled via the Secret Code in the Nurse Station.
        const newUser = await prisma.user.create({
            data: {
                id: `nurse-${Date.now()}`,
                name,
                email,
                role: 'NURSE',
                image: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
                updatedAt: new Date(),
                // If password is required by DB but optional in Prisma schema (String?), we leave it.
                // If it was required, we'd add it.
            },
        });

        // IMMEDIATELY Generate Secret Code and Assign Duty for Today
        const code = generateCode();
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        await prisma.nurseDuty.create({
            data: {
                nurseId: newUser.id,
                nurseName: newUser.name,
                shiftType: 'DAY', // Default
                shiftDate: today,
                secretCode: code,
                isActive: true,
            }
        });

        return NextResponse.json({
            data: newUser,
            secretCode: code,
            message: 'Nurse created and assigned code successfully'
        }, { status: 201 });

    } catch (error) {
        console.error('Error creating nurse:', error);
        return NextResponse.json({ error: 'Failed to create nurse' }, { status: 500 });
    }
}
