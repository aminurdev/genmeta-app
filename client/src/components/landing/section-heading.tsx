import { Reveal } from "./reveal";

export function SectionHeading({
  index,
  label,
  title,
  lead,
  invert = false,
}: {
  index: string;
  label: string;
  title: string;
  lead?: string;
  invert?: boolean;
}) {
  return (
    <Reveal className="grid gap-6 md:grid-cols-12 md:gap-10">
      <p
        className={`font-lpmono text-xs uppercase tracking-[0.14em] md:col-span-3 ${
          invert ? "text-lp-invert-ink/60" : "text-lp-muted"
        }`}
      >
        <span className="text-lp-accent">{index}</span> &nbsp;/&nbsp; {label}
      </p>
      <div className="md:col-span-9">
        <h2 className="max-w-3xl font-display text-4xl leading-[1.08] tracking-tight sm:text-5xl">
          {title}
        </h2>
        {lead && (
          <p
            className={`mt-5 max-w-xl text-base leading-relaxed ${
              invert ? "text-lp-invert-ink/70" : "text-lp-muted"
            }`}
          >
            {lead}
          </p>
        )}
      </div>
    </Reveal>
  );
}
