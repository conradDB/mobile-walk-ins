import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../../lib/supabaseAdmin';

const ALLOWED_TYPES: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
};
const MAX_BYTES = 2 * 1024 * 1024;

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const supabaseAdmin = getSupabaseAdmin();

  const form = await req.formData().catch(() => null);
  const file = form?.get('file');
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
  }

  const ext = ALLOWED_TYPES[file.type];
  if (!ext) {
    return NextResponse.json({ error: 'Unsupported image type' }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'Image must be under 2MB' }, { status: 400 });
  }

  const path = `${params.id}/logo.${ext}`;
  const { error: uploadError } = await supabaseAdmin.storage
    .from('dealer-logos')
    .upload(path, file, { contentType: file.type, upsert: true });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: publicUrlData } = supabaseAdmin.storage.from('dealer-logos').getPublicUrl(path);
  const logoUrl = `${publicUrlData.publicUrl}?v=${Date.now()}`;

  const { data: dealer, error: updateError } = await supabaseAdmin
    .from('dealers')
    .update({ logo_url: logoUrl })
    .eq('id', params.id)
    .select('id,name,logo_url')
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }
  return NextResponse.json({ dealer });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const supabaseAdmin = getSupabaseAdmin();
  const { data: dealer, error } = await supabaseAdmin
    .from('dealers')
    .update({ logo_url: null })
    .eq('id', params.id)
    .select('id,name,logo_url')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ dealer });
}
