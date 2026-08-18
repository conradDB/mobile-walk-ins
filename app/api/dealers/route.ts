import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../lib/supabaseAdmin';

export async function GET() {
  const supabaseAdmin = getSupabaseAdmin();
  const { data, error } = await supabaseAdmin
    .from('dealers')
    .select('id,name,created_at')
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

  const { data, error } = await supabaseAdmin
    .from('dealers')
    .insert({ name, dealer_setting_key: dealerSettingKey })
    .select('id,name,created_at')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ dealer: data });
}
