export default function Header({
  eyebrow,
  title,
  right,
  logo,
  logoAlt,
  centerLogo,
  animateIcon,
}: {
  eyebrow?: string;
  title?: string;
  right?: React.ReactNode;
  logo?: string;
  logoAlt?: string;
  centerLogo?: boolean;
  animateIcon?: boolean;
}) {
  return (
    <>
      <div className="brand-strip" />
      <div className={`bar${centerLogo ? ' logo-only' : ''}`}>
        {!logo && animateIcon ? (
          <span className="logo-wrap">
            <img src="/cms-logo-no-icon.png" alt={logoAlt || 'CMS Systems'} className="logo" />
            <span className="logo-wi-slot" aria-hidden="true">
              <span className="logo-wi-ring" />
              <img src="/cms-logo-icon-wi.png" alt="" className="logo-wi-icon" />
            </span>
          </span>
        ) : (
          <img src={logo || '/cms-logo.png'} alt={logoAlt || 'CMS Systems'} className="logo" />
        )}
        {!centerLogo && (
          <div className="bar-title">
            {eyebrow && <div className="eyebrow">{eyebrow}</div>}
            <h1>{title}</h1>
          </div>
        )}
        {right && <div className="bar-right">{right}</div>}
      </div>
    </>
  );
}
