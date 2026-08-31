import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../lib/supabaseAdmin';
import { isUuid } from '../../../../lib/dealers';

function matchColumn(value: string): 'id' | 'slug' {
  return isUuid(value) ? 'id' : 'slug';
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const supabaseAdmin = getSupabaseAdmin();
  const { data, error } = await supabaseAdmin
    .from('lead_forms')
    .select('id,dealer_id,name,slug,source,fields,active,created_at,dealers(name,slug,logo_url,primary_color,dealer_ref,dealer_floor)')
    .eq(matchColumn(params.id), params.id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Lead form not found' }, { status: 404 });
  }
  return NextResponse.json({ leadForm: data });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const supabaseAdmin = getSupabaseAdmin();
  const body = await req.json().catch(() => ({}));
  const update: Record<string, unknown> = {};

  if ('active' in body) {
    if (typeof body.active !== 'boolean') {
      return NextResponse.json({ error: 'active must be a boolean' }, { status: 400 });
    }
    update.active = body.active;
  }
  if ('name' in body) {
    const name = String(body.name || '').trim();
    if (!name) return NextResponse.json({ error: 'name cannot be empty' }, { status: 400 });
    update.name = name;
  }
  if ('source' in body) {
    const source = String(body.source || '').trim();
    if (!source) return NextResponse.json({ error: 'source cannot be empty' }, { status: 400 });
    update.source = source;
  }
  if ('fields' in body) {
    if (!Array.isArray(body.fields) || body.fields.length === 0) {
      return NextResponse.json({ error: 'fields must be a non-empty array' }, { status: 400 });
    }
    update.fields = body.fields;
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('lead_forms')
    .update(update)
    .eq(matchColumn(params.id), params.id)
    .select('id,dealer_id,name,slug,source,fields,active,created_at')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ leadForm: data });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const supabaseAdmin = getSupabaseAdmin();
  const { error } = await supabaseAdmin.from('lead_forms').delete().eq(matchColumn(params.id), params.id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
