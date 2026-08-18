export default function Header({
  eyebrow,
  title,
  right,
  logo,
  logoAlt,
}: {
  eyebrow: string;
  title: string;
  right?: React.ReactNode;
  logo?: string;
  logoAlt?: string;
}) {
  return (
    <>
      <div className="brand-strip" />
      <div className="bar">
        <img src={logo || '/cms-logo.png'} alt={logoAlt || 'CMS Systems'} className="logo" />
        <div className="bar-title">
          {eyebrow && <div className="eyebrow">{eyebrow}</div>}
          <h1>{title}</h1>
        </div>
        {right && <div className="bar-right">{right}</div>}
      </div>
    </>
  );
}
