
export const patientVitals = {
    spo2: 98,
    heartRate: 72,
    bloodPressure: { systolic: 120, diastolic: 80 },
    temperature: 98.6,
    respiratoryRate: 16,
    lastUpdated: new Date().toISOString()
};

export const medicalClassification = {
    triageLevel: "Level 3 - Urgent",
    severity: "Moderate",
    condition: "Stable",
    admissionType: "Elective"
};

export const currentMedications = [
    { name: "Amoxicillin", dosage: "500mg", frequency: "3x daily", type: "Antibiotic" },
    { name: "Paracetamol", dosage: "650mg", frequency: "SOS", type: "Analgesic" },
    { name: "Vitamin D3", dosage: "60000 IU", frequency: "Weekly", type: "Supplement" }
];

export const patientHistory = {
    parental: [
        { relation: "Father", condition: "Hypertension", status: "Managed" },
        { relation: "Mother", condition: "Type 2 Diabetes", status: "Managed" }
    ],
    smoking: { status: "Former Smoker", quitDate: "2018-05-20", packsPerYear: 5 },
    alcohol: { status: "Social Drinker", frequency: "Occasional" },
    lifestyle: {
        exercise: "Moderate (3x week)",
        diet: "Balanced, Low Sodium",
        sleep: "7 hours avg"
    },
    employment: "Software Engineer (Desk Job)",
    surgeries: [
        { procedure: "Appendectomy", date: "2015-08-12", hospital: "City General", outcome: "Successful" },
        { procedure: "ACL Repair", date: "2020-03-10", hospital: "Sports Med Clinic", outcome: "Successful" }
    ]
};

export const nursingNotes = [
    {
        date: "2024-05-20T08:00:00",
        author: "Sarah Nurse, RN",
        note: "Patient reports feeling well. Vital signs stable. No complaints of pain. Appetite good."
    },
    {
        date: "2024-05-19T20:00:00",
        author: "Mike Nurse, RN",
        note: "Evening rounds completed. Patient resting comfortably. Medications administered as prescribed."
    },
    {
        date: "2024-05-19T12:00:00",
        author: "Sarah Nurse, RN",
        note: "Observed patient walking in hallway. Gait steady. Encouraged fluid intake."
    }
];

// Historical data for charts (last 24 hours format roughly)
export const vitalHistoryData = [
    { time: '08:00', heartRate: 72, spo2: 98, sys: 118, dia: 78, temp: 98.4 },
    { time: '12:00', heartRate: 75, spo2: 97, sys: 122, dia: 82, temp: 98.6 },
    { time: '16:00', heartRate: 78, spo2: 98, sys: 120, dia: 80, temp: 98.7 },
    { time: '20:00', heartRate: 70, spo2: 99, sys: 115, dia: 75, temp: 98.5 },
    { time: '00:00', heartRate: 68, spo2: 97, sys: 110, dia: 70, temp: 98.3 },
    { time: '04:00', heartRate: 65, spo2: 96, sys: 108, dia: 68, temp: 98.2 },
    { time: '08:00', heartRate: 71, spo2: 98, sys: 119, dia: 79, temp: 98.5 },
];
