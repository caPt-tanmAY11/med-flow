
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> } // Await the params promise in Next.js 15+ convention if needed, or normal param access
) {
    // In strict Next.js App Router, params might be a Promise or object. 
    // Adapting to common pattern:
    const { id } = await params;
    
    if (!id) {
        return NextResponse.json({ error: 'Patient ID is required' }, { status: 400 });
    }

    try {
        // 1. Fetch Encounters with related details
        const encounters = await prisma.encounter.findMany({
            where: { patientId: id },
            orderBy: { arrivalTime: 'desc' },
            include: {
                clinicalNotes: {
                    orderBy: { createdAt: 'desc' },
                    select: {
                        id: true,
                        noteType: true,
                        content: true,
                        authorRole: true,
                        createdAt: true
                    }
                },
                prescriptions: {
                    include: {
                        medications: true
                    }
                },
                diagnoses: true,
                surgeries: true
            }
        });

        // 2. Fetch Vitals History
        const vitals = await prisma.vitalSign.findMany({
            where: { patientId: id },
            orderBy: { recordedAt: 'asc' }, // Ascending for graph
            select: {
                recordedAt: true,
                bpSystolic: true,
                bpDiastolic: true,
                pulse: true,
                temperature: true
            }
        });

        // 3. Transform to Timeline Events
        // We want a unified list of events. 
        // For now, we'll map Encounters to events, and maybe treat specific notes as sub-details?
        // Let's stick to the 'MedicalHistoryEvent' structure expected by frontend:
        /*
         interface MedicalHistoryEvent {
            id: string;
            date: string;
            type: 'OPD' | 'IPD' | 'EMERGENCY' | 'SURGERY';
            title: string;
            doctor: string;
            department: string;
            diagnosis?: string;
            notes: string;
            documents?: string[];
        }
        */

        const timelineEvents = encounters.map(enc => {
            // Determine primary diagnosis
            const diagnosis = enc.diagnoses.find(d => d.isPrimary)?.description 
                || enc.clinicalNotes.find(n => n.noteType === 'diagnosis')?.content
                || enc.clinicalNotes.find(n => n.noteType === 'chief-complaint')?.content;

            // Collect documents (mocking from prescriptions/notes for now)
            const documents: string[] = [];
            if (enc.prescriptions.length > 0) documents.push(`Prescription-${enc.id.substring(0,4)}`);
            if (enc.type === 'IPD' && enc.status === 'DISCHARGED') documents.push('Discharge_Summary.pdf');
            if (enc.surgeries.length > 0) documents.push('Surgery_Report.pdf');

            // Find general note
            const summaryNote = enc.clinicalNotes.find(n => n.noteType === 'progress' || n.noteType === 'history')?.content 
                || (enc.status === 'DISCHARGED' ? 'Patient discharged.' : 'No notes available.');

            let doctorName = 'Dr. Staff'; // Default
            // In a real app we'd fetch doctor name via relation, assuming primaryDoctorId is stored but we might not have a direct relation loaded above.
            // For this quick implementation, we'll use a placeholder or check if we can fetch it. 
            // The schema has primaryDoctorId (String?), but no relation to a User/Staff model in Encounter? 
            // checking schema... encounter.primaryDoctorId is just a string. 
            // We can leave it as ID or generic for now, currently frontend expects a string.
            doctorName = enc.primaryDoctorId || 'Unknown Doctor';

            return {
                id: enc.id,
                date: enc.arrivalTime.toISOString(),
                type: enc.type, // types match (OPD, IPD, EMERGENCY). If Surgery exists, maybe override?
                title: `${enc.type} Visit - ${enc.department || 'General'}`,
                doctor: doctorName,
                department: enc.department || 'General',
                diagnosis: diagnosis,
                notes: summaryNote,
                documents: documents.length > 0 ? documents : undefined
            };
        });
        
        // Transform Vitals for Graph
        // Expected: { date: '10/12', systolic: 130, diastolic: 85, heartRate: 78, temp: 37.2 }
        const vitalsHistory = vitals.map(v => ({
            date: new Date(v.recordedAt).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit' }),
            systolic: v.bpSystolic,
            diastolic: v.bpDiastolic,
            heartRate: v.pulse,
            temp: v.temperature
        })).filter(v => v.systolic || v.temp); // Filter empty ones

        return NextResponse.json({
            timeline: timelineEvents,
            vitals: vitalsHistory
        });

    } catch (error) {
        console.error('Error fetching EMR:', error);
        return NextResponse.json({ error: 'Failed to fetch EMR data' }, { status: 500 });
    }
}
