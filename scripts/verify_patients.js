const BASE_URL = 'http://localhost:3000/api/patients';

async function verify() {
    console.log('Starting verification...');

    // 1. Create a temporary patient
    console.log('\n1. Creating temporary patient...');
    const createRes = await fetch(BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: 'Test Patient',
            dob: '1990-01-01',
            gender: 'MALE',
            contact: '9999999999',
            isTemporary: true,
            bloodGroup: 'O+',
        }),
    });
    const createData = await createRes.json();
    if (!createRes.ok) {
        console.error('Failed to create patient:', createData);
        return;
    }
    const patientId = createData.data.id;
    console.log('Created patient:', patientId);

    // 2. Verify filtering (Temporary)
    console.log('\n2. Verifying filter (type=temporary)...');
    const tempRes = await fetch(`${BASE_URL}?type=temporary&query=Test Patient`);
    const tempData = await tempRes.json();
    console.log('Temp Data Response:', JSON.stringify(tempData, null, 2));
    const foundTemp = tempData.data?.find((p) => p.id === patientId);
    console.log('Found in temporary list:', !!foundTemp);

    // 3. Verify filtering (Permanent - should NOT find)
    console.log('\n3. Verifying filter (type=permanent)...');
    const permRes = await fetch(`${BASE_URL}?type=permanent&query=Test Patient`);
    const permData = await permRes.json();
    const foundPerm = permData.data.find((p) => p.id === patientId);
    console.log('Found in permanent list (should be false):', !!foundPerm);

    // 4. Verify filtering (Blood Group)
    console.log('\n4. Verifying filter (bloodGroup=O+)...');
    const bloodRes = await fetch(`${BASE_URL}?bloodGroup=O%2B&query=Test Patient`);
    const bloodData = await bloodRes.json();
    console.log('Blood Data Response:', JSON.stringify(bloodData, null, 2));
    const foundBlood = bloodData.data.find((p) => p.id === patientId);
    console.log('Found in O+ list:', !!foundBlood);

    // 5. Delete patient
    console.log('\n5. Deleting patient...');
    const deleteRes = await fetch(`${BASE_URL}/${patientId}`, {
        method: 'DELETE',
    });
    const deleteData = await deleteRes.json();
    console.log('Delete response:', deleteData);

    // 6. Verify deletion (should not be found in list)
    console.log('\n6. Verifying deletion...');
    const verifyRes = await fetch(`${BASE_URL}?query=Test Patient`);
    const verifyData = await verifyRes.json();
    const foundDeleted = verifyData.data.find((p) => p.id === patientId);
    console.log('Found in list after delete (should be false):', !!foundDeleted);

    console.log('\nVerification complete.');
}

verify().catch(console.error);
