import { NextResponse } from "next/server";
import { spawn } from "child_process";
import path from "path";

export async function POST(req: Request) {
    try {
        const { qrPayload } = await req.json();

        if (!qrPayload) {
            return NextResponse.json({ error: "No payload provided" }, { status: 400 });
        }

        // Execute Python script to decode
        const scriptPath = path.join(process.cwd(), "lib", "decode_aadhaar.py");

        return new Promise<NextResponse>((resolve) => {
            const pythonProcess = spawn("python3", [scriptPath]);

            let outputData = "";
            let errorData = "";

            // Send data to python script via stdin
            pythonProcess.stdin.write(qrPayload);
            pythonProcess.stdin.end();

            pythonProcess.stdout.on("data", (data) => {
                outputData += data.toString();
            });

            pythonProcess.stderr.on("data", (data) => {
                errorData += data.toString();
            });

            pythonProcess.on("close", (code) => {
                if (code !== 0) {
                    console.error("Python script error:", errorData);
                    resolve(NextResponse.json({ error: "Failed to decode Aadhaar data" }, { status: 500 }));
                    return;
                }

                try {
                    const result = JSON.parse(outputData);
                    if (result.success) {
                        // Map pyaadhaar output to our expected format
                        const data = result.data;

                        // Map Python output to frontend expected format
                        const identity = {
                            uid: data.aadhaar_masked || (data.aadhaar_last_4 ? `XXXX XXXX ${data.aadhaar_last_4}` : ""),
                            name: data.name || "",
                            dob: data.dob || "",
                            gender: data.gender || "",
                            address: data.address || "",
                            city: data.vtc || data.district || "",
                            state: data.state || "",
                            pincode: data.pincode || "",
                            // Additional fields for debugging/display
                            reference_id: data.reference_id || "",
                            care_of: data.care_of || "",
                            _raw_parts: data._raw_parts || [],
                        };

                        resolve(NextResponse.json({
                            verified: true,
                            identity
                        }));
                    } else {
                        resolve(NextResponse.json({ error: result.error || "Decoding failed" }, { status: 400 }));
                    }
                } catch (e) {
                    console.error("JSON parse error:", e, outputData);
                    resolve(NextResponse.json({ error: "Invalid response from decoder" }, { status: 500 }));
                }
            });
        });

    } catch (e: any) {
        console.error("API Error:", e);
        return NextResponse.json({ error: e.message || "Internal Server Error" }, { status: 500 });
    }
}
