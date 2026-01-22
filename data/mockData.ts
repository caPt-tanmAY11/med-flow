// Mock data for the Hospital Information System

export interface Patient {
    id: string;
    uhid: string;
    name: string;
    age: number;
    gender: 'Male' | 'Female' | 'Other';
    contact: string;
    address: string;
    bloodGroup: string;
    emergencyContact: string;
    registeredAt: string;
    idProof: string;
    idNumber: string;
    allergies: string[];
    status: 'active' | 'discharged' | 'deceased';
}

export interface Visit {
    id: string;
    patientId: string;
    type: 'OPD' | 'IPD' | 'Emergency';
    status: 'waiting' | 'in-consultation' | 'admitted' | 'discharged' | 'under-treatment';
    department: string;
    doctor: string;
    arrivalTime: string;
    triageLevel?: 'immediate' | 'urgent' | 'delayed' | 'minor';
    chiefComplaint: string;
    bedNumber?: string;
    ward?: string;
}

export interface Bed {
    id: string;
    number: string;
    ward: string;
    floor: number;
    type: 'General' | 'ICU' | 'NICU' | 'Private' | 'Semi-Private';
    status: 'available' | 'occupied' | 'reserved' | 'cleaning' | 'maintenance';
    patientId?: string;
    patientName?: string;
    admissionDate?: string;
    expectedDischarge?: string;
}

export interface LabTest {
    id: string;
    patientId: string;
    patientName: string;
    uhid: string;
    testName: string;
    orderedBy: string;
    orderedAt: string;
    status: 'ordered' | 'collected' | 'processing' | 'completed' | 'critical';
    priority: 'routine' | 'urgent' | 'stat';
    result?: string;
    normalRange?: string;
    isCritical?: boolean;
}

export interface Prescription {
    id: string;
    patientId: string;
    patientName: string;
    uhid: string;
    prescribedBy: string;
    prescribedAt: string;
    status: 'pending' | 'dispensed' | 'partial';
    medications: {
        name: string;
        dosage: string;
        frequency: string;
        duration: string;
        quantity: number;
        dispensed?: boolean;
    }[];
}

export interface InventoryItem {
    id: string;
    name: string;
    category: 'Medicine' | 'Consumable' | 'Equipment' | 'Surgical';
    sku: string;
    currentStock: number;
    minStock: number;
    maxStock: number;
    unit: string;
    batchNumber: string;
    expiryDate: string;
    supplier: string;
    unitPrice: number;
    location: string;
}

export interface Incident {
    id: string;
    type: 'medication-error' | 'fall' | 'infection' | 'equipment' | 'near-miss' | 'other';
    severity: 'low' | 'medium' | 'high' | 'critical';
    reportedBy: string;
    reportedAt: string;
    location: string;
    description: string;
    status: 'reported' | 'investigating' | 'resolved' | 'closed';
    patientId?: string;
}

export interface NursingTask {
    id: string;
    patientId: string;
    patientName: string;
    bedNumber: string;
    task: string;
    type: 'medication' | 'vitals' | 'procedure' | 'care' | 'documentation';
    priority: 'low' | 'medium' | 'high';
    dueAt: string;
    completedAt?: string;
    assignedTo: string;
    status: 'pending' | 'in-progress' | 'completed' | 'overdue';
}

export interface Surgery {
    id: string;
    patientId: string;
    patientName: string;
    uhid: string;
    procedure: string;
    surgeon: string;
    anesthetist: string;
    otRoom: string;
    scheduledDate: string;
    scheduledTime: string;
    estimatedDuration: string;
    status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled' | 'delayed';
    preOpChecklistComplete: boolean;
}

export interface Bill {
    id: string;
    patientId: string;
    patientName: string;
    uhid: string;
    visitId: string;
    items: {
        description: string;
        category: 'consultation' | 'medicine' | 'lab' | 'radiology' | 'bed' | 'procedure' | 'ot' | 'other';
        quantity: number;
        unitPrice: number;
        total: number;
    }[];
    subtotal: number;
    discount: number;
    tax: number;
    total: number;
    status: 'pending' | 'partial' | 'paid' | 'insurance-pending';
    insuranceClaim?: {
        provider: string;
        policyNumber: string;
        claimAmount: number;
        status: 'submitted' | 'approved' | 'rejected' | 'pending';
    };
}

