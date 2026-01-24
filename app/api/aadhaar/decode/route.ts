
import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';

// POST /api/aadhaar/decode - Decode Secure QR data using Python script
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { qrPayload } = body;

        if (!qrPayload) {
            return NextResponse.json({ error: 'QR Payload required' }, { status: 400 });
        }

        // We need to determine if this is BigInt (Secure QR) or XML
        // XML can be handled in JS, but if it is Secure QR (Big Integer string), we use Python decomposer
        const isSecureQR = /^\d+$/.test(qrPayload) && qrPayload.length > 50;

        if (!isSecureQR) {
            // Let the frontend or shared lib handle simple XML/Text parsing if possible
            // But since the frontend sent it here, maybe they want unified handling.
            // For now, if we receive XML, we return it as "pre-parsed" or error
            // Actually, the frontend calls this for verification primarily.
            return NextResponse.json({
                verified: false,
                error: 'Provided data does not look like Secure QR V2 (Big Integer). Use client-side XML parser?'
            });
        }

        // Path to python script
        const scriptPath = path.join(process.cwd(), 'lib/decode_aadhaar.py');

        // Execute Python
        // We try 'python' first, as 'py' is Windows launcher specific but 'python' is more universal if in PATH
        // The user complained "py not found", so likely they have python installed but not the 'py' launcher
        // OR they might alias it as python3.

        // We'll try to find a working python command or just use 'python'
        const pythonCommand = process.platform === 'win32' ? 'python' : 'python3';

        return new Promise<Response>((resolve) => {
            const pyProcess = spawn(pythonCommand, [scriptPath, qrPayload]);

            let output = '';
            let errorOutput = '';

            pyProcess.stdout.on('data', (data) => {
                output += data.toString();
            });

            pyProcess.stderr.on('data', (data) => {
                errorOutput += data.toString();
            });

            pyProcess.on('close', (code) => {
                if (code !== 0) {
                    console.error('Python script error:', errorOutput);
                    resolve(NextResponse.json({ error: 'Decoding failed', details: errorOutput }, { status: 500 }));
                    return;
                }

                try {
                    const result = JSON.parse(output);
                    if (result.success) {
                        resolve(NextResponse.json({
                            verified: true,
                            identity: result.data
                        }));
                    } else {
                        resolve(NextResponse.json({ error: result.error || 'Unknown error' }, { status: 400 }));
                    }
                } catch (e) {
                    console.error('Failed to parse Python output:', output);
                    resolve(NextResponse.json({ error: 'Invalid response from decoder' }, { status: 500 }));
                }
            });
        });

    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
