import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { QrCode } from 'lucide-react';

interface PatientQRCodeProps {
    uhid: string;
    name: string;
}

const PatientQRCode: React.FC<PatientQRCodeProps> = ({ uhid, name }) => {
    const qrData = JSON.stringify({
        uhid,
        name,
        type: 'PATIENT_ID'
    });

    return (
        <Card className="bg-white/90 shadow-sm border-sidebar-border/50 overflow-hidden">
            <CardHeader className="p-3 pb-2 flex flex-row items-center gap-2 space-y-0">
                <div className="p-1.5 bg-primary/10 rounded-md">
                    <QrCode className="w-4 h-4 text-primary" />
                </div>
                <CardTitle className="text-sm font-medium text-sidebar-foreground">My ID</CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 flex flex-col items-center gap-2">
                <div className="bg-white p-2 rounded-lg border border-border/50 shadow-inner">
                    <QRCodeSVG
                        value={qrData}
                        size={120}
                        level="H"
                        includeMargin={false}
                        className="w-full h-auto"
                    />
                </div>
                <div className="text-center w-full">
                    <p className="text-xs font-mono font-medium text-sidebar-foreground/80 break-all">
                        {uhid}
                    </p>
                    <p className="text-[10px] text-sidebar-foreground/60 truncate max-w-[140px] mx-auto">
                        {name}
                    </p>
                </div>
            </CardContent>
        </Card>
    );
};

export default PatientQRCode;
