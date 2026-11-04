import { Suspense } from "react";
import Link from "next/link";

import { PageHeader, type Crumb } from "@/components/page/page-header";
import { Badge } from "@/components/reui/badge";
import { Frame, FrameHeader, FramePanel, FrameTitle } from "@/components/reui/frame";
import { RegionError } from "@/components/states/region-error";
import { Button } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { fmtCompact, fmtInt } from "@/lib/format";
import { getOfferComps, type PublicOfferDetail } from "@/lib/offers-public";
import { slugifyName } from "@/lib/queries";
import { KIND, LABELS_VI } from "@/lib/vocab.generated";
import { OfferCard, firstSeenVi, offerPrice, offerTitle } from "./offer-card";
import { OfferContact } from "./offer-contact";
import { OfferLabelHelp } from "./offer-label-help";

const wardHrefOf = (o: PublicOfferDetail) =>
  o.market && !o.atMarketLevel ? `${o.market.path}/${slugifyName(o.ward.name)}` : null;

const listHrefOf = (o: PublicOfferDetail) =>
  o.market ? `${o.market.path}/listings/${o.kind === KIND.rent_lt ? "rent" : "sale"}` : "/vn";

/** Các dòng thông số, theo thứ tự hiện; trường thiếu thì bỏ, không in chữ «chưa có». */
export function offerFacts(o: PublicOfferDetail): { label: string; value: string }[] {
  const rows: [string, string | null][] = [
    ["Loại hình", LABELS_VI.property_type[o.propertyType as keyof typeof LABELS_VI.property_type] ?? o.propertyType],
    ["Diện tích", `${fmtInt(o.areaM2)} m²`],
    ["Phòng ngủ", o.bedrooms === null ? null : o.bedrooms === 0 ? "Studio" : fmtInt(o.bedrooms)],
    ["WC", o.bathrooms === null ? null : fmtInt(o.bathrooms)],
    ["Số tầng", o.stories === null ? null : fmtInt(o.stories)],
    ["Mặt tiền", o.frontageLength === null ? null : `${fmtCompact(o.frontageLength)} m`],
    ["Block", o.block],
    ["Tầng", o.floor],
    ["Đường", o.street],
  ];
  return rows.flatMap(([label, value]) => (value === null ? [] : [{ label, value }]));
}

