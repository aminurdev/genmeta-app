import { steps } from "./data";
import { Reveal } from "./reveal";
import { SectionHeading } from "./section-heading";

export function Workflow() {
  return (
    <section id="workflow" className="scroll-mt-16 border-t border-lp-line bg-lp-surface py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <SectionHeading
          index="02"
          label="Workflow"
          title="From upload to export in four steps."
        />

        <ol className="mt-16 grid gap-px overflow-hidden rounded-lg border border-lp-line bg-lp-line sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <li key={s.title} className="bg-lp-bg p-7">
              <Reveal delay={i * 70}>
                <span className="font-display text-5xl text-lp-accent">{i + 1}</span>
                <h3 className="mt-6 text-lg font-semibold tracking-tight">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-lp-muted">{s.body}</p>
              </Reveal>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
