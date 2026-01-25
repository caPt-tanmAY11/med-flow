import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding accounts for doctors...');

    const password = await hash('password123', 12);

    const doctors = await prisma.user.findMany({
        where: { role: 'DOCTOR' }
    });

    for (const doc of doctors) {
        const existingAccount = await prisma.account.findFirst({
            where: { userId: doc.id }
        });

        if (!existingAccount) {
            await prisma.account.create({
                data: {
                    id: crypto.randomUUID(),
                    userId: doc.id,
                    accountId: doc.email, // Using email as accountId for credential provider
                    providerId: 'credential',
                    password: password,
                    updatedAt: new Date(),
                }
            });
            console.log(`Created account for ${doc.name} (${doc.email})`);
        } else {
            console.log(`Account already exists for ${doc.name}`);
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
