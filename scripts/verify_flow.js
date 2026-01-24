const BASE_URL = 'http://localhost:3000/api';

async function verify() {
    console.log('Starting Intake Flow Verification...');

    // 1. Register Patient & Create Encounter
    console.log('\n1. Registering Patient (OPD)...');
    const patientRes = await fetch(`${BASE_URL}/patients`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: 'Flow Test Patient',
            dob: '1995-05-05',
            gender: 'FEMALE',
            contact: '9876543210',
            visitType: 'OPD',
            department: 'Orthopedics',
            priority: 'GREEN'
        }),
    });
    const patientData = await patientRes.json();

    if (!patientRes.ok) {
        console.error('Registration failed:', patientData);
        return;
    }
    console.log('Patient Registered:', patientData.data.id);

    // Note: The frontend makes two calls (patients -> encounters). 
    // The backend patient creation doesn't automatically create an encounter yet (that logic is in the frontend).
    // So for this script to simulate the frontend, we need to make the encounter call manually too.

    console.log('\n2. Creating Encounter (Simulating Frontend)...');
    const encounterRes = await fetch(`${BASE_URL}/encounters`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            patientId: patientData.data.id,
            type: 'OPD',
            department: 'Orthopedics',
            triageColor: 'GREEN'
        }),
    });
    const encounterData = await encounterRes.json();

    if (!encounterRes.ok) {
        console.error('Encounter creation failed:', encounterData);
        return;
    }
    console.log('Encounter Created:', encounterData.data.id);

    // 3. Verify OPD Queue
    console.log('\n3. Verifying OPD Queue...');
    const queueRes = await fetch(`${BASE_URL}/encounters?type=OPD&status=ACTIVE`);
    const queueData = await queueRes.json();

    const found = queueData.data.find(e => e.id === encounterData.data.id);
    console.log('Found in OPD Queue:', !!found);
    if (found) {
        console.log('Queue Details:', {
            patient: found.patient.name,
            department: found.department,
            status: found.status
        });
    }

    console.log('\nVerification Complete.');
}

verify().catch(console.error);
