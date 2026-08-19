import Link from 'next/link';
import Header from '../components/Header';

export default function AdminLandingPage() {
  return (
    <>
      <Header eyebrow="Workshop Bookings" title="What would you like to set up?" animateIcon />

      <div className="wrap admin-wrap">
        <div className="chooser-grid">
          <Link href="/admin/workshop" className="chooser-card">
            <div className="chooser-icon">🔧</div>
            <h2>Workshop Booking Link</h2>
            <p>
              Generate a walk-in booking kiosk link and QR code for a dealer&apos;s counter
              tablet — the flow you already use today.
            </p>
            <span className="chooser-cta">Manage Workshop Links →</span>
          </Link>

          <Link href="/admin/leads" className="chooser-card">
            <div className="chooser-icon">📋</div>
            <h2>Lead Submission Form</h2>
            <p>
              Build a custom lead capture form — from a template or fully from scratch — that
              submits straight into CMS LMS via the Lead Injection API.
            </p>
            <span className="chooser-cta">Manage Lead Forms →</span>
          </Link>
        </div>

        <div className="brand-footer">CMS Systems — Smarter tools. Easy integration. Better results.</div>
      </div>
    </>
  );
}