// Sample patients
export const mockPatients: Patient[] = [
    {
        id: 'p1',
        uhid: 'UHID-2024-000001',
        name: 'Rajesh Kumar',
        age: 45,
        gender: 'Male',
        contact: '+91 98765 43210',
        address: '123, MG Road, Mumbai',
        bloodGroup: 'B+',
        emergencyContact: '+91 98765 43211',
        registeredAt: '2024-01-15T09:30:00',
        idProof: 'Aadhaar',
        idNumber: 'XXXX-XXXX-1234',
        allergies: ['Penicillin'],
        status: 'active',
    },
    {
        id: 'p2',
        uhid: 'UHID-2024-000002',
        name: 'Priya Sharma',
        age: 32,
        gender: 'Female',
        contact: '+91 87654 32109',
        address: '456, Park Street, Delhi',
        bloodGroup: 'O+',
        emergencyContact: '+91 87654 32110',
        registeredAt: '2024-01-16T10:15:00',
        idProof: 'PAN',
        idNumber: 'ABCDE1234F',
        allergies: [],
        status: 'active',
    },
    {
        id: 'p3',
        uhid: 'UHID-2024-000003',
        name: 'Mohammed Ali',
        age: 58,
        gender: 'Male',
        contact: '+91 76543 21098',
        address: '789, Lake View, Bangalore',
        bloodGroup: 'A-',
        emergencyContact: '+91 76543 21099',
        registeredAt: '2024-01-17T14:45:00',
        idProof: 'Aadhaar',
        idNumber: 'XXXX-XXXX-5678',
        allergies: ['Sulfa drugs', 'Aspirin'],
        status: 'active',
    },
    {
        id: 'p4',
        uhid: 'UHID-2024-000004',
        name: 'Lakshmi Devi',
        age: 67,
        gender: 'Female',
        contact: '+91 65432 10987',
        address: '321, Temple Road, Chennai',
        bloodGroup: 'AB+',
        emergencyContact: '+91 65432 10988',
        registeredAt: '2024-01-18T08:00:00',
        idProof: 'Voter ID',
        idNumber: 'ABC1234567',
        allergies: ['Iodine'],
        status: 'active',
    },
    {
        id: 'p5',
        uhid: 'UHID-2024-000005',
        name: 'Arjun Reddy',
        age: 28,
        gender: 'Male',
        contact: '+91 54321 09876',
        address: '654, Hill View, Hyderabad',
        bloodGroup: 'O-',
        emergencyContact: '+91 54321 09877',
        registeredAt: '2024-01-19T11:30:00',
        idProof: 'Driving License',
        idNumber: 'DL1234567890',
        allergies: [],
        status: 'active',
    },
];

// Sample visits
export const mockVisits: Visit[] = [
    {
        id: 'v1',
        patientId: 'p1',
        type: 'OPD',
        status: 'waiting',
        department: 'General Medicine',
        doctor: 'Dr. Anil Kapoor',
        arrivalTime: '2024-01-20T09:00:00',
        chiefComplaint: 'Fever and body ache for 3 days',
    },
    {
        id: 'v2',
        patientId: 'p2',
        type: 'Emergency',
        status: 'under-treatment',
        department: 'Emergency',
        doctor: 'Dr. Sneha Patel',
        arrivalTime: '2024-01-20T08:30:00',
        triageLevel: 'urgent',
        chiefComplaint: 'Severe abdominal pain',
    },
    {
        id: 'v3',
        patientId: 'p3',
        type: 'IPD',
        status: 'admitted',
        department: 'Cardiology',
        doctor: 'Dr. Vikram Singh',
        arrivalTime: '2024-01-19T14:00:00',
        chiefComplaint: 'Chest pain and shortness of breath',
        bedNumber: 'ICU-05',
        ward: 'ICU',
    },
    {
        id: 'v4',
        patientId: 'p4',
        type: 'OPD',
        status: 'in-consultation',
        department: 'Orthopedics',
        doctor: 'Dr. Rahul Verma',
        arrivalTime: '2024-01-20T10:30:00',
        chiefComplaint: 'Knee pain for 2 weeks',
    },
    {
        id: 'v5',
        patientId: 'p5',
        type: 'Emergency',
        status: 'under-treatment',
        department: 'Emergency',
        doctor: 'Dr. Sneha Patel',
        arrivalTime: '2024-01-20T07:45:00',
        triageLevel: 'immediate',
        chiefComplaint: 'Road traffic accident - multiple injuries',
    },
];

