/**
 * Tariff Master Seed Script
 * 
 * Seeds TariffMaster with hospital service prices.
 * Run: npx tsx prisma/seed_tariffs.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const tariffs = [
    // ========== CONSULTATIONS ==========
    { tariffCode: 'CONS-OPD-GEN', category: 'CONSULTATION', description: 'OPD Consultation - General Physician', basePrice: 300 },
    { tariffCode: 'CONS-OPD-SPEC', category: 'CONSULTATION', description: 'OPD Consultation - Specialist', basePrice: 500 },
    { tariffCode: 'CONS-OPD-SENIOR', category: 'CONSULTATION', description: 'OPD Consultation - Senior Consultant', basePrice: 800 },
    { tariffCode: 'CONS-FOLLOWUP', category: 'CONSULTATION', description: 'Follow-up Consultation', basePrice: 200 },
    { tariffCode: 'CONS-CARDIO', category: 'CONSULTATION', description: 'Cardiology Consultation', basePrice: 1000 },
    { tariffCode: 'CONS-ORTHO', category: 'CONSULTATION', description: 'Orthopedic Consultation', basePrice: 700 },
    { tariffCode: 'CONS-NEURO', category: 'CONSULTATION', description: 'Neurology Consultation', basePrice: 1200 },
    { tariffCode: 'CONS-PEDIA', category: 'CONSULTATION', description: 'Pediatric Consultation', basePrice: 400 },
    { tariffCode: 'CONS-GYNAEC', category: 'CONSULTATION', description: 'Gynecology Consultation', basePrice: 600 },

    // ========== EMERGENCY ==========
    { tariffCode: 'EMG-REG', category: 'EMERGENCY', description: 'Emergency Registration Fee', basePrice: 200 },
    { tariffCode: 'EMG-TRIAGE', category: 'EMERGENCY', description: 'Emergency Triage & Assessment', basePrice: 500 },
    { tariffCode: 'EMG-CRITICAL', category: 'EMERGENCY', description: 'Critical Care - Emergency', basePrice: 2000 },
    { tariffCode: 'EMG-RESUS', category: 'EMERGENCY', description: 'Resuscitation Charges', basePrice: 5000 },

    // ========== LAB TESTS ==========
    { tariffCode: 'LAB-CBC', category: 'LAB', description: 'Complete Blood Count (CBC)', basePrice: 350 },
    { tariffCode: 'LAB-LFT', category: 'LAB', description: 'Liver Function Test (LFT)', basePrice: 800 },
    { tariffCode: 'LAB-KFT', category: 'LAB', description: 'Kidney Function Test (KFT/RFT)', basePrice: 700 },
    { tariffCode: 'LAB-LIPID', category: 'LAB', description: 'Lipid Profile', basePrice: 600 },
    { tariffCode: 'LAB-THYROID', category: 'LAB', description: 'Thyroid Profile (T3, T4, TSH)', basePrice: 700 },
    { tariffCode: 'LAB-HBA1C', category: 'LAB', description: 'HbA1c (Glycated Hemoglobin)', basePrice: 500 },
    { tariffCode: 'LAB-URINE', category: 'LAB', description: 'Urine Routine Examination', basePrice: 150 },
    { tariffCode: 'LAB-ESR', category: 'LAB', description: 'Erythrocyte Sedimentation Rate', basePrice: 100 },
    { tariffCode: 'LAB-GLUCOSE-F', category: 'LAB', description: 'Blood Glucose - Fasting', basePrice: 80 },
    { tariffCode: 'LAB-GLUCOSE-PP', category: 'LAB', description: 'Blood Glucose - Postprandial', basePrice: 80 },
    { tariffCode: 'LAB-CULTURE', category: 'LAB', description: 'Culture & Sensitivity', basePrice: 1200 },

    // ========== RADIOLOGY ==========
    { tariffCode: 'RAD-XRAY-CHEST', category: 'RADIOLOGY', description: 'X-Ray Chest PA View', basePrice: 400 },
    { tariffCode: 'RAD-XRAY-LIMB', category: 'RADIOLOGY', description: 'X-Ray Limb (Single View)', basePrice: 350 },
    { tariffCode: 'RAD-USG-ABD', category: 'RADIOLOGY', description: 'Ultrasound Abdomen & Pelvis', basePrice: 1500 },
    { tariffCode: 'RAD-USG-OBS', category: 'RADIOLOGY', description: 'Obstetric Ultrasound', basePrice: 1200 },
    { tariffCode: 'RAD-CT-HEAD', category: 'RADIOLOGY', description: 'CT Scan Head (Plain)', basePrice: 3500 },
    { tariffCode: 'RAD-CT-ABD', category: 'RADIOLOGY', description: 'CT Scan Abdomen (Plain)', basePrice: 5000 },
    { tariffCode: 'RAD-MRI-BRAIN', category: 'RADIOLOGY', description: 'MRI Brain (Plain)', basePrice: 8000 },
    { tariffCode: 'RAD-MRI-SPINE', category: 'RADIOLOGY', description: 'MRI Spine (Single Region)', basePrice: 7000 },
    { tariffCode: 'RAD-ECG', category: 'RADIOLOGY', description: 'Electrocardiogram (ECG)', basePrice: 300 },
    { tariffCode: 'RAD-ECHO', category: 'RADIOLOGY', description: 'Echocardiography (2D Echo)', basePrice: 2500 },

    // ========== ROOM CHARGES ==========
    { tariffCode: 'ROOM-GEN', category: 'ROOM', description: 'General Ward - Per Day', basePrice: 1500 },
    { tariffCode: 'ROOM-SEMI', category: 'ROOM', description: 'Semi-Private Room - Per Day', basePrice: 3000 },
    { tariffCode: 'ROOM-PVT', category: 'ROOM', description: 'Private Room - Per Day', basePrice: 5000 },
    { tariffCode: 'ROOM-DELUXE', category: 'ROOM', description: 'Deluxe Room - Per Day', basePrice: 8000 },
    { tariffCode: 'ROOM-ICU', category: 'ROOM', description: 'ICU - Per Day', basePrice: 12000 },
    { tariffCode: 'ROOM-NICU', category: 'ROOM', description: 'NICU - Per Day', basePrice: 15000 },
    { tariffCode: 'ROOM-PICU', category: 'ROOM', description: 'PICU - Per Day', basePrice: 14000 },

    // ========== PROCEDURES ==========
    { tariffCode: 'PROC-SUTURE-MINOR', category: 'PROCEDURE', description: 'Minor Suturing (< 2.5 cm)', basePrice: 1000 },
    { tariffCode: 'PROC-SUTURE-MAJOR', category: 'PROCEDURE', description: 'Major Suturing (> 2.5 cm)', basePrice: 2500 },
    { tariffCode: 'PROC-DRESSING', category: 'PROCEDURE', description: 'Wound Dressing', basePrice: 500 },
    { tariffCode: 'PROC-INJECTION-IM', category: 'PROCEDURE', description: 'Intramuscular Injection', basePrice: 100 },
    { tariffCode: 'PROC-INJECTION-IV', category: 'PROCEDURE', description: 'Intravenous Injection', basePrice: 150 },
    { tariffCode: 'PROC-CANNULA', category: 'PROCEDURE', description: 'IV Cannula Insertion', basePrice: 200 },
    { tariffCode: 'PROC-CATHETER', category: 'PROCEDURE', description: 'Urinary Catheterization', basePrice: 400 },
    { tariffCode: 'PROC-NGT', category: 'PROCEDURE', description: 'Nasogastric Tube Insertion', basePrice: 500 },
    { tariffCode: 'PROC-NEBULIZER', category: 'PROCEDURE', description: 'Nebulization Session', basePrice: 200 },

    // ========== PHARMACY (Common Medicines) ==========
    { tariffCode: 'PHARM-PARACETAMOL', category: 'PHARMACY', description: 'Paracetamol 500mg', basePrice: 5 },
    { tariffCode: 'PHARM-IBUPROFEN', category: 'PHARMACY', description: 'Ibuprofen 400mg', basePrice: 8 },
    { tariffCode: 'PHARM-AMOXICILLIN', category: 'PHARMACY', description: 'Amoxicillin 500mg', basePrice: 15 },
    { tariffCode: 'PHARM-AZITHROMYCIN', category: 'PHARMACY', description: 'Azithromycin 500mg', basePrice: 80 },
    { tariffCode: 'PHARM-PANTOPRAZOLE', category: 'PHARMACY', description: 'Pantoprazole 40mg', basePrice: 10 },
    { tariffCode: 'PHARM-METFORMIN', category: 'PHARMACY', description: 'Metformin 500mg', basePrice: 6 },
    { tariffCode: 'PHARM-ATORVASTATIN', category: 'PHARMACY', description: 'Atorvastatin 10mg', basePrice: 12 },
    { tariffCode: 'PHARM-AMLODIPINE', category: 'PHARMACY', description: 'Amlodipine 5mg', basePrice: 8 },
    { tariffCode: 'PHARM-IV-SALINE', category: 'PHARMACY', description: 'IV Normal Saline 500ml', basePrice: 50 },
    { tariffCode: 'PHARM-IV-DEXTROSE', category: 'PHARMACY', description: 'IV Dextrose 5% 500ml', basePrice: 60 },

    // ========== MISCELLANEOUS ==========
    { tariffCode: 'MISC-OXYGEN-HR', category: 'MISC', description: 'Oxygen - Per Hour', basePrice: 150 },
    { tariffCode: 'MISC-VENTILATOR-HR', category: 'MISC', description: 'Ventilator Support - Per Hour', basePrice: 500 },
    { tariffCode: 'MISC-MONITOR-DAY', category: 'MISC', description: 'Cardiac Monitoring - Per Day', basePrice: 1000 },
    { tariffCode: 'MISC-AMBULANCE', category: 'MISC', description: 'Ambulance Service', basePrice: 2000 },
    { tariffCode: 'MISC-PHYSIO', category: 'MISC', description: 'Physiotherapy Session', basePrice: 500 },
    { tariffCode: 'MISC-DIET-NORMAL', category: 'MISC', description: 'Diet - Normal (Per Day)', basePrice: 300 },
    { tariffCode: 'MISC-DIET-DIABETIC', category: 'MISC', description: 'Diet - Diabetic (Per Day)', basePrice: 400 },
];

async function main() {
    console.log('🏥 Seeding TariffMaster with hospital services...\n');

    const effectiveFrom = new Date('2024-01-01');

    for (const tariff of tariffs) {
        const existing = await prisma.tariffMaster.findUnique({
            where: { tariffCode: tariff.tariffCode },
        });

        if (existing) {
            await prisma.tariffMaster.update({
                where: { tariffCode: tariff.tariffCode },
                data: { ...tariff, effectiveFrom, isActive: true },
            });
            console.log(`✏️  Updated: ${tariff.tariffCode}`);
        } else {
            await prisma.tariffMaster.create({
                data: { ...tariff, effectiveFrom, isActive: true },
            });
            console.log(`✅ Created: ${tariff.tariffCode}`);
        }
    }

    const count = await prisma.tariffMaster.count();
    console.log(`\n📊 Total tariffs: ${count}`);
    console.log('🎉 Done!\n');
}

main()
    .catch((e) => { console.error('❌ Error:', e); process.exit(1); })
    .finally(async () => { await prisma.$disconnect(); });
