
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function setupIPD() {
    try {
        console.log("Setting up IPD for test patient...");
        
        // 1. Find the most recent patient to attach IPD to
        const patient = await prisma.patient.findFirst({
            orderBy: { createdAt: 'desc' }
        });

        if (!patient) {
            console.error("Patient not found. Run previous verification first.");
            process.exit(1);
        }
        console.log(`Found patient: ${patient.uhid}`);

        // 2. Create/Find a Bed
        const bed = await prisma.bed.upsert({
            where: { bedNumber: "VIP-101" },
            update: { status: "OCCUPIED" },
            create: {
                bedNumber: "VIP-101",
                ward: "Cardiology Wing",
                floor: 3,
                type: "VIP",
                status: "OCCUPIED"
            }
        });
        console.log(`Bed ready: ${bed.bedNumber}`);

        // 3. Create active IPD encounter
        const encounter = await prisma.encounter.create({
            data: {
                patientId: patient.id,
                type: "IPD",
                status: "ACTIVE",
                admissionTime: new Date(),
                primaryDoctorId: "Dr. House", // Mock doctor ID or name
            }
        });
        console.log(`Encounter created: ${encounter.id}`);

        // 4. Assign Bed
        await prisma.bedAssignment.create({
            data: {
                encounterId: encounter.id,
                bedId: bed.id,
                startTime: new Date()
            }
        });
        console.log("Bed assigned successfully.");

        // 5. Ensure User record has UHID (Simulating the new registration flow)
        // The user email is 309367@medflow.com (derived from UHID-2026-309367)
        // We need to update this user to have the uhid set.
        const userEmail = `${patient.uhid.slice(-6)}@medflow.com`;
        console.log(`Updating User record for email: ${userEmail} with UHID: ${patient.uhid}`);
        
        await prisma.user.updateMany({
            where: { email: userEmail },
            data: { uhid: patient.uhid }
        });
        console.log("User record updated with UHID.");

    } catch (error) {
        console.error("Setup failed:", error);
    } finally {
        await prisma.$disconnect();
    }
}

setupIPD();
