import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting comprehensive database seed...\n');

    // Create Roles
    console.log('Creating roles...');
    const roleNames = ['admin', 'doctor', 'nurse', 'pharmacist', 'billing', 'lab_technician'];
    for (const name of roleNames) {
        await prisma.role.upsert({ where: { name }, update: {}, create: { name, description: name.charAt(0).toUpperCase() + name.slice(1).replace('_', ' '), isSystem: name === 'admin' } });
    }

    // Create Beds
    console.log('Creating beds...');
    const wards = [
        { name: 'General Ward A', type: 'general', count: 10 },
        { name: 'ICU', type: 'icu', count: 6 },
        { name: 'Private Room', type: 'private', count: 8 },
        { name: 'Emergency', type: 'general', count: 6 },
    ];
    for (const ward of wards) {
        for (let i = 1; i <= ward.count; i++) {
            const bedNumber = `${ward.name.substring(0, 3).toUpperCase()}-${String(i).padStart(2, '0')}`;
            await prisma.bed.upsert({
                where: { bedNumber },
                update: {},
                create: { bedNumber, ward: ward.name, type: ward.type, floor: 1, status: 'AVAILABLE', features: ward.type === 'icu' ? ['oxygen', 'monitor', 'ventilator'] : ['oxygen'] },
            });
        }
    }
    console.log(`  ✓ Created 30 beds`);

    // Create Inventory Items
    console.log('Creating inventory items...');
    const inventoryItems = [
        { itemCode: 'MED-001', name: 'Paracetamol 500mg', category: 'medicine', unit: 'tablet', reorderLevel: 100, maxStock: 1000, currentStock: 850 },
        { itemCode: 'MED-002', name: 'Amoxicillin 250mg', category: 'medicine', unit: 'capsule', reorderLevel: 50, maxStock: 500, currentStock: 45 },
        { itemCode: 'MED-003', name: 'Omeprazole 20mg', category: 'medicine', unit: 'capsule', reorderLevel: 80, maxStock: 800, currentStock: 320 },
        { itemCode: 'MED-004', name: 'Insulin Injection', category: 'medicine', unit: 'vial', reorderLevel: 30, maxStock: 150, currentStock: 25 },
        { itemCode: 'MED-005', name: 'Aspirin 75mg', category: 'medicine', unit: 'tablet', reorderLevel: 100, maxStock: 1000, currentStock: 780 },
        { itemCode: 'CON-001', name: 'Surgical Gloves', category: 'consumable', unit: 'box', reorderLevel: 20, maxStock: 200, currentStock: 15 },
        { itemCode: 'CON-002', name: 'Syringes 5ml', category: 'consumable', unit: 'piece', reorderLevel: 200, maxStock: 2000, currentStock: 1200 },
        { itemCode: 'CON-003', name: 'IV Cannula', category: 'consumable', unit: 'piece', reorderLevel: 100, maxStock: 500, currentStock: 380 },
    ];
    for (const item of inventoryItems) {
        await prisma.inventoryItem.upsert({ where: { itemCode: item.itemCode }, update: {}, create: { ...item, itemType: item.category } });
    }
    console.log(`  ✓ Created ${inventoryItems.length} inventory items`);

    // Create Tariffs - Comprehensive pricing for Paisa Tracker
    console.log('Creating tariffs...');
    const tariffs = [
        // Consultation Fees by Department
        { tariffCode: 'CON-GEN', category: 'consultation', description: 'General Consultation', basePrice: 500 },
        { tariffCode: 'CON-SPE', category: 'consultation', description: 'Specialist Consultation', basePrice: 1000 },
        { tariffCode: 'CON-CAR', category: 'consultation', description: 'Cardiology Consultation', basePrice: 1200 },
        { tariffCode: 'CON-ORT', category: 'consultation', description: 'Orthopedics Consultation', basePrice: 1000 },
        { tariffCode: 'CON-GYN', category: 'consultation', description: 'Gynecology Consultation', basePrice: 1000 },
        { tariffCode: 'CON-PED', category: 'consultation', description: 'Pediatrics Consultation', basePrice: 800 },
        { tariffCode: 'CON-DER', category: 'consultation', description: 'Dermatology Consultation', basePrice: 700 },
        { tariffCode: 'CON-NEU', category: 'consultation', description: 'Neurology Consultation', basePrice: 1500 },

        // Bed Charges
        { tariffCode: 'BED-GEN', category: 'bed', description: 'General Ward (per day)', basePrice: 1500 },
        { tariffCode: 'BED-PRI', category: 'bed', description: 'Private Room (per day)', basePrice: 5000 },
        { tariffCode: 'BED-ICU', category: 'bed', description: 'ICU (per day)', basePrice: 15000 },
        { tariffCode: 'BED-EME', category: 'bed', description: 'Emergency (per day)', basePrice: 3000 },

        // Laboratory Tests
        { tariffCode: 'LAB-CBC', category: 'lab', description: 'Complete Blood Count', basePrice: 400 },
        { tariffCode: 'LAB-LFT', category: 'lab', description: 'Liver Function Test', basePrice: 800 },
        { tariffCode: 'LAB-KFT', category: 'lab', description: 'Kidney Function Test', basePrice: 700 },
        { tariffCode: 'LAB-LIPID', category: 'lab', description: 'Lipid Profile', basePrice: 600 },
        { tariffCode: 'LAB-HBA1C', category: 'lab', description: 'Glycated Hemoglobin (HbA1c)', basePrice: 550 },
        { tariffCode: 'LAB-TSH', category: 'lab', description: 'Thyroid Function Test', basePrice: 450 },
        { tariffCode: 'LAB-TFT', category: 'lab', description: 'Thyroid Profile Complete', basePrice: 900 },
        { tariffCode: 'LAB-URINE', category: 'lab', description: 'Urine Routine', basePrice: 150 },
        { tariffCode: 'LAB-ESR', category: 'lab', description: 'ESR Test', basePrice: 100 },
        { tariffCode: 'LAB-CRP', category: 'lab', description: 'C-Reactive Protein', basePrice: 500 },
        { tariffCode: 'LAB-BLOOD-SUGAR', category: 'lab', description: 'Blood Sugar Fasting', basePrice: 100 },
        { tariffCode: 'LAB-BLOOD-PP', category: 'lab', description: 'Blood Sugar PP', basePrice: 100 },

        // Radiology
        { tariffCode: 'RAD-XRAY', category: 'radiology', description: 'X-Ray', basePrice: 500 },
        { tariffCode: 'RAD-CT', category: 'radiology', description: 'CT Scan', basePrice: 5000 },
        { tariffCode: 'RAD-MRI', category: 'radiology', description: 'MRI Scan', basePrice: 8000 },
        { tariffCode: 'RAD-USG', category: 'radiology', description: 'Ultrasound', basePrice: 800 },
        { tariffCode: 'RAD-ECG', category: 'radiology', description: 'ECG', basePrice: 200 },
        { tariffCode: 'RAD-ECHO', category: 'radiology', description: 'Echocardiogram', basePrice: 2500 },

        // Pharmacy (Common Medications)
        { tariffCode: 'MED-PARA', category: 'pharmacy', description: 'Paracetamol 500mg', basePrice: 5 },
        { tariffCode: 'MED-AMOX', category: 'pharmacy', description: 'Amoxicillin 250mg', basePrice: 15 },
        { tariffCode: 'MED-OMEP', category: 'pharmacy', description: 'Omeprazole 20mg', basePrice: 8 },
        { tariffCode: 'MED-METF', category: 'pharmacy', description: 'Metformin 500mg', basePrice: 4 },
        { tariffCode: 'MED-AMLO', category: 'pharmacy', description: 'Amlodipine 5mg', basePrice: 10 },
        { tariffCode: 'MED-ATOR', category: 'pharmacy', description: 'Atorvastatin 10mg', basePrice: 12 },

        // Procedures
        { tariffCode: 'PROC-DRESS', category: 'procedure', description: 'Dressing', basePrice: 200 },
        { tariffCode: 'PROC-INJECT', category: 'procedure', description: 'Injection Charges', basePrice: 50 },
        { tariffCode: 'PROC-IV', category: 'procedure', description: 'IV Fluid Administration', basePrice: 150 },
        { tariffCode: 'PROC-CATH', category: 'procedure', description: 'Catheterization', basePrice: 500 },

        // Emergency
        { tariffCode: 'EME-REG', category: 'emergency', description: 'Emergency Registration', basePrice: 300 },
        { tariffCode: 'EME-RESUS', category: 'emergency', description: 'Resuscitation Charges', basePrice: 5000 },
    ];
    for (const t of tariffs) {
        await prisma.tariffMaster.upsert({ where: { tariffCode: t.tariffCode }, update: {}, create: { ...t, effectiveFrom: new Date('2024-01-01') } });
    }
    console.log(`  ✓ Created ${tariffs.length} tariffs`);

    // Create Patients
    console.log('Creating patients with full data...');
    const patients = [
        { name: 'Rajesh Kumar', gender: 'MALE' as const, dob: '1985-03-15', contact: '9876543210', bloodGroup: 'O+', city: 'Mumbai', allergies: [{ allergen: 'Penicillin', type: 'drug', severity: 'severe' }, { allergen: 'Peanuts', type: 'food', severity: 'moderate' }] },
        { name: 'Priya Sharma', gender: 'FEMALE' as const, dob: '1990-07-22', contact: '9876543211', bloodGroup: 'A+', city: 'Delhi', allergies: [] },
        { name: 'Amit Singh', gender: 'MALE' as const, dob: '1978-11-30', contact: '9876543212', bloodGroup: 'B+', city: 'Mumbai', allergies: [{ allergen: 'Sulfa drugs', type: 'drug', severity: 'mild' }] },
        { name: 'Sunita Devi', gender: 'FEMALE' as const, dob: '1965-01-05', contact: '9876543213', bloodGroup: 'AB-', city: 'Pune', allergies: [] },
        { name: 'Mohammed Ali', gender: 'MALE' as const, dob: '2010-09-12', contact: '9876543214', bloodGroup: 'O-', city: 'Mumbai', allergies: [] },
        { name: 'Anita Patel', gender: 'FEMALE' as const, dob: '1992-04-18', contact: '9876543215', bloodGroup: 'A-', city: 'Ahmedabad', allergies: [{ allergen: 'Aspirin', type: 'drug', severity: 'severe' }] },
        { name: 'Vikram Reddy', gender: 'MALE' as const, dob: '1955-08-25', contact: '9876543216', bloodGroup: 'B-', city: 'Hyderabad', allergies: [] },
        { name: 'Kavita Nair', gender: 'FEMALE' as const, dob: '1988-12-03', contact: '9876543217', bloodGroup: 'O+', city: 'Chennai', allergies: [] },
    ];

    const createdPatients: { id: string; name: string }[] = [];
    for (let i = 0; i < patients.length; i++) {
        const p = patients[i];
        const uhid = `UHID-2024-${String(i + 1).padStart(6, '0')}`;
        const patient = await prisma.patient.upsert({
            where: { uhid },
            update: {},
            create: { uhid, name: p.name, gender: p.gender, dob: new Date(p.dob), contact: p.contact, bloodGroup: p.bloodGroup, city: p.city, state: 'Maharashtra', phoneHash: p.contact.slice(-10), nameNormalized: p.name.toLowerCase().replace(/[^a-z0-9]/g, '') },
        });
        createdPatients.push({ id: patient.id, name: patient.name });
        for (const allergy of p.allergies) {
            await prisma.allergy.create({ data: { patientId: patient.id, allergen: allergy.allergen, allergenType: allergy.type, severity: allergy.severity, reaction: 'Documented' } }).catch(() => { });
        }
    }
    console.log(`  ✓ Created ${patients.length} patients with allergies`);

    // Create Encounters (Active patients in different departments)
    console.log('Creating encounters...');
    const encounterData = [
        { patientIdx: 0, type: 'IPD' as const, department: 'Cardiology', triageColor: null, bedNumber: 'ICU-01' },
        { patientIdx: 1, type: 'EMERGENCY' as const, department: 'Emergency', triageColor: 'RED' as const, bedNumber: 'EME-01' },
        { patientIdx: 2, type: 'IPD' as const, department: 'Orthopedics', triageColor: null, bedNumber: 'GEN-01' },
        { patientIdx: 3, type: 'OPD' as const, department: 'General Medicine', triageColor: null, bedNumber: null },
        { patientIdx: 4, type: 'EMERGENCY' as const, department: 'Pediatrics', triageColor: 'ORANGE' as const, bedNumber: 'EME-02' },
        { patientIdx: 5, type: 'IPD' as const, department: 'Gynecology', triageColor: null, bedNumber: 'PRI-01' },
        { patientIdx: 6, type: 'IPD' as const, department: 'Cardiology', triageColor: null, bedNumber: 'ICU-02' },
        { patientIdx: 7, type: 'OPD' as const, department: 'Dermatology', triageColor: null, bedNumber: null },
    ];

    const createdEncounters: { id: string; patientId: string; patientName: string }[] = [];
    for (const enc of encounterData) {
        const patient = createdPatients[enc.patientIdx];
        const encounter = await prisma.encounter.create({
            data: {
                patientId: patient.id,
                type: enc.type,
                status: 'ACTIVE',
                department: enc.department,
                primaryDoctorId: 'dr-shah',
                triageColor: enc.triageColor,
                triageNotes: enc.triageColor ? 'Patient triaged on arrival' : null,
                arrivalTime: new Date(Date.now() - Math.random() * 48 * 60 * 60 * 1000),
                currentLocation: enc.department,
                medicoLegalFlag: enc.patientIdx === 4,
            },
        });
        createdEncounters.push({ id: encounter.id, patientId: patient.id, patientName: patient.name });

        // Assign bed if IPD/Emergency
        if (enc.bedNumber) {
            const bed = await prisma.bed.findUnique({ where: { bedNumber: enc.bedNumber } });
            if (bed) {
                await prisma.bedAssignment.create({ data: { encounterId: encounter.id, bedId: bed.id, assignedBy: 'admin' } });
                await prisma.bed.update({ where: { id: bed.id }, data: { status: 'OCCUPIED' } });
            }
        }
    }
    console.log(`  ✓ Created ${encounterData.length} encounters`);

    // Create Lab Orders with Results
    console.log('Creating lab orders and results...');
    const labTests = ['CBC', 'LFT', 'KFT', 'LIPID', 'HbA1c', 'TSH'];
    for (let i = 0; i < 4; i++) {
        const enc = createdEncounters[i];
        for (let j = 0; j < 2; j++) {
            const test = labTests[(i * 2 + j) % labTests.length];
            const order = await prisma.order.create({
                data: {
                    encounterId: enc.id,
                    patientId: enc.patientId,
                    orderType: 'lab',
                    orderCode: test,
                    orderName: test === 'CBC' ? 'Complete Blood Count' : test === 'LFT' ? 'Liver Function Test' : test === 'KFT' ? 'Kidney Function Test' : test === 'LIPID' ? 'Lipid Profile' : test === 'HbA1c' ? 'Glycated Hemoglobin' : 'Thyroid Function Test',
                    priority: i === 1 ? 'STAT' : 'ROUTINE',
                    orderedBy: 'Dr. Shah',
                    status: j === 0 ? 'completed' : 'ordered',
                },
            });
            if (j === 0) {
                await prisma.sample.create({ data: { orderId: order.id, sampleType: 'blood', collectedBy: 'Lab Tech', barcode: `SAM-${Date.now()}-${Math.random().toString(36).substr(2, 5)}` } });
                await prisma.labResult.create({ data: { orderId: order.id, resultedBy: 'Lab Tech', result: { value: (Math.random() * 10 + 5).toFixed(1), unit: 'mg/dL' }, isCritical: i === 0 && j === 0, verifiedBy: 'Dr. Pathologist', verifiedAt: new Date() } });
            }
        }
    }
    console.log(`  ✓ Created lab orders with results`);

    // Create Prescriptions
    console.log('Creating prescriptions...');
    for (const enc of createdEncounters.slice(0, 5)) {
        const prescription = await prisma.prescription.create({
            data: {
                encounterId: enc.id,
                patientId: enc.patientId,
                prescribedBy: 'Dr. Shah',
                status: 'active',
            },
        });
        await prisma.prescriptionMedication.create({
            data: { prescriptionId: prescription.id, medicationName: 'Paracetamol 500mg', dosage: '1 tablet', frequency: 'TDS', route: 'oral', duration: '5 days', isDispensed: Math.random() > 0.5 },
        });
        await prisma.prescriptionMedication.create({
            data: { prescriptionId: prescription.id, medicationName: 'Omeprazole 20mg', dosage: '1 capsule', frequency: 'OD', route: 'oral', duration: '7 days', isDispensed: false },
        });
    }
    console.log(`  ✓ Created prescriptions`);

    // Create Vitals
    console.log('Creating vital signs...');
    for (const enc of createdEncounters.slice(0, 6)) {
        for (let v = 0; v < 3; v++) {
            await prisma.vitalSign.create({
                data: {
                    encounterId: enc.id,
                    patientId: enc.patientId,
                    recordedBy: 'Nurse',
                    recordedAt: new Date(Date.now() - v * 4 * 60 * 60 * 1000),
                    temperature: 36.5 + Math.random() * 2,
                    pulse: 70 + Math.floor(Math.random() * 30),
                    respRate: 14 + Math.floor(Math.random() * 6),
                    bpSystolic: 110 + Math.floor(Math.random() * 30),
                    bpDiastolic: 70 + Math.floor(Math.random() * 20),
                    spO2: 95 + Math.random() * 4,
                },
            });
        }
    }
    console.log(`  ✓ Created vital signs`);

    // Create Bills
    console.log('Creating bills...');
    for (let i = 0; i < 5; i++) {
        const enc = createdEncounters[i];
        const totalAmount = 5000 + Math.floor(Math.random() * 20000);
        const paidAmount = i < 2 ? totalAmount : i === 2 ? totalAmount * 0.5 : 0;
        const billNumber = `BILL-2024-${String(i + 1).padStart(6, '0')}`;
        const bill = await prisma.bill.upsert({
            where: { billNumber },
            update: {},
            create: {
                billNumber,
                patientId: enc.patientId,
                encounterId: enc.id,
                status: paidAmount === totalAmount ? 'paid' : paidAmount > 0 ? 'partial' : 'pending',
                subtotal: totalAmount,
                totalAmount,
                paidAmount,
                balanceDue: totalAmount - paidAmount,
            },
        });
        // Only create bill items if this is a new bill (check by items count)
        const existingItems = await prisma.billItem.count({ where: { billId: bill.id } });
        if (existingItems === 0) {
            await prisma.billItem.create({ data: { billId: bill.id, category: 'consultation', description: 'Consultation Fee', quantity: 1, unitPrice: 1000, totalPrice: 1000 } });
            await prisma.billItem.create({ data: { billId: bill.id, category: 'bed', description: 'Bed Charges (2 days)', quantity: 2, unitPrice: 1500, totalPrice: 3000 } });
        }
        if (paidAmount > 0) {
            const existingPayment = await prisma.payment.findFirst({ where: { billId: bill.id } });
            if (!existingPayment) {
                await prisma.payment.create({ data: { billId: bill.id, amount: paidAmount, paymentMode: 'cash', receivedBy: 'Cashier' } });
            }
        }
    }
    console.log(`  ✓ Created bills and payments`);

    // Create comprehensive department-wise billing data for Paisa Tracker
    console.log('Creating department-wise revenue data...');
    const departments = [
        'CARDIOLOGY', 'GYNECOLOGY', 'GASTROENTEROLOGY', 'ORTHOPEDICS', 'NEUROLOGY',
        'PEDIATRICS', 'DERMATOLOGY', 'OPHTHALMOLOGY', 'ENT', 'PULMONOLOGY',
        'NEPHROLOGY', 'UROLOGY', 'ONCOLOGY', 'PSYCHIATRY', 'GENERAL_MEDICINE'
    ];

    const deptServices = {
        'CARDIOLOGY': [
            { desc: 'ECG', price: 200 }, { desc: 'Echo', price: 2500 }, { desc: 'TMT', price: 1500 },
            { desc: 'Angiography', price: 25000 }, { desc: 'Cardiac Consultation', price: 1200 }
        ],
        'GYNECOLOGY': [
            { desc: 'Ultrasound', price: 800 }, { desc: 'Pap Smear', price: 500 }, { desc: 'Mammography', price: 1200 },
            { desc: 'Delivery Charges', price: 15000 }, { desc: 'Gynec Consultation', price: 1000 }
        ],
        'GASTROENTEROLOGY': [
            { desc: 'Endoscopy', price: 5000 }, { desc: 'Colonoscopy', price: 8000 }, { desc: 'LFT', price: 800 },
            { desc: 'Ultrasound Abdomen', price: 1000 }, { desc: 'Gastro Consultation', price: 1000 }
        ],
        'ORTHOPEDICS': [
            { desc: 'X-Ray', price: 500 }, { desc: 'MRI', price: 8000 }, { desc: 'CT Scan', price: 5000 },
            { desc: 'Plaster/Cast', price: 1500 }, { desc: 'Ortho Consultation', price: 1000 }
        ],
        'NEUROLOGY': [
            { desc: 'EEG', price: 1500 }, { desc: 'MRI Brain', price: 10000 }, { desc: 'Nerve Conduction', price: 2500 },
            { desc: 'Neuro Consultation', price: 1500 }, { desc: 'Lumbar Puncture', price: 3000 }
        ],
        'PEDIATRICS': [
            { desc: 'Vaccination', price: 500 }, { desc: 'Neonatal Care', price: 5000 }, { desc: 'Pediatric Consultation', price: 800 },
            { desc: 'Growth Assessment', price: 300 }, { desc: 'Nebulization', price: 200 }
        ],
        'DERMATOLOGY': [
            { desc: 'Skin Biopsy', price: 2000 }, { desc: 'Laser Treatment', price: 5000 }, { desc: 'Allergy Test', price: 1500 },
            { desc: 'Derma Consultation', price: 700 }, { desc: 'Acne Treatment', price: 1000 }
        ],
        'OPHTHALMOLOGY': [
            { desc: 'Eye Exam', price: 500 }, { desc: 'Cataract Surgery', price: 25000 }, { desc: 'Fundoscopy', price: 800 },
            { desc: 'Lasik Evaluation', price: 2000 }, { desc: 'Ophtha Consultation', price: 600 }
        ],
        'ENT': [
            { desc: 'Audiometry', price: 800 }, { desc: 'Endoscopy Nasal', price: 2000 }, { desc: 'Tonsillectomy', price: 15000 },
            { desc: 'ENT Consultation', price: 600 }, { desc: 'Hearing Aid Fitting', price: 5000 }
        ],
        'PULMONOLOGY': [
            { desc: 'PFT', price: 1500 }, { desc: 'Bronchoscopy', price: 10000 }, { desc: 'Chest X-Ray', price: 500 },
            { desc: 'Pulmo Consultation', price: 1000 }, { desc: 'Sleep Study', price: 8000 }
        ],
        'NEPHROLOGY': [
            { desc: 'Dialysis', price: 3000 }, { desc: 'KFT', price: 700 }, { desc: 'Kidney Biopsy', price: 5000 },
            { desc: 'Nephro Consultation', price: 1200 }, { desc: 'Ultrasound Kidney', price: 800 }
        ],
        'UROLOGY': [
            { desc: 'Cystoscopy', price: 5000 }, { desc: 'PSA Test', price: 800 }, { desc: 'Urodynamic Study', price: 3000 },
            { desc: 'Uro Consultation', price: 1000 }, { desc: 'TURP', price: 35000 }
        ],
        'ONCOLOGY': [
            { desc: 'Chemotherapy', price: 15000 }, { desc: 'Biopsy', price: 5000 }, { desc: 'PET Scan', price: 25000 },
            { desc: 'Onco Consultation', price: 1500 }, { desc: 'Radiation Therapy', price: 20000 }
        ],
        'PSYCHIATRY': [
            { desc: 'Psychological Assessment', price: 2000 }, { desc: 'Therapy Session', price: 1500 }, { desc: 'Psychiatry Consultation', price: 1200 },
            { desc: 'Counseling', price: 800 }, { desc: 'Rehab Program', price: 10000 }
        ],
        'GENERAL_MEDICINE': [
            { desc: 'CBC', price: 400 }, { desc: 'Lipid Profile', price: 600 }, { desc: 'Thyroid Test', price: 450 },
            { desc: 'General Consultation', price: 500 }, { desc: 'Health Checkup', price: 3000 }
        ],
    };

    // Create 50+ varied bill items across departments
    for (let billNum = 50; billNum <= 85; billNum++) {
        const billNumber = `BILL-2024-${String(billNum).padStart(6, '0')}`;
        const patient = createdPatients[billNum % createdPatients.length];
        const dept = departments[billNum % departments.length];
        const services = deptServices[dept as keyof typeof deptServices] || deptServices['GENERAL_MEDICINE'];

        const existingBill = await prisma.bill.findUnique({ where: { billNumber } });
        if (!existingBill) {
            // Random amounts
            const numServices = 1 + (billNum % 4);
            let subtotal = 0;
            const items: { desc: string; price: number }[] = [];
            for (let s = 0; s < numServices; s++) {
                const service = services[s % services.length];
                items.push(service);
                subtotal += service.price;
            }

            const paidAmount = billNum % 3 === 0 ? subtotal : billNum % 3 === 1 ? subtotal * 0.5 : 0;

            const encounter = createdEncounters[billNum % createdEncounters.length];
            const bill = await prisma.bill.create({
                data: {
                    billNumber,
                    patientId: patient.id,
                    encounterId: encounter.id,
                    status: paidAmount === subtotal ? 'paid' : paidAmount > 0 ? 'partial' : 'pending',
                    subtotal,
                    totalAmount: subtotal,
                    paidAmount,
                    balanceDue: subtotal - paidAmount,
                },
            });

            for (const item of items) {
                await prisma.billItem.create({
                    data: {
                        billId: bill.id,
                        category: 'service',
                        description: item.desc,
                        quantity: 1,
                        unitPrice: item.price,
                        totalPrice: item.price,
                    },
                });
            }

            if (paidAmount > 0) {
                await prisma.payment.create({
                    data: {
                        billId: bill.id,
                        amount: paidAmount,
                        paymentMode: billNum % 2 === 0 ? 'cash' : 'card',
                        receivedBy: 'Cashier',
                    },
                });
            }
        }
    }
    console.log(`  ✓ Created department-wise revenue data (25 bills across 15 departments)`);

    // Create Surgeries
    console.log('Creating surgeries...');
    const surgeries = [
        { patientIdx: 0, procedure: 'Coronary Angioplasty', otRoom: '1', duration: 120, status: 'scheduled' },
        { patientIdx: 2, procedure: 'Knee Replacement', otRoom: '2', duration: 180, status: 'in-progress' },
        { patientIdx: 5, procedure: 'Cesarean Section', otRoom: '3', duration: 90, status: 'completed' },
    ];
    for (const surg of surgeries) {
        const enc = createdEncounters[surg.patientIdx];
        const surgery = await prisma.surgery.create({
            data: {
                patientId: enc.patientId,
                encounterId: enc.id,
                procedureName: surg.procedure,
                scheduledDate: new Date(),
                scheduledTime: '10:00',
                estimatedDuration: surg.duration,
                otRoom: surg.otRoom,
                status: surg.status,
            },
        });
        await prisma.surgeryTeam.create({ data: { surgeryId: surgery.id, staffId: 'dr-1', staffName: 'Dr. Surgeon', role: 'surgeon' } });
        await prisma.surgeryTeam.create({ data: { surgeryId: surgery.id, staffId: 'dr-2', staffName: 'Dr. Anesthesia', role: 'anesthetist' } });
        await prisma.oTChecklist.create({ data: { surgeryId: surgery.id, checklistType: 'pre-op', items: { verified: true, consent: true, site_marked: true }, completedBy: 'Nurse', completedAt: new Date() } });
    }
    console.log(`  ✓ Created surgeries`);

    // Create Safety Alerts
    console.log('Creating safety alerts...');
    const alerts = [
        { patientIdx: 0, type: 'allergy', severity: 'critical', message: 'Patient has severe Penicillin allergy - Do NOT prescribe!' },
        { patientIdx: 0, type: 'critical-lab', severity: 'critical', message: 'Critical Potassium level: 6.5 mEq/L (High)' },
        { patientIdx: 1, type: 'vital-abnormality', severity: 'warning', message: 'Blood pressure elevated: 180/110 mmHg' },
        { patientIdx: 5, type: 'drug-interaction', severity: 'warning', message: 'Potential interaction: Aspirin allergy patient prescribed NSAIDs' },
    ];
    for (const alert of alerts) {
        const enc = createdEncounters[alert.patientIdx];
        await prisma.safetyAlert.create({
            data: { patientId: enc.patientId, encounterId: enc.id, alertType: alert.type, severity: alert.severity, message: alert.message },
        });
    }
    console.log(`  ✓ Created safety alerts`);

    // Create Incidents
    console.log('Creating incidents...');
    await prisma.incident.create({ data: { incidentType: 'medication-error', severity: 'medium', location: 'Ward A', description: 'Wrong dosage administered - patient given 1000mg instead of 500mg', reportedBy: 'Nurse Priya', status: 'investigating' } });
    await prisma.incident.create({ data: { incidentType: 'fall', severity: 'high', location: 'ICU', description: 'Patient fell while attempting to get out of bed unassisted', reportedBy: 'Nurse Rahul', status: 'reported' } });
    await prisma.incident.create({ data: { incidentType: 'near-miss', severity: 'low', location: 'Pharmacy', description: 'Wrong medication almost dispensed - caught at verification', reportedBy: 'Pharmacist', status: 'resolved' } });
    console.log(`  ✓ Created incidents`);

    // Create Insurance Policies
    console.log('Creating insurance policies...');
    for (let i = 0; i < 4; i++) {
        const patient = createdPatients[i];
        const policy = await prisma.insurancePolicy.create({
            data: {
                patientId: patient.id,
                insurerId: `INS-${i + 1}`,
                insurerName: ['Star Health', 'ICICI Lombard', 'Max Bupa', 'HDFC Ergo'][i],
                policyNumber: `POL-2024-${String(i + 1).padStart(6, '0')}`,
                policyType: i % 2 === 0 ? 'cashless' : 'reimbursement',
                sumInsured: [500000, 1000000, 300000, 750000][i],
                validFrom: new Date('2024-01-01'),
                validTo: new Date('2024-12-31'),
                tpaName: ['Medi Assist', 'Paramount', null, 'Raksha TPA'][i],
            },
        });
        if (i < 2) {
            await prisma.preAuthorization.create({
                data: { encounterId: createdEncounters[i].id, policyId: policy.id, requestedAmount: 50000 + i * 25000, approvedAmount: i === 0 ? 50000 : null, status: i === 0 ? 'approved' : 'pending' },
            });
        }
    }
    console.log(`  ✓ Created insurance policies and pre-auths`);

    // Create Clinical Notes
    console.log('Creating clinical notes...');
    for (const enc of createdEncounters.slice(0, 4)) {
        await prisma.clinicalNote.create({ data: { encounterId: enc.id, patientId: enc.patientId, noteType: 'chief-complaint', content: 'Patient presents with chest pain and shortness of breath since 2 days.', authorId: 'dr-1', authorRole: 'Doctor' } });
        await prisma.clinicalNote.create({ data: { encounterId: enc.id, patientId: enc.patientId, noteType: 'progress', content: 'Patient condition stable. Vitals within normal limits. Continue current treatment.', authorId: 'dr-1', authorRole: 'Doctor' } });
    }
    console.log(`  ✓ Created clinical notes`);

    // Create Medications
    console.log('Creating medications...');
    const medications = [
        { name: 'Paracetamol 500mg', genericName: 'Paracetamol', category: 'analgesic', form: 'tablet', strength: '500mg', manufacturer: 'Cipla' },
        { name: 'Amoxicillin 250mg', genericName: 'Amoxicillin', category: 'antibiotic', form: 'capsule', strength: '250mg', manufacturer: 'Ranbaxy' },
        { name: 'Omeprazole 20mg', genericName: 'Omeprazole', category: 'antacid', form: 'capsule', strength: '20mg', manufacturer: 'Sun Pharma' },
        { name: 'Metformin 500mg', genericName: 'Metformin', category: 'antidiabetic', form: 'tablet', strength: '500mg', manufacturer: 'USV' },
        { name: 'Amlodipine 5mg', genericName: 'Amlodipine', category: 'antihypertensive', form: 'tablet', strength: '5mg', manufacturer: 'Torrent' },
        { name: 'Atorvastatin 10mg', genericName: 'Atorvastatin', category: 'statin', form: 'tablet', strength: '10mg', manufacturer: 'Pfizer' },
        { name: 'Insulin Glargine', genericName: 'Insulin', category: 'antidiabetic', form: 'injection', strength: '100IU/ml', manufacturer: 'Sanofi', isControlled: true },
        { name: 'Morphine 10mg', genericName: 'Morphine', category: 'opioid', form: 'injection', strength: '10mg/ml', manufacturer: 'Rusan', isControlled: true },
    ];
    const createdMedications: { id: string; name: string }[] = [];
    for (const med of medications) {
        const medication = await prisma.medication.create({ data: { ...med, isControlled: med.isControlled || false } });
        createdMedications.push({ id: medication.id, name: medication.name });
    }
    console.log(`  ✓ Created ${medications.length} medications`);

    // Create Drug Interactions
    console.log('Creating drug interactions...');
    if (createdMedications.length >= 2) {
        await prisma.drugInteraction.create({ data: { medicationId: createdMedications[0].id, interactsWith: 'Warfarin', severity: 'moderate', description: 'May increase anticoagulant effect' } });
        await prisma.drugInteraction.create({ data: { medicationId: createdMedications[1].id, interactsWith: 'Methotrexate', severity: 'major', description: 'Increased risk of methotrexate toxicity' } });
        await prisma.drugInteraction.create({ data: { medicationId: createdMedications[4].id, interactsWith: 'Simvastatin', severity: 'major', description: 'Increased risk of myopathy' } });
    }
    console.log(`  ✓ Created drug interactions`);

    // Create Vendors
    console.log('Creating vendors...');
    const vendors = [
        { name: 'MedSupply India Pvt Ltd', contactPerson: 'Rahul Mehta', phone: '9876500001', email: 'rahul@medsupply.in', gstNumber: '27AABCU9603R1ZM' },
        { name: 'PharmaCare Distributors', contactPerson: 'Priya Singh', phone: '9876500002', email: 'priya@pharmacare.in', gstNumber: '27AABCU9604R1ZN' },
        { name: 'SurgiEquip Solutions', contactPerson: 'Amit Kumar', phone: '9876500003', email: 'amit@surgiequip.in', gstNumber: '27AABCU9605R1ZO' },
    ];
    const createdVendors: { id: string; name: string }[] = [];
    for (const vendor of vendors) {
        // Check if vendor already exists
        const existing = await prisma.vendor.findFirst({ where: { email: vendor.email } });
        if (existing) {
            createdVendors.push({ id: existing.id, name: existing.name });
        } else {
            const v = await prisma.vendor.create({ data: vendor });
            createdVendors.push({ id: v.id, name: v.name });
        }
    }
    console.log(`  ✓ Created ${vendors.length} vendors`);

    // Create Purchase Orders
    console.log('Creating purchase orders...');
    for (let i = 0; i < 3; i++) {
        const poNumber = `PO-2024-${String(i + 1).padStart(6, '0')}`;
        const existingPO = await prisma.purchaseOrder.findUnique({ where: { poNumber } });
        if (!existingPO) {
            const po = await prisma.purchaseOrder.create({
                data: {
                    vendorId: createdVendors[i].id,
                    poNumber,
                    status: ['approved', 'received', 'draft'][i],
                    totalAmount: 50000 + i * 25000,
                    createdBy: 'admin',
                    approvedBy: i < 2 ? 'manager' : null,
                    approvedAt: i < 2 ? new Date() : null,
                },
            });
            const inventoryItem = await prisma.inventoryItem.findFirst();
            if (inventoryItem) {
                await prisma.purchaseOrderItem.create({ data: { poId: po.id, itemId: inventoryItem.id, quantity: 100, unitPrice: 50 } });
            }
        }
    }
    console.log(`  ✓ Created purchase orders`);

    // Create Equipment
    console.log('Creating equipment...');
    const equipment = [
        { name: 'Ventilator V500', category: 'life-support', serialNumber: 'VNT-001', location: 'ICU', status: 'in-use' },
        { name: 'Defibrillator', category: 'emergency', serialNumber: 'DEF-001', location: 'Emergency', status: 'available' },
        { name: 'ECG Machine', category: 'diagnostic', serialNumber: 'ECG-001', location: 'Cardiology', status: 'available' },
        { name: 'X-Ray Machine', category: 'radiology', serialNumber: 'XRY-001', location: 'Radiology', status: 'in-use' },
        { name: 'MRI Scanner', category: 'radiology', serialNumber: 'MRI-001', location: 'Radiology', status: 'maintenance' },
        { name: 'Ultrasound Machine', category: 'diagnostic', serialNumber: 'USG-001', location: 'Obstetrics', status: 'available' },
        { name: 'Patient Monitor', category: 'monitoring', serialNumber: 'MON-001', location: 'ICU', status: 'in-use' },
        { name: 'Infusion Pump', category: 'therapy', serialNumber: 'INF-001', location: 'General Ward A', status: 'available' },
    ];
    for (const eq of equipment) {
        await prisma.equipment.create({ data: { ...eq, nextMaintenanceAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) } });
    }
    console.log(`  ✓ Created ${equipment.length} equipment`);

    // Create Staff Shifts
    console.log('Creating staff shifts...');
    const staffMembers = [
        { staffId: 'dr-shah', staffName: 'Dr. Shah', department: 'Cardiology' },
        { staffId: 'dr-patel', staffName: 'Dr. Patel', department: 'Orthopedics' },
        { staffId: 'nurse-priya', staffName: 'Nurse Priya', department: 'ICU' },
        { staffId: 'nurse-rahul', staffName: 'Nurse Rahul', department: 'Emergency' },
        { staffId: 'tech-amit', staffName: 'Lab Tech Amit', department: 'Laboratory' },
    ];
    const shiftTypes = ['morning', 'evening', 'night'];
    for (const staff of staffMembers) {
        for (let d = 0; d < 3; d++) {
            const shiftType = shiftTypes[d % 3];
            const startHour = shiftType === 'morning' ? 8 : shiftType === 'evening' ? 16 : 0;
            const startTime = new Date();
            startTime.setDate(startTime.getDate() + d);
            startTime.setHours(startHour, 0, 0, 0);
            const endTime = new Date(startTime);
            endTime.setHours(startTime.getHours() + 8);
            await prisma.staffShift.create({
                data: { ...staff, shiftType, startTime, endTime, status: d === 0 ? 'checked-in' : 'scheduled' },
            });
        }
    }
    console.log(`  ✓ Created staff shifts`);

    // Create Appointments
    console.log('Creating appointments...');
    for (let i = 0; i < 6; i++) {
        const patient = createdPatients[i % createdPatients.length];
        const scheduledAt = new Date();
        scheduledAt.setDate(scheduledAt.getDate() + i);
        scheduledAt.setHours(9 + i, 0, 0, 0);
        await prisma.appointment.create({
            data: {
                patientId: patient.id,
                doctorId: 'dr-shah',
                department: ['Cardiology', 'Orthopedics', 'General Medicine', 'Dermatology', 'Pediatrics', 'Gynecology'][i],
                scheduledAt,
                duration: 15 + (i % 2) * 15,
                status: i === 0 ? 'checked-in' : i === 1 ? 'in-progress' : 'scheduled',
                visitType: i < 2 ? 'new' : 'follow-up',
                notes: i === 0 ? 'First consultation for cardiac evaluation' : null,
            },
        });
    }
    console.log(`  ✓ Created appointments`);

    // Create Consents
    console.log('Creating consents...');
    for (let i = 0; i < 4; i++) {
        const enc = createdEncounters[i];
        await prisma.consent.create({
            data: {
                patientId: enc.patientId,
                encounterId: enc.id,
                consentType: ['treatment', 'surgery', 'anesthesia', 'blood-transfusion'][i],
                consentText: `I hereby consent to ${['general treatment', 'surgical procedure', 'anesthesia administration', 'blood transfusion'][i]} as recommended by my physician.`,
                signedBy: createdPatients[i].name,
                witnessedBy: 'Nurse Priya',
            },
        });
    }
    console.log(`  ✓ Created consents`);

    // Create Care Plans
    console.log('Creating care plans...');
    for (let i = 0; i < 3; i++) {
        const enc = createdEncounters[i];
        await prisma.carePlan.create({
            data: {
                encounterId: enc.id,
                patientId: enc.patientId,
                goals: JSON.stringify(['Pain management', 'Mobility improvement', 'Infection prevention']),
                interventions: JSON.stringify(['Medication administration', 'Physical therapy', 'Wound care']),
                createdBy: 'dr-shah',
                status: 'active',
            },
        });
    }
    console.log(`  ✓ Created care plans`);

    // Create Order Sets
    console.log('Creating order sets...');
    const orderSets = [
        { name: 'Cardiac Emergency Protocol', category: 'cardiac', description: 'Standard orders for cardiac emergencies' },
        { name: 'Sepsis Bundle', category: 'sepsis', description: 'Time-critical sepsis management orders' },
        { name: 'Post-Op Care', category: 'surgery', description: 'Standard post-operative care orders' },
        { name: 'Diabetic Ketoacidosis', category: 'metabolic', description: 'DKA management protocol' },
    ];
    for (let i = 0; i < orderSets.length; i++) {
        const existing = await prisma.orderSet.findFirst({ where: { name: orderSets[i].name } });
        if (!existing) {
            const os = await prisma.orderSet.create({ data: orderSets[i] });
            await prisma.orderSetItem.create({ data: { orderSetId: os.id, itemType: 'lab', itemCode: 'CBC', itemName: 'Complete Blood Count', sortOrder: 1 } });
            await prisma.orderSetItem.create({ data: { orderSetId: os.id, itemType: 'medication', itemCode: 'MED-001', itemName: 'Paracetamol 500mg', sortOrder: 2 } });
        }
    }
    console.log(`  ✓ Created order sets`);

    // Create Clinical Codes
    console.log('Creating clinical codes...');
    const clinicalCodes = [
        { codeSystem: 'ICD-10', code: 'I21.0', description: 'Acute transmural myocardial infarction of anterior wall', category: 'Cardiovascular' },
        { codeSystem: 'ICD-10', code: 'J18.9', description: 'Pneumonia, unspecified organism', category: 'Respiratory' },
        { codeSystem: 'ICD-10', code: 'E11.9', description: 'Type 2 diabetes mellitus without complications', category: 'Endocrine' },
        { codeSystem: 'ICD-10', code: 'K35.80', description: 'Unspecified acute appendicitis', category: 'Digestive' },
        { codeSystem: 'CPT', code: '99213', description: 'Office visit, established patient, low complexity', category: 'Evaluation' },
        { codeSystem: 'CPT', code: '99284', description: 'Emergency department visit, high severity', category: 'Emergency' },
    ];
    for (const code of clinicalCodes) {
        await prisma.clinicalCode.upsert({ where: { codeSystem_code: { codeSystem: code.codeSystem, code: code.code } }, update: {}, create: code });
    }
    console.log(`  ✓ Created clinical codes`);

    // Create Encounter Diagnoses
    console.log('Creating encounter diagnoses...');
    for (let i = 0; i < 4; i++) {
        const enc = createdEncounters[i];
        await prisma.encounterDiagnosis.create({
            data: {
                encounterId: enc.id,
                isPrimary: true,
                codeSystem: 'ICD-10',
                code: clinicalCodes[i].code,
                description: clinicalCodes[i].description,
                codedBy: 'dr-shah',
            },
        });
    }
    console.log(`  ✓ Created encounter diagnoses`);

    // Create Permissions
    console.log('Creating permissions...');
    const resources = ['patient', 'encounter', 'billing', 'pharmacy', 'lab', 'radiology', 'surgery'];
    const actions = ['create', 'read', 'update', 'delete', 'approve'];
    const createdPermissions: { id: string; resource: string; action: string }[] = [];
    for (const resource of resources) {
        for (const action of actions) {
            const perm = await prisma.permission.upsert({
                where: { resource_action: { resource, action } },
                update: {},
                create: { resource, action, description: `Can ${action} ${resource}` },
            });
            createdPermissions.push({ id: perm.id, resource, action });
        }
    }
    console.log(`  ✓ Created permissions`);

    // Assign permissions to roles
    console.log('Assigning permissions to roles...');
    const adminRole = await prisma.role.findUnique({ where: { name: 'admin' } });
    const doctorRole = await prisma.role.findUnique({ where: { name: 'doctor' } });
    if (adminRole) {
        for (const perm of createdPermissions) {
            await prisma.rolePermission.upsert({
                where: { roleId_permissionId: { roleId: adminRole.id, permissionId: perm.id } },
                update: {},
                create: { roleId: adminRole.id, permissionId: perm.id },
            });
        }
    }
    if (doctorRole) {
        const doctorPerms = createdPermissions.filter(p => ['patient', 'encounter', 'lab', 'radiology'].includes(p.resource) && ['create', 'read', 'update'].includes(p.action));
        for (const perm of doctorPerms) {
            await prisma.rolePermission.upsert({
                where: { roleId_permissionId: { roleId: doctorRole.id, permissionId: perm.id } },
                update: {},
                create: { roleId: doctorRole.id, permissionId: perm.id },
            });
        }
    }
    console.log(`  ✓ Assigned permissions to roles`);

    // Create Dashboard Configs
    console.log('Creating dashboard configs...');
    const dashboardConfigs = [
        { dashboardType: 'operations', widgets: JSON.stringify(['bed-occupancy', 'patient-flow', 'pending-discharges']), layout: JSON.stringify({ columns: 3 }), isDefault: true },
        { dashboardType: 'clinical', widgets: JSON.stringify(['critical-alerts', 'pending-orders', 'patient-list']), layout: JSON.stringify({ columns: 2 }), isDefault: true },
        { dashboardType: 'financial', widgets: JSON.stringify(['revenue-summary', 'pending-bills', 'collections']), layout: JSON.stringify({ columns: 3 }), isDefault: true },
        { dashboardType: 'executive', widgets: JSON.stringify(['kpi-summary', 'trends', 'alerts']), layout: JSON.stringify({ columns: 2 }), isDefault: true },
    ];
    for (const config of dashboardConfigs) {
        await prisma.dashboardConfig.create({ data: config });
    }
    console.log(`  ✓ Created dashboard configs`);

    // Create Infection Control Records
    console.log('Creating infection control records...');
    await prisma.infectionControl.create({
        data: { patientId: createdPatients[0].id, encounterId: createdEncounters[0].id, infectionType: 'MRSA', organism: 'Methicillin-resistant Staphylococcus aureus', isolationType: 'contact', notes: 'Patient isolated in single room' },
    });
    await prisma.infectionControl.create({
        data: { patientId: createdPatients[1].id, encounterId: createdEncounters[1].id, infectionType: 'COVID-19', organism: 'SARS-CoV-2', isolationType: 'airborne', notes: 'Negative pressure room required' },
    });
    console.log(`  ✓ Created infection control records`);

    // Create CAPA (Corrective and Preventive Actions)
    console.log('Creating CAPA records...');
    const incidents = await prisma.incident.findMany({ take: 2 });
    if (incidents.length > 0) {
        await prisma.cAPA.create({
            data: {
                incidentId: incidents[0].id,
                capaType: 'corrective',
                description: 'Implement double-check system for medication administration',
                assignedTo: 'Nursing Manager',
                dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
                status: 'in-progress',
            },
        });
        await prisma.cAPA.create({
            data: {
                incidentId: incidents[0].id,
                capaType: 'preventive',
                description: 'Conduct staff training on medication safety',
                assignedTo: 'Training Department',
                dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                status: 'open',
            },
        });
    }
    console.log(`  ✓ Created CAPA records`);

    // Create Risk Assessments
    console.log('Creating risk assessments...');
    for (let i = 0; i < 4; i++) {
        const enc = createdEncounters[i];
        await prisma.riskAssessment.create({
            data: {
                patientId: enc.patientId,
                encounterId: enc.id,
                assessmentType: ['fall', 'pressure-ulcer', 'vte', 'nutrition'][i],
                score: 3 + i * 2,
                riskLevel: i < 2 ? 'low' : i === 2 ? 'medium' : 'high',
                assessedBy: 'Nurse Priya',
                interventions: ['Bed rails up', 'Regular repositioning', 'Compression stockings'],
            },
        });
    }
    console.log(`  ✓ Created risk assessments`);

    // Create Stock Transactions
    console.log('Creating stock transactions...');
    const inventoryItemsForTxn = await prisma.inventoryItem.findMany({ take: 3 });
    for (let i = 0; i < inventoryItemsForTxn.length; i++) {
        await prisma.stockTransaction.create({
            data: {
                itemId: inventoryItemsForTxn[i].id,
                transactionType: ['issue', 'return', 'adjustment'][i],
                quantity: i === 0 ? -10 : i === 1 ? 5 : 20,
                performedBy: 'Pharmacist',
                notes: ['Issued to Ward A', 'Returned from ICU', 'Inventory adjustment'][i],
            },
        });
    }
    console.log(`  ✓ Created stock transactions`);

    // Create Shift Handovers
    console.log('Creating shift handovers...');
    for (let i = 0; i < 2; i++) {
        const enc = createdEncounters[i];
        await prisma.shiftHandover.create({
            data: {
                encounterId: enc.id,
                outgoingNurse: 'Nurse Priya',
                incomingNurse: 'Nurse Rahul',
                patientSummary: 'Patient stable, vitals within normal limits. Continue current treatment plan.',
                pendingTasks: JSON.stringify(['Medication at 6 PM', 'Dressing change', 'Lab follow-up']),
                alerts: JSON.stringify(['Allergy to Penicillin', 'Fall risk']),
                acknowledgedAt: new Date(),
            },
        });
    }
    console.log(`  ✓ Created shift handovers`);

    // Create Discharge Summaries for discharged patients
    console.log('Creating discharge summaries...');
    const dischargedPatient = await prisma.encounter.create({
        data: {
            patientId: createdPatients[7].id,
            type: 'IPD',
            status: 'DISCHARGED',
            department: 'General Medicine',
            primaryDoctorId: 'dr-shah',
            arrivalTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
            dischargeTime: new Date(),
        },
    });
    await prisma.dischargeSummary.create({
        data: {
            encounterId: dischargedPatient.id,
            patientId: createdPatients[7].id,
            admissionDiagnosis: 'Acute gastroenteritis with dehydration',
            dischargeDiagnosis: 'Acute gastroenteritis - Resolved',
            courseOfTreatment: 'IV fluids, antiemetics, probiotics. Patient responded well to treatment.',
            conditionAtDischarge: 'Stable, tolerating oral intake',
            followUpInstructions: 'Follow up in OPD after 1 week. Continue probiotics for 5 days.',
            medications: JSON.stringify(['Tab. ORS BD', 'Tab. Domperidone TDS x 3 days']),
            createdBy: 'dr-shah',
            approvedBy: 'dr-shah',
            approvedAt: new Date(),
        },
    });
    console.log(`  ✓ Created discharge summaries`);

    // Create Audit Events
    console.log('Creating audit events...');
    for (let i = 0; i < 10; i++) {
        await prisma.auditEvent.create({
            data: {
                entityType: ['Patient', 'Encounter', 'Bill', 'Prescription', 'Order'][i % 5],
                entityId: createdPatients[i % createdPatients.length].id,
                action: ['create', 'read', 'update', 'print', 'export'][i % 5],
                performedBy: ['dr-shah', 'nurse-priya', 'admin', 'pharmacist', 'billing'][i % 5],
                performedAt: new Date(Date.now() - i * 60 * 60 * 1000),
                ipAddress: '192.168.1.' + (100 + i),
            },
        });
    }
    console.log(`  ✓ Created audit events`);

    // Create Resource Utilization Records
    console.log('Creating resource utilization records...');
    for (let d = 0; d < 7; d++) {
        const date = new Date();
        date.setDate(date.getDate() - d);
        await prisma.resourceUtilization.create({
            data: { resourceType: 'bed', resourceId: 'ward-general', utilizationDate: date, hoursUsed: 18 + Math.random() * 4, hoursAvailable: 24 },
        });
        await prisma.resourceUtilization.create({
            data: { resourceType: 'ot', resourceId: 'ot-1', utilizationDate: date, hoursUsed: 6 + Math.random() * 4, hoursAvailable: 12 },
        });
    }
    console.log(`  ✓ Created resource utilization records`);

    console.log('\n✅ Comprehensive database seeded successfully!');
    console.log('\n📊 Summary:');
    console.log('   - 8 patients with allergies');
    console.log('   - 9 encounters (OPD, IPD, Emergency, Discharged)');
    console.log('   - Lab orders with results');
    console.log('   - Prescriptions and medications');
    console.log('   - Vital signs across encounters');
    console.log('   - Bills with payments');
    console.log('   - 3 scheduled/ongoing surgeries');
    console.log('   - Safety alerts (critical & warnings)');
    console.log('   - Incident reports with CAPA');
    console.log('   - Insurance policies and pre-auths');
    console.log('   - 8 medications with drug interactions');
    console.log('   - 3 vendors with purchase orders');
    console.log('   - 8 equipment items');
    console.log('   - Staff shifts (3 days)');
    console.log('   - 6 appointments');
    console.log('   - Consents and care plans');
    console.log('   - Order sets and clinical codes');
    console.log('   - Permissions and role assignments');
    console.log('   - Dashboard configurations');
    console.log('   - Infection control records');
    console.log('   - Risk assessments');
    console.log('   - Stock transactions');
    console.log('   - Shift handovers');
    console.log('   - Discharge summaries');
    console.log('   - Audit events');
    console.log('   - Resource utilization records');
}

main()
    .catch((e) => { console.error('❌ Seed failed:', e); process.exit(1); })
    .finally(async () => { await prisma.$disconnect(); });
