import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../../lib/supabaseAdmin';
import { buildLeadPayload, submitLeadToCms, SavedLeadField, fieldId } from '../../../../../lib/cmsLead';

export async function POST(req: Request, { params }: { params: { slug: string } }) {
  const supabaseAdmin = getSupabaseAdmin();
  const body = await req.json().catch(() => ({}));
  const values: Record<string, unknown> = body.values && typeof body.values === 'object' ? body.values : {};
  const utm = body.utm && typeof body.utm === 'object' ? body.utm : undefined;

  const { data: form, error: formError } = await supabaseAdmin
    .from('lead_forms')
    .select('id,name,source,fields,active,dealers(dealer_ref,dealer_floor)')
    .eq('slug', params.slug)
    .single();

  if (formError || !form) {
    return NextResponse.json({ result: false, message: 'This form could not be found.' }, { status: 404 });
  }
  if (!form.active) {
    return NextResponse.json({ result: false, message: 'This form is no longer accepting submissions.' }, { status: 410 });
  }
  const dealer = form.dealers as unknown as { dealer_ref: string | null; dealer_floor: string | null } | null;
  if (!dealer?.dealer_ref || !dealer?.dealer_floor) {
    return NextResponse.json({ result: false, message: 'This dealer is not configured to receive leads.' }, { status: 500 });
  }

  const fields = form.fields as SavedLeadField[];
  const missing = fields.filter((f) => {
    if (!f.required) return false;
    const raw = values[fieldId(f.node, f.key)];
    return raw === undefined || raw === null || raw === '';
  });
  if (missing.length > 0) {
    return NextResponse.json(
      { result: false, message: `Please fill in: ${missing.map((f) => f.label).join(', ')}` },
      { status: 400 }
    );
  }

  const payload = buildLeadPayload(
    fields,
    values,
    { dealer_ref: dealer.dealer_ref, dealer_floor: dealer.dealer_floor },
    form.source,
    utm
  );

  let cmsStatus = 'Exception';
  let cmsResponseBody: unknown = null;
  let result = false;
  let message = 'Could not submit your enquiry — please try again.';

  try {
    const { data } = await submitLeadToCms(payload);
    cmsResponseBody = data;
    cmsStatus = data?.status || 'Exception';
    result = data?.status === 'Success';
    message = result ? 'Thank you — your enquiry has been submitted.' : data?.message || message;
  } catch (e: any) {
    cmsResponseBody = { error: e.message };
    message = 'Could not reach the lead system — please try again shortly.';
  }

  await supabaseAdmin.from('lead_submissions').insert({
    lead_form_id: form.id,
    payload,
    cms_status: cmsStatus,
    cms_response: cmsResponseBody,
  });

  return NextResponse.json({ result, message });
}
