import { features } from "./data";
import { Reveal } from "./reveal";
import { SectionHeading } from "./section-heading";

export function Features() {
  return (
    <section id="features" className="scroll-mt-16 border-t border-lp-line py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <SectionHeading
          index="01"
          label="Features"
          title="Everything between a folder of files and a finished upload."
          lead="Built around the way contributors actually work: large batches, strict agency rules, and no time to spare."
        />

        <ul className="mt-16 grid border-t border-lp-line md:grid-cols-2">
          {features.map((f, i) => (
            <li
              key={f.title}
              className={`border-b border-lp-line py-8 md:px-0 ${
                i % 2 === 0 ? "md:border-r md:pr-10" : "md:pl-10"
              }`}
            >
              <Reveal delay={(i % 2) * 80}>
                <div className="flex gap-6">
                  <span className="font-lpmono text-xs text-lp-accent">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h3 className="font-display text-2xl tracking-tight">{f.title}</h3>
                    <p className="mt-2 max-w-md text-[0.95rem] leading-relaxed text-lp-muted">
                      {f.body}
                    </p>
                  </div>
                </div>
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