/** Thân trang một tin rao (hồ sơ trang-chi-tiet-tin): màn hẹp giá → liên hệ → thông số; màn rộng liên hệ ở cột phụ. */
export function OfferBody({ offer: o }: { offer: PublicOfferDetail }) {
  const wardHref = wardHrefOf(o);
  const crumbs: Crumb[] = [
    { label: "Việt Nam", href: "/vn" },
    ...(o.market ? [{ label: o.market.name, href: o.market.path }] : []),
    { label: o.kind === KIND.rent_lt ? "Cho thuê" : "Bán", href: listHrefOf(o) },
    { label: "Tin" },
  ];
  return (
    <div className="flex flex-col gap-6">
      <PageHeader crumbs={crumbs} title={offerTitle(o)} stats={[]} description={firstSeenVi(o.firstSeenDays)} />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        <Frame spacing="default" className="min-w-0">
          <FramePanel className="flex flex-col gap-2">
            <div className="flex flex-wrap items-baseline gap-2">
              <p className="text-foreground text-xl font-semibold tracking-tight tabular-nums">{offerPrice(o)}</p>
              {o.kind === KIND.sale && o.pricePerm2 !== null && (
                <p className="text-muted-foreground text-sm tabular-nums">{fmtCompact(o.pricePerm2)}/m²</p>
              )}
            </div>
            {o.unverified && (
              <OfferLabelHelp what="offer">
                <Badge variant="warning-light">Chưa xác minh</Badge>
              </OfferLabelHelp>
            )}
          </FramePanel>
        </Frame>
        <Frame spacing="default" className="min-w-0 lg:col-start-2 lg:row-span-2 lg:row-start-1">
          <FrameHeader>
            <FrameTitle role="heading" aria-level={2}>Người đăng</FrameTitle>
          </FrameHeader>
          <FramePanel className="flex flex-col gap-3">
            {o.sellerName ? (
              <p className="text-sm font-medium">{o.sellerName}</p>
            ) : (
              <p className="text-muted-foreground text-sm">{o.sellerManyNames ? "Tài khoản nhiều tên" : "Chưa có tên"}</p>
            )}
            <div className="flex justify-start">
              <OfferContact offerId={o.offerId} hasPhone={o.hasPhone} inferred={o.phoneInferred} />
            </div>
          </FramePanel>
        </Frame>
        <Frame spacing="default" className="min-w-0">
          <FrameHeader>
            <FrameTitle role="heading" aria-level={2}>Thông số</FrameTitle>
          </FrameHeader>
          <FramePanel>
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              {offerFacts(o).map((f) => (
                <div key={f.label} className="flex min-w-0 flex-col gap-0.5">
                  <dt className="text-muted-foreground text-xs">{f.label}</dt>
                  <dd className="break-words tabular-nums">{f.value}</dd>
                </div>
              ))}
              <div className="flex min-w-0 flex-col gap-0.5">
                <dt className="text-muted-foreground text-xs">{wardHref ? "Phường" : "Thị trường"}</dt>
                <dd className="break-words">
                  {wardHref ? (
                    <Link prefetch={false} href={wardHref} className="underline underline-offset-4">{o.ward.name}</Link>
                  ) : (
                    o.ward.name
                  )}
                </dd>
              </div>
            </dl>
          </FramePanel>
        </Frame>
      </div>
      {!o.atMarketLevel && <OfferCompsRegion offer={o} />}
    </div>
  );
}

/** Khối tin cùng tiêu chí: lỗi và đang tải đều nằm trong vùng, phần trên của trang vẫn đọc được. */
export function OfferCompsRegion({ offer }: { offer: PublicOfferDetail }) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-0.5">
        <h2 className="text-sm font-semibold tracking-tight">Tin cùng tiêu chí</h2>
        <p className="text-muted-foreground text-xs">Cùng phường, cùng loại tin và loại hình, diện tích chênh không quá 25%.</p>
      </div>
      <RegionError what="tin cùng tiêu chí">
        <Suspense fallback={<OfferCompsSkeleton />}>
          <OfferComps offer={offer} />
        </Suspense>
      </RegionError>
    </section>
  );
}

export async function OfferComps({ offer }: { offer: PublicOfferDetail }) {
  const comps = await getOfferComps(offer);
  if (comps.length === 0) return <OfferCompsEmpty offer={offer} />;
  const wardHref = wardHrefOf(offer);
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {comps.map((c) => (
        <OfferCard key={c.offerId} offer={c} wardHref={wardHref} />
      ))}
    </div>
  );
}

export function OfferCompsEmpty({ offer }: { offer: PublicOfferDetail }) {
  return (
    <Empty className="border">
      <EmptyHeader>
        <EmptyTitle>Chưa có tin cùng tiêu chí</EmptyTitle>
        <EmptyDescription>Xem các tin khác ở {offer.ward.name}.</EmptyDescription>
      </EmptyHeader>
      <Button
        variant="outline"
        size="sm"
        nativeButton={false}
        render={<Link prefetch={false} href={`${listHrefOf(offer)}?ward=${encodeURIComponent(offer.ward.id)}`} />}
      >
        Xem tin ở phường này
      </Button>
    </Empty>
  );
}

/** Skeleton đúng bố cục lưới thẻ. */
export function OfferCompsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-busy="true" aria-label="Đang tải tin cùng tiêu chí">
      {Array.from({ length: 3 }, (_, i) => (
        <Frame key={i}>
          <FramePanel className="flex flex-col gap-3">
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-8 w-full" />
          </FramePanel>
        </Frame>
      ))}
    </div>
  );
}
