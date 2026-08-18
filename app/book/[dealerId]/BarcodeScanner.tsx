'use client';

import { useEffect, useRef, useState } from 'react';
import type { IScannerControls } from '@zxing/browser';

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
  const controlsRef = useRef<IScannerControls | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const { BrowserPDF417Reader } = await import('@zxing/browser');
        const { DecodeHintType } = await import('@zxing/library');
        // TRY_HARDER makes each decode attempt do the extra work (multiple
        // scan lines, row stitching) a dense real-world PDF417 needs — off
        // by default because it's slower per-frame, but this is a deliberate
        // "scan this one barcode" flow, not a live video feed, so it's worth it.
        const hints = new Map<any, any>([[DecodeHintType.TRY_HARDER, true]]);
        const reader = new BrowserPDF417Reader(hints, { delayBetweenScanAttempts: 100 });
        const controls = await reader.decodeFromConstraints(
          {
            audio: false,
            video: {
              facingMode: { ideal: 'environment' },
              // Full HD balances legibility against decode speed — 4K frames
              // are too heavy for this JS decoder to process many times a
              // second, which cuts the chances of catching a sharp, aligned
              // frame far more than the extra pixels help.
              width: { ideal: 1920 },
              height: { ideal: 1080 },
              advanced: [{ focusMode: 'continuous' } as unknown as MediaTrackConstraintSet],
            },
          },
          videoRef.current ?? undefined,
          (result, err) => {
            if (cancelled) return;
            if (result) {
              const bytes = result.getRawBytes();
              if (bytes && bytes.length > 0) {
                controlsRef.current?.stop();
                onResult(bytes);
              }
            }
            // NotFoundException fires on essentially every frame with no
            // barcode in view — that's expected, not a real error.
          }
        );
        if (cancelled) {
          controls.stop();
        } else {
          controlsRef.current = controls;
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
      controlsRef.current?.stop();
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
      {error && <div className="msg err scanner-error">{error}</div>}
    </div>
  );
}
