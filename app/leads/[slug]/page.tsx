import { getSupabaseAdmin } from '../../../lib/supabaseAdmin';
import Header from '../../components/Header';
import LeadForm from './LeadForm';
import { SavedLeadField } from '../../../lib/cmsLead';

// Same reasoning as app/book/[dealerId]/page.tsx: Supabase queries run over
// fetch, which Next.js would otherwise cache this route's data indefinitely.
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

type LeadFormRow = {
  id: string;
  name: string;
  slug: string;
  fields: SavedLeadField[];
  active: boolean;
  dealers: { name: string; logo_url: string | null; primary_color: string | null } | null;
};

async function getLeadForm(slug: string): Promise<LeadFormRow | null> {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { data } = await supabaseAdmin
      .from('lead_forms')
      .select('id,name,slug,fields,active,dealers(name,logo_url,primary_color)')
      .eq('slug', slug)
      .single();
    return data as unknown as LeadFormRow | null;
  } catch {
    return null;
  }
}

export default async function LeadFormPage({ params }: { params: { slug: string } }) {
  const form = await getLeadForm(params.slug);

  const theme: Record<string, string> = {};
  if (form?.dealers?.primary_color) {
    theme['--blue'] = form.dealers.primary_color;
    theme['--blue-dark'] = form.dealers.primary_color;
  }

  if (!form || !form.active) {
    return (
      <div>
        <Header centerLogo logoAlt="CMS Systems" />
        <div className="wrap">
          <div className="empty">
            {form ? 'This form is no longer accepting submissions.' : 'This form could not be found.'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={theme as React.CSSProperties}>
      <Header
        centerLogo
        logo={form.dealers?.logo_url || undefined}
        logoAlt={form.dealers?.logo_url ? form.dealers.name : 'CMS Systems'}
      />
      <LeadForm slug={form.slug} formName={form.name} fields={form.fields} />
    </div>
  );
}
