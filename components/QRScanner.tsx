"use client";

import { useState, useEffect, useRef } from 'react';
import { Camera, Upload, X, Loader2, QrCode, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { parseAadhaarQR, AadhaarQRData } from '@/lib/aadhaar-qr';
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';

interface QRScannerProps {
    onScan: (data: AadhaarQRData) => void;
    onClose: () => void;
}

export default function QRScanner({ onScan, onClose }: QRScannerProps) {
    const [mode, setMode] = useState<'select' | 'scanning' | 'processing'>('select');
    const [error, setError] = useState<string | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const controlsRef = useRef<any>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

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
            const codeReader = new BrowserMultiFormatReader();
            // Create an image element to decode
            const img = document.createElement('img');
            img.src = URL.createObjectURL(file);

            await new Promise((resolve) => { img.onload = resolve; });

            const result = await codeReader.decodeFromImageElement(img);
            handleQRData(result.getText());
        } catch (err) {
            console.error('File scan error:', err);
            if (err instanceof NotFoundException) {
                setError('Could not detect QR code. Please ensure the image is clear and the QR code is fully visible.');
            } else {
                setError('Failed to process image. Please try again.');
            }
            setMode('select');
        }
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

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopScanner();
        };
    }, []);

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-background rounded-xl max-w-lg w-full overflow-hidden">
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
        </div>
    );
}
