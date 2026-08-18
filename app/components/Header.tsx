export default function Header({
  eyebrow,
  title,
  right,
}: {
  eyebrow: string;
  title: string;
  right?: React.ReactNode;
}) {
  return (
    <>
      <div className="brand-strip" />
      <div className="bar">
        <img src="/cms-logo.png" alt="CMS Systems" className="logo" />
        <div className="bar-title">
          <div className="eyebrow">{eyebrow}</div>
          <h1>{title}</h1>
        </div>
        {right && <div className="bar-right">{right}</div>}
      </div>
    </>
  );
}
