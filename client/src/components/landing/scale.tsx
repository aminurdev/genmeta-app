import { scalePoints } from "./data";
import { Reveal } from "./reveal";
import { SectionHeading } from "./section-heading";

export function Scale() {
  return (
    <section className="bg-lp-invert py-24 text-lp-invert-ink sm:py-32">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <SectionHeading
          invert
          index="04"
          label="Desktop power"
          title="Scale your microstock business."
          lead="Portfolio tools for serious contributors who upload every week."
        />

        <div className="mt-16 grid gap-10 md:grid-cols-3">
          {scalePoints.map((p, i) => (
            <Reveal key={p.title} delay={i * 80}>
              <div className="border-t border-lp-invert-ink/25 pt-6">
                <h3 className="font-display text-2xl tracking-tight">{p.title}</h3>
                <p className="mt-3 text-[0.95rem] leading-relaxed text-lp-invert-ink/70">
                  {p.body}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
