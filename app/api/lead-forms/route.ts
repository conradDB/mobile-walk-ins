import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../lib/supabaseAdmin';
import { slugify } from '../../../lib/dealers';

export async function GET() {
  const supabaseAdmin = getSupabaseAdmin();
  const { data, error } = await supabaseAdmin
    .from('lead_forms')
    .select('id,dealer_id,name,slug,source,fields,active,created_at,dealers(name,slug,logo_url,primary_color)')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ leadForms: data });
}

export async function POST(req: Request) {
  const supabaseAdmin = getSupabaseAdmin();
  const body = await req.json().catch(() => ({}));
  const dealerId = (body.dealerId || '').trim();
  const name = (body.name || '').trim();
  const source = (body.source || '').trim();
  const fields = Array.isArray(body.fields) ? body.fields : null;

  if (!dealerId || !name || !source || !fields || fields.length === 0) {
    return NextResponse.json(
      { error: 'dealerId, name, source and at least one field are required' },
      { status: 400 }
    );
  }

  const { data: dealer, error: dealerError } = await supabaseAdmin
    .from('dealers')
    .select('id,dealer_ref,dealer_floor')
    .eq('id', dealerId)
    .single();

  if (dealerError || !dealer) {
    return NextResponse.json({ error: 'Dealer not found' }, { status: 404 });
  }
  if (!dealer.dealer_ref || !dealer.dealer_floor) {
    return NextResponse.json(
      { error: 'This dealer has no DealerRef/DealerFloor set — set its CMS codes first' },
      { status: 400 }
    );
  }

  const base = slugify(body.slug ? String(body.slug) : name);
  let lastError: { message: string } | null = null;

  for (let attempt = 0; attempt < 5; attempt++) {
    const slug = attempt === 0 ? base : `${base}-${Math.random().toString(36).slice(2, 6)}`;
    const { data, error } = await supabaseAdmin
      .from('lead_forms')
      .insert({ dealer_id: dealerId, name, slug, source, fields })
      .select('id,dealer_id,name,slug,source,fields,active,created_at')
      .single();

    if (!error) {
      return NextResponse.json({ leadForm: data });
    }
    lastError = error;
    if (error.code !== '23505') break;
  }

  return NextResponse.json({ error: lastError?.message || 'Could not create lead form' }, { status: 500 });
}