// Sample beds
export const mockBeds: Bed[] = [
    // ICU Beds
    { id: 'b1', number: 'ICU-01', ward: 'ICU', floor: 2, type: 'ICU', status: 'occupied', patientId: 'p3', patientName: 'Mohammed Ali', admissionDate: '2024-01-19', expectedDischarge: '2024-01-25' },
    { id: 'b2', number: 'ICU-02', ward: 'ICU', floor: 2, type: 'ICU', status: 'available' },
    { id: 'b3', number: 'ICU-03', ward: 'ICU', floor: 2, type: 'ICU', status: 'cleaning' },
    { id: 'b4', number: 'ICU-04', ward: 'ICU', floor: 2, type: 'ICU', status: 'occupied', patientId: 'p5', patientName: 'Arjun Reddy', admissionDate: '2024-01-20', expectedDischarge: '2024-01-28' },
    { id: 'b5', number: 'ICU-05', ward: 'ICU', floor: 2, type: 'ICU', status: 'reserved' },
    { id: 'b6', number: 'ICU-06', ward: 'ICU', floor: 2, type: 'ICU', status: 'available' },
    // General Ward
    { id: 'b7', number: 'GW-101', ward: 'General', floor: 1, type: 'General', status: 'occupied', patientName: 'Patient A', admissionDate: '2024-01-18' },
    { id: 'b8', number: 'GW-102', ward: 'General', floor: 1, type: 'General', status: 'available' },
    { id: 'b9', number: 'GW-103', ward: 'General', floor: 1, type: 'General', status: 'available' },
    { id: 'b10', number: 'GW-104', ward: 'General', floor: 1, type: 'General', status: 'occupied', patientName: 'Patient B', admissionDate: '2024-01-17' },
    { id: 'b11', number: 'GW-105', ward: 'General', floor: 1, type: 'General', status: 'maintenance' },
    { id: 'b12', number: 'GW-106', ward: 'General', floor: 1, type: 'General', status: 'available' },
    // Private Rooms
    { id: 'b13', number: 'PVT-201', ward: 'Private', floor: 3, type: 'Private', status: 'occupied', patientName: 'VIP Patient', admissionDate: '2024-01-19' },
    { id: 'b14', number: 'PVT-202', ward: 'Private', floor: 3, type: 'Private', status: 'available' },
    { id: 'b15', number: 'PVT-203', ward: 'Private', floor: 3, type: 'Private', status: 'reserved' },
    { id: 'b16', number: 'PVT-204', ward: 'Private', floor: 3, type: 'Private', status: 'cleaning' },
];

// Sample lab tests
export const mockLabTests: LabTest[] = [
    { id: 'lt1', patientId: 'p1', patientName: 'Rajesh Kumar', uhid: 'UHID-2024-000001', testName: 'Complete Blood Count', orderedBy: 'Dr. Anil Kapoor', orderedAt: '2024-01-20T09:15:00', status: 'collected', priority: 'routine' },
    { id: 'lt2', patientId: 'p2', patientName: 'Priya Sharma', uhid: 'UHID-2024-000002', testName: 'Liver Function Test', orderedBy: 'Dr. Sneha Patel', orderedAt: '2024-01-20T08:45:00', status: 'processing', priority: 'urgent' },
    { id: 'lt3', patientId: 'p3', patientName: 'Mohammed Ali', uhid: 'UHID-2024-000003', testName: 'Troponin I', orderedBy: 'Dr. Vikram Singh', orderedAt: '2024-01-19T14:30:00', status: 'critical', priority: 'stat', result: '2.5 ng/mL', normalRange: '<0.04 ng/mL', isCritical: true },
    { id: 'lt4', patientId: 'p5', patientName: 'Arjun Reddy', uhid: 'UHID-2024-000005', testName: 'CT Scan - Head', orderedBy: 'Dr. Sneha Patel', orderedAt: '2024-01-20T08:00:00', status: 'completed', priority: 'stat' },
    { id: 'lt5', patientId: 'p4', patientName: 'Lakshmi Devi', uhid: 'UHID-2024-000004', testName: 'X-Ray - Knee', orderedBy: 'Dr. Rahul Verma', orderedAt: '2024-01-20T10:45:00', status: 'ordered', priority: 'routine' },
];

