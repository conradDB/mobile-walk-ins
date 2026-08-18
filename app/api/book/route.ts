import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../lib/supabaseAdmin';

const CMS_API_URL =
  'https://aws-prod-workshop-api.cmscloud.co.za/api/Workshop/CreateUnconfirmedBooking';

export async function POST(req: Request) {
  let supabaseAdmin;
  try {
    supabaseAdmin = getSupabaseAdmin();
  } catch (e: any) {
    return NextResponse.json(
      { result: false, bookingNumber: 0, message: 'Server is not configured yet: ' + e.message },
      { status: 500 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const { dealerId, ...booking } = body;

  if (!dealerId) {
    return NextResponse.json(
      { result: false, bookingNumber: 0, message: 'Missing dealer link.' },
      { status: 400 }
    );
  }

  const { data: dealer, error } = await supabaseAdmin
    .from('dealers')
    .select('dealer_setting_key,name')
    .eq('id', dealerId)
    .single();

  if (error || !dealer) {
    return NextResponse.json(
      { result: false, bookingNumber: 0, message: 'This booking link is not recognized.' },
      { status: 404 }
    );
  }

  const required = [
    'firstName',
    'lastName',
    'contactNumber',
    'make',
    'registration',
    'briefDescription',
    'dtScheduled',
  ];
  const missing = required.filter((k) => !booking[k]);
  if (missing.length) {
    return NextResponse.json(
      { result: false, bookingNumber: 0, message: `Missing fields: ${missing.join(', ')}` },
      { status: 400 }
    );
  }

  const payload = {
    dealerSettingKey: dealer.dealer_setting_key,
    dtScheduled: booking.dtScheduled,
    briefDescription: booking.briefDescription,
    make: booking.make,
    model: booking.model || '',
    registration: booking.registration,
    odoMeter: booking.odoMeter ? parseInt(booking.odoMeter, 10) : 0,
    firstName: booking.firstName,
    lastName: booking.lastName,
    title: booking.title || '',
    jobScheduleRef: null,
    contactNumber: booking.contactNumber,
  };

  try {
    const resp = await fetch(CMS_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await resp.json();
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json(
      {
        result: false,
        bookingNumber: 0,
        message: 'Could not reach the CMS booking service: ' + e.message,
      },
      { status: 502 }
    );
  }
}
