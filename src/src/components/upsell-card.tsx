/** Thay thế section pro-only — mirror endpoint-level 401 của AirDNA (server không trả data, UI mời nâng cấp). */
export function UpsellCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex h-full min-h-40 flex-col items-center justify-center rounded-lg border border-dashed border-amber-300 bg-amber-50 p-6 text-center">
      <div className="text-sm font-semibold text-amber-900">🔒 {title} is a Pro feature</div>
      <div className="mt-1 max-w-md text-xs text-amber-800">{description}</div>
      <div className="mt-3 text-[11px] text-amber-700">
        Use the <span className="font-semibold uppercase">Free / Pro</span> switch in the top-right
        corner (demo billing) to unlock.
      </div>
    </div>
  );
}
