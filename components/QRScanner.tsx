"use client";

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Camera, Upload, X, Loader2, QrCode, AlertCircle, ScanLine, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AadhaarQRData } from '@/lib/aadhaar-qr';
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';
import { cn } from '@/lib/utils';

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
                <div className="flex items-center justify-between p-6 border-b border-white/10 bg-gradient-to-r from-muted/50 to-transparent">
                    <div className="flex items-center gap-4">
                        <div className="p-2.5 bg-primary/15 rounded-xl ring-1 ring-primary/20 shadow-inner">
                            <QrCode className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold tracking-tight">Scan Aadhaar</h2>
                            <p className="text-xs text-muted-foreground font-medium">Secure QR verification</p>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleClose}
                        className="rounded-full h-10 w-10 hover:bg-destructive/10 hover:text-destructive transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </Button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {error && (
                        <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-2xl flex items-start gap-3 text-destructive animate-in slide-in-from-top-2 shadow-sm">
                            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                            <div className="text-sm font-medium leading-relaxed">{error}</div>
                        </div>
                    )}

                    {mode === 'select' && (
                        <div className="space-y-8 py-2">
                            <div className="text-center space-y-2">
                                <h3 className="font-semibold text-lg">Choose Input Method</h3>
                                <p className="text-sm text-muted-foreground max-w-[260px] mx-auto leading-relaxed">
                                    Scan the secure QR code found on the back of the Aadhaar card
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-5">
                                <button
                                    onClick={startScanner}
                                    className="group relative p-6 border rounded-3xl hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 flex flex-col items-center gap-4 text-center shadow-sm hover:shadow-md"
                                >
                                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-inner">
                                        <Camera className="w-8 h-8 text-primary" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <span className="font-bold block tracking-tight">Camera</span>
                                        <span className="text-xs text-muted-foreground font-medium">Scan directly</span>
                                    </div>
                                </button>

                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="group relative p-6 border rounded-3xl hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 flex flex-col items-center gap-4 text-center shadow-sm hover:shadow-md"
                                >
                                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-inner">
                                        <Upload className="w-8 h-8 text-primary" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <span className="font-bold block tracking-tight">Upload</span>
                                        <span className="text-xs text-muted-foreground font-medium">From gallery</span>
                                    </div>
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
                        <div className="space-y-6">
                            <div className="relative w-full aspect-square bg-black rounded-3xl overflow-hidden shadow-2xl ring-4 ring-black/5">
                                <video
                                    ref={videoRef}
                                    className="w-full h-full object-cover opacity-90"
                                />
                                {/* Scanning Overlay */}
                                <div className="absolute inset-0 pointer-events-none">
                                    {/* Darken outer area to focus center */}
                                    <div className="absolute inset-0 border-[40px] border-black/40 rounded-3xl backdrop-blur-[2px]"></div>

                                    {/* Corners */}
                                    <div className="absolute top-10 left-10 w-16 h-16 border-l-4 border-t-4 border-primary rounded-tl-2xl shadow-[0_0_15px_rgba(var(--primary),0.5)]"></div>
                                    <div className="absolute top-10 right-10 w-16 h-16 border-r-4 border-t-4 border-primary rounded-tr-2xl shadow-[0_0_15px_rgba(var(--primary),0.5)]"></div>
                                    <div className="absolute bottom-10 left-10 w-16 h-16 border-l-4 border-b-4 border-primary rounded-bl-2xl shadow-[0_0_15px_rgba(var(--primary),0.5)]"></div>
                                    <div className="absolute bottom-10 right-10 w-16 h-16 border-r-4 border-b-4 border-primary rounded-br-2xl shadow-[0_0_15px_rgba(var(--primary),0.5)]"></div>

                                    {/* Scanning Line */}
                                    <div className="absolute top-10 left-10 right-10 h-0.5 bg-primary shadow-[0_0_20px_rgba(var(--primary),0.8)] animate-[scan_2s_ease-in-out_infinite]"></div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between gap-4 px-2">
                                <p className="text-sm font-medium text-muted-foreground animate-pulse flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-primary"></span>
                                    Align QR code within frame...
                                </p>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => { stopScanner(); setMode('select'); }}
                                    className="rounded-full px-6 font-medium"
                                >
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    )}

                    {mode === 'processing' && (
                        <div className="py-20 text-center space-y-8">
                            <div className="relative mx-auto w-24 h-24">
                                <div className="absolute inset-0 rounded-full border-[6px] border-primary/10"></div>
                                <div className="absolute inset-0 rounded-full border-[6px] border-primary border-t-transparent animate-spin"></div>
                                <ScanLine className="absolute inset-0 m-auto w-10 h-10 text-primary animate-pulse" />
                            </div>
                            <div className="space-y-3">
                                <h3 className="text-2xl font-bold tracking-tight">Verifying Details</h3>
                                <p className="text-sm text-muted-foreground max-w-[240px] mx-auto leading-relaxed">
                                    Decoding secure Aadhaar signature and extracting demographics...
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
}
