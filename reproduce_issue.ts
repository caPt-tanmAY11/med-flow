
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const encounter = await prisma.encounter.create({
        data: {
            patientId: 'some-uuid',
            type: 'OPD',
            status: 'ACTIVE',
            department: 'LAB_SERVICES',
            triageNotes: 'Test',
            arrivalTime: new Date(),
        },
    });
    console.log(encounter);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