// Sample prescriptions
export const mockPrescriptions: Prescription[] = [
    {
        id: 'rx1',
        patientId: 'p1',
        patientName: 'Rajesh Kumar',
        uhid: 'UHID-2024-000001',
        prescribedBy: 'Dr. Anil Kapoor',
        prescribedAt: '2024-01-20T09:30:00',
        status: 'pending',
        medications: [
            { name: 'Paracetamol 500mg', dosage: '500mg', frequency: 'TDS', duration: '5 days', quantity: 15 },
            { name: 'Cetirizine 10mg', dosage: '10mg', frequency: 'OD', duration: '5 days', quantity: 5 },
        ],
    },
    {
        id: 'rx2',
        patientId: 'p3',
        patientName: 'Mohammed Ali',
        uhid: 'UHID-2024-000003',
        prescribedBy: 'Dr. Vikram Singh',
        prescribedAt: '2024-01-19T15:00:00',
        status: 'dispensed',
        medications: [
            { name: 'Aspirin 75mg', dosage: '75mg', frequency: 'OD', duration: '30 days', quantity: 30, dispensed: true },
            { name: 'Atorvastatin 20mg', dosage: '20mg', frequency: 'HS', duration: '30 days', quantity: 30, dispensed: true },
            { name: 'Metoprolol 50mg', dosage: '50mg', frequency: 'BD', duration: '30 days', quantity: 60, dispensed: true },
        ],
    },
];

// Sample inventory
export const mockInventory: InventoryItem[] = [
    { id: 'inv1', name: 'Paracetamol 500mg', category: 'Medicine', sku: 'MED001', currentStock: 5000, minStock: 1000, maxStock: 10000, unit: 'tablets', batchNumber: 'BN2024001', expiryDate: '2025-06-30', supplier: 'Sun Pharma', unitPrice: 2, location: 'Pharmacy Store A' },
    { id: 'inv2', name: 'Disposable Syringes 5ml', category: 'Consumable', sku: 'CON001', currentStock: 200, minStock: 500, maxStock: 2000, unit: 'pieces', batchNumber: 'BN2024002', expiryDate: '2026-12-31', supplier: 'BD Medical', unitPrice: 8, location: 'Central Store' },
    { id: 'inv3', name: 'N95 Masks', category: 'Consumable', sku: 'CON002', currentStock: 150, minStock: 200, maxStock: 1000, unit: 'pieces', batchNumber: 'BN2024003', expiryDate: '2025-03-15', supplier: '3M Healthcare', unitPrice: 25, location: 'Central Store' },
    { id: 'inv4', name: 'Insulin Regular', category: 'Medicine', sku: 'MED002', currentStock: 80, minStock: 50, maxStock: 200, unit: 'vials', batchNumber: 'BN2024004', expiryDate: '2024-04-30', supplier: 'Novo Nordisk', unitPrice: 450, location: 'Cold Storage' },
    { id: 'inv5', name: 'Surgical Gloves (L)', category: 'Consumable', sku: 'CON003', currentStock: 800, minStock: 300, maxStock: 1500, unit: 'pairs', batchNumber: 'BN2024005', expiryDate: '2025-09-30', supplier: 'Ansell', unitPrice: 12, location: 'OT Store' },
];

// Sample nursing tasks
export const mockNursingTasks: NursingTask[] = [
    { id: 'nt1', patientId: 'p3', patientName: 'Mohammed Ali', bedNumber: 'ICU-01', task: 'Administer Heparin 5000 IU SC', type: 'medication', priority: 'high', dueAt: '2024-01-20T10:00:00', assignedTo: 'Nurse Priya', status: 'pending' },
    { id: 'nt2', patientId: 'p3', patientName: 'Mohammed Ali', bedNumber: 'ICU-01', task: 'Record vitals', type: 'vitals', priority: 'medium', dueAt: '2024-01-20T10:30:00', assignedTo: 'Nurse Priya', status: 'pending' },
    { id: 'nt3', patientId: 'p5', patientName: 'Arjun Reddy', bedNumber: 'ICU-04', task: 'Wound dressing change', type: 'procedure', priority: 'high', dueAt: '2024-01-20T11:00:00', assignedTo: 'Nurse Sunita', status: 'in-progress' },
    { id: 'nt4', patientId: 'p5', patientName: 'Arjun Reddy', bedNumber: 'ICU-04', task: 'Pain assessment', type: 'care', priority: 'medium', dueAt: '2024-01-20T09:00:00', completedAt: '2024-01-20T09:15:00', assignedTo: 'Nurse Sunita', status: 'completed' },
];

