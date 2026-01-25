"use client";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface PrescriptionData {
    prescription: {
        id: string;
        createdAt: string;
        prescribedBy: string;
        status: string;
    };
    patient: {
        name: string;
        uhid: string;
        gender: string;
        dob: string;
        contact: string;
    };
    encounter: {
        type: string;
        department: string;
        createdAt: string;
    };
    medications: Array<{
        name: string;
        dosage: string;
        frequency: string;
        route: string;
        duration: string;
        instructions: string | null;
    }>;
}

export function generatePrescriptionPDF(data: PrescriptionData): void {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("MED-FLOW HOSPITAL", pageWidth / 2, 20, { align: "center" });

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Healthcare Management System", pageWidth / 2, 26, { align: "center" });

    // Line separator
    doc.setLineWidth(0.5);
    doc.line(14, 30, pageWidth - 14, 30);

    // Prescription Title
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("PRESCRIPTION", pageWidth / 2, 40, { align: "center" });

    // Patient Information
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const patientAge = data.patient.dob
        ? new Date().getFullYear() - new Date(data.patient.dob).getFullYear()
        : "N/A";

    let yPos = 50;

    doc.setFont("helvetica", "bold");
    doc.text("Patient Details:", 14, yPos);
    doc.setFont("helvetica", "normal");
    yPos += 6;

    doc.text(`Name: ${data.patient.name}`, 14, yPos);
    doc.text(`UHID: ${data.patient.uhid}`, pageWidth / 2, yPos);
    yPos += 5;

    doc.text(`Age/Gender: ${patientAge} years / ${data.patient.gender}`, 14, yPos);
    doc.text(`Contact: ${data.patient.contact || "N/A"}`, pageWidth / 2, yPos);
    yPos += 5;

    doc.text(`Visit Type: ${data.encounter.type}`, 14, yPos);
    doc.text(`Department: ${data.encounter.department || "General"}`, pageWidth / 2, yPos);
    yPos += 5;

    doc.text(`Date: ${new Date(data.prescription.createdAt).toLocaleDateString("en-IN")}`, 14, yPos);
    doc.text(`Prescribed By: Dr. ${data.prescription.prescribedBy}`, pageWidth / 2, yPos);
    yPos += 10;

    // Line separator
    doc.setLineWidth(0.3);
    doc.line(14, yPos, pageWidth - 14, yPos);
    yPos += 8;

    // Rx Symbol
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.text("Rx", 14, yPos + 5);
    yPos += 10;

    // Medications Table
    const tableData = data.medications.map((med, index) => [
        (index + 1).toString(),
        med.name,
        med.dosage,
        med.frequency,
        med.route,
        med.duration,
        med.instructions || "-"
    ]);

    autoTable(doc, {
        startY: yPos,
        head: [["#", "Medicine", "Dosage", "Frequency", "Route", "Duration", "Instructions"]],
        body: tableData,
        theme: "grid",
        headStyles: {
            fillColor: [66, 139, 202],
            textColor: 255,
            fontSize: 9,
            fontStyle: "bold"
        },
        bodyStyles: {
            fontSize: 9
        },
        columnStyles: {
            0: { cellWidth: 10 },
            1: { cellWidth: 35 },
            2: { cellWidth: 20 },
            3: { cellWidth: 25 },
            4: { cellWidth: 20 },
            5: { cellWidth: 25 },
            6: { cellWidth: 40 }
        },
        margin: { left: 14, right: 14 }
    });

    // Footer
    const finalY = (doc as any).lastAutoTable.finalY + 20;

    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.text("This is a computer-generated prescription.", pageWidth / 2, finalY, { align: "center" });
    doc.text("Please consult your pharmacist for any queries.", pageWidth / 2, finalY + 4, { align: "center" });

    // Signature line
    doc.setLineWidth(0.3);
    doc.line(pageWidth - 60, finalY + 15, pageWidth - 14, finalY + 15);
    doc.setFont("helvetica", "normal");
    doc.text("Doctor's Signature", pageWidth - 37, finalY + 20, { align: "center" });

    // Save the PDF
    const fileName = `Prescription_${data.patient.uhid}_${new Date().toISOString().split("T")[0]}.pdf`;
    doc.save(fileName);
}

export async function downloadPrescriptionPDF(prescriptionId: string): Promise<boolean> {
    try {
        const response = await fetch(`/api/prescriptions/${prescriptionId}`);
        if (!response.ok) {
            throw new Error("Failed to fetch prescription data");
        }

        const data: PrescriptionData = await response.json();
        generatePrescriptionPDF(data);
        return true;
    } catch (error) {
        console.error("Error generating PDF:", error);
        return false;
    }
}
