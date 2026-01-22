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

    // Create Tariffs
    console.log('Creating tariffs...');
    const tariffs = [
        { tariffCode: 'CON-GEN', category: 'consultation', description: 'General Consultation', basePrice: 500 },
        { tariffCode: 'CON-SPE', category: 'consultation', description: 'Specialist Consultation', basePrice: 1000 },
        { tariffCode: 'BED-GEN', category: 'bed', description: 'General Ward (per day)', basePrice: 1500 },
        { tariffCode: 'BED-ICU', category: 'bed', description: 'ICU (per day)', basePrice: 15000 },
        { tariffCode: 'LAB-CBC', category: 'lab', description: 'Complete Blood Count', basePrice: 400 },
        { tariffCode: 'LAB-LFT', category: 'lab', description: 'Liver Function Test', basePrice: 800 },
        { tariffCode: 'RAD-CT', category: 'radiology', description: 'CT Scan', basePrice: 5000 },
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
        const bill = await prisma.bill.create({
            data: {
                billNumber: `BILL-2024-${String(i + 1).padStart(6, '0')}`,
                patientId: enc.patientId,
                encounterId: enc.id,
                status: paidAmount === totalAmount ? 'paid' : paidAmount > 0 ? 'partial' : 'pending',
                subtotal: totalAmount,
                totalAmount,
                paidAmount,
                balanceDue: totalAmount - paidAmount,
            },
        });
        await prisma.billItem.create({ data: { billId: bill.id, category: 'consultation', description: 'Consultation Fee', quantity: 1, unitPrice: 1000, totalPrice: 1000 } });
        await prisma.billItem.create({ data: { billId: bill.id, category: 'bed', description: 'Bed Charges (2 days)', quantity: 2, unitPrice: 1500, totalPrice: 3000 } });
        if (paidAmount > 0) {
            await prisma.payment.create({ data: { billId: bill.id, amount: paidAmount, paymentMode: 'cash', receivedBy: 'Cashier' } });
        }
    }
    console.log(`  ✓ Created bills and payments`);

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

    console.log('\n✅ Comprehensive database seeded successfully!');
    console.log('\n📊 Summary:');
    console.log('   - 8 patients with allergies');
    console.log('   - 8 active encounters (OPD, IPD, Emergency)');
    console.log('   - Lab orders with results');
    console.log('   - Prescriptions and medications');
    console.log('   - Vital signs across encounters');
    console.log('   - Bills with payments');
    console.log('   - 3 scheduled/ongoing surgeries');
    console.log('   - Safety alerts (critical & warnings)');
    console.log('   - Incident reports');
    console.log('   - Insurance policies and pre-auths');
}

main()
    .catch((e) => { console.error('❌ Seed failed:', e); process.exit(1); })
    .finally(async () => { await prisma.$disconnect(); });