// Sample surgeries
export const mockSurgeries: Surgery[] = [
    { id: 's1', patientId: 'p4', patientName: 'Lakshmi Devi', uhid: 'UHID-2024-000004', procedure: 'Total Knee Replacement - Right', surgeon: 'Dr. Rahul Verma', anesthetist: 'Dr. Kavita Nair', otRoom: 'OT-1', scheduledDate: '2024-01-22', scheduledTime: '09:00', estimatedDuration: '3 hours', status: 'scheduled', preOpChecklistComplete: false },
    { id: 's2', patientId: 'p5', patientName: 'Arjun Reddy', uhid: 'UHID-2024-000005', procedure: 'Exploratory Laparotomy', surgeon: 'Dr. Sneha Patel', anesthetist: 'Dr. Amit Shah', otRoom: 'OT-2', scheduledDate: '2024-01-20', scheduledTime: '14:00', estimatedDuration: '2 hours', status: 'scheduled', preOpChecklistComplete: true },
];

// Sample bills
export const mockBills: Bill[] = [
    {
        id: 'bill1',
        patientId: 'p1',
        patientName: 'Rajesh Kumar',
        uhid: 'UHID-2024-000001',
        visitId: 'v1',
        items: [
            { description: 'OPD Consultation - General Medicine', category: 'consultation', quantity: 1, unitPrice: 500, total: 500 },
            { description: 'Complete Blood Count', category: 'lab', quantity: 1, unitPrice: 350, total: 350 },
            { description: 'Paracetamol 500mg x 15', category: 'medicine', quantity: 15, unitPrice: 2, total: 30 },
            { description: 'Cetirizine 10mg x 5', category: 'medicine', quantity: 5, unitPrice: 5, total: 25 },
        ],
        subtotal: 905,
        discount: 0,
        tax: 0,
        total: 905,
        status: 'pending',
    },
    {
        id: 'bill2',
        patientId: 'p3',
        patientName: 'Mohammed Ali',
        uhid: 'UHID-2024-000003',
        visitId: 'v3',
        items: [
            { description: 'ICU Bed Charges (per day)', category: 'bed', quantity: 2, unitPrice: 15000, total: 30000 },
            { description: 'Cardiology Consultation', category: 'consultation', quantity: 2, unitPrice: 1000, total: 2000 },
            { description: 'Troponin I Test', category: 'lab', quantity: 2, unitPrice: 800, total: 1600 },
            { description: 'ECG', category: 'procedure', quantity: 3, unitPrice: 300, total: 900 },
            { description: 'Cardiac Medications', category: 'medicine', quantity: 1, unitPrice: 2500, total: 2500 },
        ],
        subtotal: 37000,
        discount: 3700,
        tax: 0,
        total: 33300,
        status: 'insurance-pending',
        insuranceClaim: {
            provider: 'Star Health Insurance',
            policyNumber: 'SH123456789',
            claimAmount: 25000,
            status: 'submitted',
        },
    },
];

// Sample incidents
export const mockIncidents: Incident[] = [
    { id: 'inc1', type: 'medication-error', severity: 'medium', reportedBy: 'Nurse Priya', reportedAt: '2024-01-19T16:30:00', location: 'ICU', description: 'Wrong dosage of insulin administered. Patient monitored, no adverse effects.', status: 'investigating' },
    { id: 'inc2', type: 'fall', severity: 'high', reportedBy: 'Nurse Sunita', reportedAt: '2024-01-18T22:15:00', location: 'General Ward', description: 'Patient fell while attempting to use bathroom without assistance.', status: 'resolved', patientId: 'p7' },
    { id: 'inc3', type: 'near-miss', severity: 'low', reportedBy: 'Dr. Anil Kapoor', reportedAt: '2024-01-20T08:00:00', location: 'Pharmacy', description: 'Similar looking medication packaging nearly caused dispensing error. Caught before administration.', status: 'reported' },
];

// KPI Data for dashboards
export const kpiData = {
    bedOccupancy: 72,
    todayAdmissions: 12,
    todayDischarges: 8,
    opdVisits: 145,
    emergencyVisits: 23,
    pendingLabTests: 34,
    criticalPatients: 5,
    surgeriesToday: 4,
    pendingBills: 28,
    revenue: {
        today: 485000,
        month: 12500000,
    },
    expiringItems: 8,
    lowStockItems: 12,
    pendingInsuranceClaims: 15,
    averageWaitTime: 18, // minutes
    staffOnDuty: {
        doctors: 24,
        nurses: 48,
        support: 35,
    },
};
