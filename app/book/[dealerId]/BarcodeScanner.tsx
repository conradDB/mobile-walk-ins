'use client';

import { useEffect, useRef, useState } from 'react';

export default function BarcodeScanner({
  title,
  hint,
  onResult,
  onClose,
}: {
  title: string;
  hint: string;
  onResult: (rawBytes: Uint8Array) => void;
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [capturing, setCapturing] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
            advanced: [{ focusMode: 'continuous' } as unknown as MediaTrackConstraintSet],
          },
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
      } catch (e: any) {
        if (!cancelled) {
          setError(
            e?.name === 'NotAllowedError'
              ? 'Camera access was denied. Allow camera access and try again.'
              : e?.name === 'NotFoundError'
              ? 'No camera was found on this device.'
              : 'Could not start the camera: ' + (e?.message || 'unknown error')
          );
        }
      }
    })();

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  async function captureAndDecode() {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0) return;

    setCapturing(true);
    setMessage('');
    try {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('canvas unsupported');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      const { readBarcodes } = await import('zxing-wasm/reader');
      const results = await readBarcodes(imageData, {
        formats: ['PDF417'],
        tryHarder: true,
        maxNumberOfSymbols: 1,
      });

      const bytes = results[0]?.bytes;
      if (bytes && bytes.length > 0) {
        streamRef.current?.getTracks().forEach((t) => t.stop());
        onResult(bytes);
        return;
      }
      setMessage('No barcode found in that frame — align it and try again.');
    } catch {
      setMessage('No barcode found in that frame — align it and try again.');
    } finally {
      setCapturing(false);
    }
  }

  return (
    <div className="scanner-overlay">
      <video ref={videoRef} className="scanner-video" muted playsInline />
      <div className="scanner-frame" />
      <div className="scanner-topbar">
        <div>
          <h3>{title}</h3>
          <p className="hint">{hint}</p>
        </div>
        <button className="row-btn" onClick={onClose}>
          Cancel
        </button>
      </div>
      <div className="scanner-bottombar">
        {message && <div className="scanner-message">{message}</div>}
        <button className="scanner-capture" onClick={captureAndDecode} disabled={capturing || !!error}>
          {capturing ? 'Reading…' : 'Tap to Scan'}
        </button>
      </div>
      {error && <div className="msg err scanner-error">{error}</div>}
    </div>
  );
}
