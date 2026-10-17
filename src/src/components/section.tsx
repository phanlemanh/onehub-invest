import type { ReactNode } from "react";

/** Khung section thống nhất cho các khối sâu của trang insights. */
export function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-lg border border-neutral-200 bg-white p-4">
      <div className="text-sm font-semibold text-neutral-900">{title}</div>
      {subtitle ? <div className="text-xs text-neutral-500">{subtitle}</div> : null}
      <div className="mt-3">{children}</div>
    </section>
  );
}
