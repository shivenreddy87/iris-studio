const BRANDS = ["Vortex", "Nimbus", "Prysma", "Cirrus", "Kynder", "Halcyn"];

function LogoItem({ name }: { name: string }) {
  return (
    <div className="flex shrink-0 items-center gap-3">
      <div className="liquid-glass grid h-6 w-6 place-items-center rounded-lg text-[11px] font-semibold text-foreground/90">
        {name[0]}
      </div>
      <span className="text-base font-semibold text-foreground">{name}</span>
    </div>
  );
}

export function LogoMarquee() {
  const items = [...BRANDS, ...BRANDS];
  return (
    <div className="pb-10">
      <div className="mx-auto flex max-w-5xl items-center gap-12 px-8">
        <p className="shrink-0 text-sm leading-tight text-foreground/50">
          Relied on by brands
          <br />
          across the globe
        </p>
        <div className="relative flex-1 overflow-hidden">
          <div className="flex w-max animate-marquee items-center gap-16">
            {items.map((name, i) => (
              <LogoItem key={`${name}-${i}`} name={name} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
