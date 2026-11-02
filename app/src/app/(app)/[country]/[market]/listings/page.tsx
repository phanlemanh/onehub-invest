export const dynamic = "force-dynamic";

import { permanentRedirect } from "next/navigation";

import { noiQuery } from "@/lib/ma-thi-truong";
import { LISTING_KIND } from "@/lib/offers-filters";

type Params = Promise<{ country: string; market: string }>;
type Search = Promise<Record<string, string | string[] | undefined>>;

/** Đường cũ: `/listings` và `?kind=` chuyển vĩnh viễn sang trang Bán, Cho thuê. Trang đích tự kiểm thị trường. */
export default async function ListingsRedirect({ params, searchParams }: { params: Params; searchParams: Search }) {
  const { country, market } = await params;
  const { kind, ...rest } = await searchParams;
  const base = `/${country}/${market}/listings`;
  if (kind === LISTING_KIND.rent_st) permanentRedirect(noiQuery(`${base}/rent`, { ...rest, term: "short" }));
  permanentRedirect(noiQuery(kind === LISTING_KIND.rent_lt ? `${base}/rent` : `${base}/sale`, rest));
}
