import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: Request) {
    try {
        const session = await auth.api.getSession({ headers: req.headers });
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const query = searchParams.get("query");

        if (!query || query.length < 3) {
            return NextResponse.json([]);
        }

        const patients = await prisma.patient.findMany({
            where: {
                uhid: {
                    startsWith: query,
                    mode: 'insensitive' // Case insensitive search
                }
            },
            select: {
                id: true,
                uhid: true,
                name: true,
                gender: true,
                dob: true,
                contact: true
            },
            take: 10 // Limit results
        });

        return NextResponse.json(patients);

    } catch (error) {
        console.error("Error searching patients:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
