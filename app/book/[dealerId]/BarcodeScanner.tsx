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
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const runningRef = useRef(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    runningRef.current = true;

    async function scanLoop() {
      const { readBarcodes } = await import('zxing-wasm/reader');
      const video = videoRef.current;

      while (runningRef.current && !cancelled) {
        if (video && video.videoWidth > 0) {
          if (!canvasRef.current) canvasRef.current = document.createElement('canvas');
          const canvas = canvasRef.current;
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            try {
              const results = await readBarcodes(imageData, {
                formats: ['PDF417'],
                tryHarder: true,
                maxNumberOfSymbols: 1,
              });
              const bytes = results[0]?.bytes;
              if (bytes && bytes.length > 0 && runningRef.current && !cancelled) {
                runningRef.current = false;
                streamRef.current?.getTracks().forEach((t) => t.stop());
                onResult(bytes);
                return;
              }
            } catch {
              // No symbol in this frame — normal, just try the next one.
            }
          }
        }
        // Decode itself is the natural pacing here (a few hundred ms at this
        // resolution) — just a tiny yield so a cancel/unmount can land promptly.
        await new Promise((r) => setTimeout(r, 30));
      }
    }

    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: { ideal: 'environment' },
            // A dense PDF417 like a driver's license packs far more narrow
            // bars across the frame than a typical barcode, so more pixels
            // directly buys more pixels-per-bar, which is what decides
            // whether it resolves at all.
            width: { ideal: 4096 },
            height: { ideal: 2304 },
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
        // Brief settle so the first attempts aren't spent on the initial
        // exposure/focus hunt right as the camera opens.
        await new Promise((r) => setTimeout(r, 350));
        if (!cancelled) scanLoop();
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
      runningRef.current = false;
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [onResult]);

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
      {!error && (
        <div className="scanner-bottombar">
          <div className="scanner-status">
            <span className="scanner-pulse" />
            Scanning…
          </div>
        </div>
      )}
      {error && <div className="msg err scanner-error">{error}</div>}
    </div>
  );
}
