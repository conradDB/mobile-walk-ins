import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../lib/supabaseAdmin';

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const supabaseAdmin = getSupabaseAdmin();
  const { data, error } = await supabaseAdmin
    .from('dealers')
    .select('id,name,logo_url,created_at')
    .eq('id', params.id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Dealer not found' }, { status: 404 });
  }
  return NextResponse.json({ dealer: data });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const supabaseAdmin = getSupabaseAdmin();
  const { error } = await supabaseAdmin.from('dealers').delete().eq('id', params.id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
