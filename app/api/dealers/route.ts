import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../lib/supabaseAdmin';
import { slugify } from '../../../lib/dealers';

export async function GET() {
  const supabaseAdmin = getSupabaseAdmin();
  const { data, error } = await supabaseAdmin
    .from('dealers')
    .select('id,name,slug,logo_url,primary_color,secondary_color,scanning_enabled,created_at')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ dealers: data });
}

export async function POST(req: Request) {
  const supabaseAdmin = getSupabaseAdmin();
  const body = await req.json().catch(() => ({}));
  const name = (body.name || '').trim();
  const dealerSettingKey = (body.dealerSettingKey || '').trim();

  if (!name || !dealerSettingKey) {
    return NextResponse.json(
      { error: 'name and dealerSettingKey are both required' },
      { status: 400 }
    );
  }

  const base = slugify(name);
  let lastError: { message: string } | null = null;

  for (let attempt = 0; attempt < 5; attempt++) {
    const slug = attempt === 0 ? base : `${base}-${Math.random().toString(36).slice(2, 6)}`;
    const { data, error } = await supabaseAdmin
      .from('dealers')
      .insert({ name, dealer_setting_key: dealerSettingKey, slug })
      .select('id,name,slug,created_at')
      .single();

    if (!error) {
      return NextResponse.json({ dealer: data });
    }
    lastError = error;
    if (error.code !== '23505') break; // not a unique-violation, don't retry
  }

  return NextResponse.json({ error: lastError?.message || 'Could not create dealer' }, { status: 500 });
}
