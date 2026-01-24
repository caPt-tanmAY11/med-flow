
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verify() {
    try {
        console.log("Starting verification...");

        const patientData = {
            name: "Auto User Test",
            dob: new Date("1995-05-05").toISOString(),
            gender: "MALE",
            contact: "9876543210",
            address: "123 Test St",
            isTemporary: false
        };

        console.log("Sending POST request to /api/patients...");
        const response = await fetch('http://localhost:3000/api/patients', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(patientData)
        });

        if (!response.ok) {
            const text = await response.text();
            throw new Error(`API request failed: ${response.status} ${text}`);
        }

        const result = await response.json();
        console.log("Patient created:", result.data.uhid);

        const uhid = result.data.uhid;
        const uhidLast6 = uhid.slice(-6);
        const expectedEmail = `${uhidLast6}@medflow.com`;

        console.log(`Checking for user with email: ${expectedEmail}`);
        
        // Give it a moment for the async user creation (though it was awaited in the route, better safe)
        await new Promise(resolve => setTimeout(resolve, 1000));

        const user = await prisma.user.findUnique({
            where: { email: expectedEmail }
        });

        if (user) {
            console.log("SUCCESS: User found!", user);
            if (user.role === 'PATIENT') {
                console.log("SUCCESS: User role is PATIENT");
                process.exit(0);
            } else {
                console.error(`FAILURE: User role is ${user.role}, expected PATIENT`);
                process.exit(1);
            }
        } else {
            console.error("FAILURE: User not found in database.");
            process.exit(1);
        }

    } catch (error) {
        console.error("Verification failed:", error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

verify();
