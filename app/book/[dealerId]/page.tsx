import { getSupabaseAdmin } from '../../../lib/supabaseAdmin';
import { isUuid } from '../../../lib/dealers';
import Header from '../../components/Header';
import BookingForm from './BookingForm';

type DealerBrand = {
  name: string;
  logo_url: string | null;
  primary_color: string | null;
  secondary_color: string | null;
};

async function getDealer(dealerId: string): Promise<DealerBrand | null> {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { data } = await supabaseAdmin
      .from('dealers')
      .select('name,logo_url,primary_color,secondary_color')
      .eq(isUuid(dealerId) ? 'id' : 'slug', dealerId)
      .single();
    return data;
  } catch {
    return null;
  }
}

export default async function KioskPage({ params }: { params: { dealerId: string } }) {
  const dealer = await getDealer(params.dealerId);

  const theme: Record<string, string> = {};
  if (dealer?.primary_color) {
    theme['--blue'] = dealer.primary_color;
    theme['--blue-dark'] = dealer.primary_color;
  }
  if (dealer?.secondary_color) {
    theme['--turquoise'] = dealer.secondary_color;
  }

  return (
    <div style={theme as React.CSSProperties}>
      <Header
        centerLogo
        logo={dealer?.logo_url || undefined}
        logoAlt={dealer?.logo_url ? dealer.name : 'CMS Systems'}
      />
      <BookingForm dealerId={params.dealerId} />
    </div>
  );
}
