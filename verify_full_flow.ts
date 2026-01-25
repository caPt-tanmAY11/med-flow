
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyFullFlow() {
    try {
        console.log("=== Starting End-to-End Verification ===");

        // 1. Create a NEW unique patient
        const randomSuffix = Math.floor(Math.random() * 10000);
        const patientName = `Test Patient ${randomSuffix}`;
        const patientData = {
            name: patientName,
            dob: new Date("1990-01-01").toISOString(),
            gender: "FEMALE",
            contact: `98700${randomSuffix.toString().padStart(5, '0')}`,
            address: "456 Flow St",
            isTemporary: false
        };

        console.log(`\n1. Registering new patient: ${patientName}`);
        const regResponse = await fetch('http://localhost:3000/api/patients', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(patientData)
        });

        if (!regResponse.ok) {
            throw new Error(`Registration failed: ${regResponse.status}`);
        }

        const regResult = await regResponse.json();
        const uhid = regResult.data.uhid;
        console.log(`   -> Patient created with UHID: ${uhid}`);

        // 2. Verify User Account Created
        await new Promise(r => setTimeout(r, 2000)); // Wait for async auth creation
        const uhidLast6 = uhid.slice(-6);
        const email = `${uhidLast6}@medflow.com`;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            throw new Error(`User account not found for email: ${email}`);
        }
        console.log(`   -> User account verified: ${user.email} (UHID: ${user.uhid})`);

        if (user.uhid !== uhid) {
            throw new Error(`Mismatch! User UHID (${user.uhid}) does not match Patient UHID (${uhid})`);
        }

        // 3. Create Admission (IPD) Data
        console.log("\n2. Simulating IPD Admission...");
        const bedNum = `BED-${randomSuffix}`;
        const ward = `Ward ${randomSuffix}`;
        const floor = 4;

        const bed = await prisma.bed.create({
            data: {
                bedNumber: bedNum,
                ward: ward,
                floor: floor,
                type: "General",
                status: "OCCUPIED"
            }
        });

        const encounter = await prisma.encounter.create({
            data: {
                patientId: regResult.data.id,
                type: "IPD",
                status: "ACTIVE",
                admissionTime: new Date(),
                primaryDoctorId: "Dr. Verify"
            }
        });

        await prisma.bedAssignment.create({
            data: {
                encounterId: encounter.id,
                bedId: bed.id,
                startTime: new Date()
            }
        });
        console.log(`   -> Admitted to Bed: ${bedNum}, Ward: ${ward}, Floor: ${floor}`);

        // 4. Return credentials for Browser Verification
        console.log("\n=== READY FOR BROWSER VERIFICATION ===");
        console.log(`EMAIL: ${email}`);
        console.log(`PASSWORD: 123456789`);
        console.log(`EXPECTED BED: ${bedNum}`);
        console.log(`EXPECTED WARD: ${ward}`);
        console.log(`EXPECTED FLOOR: Level ${floor}`);

    } catch (error) {
        console.error("Verification Setup Failed:", error);
    } finally {
        await prisma.$disconnect();
    }
}

verifyFullFlow();
