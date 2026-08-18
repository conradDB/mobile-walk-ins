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
        const reader = new BrowserPDF417Reader();
        const controls = await reader.decodeFromConstraints(
          {
            audio: false,
            video: {
              facingMode: { ideal: 'environment' },
              // PDF417 is dense — a low-res stream (browsers often default to
              // ~640x480) stretched across a large preview looks blurry and
              // won't decode. Ask for the highest resolution the camera has.
              width: { ideal: 3840 },
              height: { ideal: 2160 },
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
