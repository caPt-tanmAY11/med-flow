"use client";

import { useState, useRef, useCallback } from 'react';
import { Camera, Upload, X, Loader2, RotateCcw, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { extractDataFromIdCard, ExtractedData } from '@/lib/ocr';

interface IdCardCaptureProps {
    onExtract: (data: ExtractedData) => void;
    onClose: () => void;
}

export default function IdCardCapture({ onExtract, onClose }: IdCardCaptureProps) {
    const [mode, setMode] = useState<'select' | 'camera' | 'preview' | 'processing'>('select');
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const startCamera = useCallback(async () => {
        try {
            setError(null);
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } }
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
            setMode('camera');
        } catch (err) {
            setError('Camera access denied. Please allow camera access or upload an image.');
            console.error('Camera error:', err);
        }
    }, []);

    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
    }, []);

    const capturePhoto = useCallback(() => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(video, 0, 0);
                const imageData = canvas.toDataURL('image/jpeg', 0.9);
                setCapturedImage(imageData);
                stopCamera();
                setMode('preview');
            }
        }
    }, [stopCamera]);

    const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setCapturedImage(event.target?.result as string);
                setMode('preview');
            };
            reader.readAsDataURL(file);
        }
    }, []);

    const retake = useCallback(() => {
        setCapturedImage(null);
        setError(null);
        setProgress(0);
        setMode('select');
    }, []);

    const processImage = useCallback(async () => {
        if (!capturedImage) return;

        setMode('processing');
        setProgress(0);
        setError(null);

        try {
            const data = await extractDataFromIdCard(capturedImage, setProgress);

            if (data.confidence < 30) {
                setError('Low quality scan. Please try again with a clearer image.');
                setMode('preview');
                return;
            }

            if (!data.name && !data.dob && !data.gender) {
                setError('Could not extract data. Please ensure the ID card is clearly visible.');
                setMode('preview');
                return;
            }

            onExtract(data);
        } catch (err) {
            console.error('OCR error:', err);
            setError('Failed to process image. Please try again.');
            setMode('preview');
        }
    }, [capturedImage, onExtract]);

    const handleClose = useCallback(() => {
        stopCamera();
        onClose();
    }, [stopCamera, onClose]);

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-background rounded-xl max-w-2xl w-full overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b">
                    <h2 className="text-lg font-semibold">Scan ID Card (Aadhaar)</h2>
                    <Button variant="ghost" size="sm" onClick={handleClose}>
                        <X className="w-4 h-4" />
                    </Button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
                            <AlertCircle className="w-5 h-5" />
                            <span className="text-sm">{error}</span>
                        </div>
                    )}

                    {mode === 'select' && (
                        <div className="space-y-4">
                            <p className="text-center text-muted-foreground mb-6">
                                Capture or upload your Aadhaar card to auto-fill registration details
                            </p>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={startCamera}
                                    className="p-8 border-2 border-dashed rounded-xl hover:border-primary hover:bg-primary/5 transition-colors flex flex-col items-center gap-3"
                                >
                                    <Camera className="w-12 h-12 text-primary" />
                                    <span className="font-medium">Use Camera</span>
                                    <span className="text-xs text-muted-foreground">Take a photo</span>
                                </button>
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="p-8 border-2 border-dashed rounded-xl hover:border-primary hover:bg-primary/5 transition-colors flex flex-col items-center gap-3"
                                >
                                    <Upload className="w-12 h-12 text-primary" />
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

                    {mode === 'camera' && (
                        <div className="space-y-4">
                            <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    playsInline
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 pointer-events-none">
                                    <div className="absolute inset-8 border-2 border-white/50 rounded-lg" />
                                    <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm bg-black/50 px-3 py-1 rounded">
                                        Position ID card within the frame
                                    </p>
                                </div>
                            </div>
                            <div className="flex justify-center gap-4">
                                <Button variant="outline" onClick={() => { stopCamera(); setMode('select'); }}>
                                    Cancel
                                </Button>
                                <Button onClick={capturePhoto}>
                                    <Camera className="w-4 h-4 mr-2" />
                                    Capture
                                </Button>
                            </div>
                            <canvas ref={canvasRef} className="hidden" />
                        </div>
                    )}

                    {mode === 'preview' && capturedImage && (
                        <div className="space-y-4">
                            <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                                <img
                                    src={capturedImage}
                                    alt="Captured ID"
                                    className="w-full h-full object-contain"
                                />
                            </div>
                            <div className="flex justify-center gap-4">
                                <Button variant="outline" onClick={retake}>
                                    <RotateCcw className="w-4 h-4 mr-2" />
                                    Retake
                                </Button>
                                <Button onClick={processImage}>
                                    <Check className="w-4 h-4 mr-2" />
                                    Extract Data
                                </Button>
                            </div>
                        </div>
                    )}

                    {mode === 'processing' && (
                        <div className="py-12 text-center space-y-4">
                            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
                            <div>
                                <p className="font-medium">Processing ID Card...</p>
                                <p className="text-sm text-muted-foreground">Extracting information</p>
                            </div>
                            <div className="max-w-xs mx-auto">
                                <div className="h-2 bg-muted rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-primary transition-all duration-300"
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">{progress}%</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer hint */}
                <div className="px-6 pb-4">
                    <p className="text-xs text-muted-foreground text-center">
                        📷 For best results, ensure good lighting and the ID card is clearly visible
                    </p>
                </div>
            </div>
        </div>
    );
}
