import { NextResponse } from "next/server";
import { spawn } from "child_process";
import path from "path";

/**
 * POST /api/ocr
 * 
 * Extracts text from image using PaddleOCR (Python)
 * Better accuracy for handwriting recognition than Tesseract.js
 * 
 * Request body: { image: "base64 encoded image data" }
 * Response: { success: true, text: "extracted text", confidence: 85.5 }
 */
export async function POST(req: Request): Promise<Response> {
    try {
        const { image } = await req.json();

        if (!image) {
            return NextResponse.json({ success: false, error: "No image provided" }, { status: 400 });
        }

        // Path to Python OCR script
        const scriptPath = path.join(process.cwd(), "lib", "ocr_handwriting.py");
        // Use virtual environment Python if available, fallback to system python3
        const venvPython = path.join(process.cwd(), "venv", "bin", "python3");
        const pythonCmd = venvPython; // Using venv python for PaddleOCR

        const result = await new Promise<Response>((resolve) => {
            const pythonProcess = spawn(pythonCmd, [scriptPath]);

            let outputData = "";
            let errorData = "";

            // Send base64 image data to python script via stdin
            pythonProcess.stdin.write(image);
            pythonProcess.stdin.end();

            pythonProcess.stdout.on("data", (data) => {
                outputData += data.toString();
            });

            pythonProcess.stderr.on("data", (data) => {
                errorData += data.toString();
            });

            pythonProcess.on("close", (code) => {
                if (code !== 0 || !outputData) {
                    console.error("Python OCR script error:", errorData);
                    resolve(NextResponse.json({
                        success: false,
                        error: "OCR extraction failed. Make sure PaddleOCR is installed.",
                        details: errorData
                    }, { status: 500 }));
                    return;
                }

                try {
                    const result = JSON.parse(outputData);
                    resolve(NextResponse.json(result));
                } catch (e) {
                    console.error("JSON parse error:", e, outputData);
                    resolve(NextResponse.json({
                        success: false,
                        error: "Invalid response from OCR script"
                    }, { status: 500 }));
                }
            });

            // Handle process errors
            pythonProcess.on("error", (err) => {
                console.error("Failed to start Python process:", err);
                resolve(NextResponse.json({
                    success: false,
                    error: "Failed to start OCR process. Is Python3 installed?"
                }, { status: 500 }));
            });
        });

        return result;

    } catch (e: unknown) {
        console.error("API Error:", e);
        const errorMessage = e instanceof Error ? e.message : "Internal Server Error";
        return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
    }
}
