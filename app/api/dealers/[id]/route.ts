import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../lib/supabaseAdmin';

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
