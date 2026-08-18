'use client';

import { useEffect, useState } from 'react';
import BarcodeScanner from './BarcodeScanner';
import { scanDriverLicence } from '../../../lib/sadl';
import { readVehicleDisk } from '../../../lib/vehicleDisk';

const DEFAULT_TIME = '08:00';

function defaultDate() {
  return new Date().toISOString().slice(0, 10);
}

export default function BookingForm({ dealerId }: { dealerId: string }) {
  const [title, setTitle] = useState('Mr');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [registration, setRegistration] = useState('');
  const [odoMeter, setOdoMeter] = useState('');
  const [briefDescription, setBriefDescription] = useState('');
  const [date, setDate] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [errMsg, setErrMsg] = useState('');
  const [result, setResult] = useState<{ bookingNumber: number; message: string } | null>(null);

  const [scanMode, setScanMode] = useState<'license' | 'disk' | null>(null);
  const [toastMsg, setToastMsg] = useState('');

  useEffect(() => {
    setDate(defaultDate());
  }, []);

  function toast(msg: string) {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 2600);
  }

  function resetForm() {
    setTitle('Mr');
    setFirstName('');
    setLastName('');
    setContactNumber('');
    setMake('');
    setModel('');
    setRegistration('');
    setOdoMeter('');
    setBriefDescription('');
    setDate(defaultDate());
    setErrMsg('');
    setResult(null);
  }

  function handleLicenseScan(rawBytes: Uint8Array) {
    setScanMode(null);
    const holder = scanDriverLicence(rawBytes);
    if (!holder) {
      toast("Could not read that license — try again or enter the name manually");
      return;
    }
    if (holder.surname) setLastName(holder.surname);
    if (holder.initials) setFirstName(holder.initials);
    toast('License scanned — name filled in (initials only, no full first name on SA licenses)');
  }

  function handleDiskScan(rawBytes: Uint8Array) {
    setScanMode(null);
    const diskResult = readVehicleDisk(rawBytes);
    const extras: string[] = [];
    if (diskResult.vin) extras.push(`VIN: ${diskResult.vin}`);
    if (diskResult.isPlainText) {
      const snippet = diskResult.rawText.replace(/\s+/g, ' ').trim().slice(0, 120);
      if (snippet && !diskResult.vin) extras.push(`Disk data: ${snippet}`);
    }
    if (extras.length === 0) {
      toast('Could not automatically read the disk — enter vehicle details manually');
      return;
    }
    setBriefDescription((prev) => (prev ? `${prev} — ${extras.join(', ')}` : extras.join(', ')));
    toast('Vehicle disk scanned — details added to description');
  }

  const requiredFields = {
    title,
    firstName,
    lastName,
    contactNumber,
    make,
    model,
    registration,
    odoMeter,
    briefDescription,
    date,
  };
  const isComplete = Object.values(requiredFields).every((v) => v.trim() !== '');

  async function submit() {
    setErrMsg('');
    if (!isComplete) {
      setErrMsg('Please fill in all fields before booking the vehicle in.');
      return;
    }

    const dtScheduled = new Date(`${date}T${DEFAULT_TIME}:00`).toISOString();

    setSubmitting(true);
    try {
      const res = await fetch('/api/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dealerId,
          dtScheduled,
          briefDescription,
          make,
          model,
          registration,
          odoMeter,
          firstName,
          lastName,
          title,
          contactNumber,
        }),
      });
      const data = await res.json();
      if (data.result) {
        setResult({ bookingNumber: data.bookingNumber, message: data.message });
      } else {
        setErrMsg(data.message || 'The booking could not be created.');
      }
    } catch (e: any) {
      setErrMsg('Could not reach the booking service: ' + e.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="wrap">
      {!result && (
        <div className="card">
          <div className="section-label">Client</div>
          <div className="scan-row">
            <button className="scan-btn" onClick={() => setScanMode('license')}>
              ⎙ Scan Driver&apos;s License
            </button>
          </div>
          <div className="grid">
            <div className="field">
              <label>Title</label>
              <select value={title} onChange={(e) => setTitle(e.target.value)}>
                <option value="Mr">Mr</option>
                <option value="Mrs">Mrs</option>
                <option value="Ms">Ms</option>
                <option value="Dr">Dr</option>
                <option value="">Other / N/A</option>
              </select>
            </div>
            <div className="field">
              <label>Contact Number</label>
              <input value={contactNumber} onChange={(e) => setContactNumber(e.target.value)} type="tel" placeholder="082 000 0000" />
            </div>
            <div className="field">
              <label>First Name</label>
              <input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Thabo" />
            </div>
            <div className="field">
              <label>Last Name</label>
              <input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Nkosi" />
            </div>
          </div>

          <div className="section-label">Vehicle</div>
          <div className="scan-row">
            <button className="scan-btn" onClick={() => setScanMode('disk')}>
              ⎙ Scan License Disk
            </button>
          </div>
          <div className="grid">
            <div className="field">
              <label>Make</label>
              <input value={make} onChange={(e) => setMake(e.target.value)} placeholder="Toyota" />
            </div>
            <div className="field">
              <label>Model</label>
              <input value={model} onChange={(e) => setModel(e.target.value)} placeholder="Hilux" />
            </div>
            <div className="field">
              <label>Registration</label>
              <input
                value={registration}
                onChange={(e) => setRegistration(e.target.value)}
                placeholder="HG71RTGP"
                style={{ textTransform: 'uppercase' }}
              />
            </div>
            <div className="field">
              <label>Odometer (km)</label>
              <input value={odoMeter} onChange={(e) => setOdoMeter(e.target.value)} type="number" min="0" placeholder="45000" />
            </div>
          </div>

          <div className="section-label">Appointment</div>
          <div className="grid">
            <div className="field full">
              <label>Brief Description</label>
              <input
                value={briefDescription}
                onChange={(e) => setBriefDescription(e.target.value)}
                placeholder="e.g. 15 000 km Service"
              />
            </div>
            <div className="field full">
              <label>Date</label>
              <div className="date-field-clip">
                <input value={date} onChange={(e) => setDate(e.target.value)} type="date" />
              </div>
            </div>
          </div>

          <button className="cta" onClick={submit} disabled={submitting || !isComplete}>
            {submitting ? 'Booking…' : 'Book Vehicle In'}
          </button>
          {errMsg && <div className="msg err">{errMsg}</div>}
        </div>
      )}

      {result && (
        <div className="card result">
          <div className="badge">✓</div>
          <h2>Booking Created</h2>
          <p>{result.message}</p>
          <div className="num mono">#{result.bookingNumber}</div>
          <button onClick={resetForm}>Start Next Booking</button>
        </div>
      )}

      <div className="brand-footer">CMS Systems — Smarter tools. Easy integration. Better results.</div>

      {scanMode === 'license' && (
        <BarcodeScanner
          title="Scan Driver's License"
          hint="Move in close so the barcode fills the width of the frame, hold steady, then tap Scan."
          onResult={handleLicenseScan}
          onClose={() => setScanMode(null)}
        />
      )}
      {scanMode === 'disk' && (
        <BarcodeScanner
          title="Scan License Disk"
          hint="Hold the vehicle license disk barcode steady inside the frame."
          onResult={handleDiskScan}
          onClose={() => setScanMode(null)}
        />
      )}

      <div className={`toast ${toastMsg ? 'show' : ''}`}>{toastMsg}</div>
    </div>
  );
}
