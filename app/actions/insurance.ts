"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { auth } from "@/lib/auth"; // or from better-auth/nextj
import { headers } from "next/headers";

const insuranceSchema = z.object({
    insurerName: z.string().min(1, "Insurer name is required"),
    policyNumber: z.string().min(1, "Policy number is required"),
    validFrom: z.string().min(1, "Valid from date is required"),
    validTo: z.string().min(1, "Valid to date is required"),
    sumInsured: z.string().transform((val) => parseFloat(val) || 0),
    tpaName: z.string().optional(),
});

export async function addInsurancePolicy(
    data: z.input<typeof insuranceSchema>
) {
    try {
        /** 1️⃣ Get Better Auth session */
        const session = await auth.api.getSession({
            headers: await headers(), // Explicitly pass the headers
        });

        /** 2️⃣ Validate input */
        const parsed = insuranceSchema.safeParse(data);
        if (!parsed.success) {
            return { error: "Invalid fields" };
        }

        const {
            insurerName,
            policyNumber,
            validFrom,
            validTo,
            sumInsured,
            tpaName,
        } = parsed.data;

        /** 3️⃣ Resolve patient via email */
        /** 3️⃣ Resolve patient via email */
        let patient = await prisma.patient.findFirst({
            where: {
                email: session?.user.email,
            },
        });

        if (!patient) {
            console.log("Patient not found for email:", session?.user.email, "Creating new patient record...");
            // Create a new patient record for the demo
            patient = await prisma.patient.create({
                data: {
                    name: session?.user?.name || "New Patient",
                    email: session?.user?.email,
                    uhid: `UHID-${Date.now()}`, // Mock UHID
                    gender: "OTHER", // Default
                    dob: new Date("1990-01-01"), // Default
                    contact: "0000000000"
                }
            });
        }

        console.log("Adding policy for patient:", patient.id);

        /** 4️⃣ Create insurance policy */
        await prisma.insurancePolicy.create({
            data: {
                patientId: patient.id,
                insurerId: `INS-${crypto.randomUUID().slice(0, 6).toUpperCase()}`,
                insurerName,
                policyNumber,
                policyType: "Health",
                validFrom: new Date(validFrom),
                validTo: new Date(validTo),
                sumInsured,
                tpaName,
                isActive: true,
            },
        });

        revalidatePath("/patient/insurance");

        return { success: "Policy added successfully" };
    } catch (error) {
        console.error("Failed to add policy:", error);
        return { error: "Failed to add policy" };
    }
}

export async function getPatientPolicies() {
    try {
        /** 1️⃣ Get Better Auth session */
        const session = await auth.api.getSession({
            headers: await headers(), // Explicitly pass the headers
        })

        if (!session?.user?.email) {
            return [];
        }

        /** 2️⃣ Resolve patient */
        const patient = await prisma.patient.findFirst({
            where: {
                email: session.user.email,
            },
        });

        if (!patient) {
            return [];
        }

        /** 3️⃣ Fetch policies */
        return await prisma.insurancePolicy.findMany({
            where: {
                patientId: patient.id,
            },
            orderBy: {
                createdAt: "desc",
            },
        });
    } catch (error) {
        console.error("Failed to fetch policies:", error);
        return [];
    }
}
