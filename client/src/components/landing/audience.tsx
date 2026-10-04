import { audiences } from "./data";
import { Reveal } from "./reveal";
import { SectionHeading } from "./section-heading";

export function Audience() {
  return (
    <section className="border-t border-lp-line py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <SectionHeading
          index="03"
          label="Who it's for"
          title="Made for every kind of stock creator."
        />

        <ul className="mt-14 border-t border-lp-line">
          {audiences.map((a, i) => (
            <li key={a.title} className="group border-b border-lp-line">
              <Reveal delay={i * 60}>
                <div className="grid items-baseline gap-2 py-7 transition-colors md:grid-cols-12 md:gap-10">
                  <h3 className="font-display text-3xl tracking-tight transition-colors group-hover:text-lp-accent md:col-span-5 md:text-4xl">
                    {a.title}
                  </h3>
                  <p className="max-w-md text-base leading-relaxed text-lp-muted md:col-span-7">
                    {a.body}
                  </p>
                </div>
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
