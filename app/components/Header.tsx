export default function Header({
  eyebrow,
  title,
  right,
  logo,
  logoAlt,
  centerLogo,
}: {
  eyebrow?: string;
  title?: string;
  right?: React.ReactNode;
  logo?: string;
  logoAlt?: string;
  centerLogo?: boolean;
}) {
  return (
    <>
      <div className="brand-strip" />
      <div className={`bar${centerLogo ? ' logo-only' : ''}`}>
        <img src={logo || '/cms-logo.png'} alt={logoAlt || 'CMS Systems'} className="logo" />
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
