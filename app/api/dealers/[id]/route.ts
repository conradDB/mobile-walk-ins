import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../lib/supabaseAdmin';
import { isUuid, isHexColor } from '../../../../lib/dealers';

function matchColumn(value: string): 'id' | 'slug' {
  return isUuid(value) ? 'id' : 'slug';
}

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const supabaseAdmin = getSupabaseAdmin();
  const { data, error } = await supabaseAdmin
    .from('dealers')
    .select('id,name,slug,logo_url,primary_color,secondary_color,scanning_enabled,created_at')
    .eq(matchColumn(params.id), params.id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Dealer not found' }, { status: 404 });
  }
  return NextResponse.json({ dealer: data });
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const supabaseAdmin = getSupabaseAdmin();
  const body = await req.json().catch(() => ({}));
  const update: Record<string, string | boolean | null> = {};

  for (const key of ['primary_color', 'secondary_color'] as const) {
    if (key in body) {
      const value = body[key];
      if (value === null || value === '') {
        update[key] = null;
      } else if (typeof value === 'string' && isHexColor(value)) {
        update[key] = value.toUpperCase();
      } else {
        return NextResponse.json({ error: `${key} must be a hex colour like #31459C` }, { status: 400 });
      }
    }
  }

  if ('scanning_enabled' in body) {
    if (typeof body.scanning_enabled !== 'boolean') {
      return NextResponse.json({ error: 'scanning_enabled must be a boolean' }, { status: 400 });
    }
    update.scanning_enabled = body.scanning_enabled;
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('dealers')
    .update(update)
    .eq(matchColumn(params.id), params.id)
    .select('id,name,slug,logo_url,primary_color,secondary_color,scanning_enabled')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ dealer: data });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const supabaseAdmin = getSupabaseAdmin();
  const { error } = await supabaseAdmin.from('dealers').delete().eq(matchColumn(params.id), params.id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
