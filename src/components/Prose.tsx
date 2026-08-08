import type { ReactNode } from "react";

/**
 * Shared shell for the policy and content pages. Keeps typography consistent
 * without pulling in the Tailwind typography plugin for six static pages.
 */
export function Prose({
  title,
  intro,
  updated,
  children,
}: {
  title: string;
  intro?: string;
  updated?: string;
  children: ReactNode;
}) {
  return (
    <article className="mx-auto max-w-2xl px-4 py-14 sm:px-6">
      <h1 className="text-4xl font-semibold text-plum-900 sm:text-5xl">{title}</h1>
      {intro && <p className="mt-4 text-lg leading-relaxed text-ink-soft">{intro}</p>}
      {updated && <p className="mt-2 text-sm text-ink-soft">Last updated {updated}</p>}

      <div
        className="mt-10 space-y-6 text-[15px] leading-relaxed text-ink
          [&_a]:text-plum-700 [&_a]:underline [&_a]:underline-offset-4
          [&_h2]:mt-10 [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:text-plum-900
          [&_h3]:mt-6 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-ink
          [&_li]:pl-1 [&_p]:text-ink-soft
          [&_strong]:font-semibold [&_strong]:text-ink
          [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5 [&_ul]:text-ink-soft"
      >
        {children}
      </div>
    </article>
  );
}
