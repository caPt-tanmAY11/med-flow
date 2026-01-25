"use client";

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Camera, Upload, X, Loader2, QrCode, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AadhaarQRData } from '@/lib/aadhaar-qr';
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';

interface QRScannerProps {
    onScan: (data: AadhaarQRData) => void;
    onClose: () => void;
}

export default function QRScanner({ onScan, onClose }: QRScannerProps) {
    const [mode, setMode] = useState<'select' | 'scanning' | 'processing'>('select');
    const [error, setError] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const controlsRef = useRef<any>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setMounted(true);
        return () => {
            stopScanner();
        };
    }, []);

    const startScanner = async () => {
        setError(null);
        setMode('scanning');

        try {
            const codeReader = new BrowserMultiFormatReader();

            // Use native API to list devices
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoInputDevices = devices.filter(device => device.kind === 'videoinput');

            // Select back camera if available
            const selectedDeviceId = videoInputDevices.find((device: MediaDeviceInfo) => device.label.toLowerCase().includes('back'))?.deviceId
                || videoInputDevices[0].deviceId;

            const controls = await codeReader.decodeFromVideoDevice(
                selectedDeviceId,
                videoRef.current!,
                (result, err) => {
                    if (result) {
                        handleQRData(result.getText());
                        // Stop scanning after successful decode
                        if (controlsRef.current) {
                            controlsRef.current.stop();
                        }
                    }
                }
            );
            controlsRef.current = controls;
        } catch (err) {
            console.error('Scanner error:', err);
            setError('Camera access denied or not available. Please try uploading an image.');
            setMode('select');
        }
    };

    const stopScanner = () => {
        if (controlsRef.current) {
            controlsRef.current.stop();
            controlsRef.current = null;
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setError(null);
        setMode('processing');

        try {
            // Create an image element
            const img = document.createElement('img');
            const objectUrl = URL.createObjectURL(file);
            img.src = objectUrl;

            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
            });

            // Try multiple decode strategies
            let result = null;
            const codeReader = new BrowserMultiFormatReader();

            // Strategy 1: Direct decode
            try {
                result = await codeReader.decodeFromImageElement(img);
            } catch (e) {
                console.log('Direct decode failed, trying preprocessed...');
            }

            // Strategy 2: Preprocessed with enhanced contrast
            if (!result) {
                try {
                    const processedImg = await preprocessImage(img, 'enhance');
                    result = await codeReader.decodeFromImageElement(processedImg);
                } catch (e) {
                    console.log('Enhanced decode failed, trying grayscale...');
                }
            }

            // Strategy 3: Grayscale with higher contrast
            if (!result) {
                try {
                    const processedImg = await preprocessImage(img, 'grayscale');
                    result = await codeReader.decodeFromImageElement(processedImg);
                } catch (e) {
                    console.log('Grayscale decode failed, trying scaled...');
                }
            }

            // Strategy 4: Scale up small images
            if (!result) {
                try {
                    const processedImg = await preprocessImage(img, 'scale');
                    result = await codeReader.decodeFromImageElement(processedImg);
                } catch (e) {
                    console.log('Scaled decode failed');
                }
            }

            // Clean up
            URL.revokeObjectURL(objectUrl);

            if (result) {
                handleQRData(result.getText());
            } else {
                throw new NotFoundException('Could not detect QR code after multiple attempts');
            }
        } catch (err) {
            console.error('File scan error:', err);
            if (err instanceof NotFoundException) {
                setError('Could not detect QR code. Try cropping to show only the QR code, or take a clearer photo.');
            } else {
                setError('Failed to process image. Please try again.');
            }
            setMode('select');
        }
    };

    // Preprocess image for better QR detection
    const preprocessImage = (img: HTMLImageElement, mode: 'enhance' | 'grayscale' | 'scale'): Promise<HTMLImageElement> => {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d')!;

            // Determine target size
            let targetWidth = img.naturalWidth;
            let targetHeight = img.naturalHeight;

            if (mode === 'scale' && (img.naturalWidth < 600 || img.naturalHeight < 600)) {
                // Scale up small images
                const scale = Math.max(600 / img.naturalWidth, 600 / img.naturalHeight);
                targetWidth = Math.round(img.naturalWidth * scale);
                targetHeight = Math.round(img.naturalHeight * scale);
            } else if (img.naturalWidth > 2000 || img.naturalHeight > 2000) {
                // Scale down very large images
                const scale = Math.min(2000 / img.naturalWidth, 2000 / img.naturalHeight);
                targetWidth = Math.round(img.naturalWidth * scale);
                targetHeight = Math.round(img.naturalHeight * scale);
            }

            canvas.width = targetWidth;
            canvas.height = targetHeight;

            // Draw base image
            ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

            if (mode === 'enhance' || mode === 'grayscale') {
                // Get image data for processing
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = imageData.data;

                for (let i = 0; i < data.length; i += 4) {
                    if (mode === 'grayscale') {
                        // Convert to grayscale
                        const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
                        data[i] = data[i + 1] = data[i + 2] = gray;
                    }

                    // Increase contrast
                    const factor = 1.5; // Contrast factor
                    data[i] = Math.min(255, Math.max(0, factor * (data[i] - 128) + 128));
                    data[i + 1] = Math.min(255, Math.max(0, factor * (data[i + 1] - 128) + 128));
                    data[i + 2] = Math.min(255, Math.max(0, factor * (data[i + 2] - 128) + 128));
                }

                ctx.putImageData(imageData, 0, 0);
            }

            // Create new image from canvas
            const processedImg = document.createElement('img');
            processedImg.onload = () => resolve(processedImg);
            processedImg.src = canvas.toDataURL('image/png');
        });
    };

    const handleQRData = async (qrText: string) => {
        setMode('processing');

        try {
            // Call backend API for verification and decoding
            const response = await fetch('/api/aadhaar/decode', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ qrPayload: qrText }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to verify QR code');
            }

            if (result.verified && result.identity) {
                // Map API response to AadhaarQRData structure
                const data: AadhaarQRData = {
                    uid: result.identity.uid,
                    name: result.identity.name,
                    dob: result.identity.dob,
                    gender: (result.identity.gender === 'M' || result.identity.gender === 'MALE') ? 'MALE' :
                        (result.identity.gender === 'F' || result.identity.gender === 'FEMALE') ? 'FEMALE' : 'OTHER',
                    address: result.identity.address,
                    city: result.identity.city,
                    state: result.identity.state,
                    pincode: result.identity.pincode,
                    yob: '', // Derived from DOB usually
                    isSecureQR: true,
                    rawData: qrText
                };
                onScan(data);
            } else {
                throw new Error('QR code verification failed');
            }
        } catch (err: any) {
            console.error('Verification error:', err);
            setError(err.message || 'Failed to verify Aadhaar QR');
            setMode('select');
        }
    };

    const handleClose = () => {
        stopScanner();
        onClose();
    };

    if (!mounted) return null;

    return createPortal(
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-200">
            <div className="bg-background rounded-xl max-w-lg w-full overflow-hidden shadow-2xl scale-100 animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b">
                    <div className="flex items-center gap-2">
                        <QrCode className="w-5 h-5 text-primary" />
                        <h2 className="text-lg font-semibold">Scan Aadhaar QR Code</h2>
                    </div>
                    <Button variant="ghost" size="sm" onClick={handleClose}>
                        <X className="w-4 h-4" />
                    </Button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            <span className="text-sm">{error}</span>
                        </div>
                    )}

                    {mode === 'select' && (
                        <div className="space-y-4">
                            <p className="text-center text-muted-foreground mb-6">
                                Scan the QR code on the back of the Aadhaar card to auto-fill registration details
                            </p>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={startScanner}
                                    className="p-6 border-2 border-dashed rounded-xl hover:border-primary hover:bg-primary/5 transition-colors flex flex-col items-center gap-3"
                                >
                                    <Camera className="w-10 h-10 text-primary" />
                                    <span className="font-medium">Use Camera</span>
                                    <span className="text-xs text-muted-foreground">Point at QR code</span>
                                </button>
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="p-6 border-2 border-dashed rounded-xl hover:border-primary hover:bg-primary/5 transition-colors flex flex-col items-center gap-3"
                                >
                                    <Upload className="w-10 h-10 text-primary" />
                                    <span className="font-medium">Upload Image</span>
                                    <span className="text-xs text-muted-foreground">JPG, PNG</span>
                                </button>
                            </div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleFileUpload}
                                className="hidden"
                            />
                        </div>
                    )}

                    {mode === 'scanning' && (
                        <div className="space-y-4">
                            <div className="relative w-full aspect-square bg-black rounded-lg overflow-hidden">
                                <video
                                    ref={videoRef}
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 pointer-events-none border-2 border-white/50 m-8 rounded-lg"></div>
                            </div>
                            <p className="text-center text-sm text-muted-foreground">
                                Position the QR code within the frame
                            </p>
                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={() => { stopScanner(); setMode('select'); }}
                            >
                                Cancel
                            </Button>
                        </div>
                    )}

                    {mode === 'processing' && (
                        <div className="py-12 text-center space-y-4">
                            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
                            <div>
                                <p className="font-medium">Verifying & Decoding...</p>
                                <p className="text-sm text-muted-foreground">Checking digital signature</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer hint */}
                <div className="px-6 pb-4">
                    <p className="text-xs text-muted-foreground text-center">
                        📱 The QR code is on the back of the Aadhaar card, near the photo
                    </p>
                </div>
            </div>
        </div>,
        document.body
    );
}
