import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding doctors...');

    const doctors = [
        { name: 'Dr. John Smith', email: 'john.smith@medflow.com', department: 'General Medicine' },
        { name: 'Dr. Sarah Johnson', email: 'sarah.johnson@medflow.com', department: 'Cardiology' },
        { name: 'Dr. Michael Brown', email: 'michael.brown@medflow.com', department: 'Orthopedics' },
        { name: 'Dr. Emily Davis', email: 'emily.davis@medflow.com', department: 'Pediatrics' },
        { name: 'Dr. David Wilson', email: 'david.wilson@medflow.com', department: 'Dermatology' },
        { name: 'Dr. Jessica Taylor', email: 'jessica.taylor@medflow.com', department: 'Gynecology' },
        { name: 'Dr. Robert Anderson', email: 'robert.anderson@medflow.com', department: 'ENT' },
    ];

    for (const doc of doctors) {
        const existing = await prisma.user.findUnique({ where: { email: doc.email } });
        if (!existing) {
            await prisma.user.create({
                data: {
                    id: crypto.randomUUID(),
                    name: doc.name,
                    email: doc.email,
                    role: 'DOCTOR',
                    department: doc.department,
                    updatedAt: new Date(),
                }
            });
            console.log(`Created ${doc.name}`);
        } else {
            // Update department if missing
            if (!existing.department) {
                await prisma.user.update({
                    where: { id: existing.id },
                    data: { department: doc.department }
                });
                console.log(`Updated department for ${doc.name}`);
            }
        }
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
