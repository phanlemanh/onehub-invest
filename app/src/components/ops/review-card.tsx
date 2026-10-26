"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { CheckIcon, CircleHelpIcon, XIcon } from "lucide-react";

import { Badge } from "@/components/reui/badge";
import { Button } from "@/components/ui/button";
import { Item, ItemContent, ItemDescription, ItemGroup, ItemTitle } from "@/components/ui/item";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { EnrichChoices } from "@/lib/enrich-choices";
import { aiSuggestionLabel, propertyTypeLabel } from "@/lib/ops-labels";
import type { ReviewItem } from "@/lib/ops/review-queue";
import { RawLabel } from "./raw-label";
import type { ReviewMedia } from "@/lib/ops/review-media";

import { ReviewPhotos } from "./review-photos";

export type { ReviewItem } from "@/lib/ops/review-queue";

/**
 * Nội dung một thẻ hàng duyệt — rẽ nhánh theo item_type:
 * - entity_match: 2 tin cạnh nhau (xếp chồng ở màn hẹp) + gợi ý máy + 3 nút quyết định.
 * - agent_output (enrich:<offer_id>): đoạn tin + danh sách giá trị đề xuất;
 *   «Áp dụng» → route decide → decide_enrichment_review (migration 033). Field luật E1 trái
 *   LLM (conflict) hiện hai bên kèm căn cứ; người chọn một bên trước khi áp (AC-11).
 * - loại khác: một dòng báo, không làm sập trang.
 * Không hiện độ tự tin (Q9). Ảnh tin (`media`, từ loadReviewMedia — chỉ admin) hiện dưới mỗi tin.
 * `children` nhận { body, actions } để sheet chi tiết (UI1) đặt nút quyết định ở chân; vắng thì xếp chồng.
 * Click → POST API → router.refresh() để cập nhật danh sách.
 */
export type ReviewEvidence = {
  offer_a: {
    offer_id: string; source: string; price_vnd: number | null;
    area_m2: number | null; price_perm2: number | null;
    bedrooms: number | null; phuong: string | null;
    property_type: string | null; text: string | null;
    street?: string | null; block?: string | null; floor?: string | null;
    bathrooms?: number | null;
  };
  offer_b: {
    offer_id: string; source: string; price_vnd: number | null;
    area_m2: number | null; price_perm2: number | null;
    bedrooms: number | null; phuong: string | null;
    property_type: string | null; subject: string | null;
    street?: string | null; block?: string | null; floor?: string | null;
    bathrooms?: number | null; image_url?: string | null;
  };
  stage_b_score: number;
};

export type EnrichEvidence = {
  offer_id?: string;
  text?: string | null;
  group_name?: string | null;
  run_id?: string;
  model?: string | null;
  fields?: EnrichField[];
};

export type EnrichField = {
  proposal_id: number;
  field: string;
  value: string;
  source?: string;
  basis?: string | null;
  conflict?: boolean;
};

export type ReviewCardParts = { body: ReactNode; actions: ReactNode };

function fmtPrice(v: number | null) {
  if (v === null) return "—";
  if (v >= 1e9) return `${(v / 1e9).toFixed(2)} tỷ`;
  return `${Math.round(v / 1e6)}tr`;
}
function fmtPerm2(v: number | null) {
  if (v === null) return "—";
  return `${Math.round(v / 1e6)}tr/m²`;
}

function Fact({ label, className, children }: { label: string; className?: string; children: ReactNode }) {
  return (
    <div className={className}>
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="truncate font-medium">{children}</p>
    </div>
  );
}

type OfferData = ReviewEvidence["offer_a"] | ReviewEvidence["offer_b"];
function OfferCard({ label, offer }: { label: string; offer: OfferData }) {
  const desc = "text" in offer ? offer.text : offer.subject;
  return (
    <Item variant="outline" size="sm">
      <ItemContent className="min-w-0 gap-2 text-xs">
        <div className="flex items-center justify-between gap-2">
          <Badge variant="outline">{label}</Badge>
          <span className="text-muted-foreground">{offer.source}</span>
        </div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1">
          <Fact label="Giá"><span className="tabular-nums">{fmtPrice(offer.price_vnd)}</span></Fact>
          <Fact label="Diện tích"><span className="tabular-nums">{offer.area_m2 ?? "—"} m²</span></Fact>
          <Fact label="Giá/m²"><span className="tabular-nums">{fmtPerm2(offer.price_perm2)}</span></Fact>
          <Fact label="Phường">{offer.phuong ?? "—"}</Fact>
          {offer.bedrooms !== null && (
            <Fact label="PN/WC">
              {offer.bedrooms}PN{offer.bathrooms ? `/${offer.bathrooms}WC` : ""}
            </Fact>
          )}
          <Fact label="Loại">
            {offer.property_type === null ? "—" : <RawLabel n={propertyTypeLabel(offer.property_type)} raw={offer.property_type} />}
          </Fact>
          <Fact label="Địa chỉ" className="col-span-2">
            <span translate="no">{offer.street ?? "—"}</span>
          </Fact>
        </div>
        {desc ? (
          <p className="text-muted-foreground line-clamp-2 border-t pt-2" translate="no" data-review-quote>{desc}</p>
        ) : null}
      </ItemContent>
    </Item>
  );
}

type DecideStatus = "approved" | "rejected" | "deferred";

const DONE_LABEL: Record<string, Record<string, string>> = {
  entity_match: { approved: "Đã duyệt", rejected: "Đã từ chối", deferred: "Hoãn" },
  agent_output: { approved: "Đã áp", rejected: "Đã bỏ", deferred: "Hoãn" },
};

/** Gửi quyết định lên route decide rồi làm mới danh sách. */
function useDecide(id: number) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const decide = (status: DecideStatus, choices?: EnrichChoices) => {
    start(async () => {
      const res = await fetch(`/api/v1/ops/review/${id}/decide`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(choices ? { status, choices } : { status }),
      });
      if (res.ok) {
        setMsg(status === "approved" ? "Đã duyệt" : status === "rejected" ? "Đã từ chối" : "Đã hoãn");
        router.refresh();
      } else {
        setMsg(`Lỗi: ${(await res.json().catch(() => ({}))).error ?? "không rõ"}`);
      }
    });
  };
  return { pending, msg, decide };
}

function DoneBadge({ item }: { item: ReviewItem }) {
  const label = DONE_LABEL[item.item_type]?.[item.status] ?? "Đã quyết";
  return <Badge variant={item.status === "approved" ? "success-light" : "outline"}>{label}</Badge>;
}

/** Xếp chồng thân + nút khi không có `children` (dáng thẻ đứng riêng, dùng trong test và nơi khác). */
const stacked = ({ body, actions }: ReviewCardParts) => (
  <div className="flex flex-col gap-3">
    {body}
    {actions}
  </div>
);

export function ReviewCard({ item, media, children = stacked }: {
  item: ReviewItem;
  media?: ReviewMedia;
  children?: (parts: ReviewCardParts) => ReactNode;
}) {
  if (item.item_type === "entity_match") return <EntityMatchCard item={item} media={media} render={children} />;
  if (item.item_type === "agent_output") return <AgentOutputCard item={item} media={media} render={children} />;
  return children({
    body: (
      <p className="text-muted-foreground text-xs">
        Loại thẻ khác (<code>{item.item_type}</code>) chưa có giao diện duyệt.
      </p>
    ),
    actions: null,
  });
}

const FIELD_LABEL: Record<string, string> = {
  property_type: "Loại hình",
  bedrooms: "Phòng ngủ",
  bathrooms: "WC",
  street_raw: "Đường",
  block_raw: "Toà",
};

const SOURCE_LABEL: Record<string, string> = { e1_rule: "Theo luật", e2_llm: "Theo AI" };
const CHOICE_LABEL: Record<string, string> = { e1_rule: "Chọn luật", e2_llm: "Chọn AI" };
/** Giá trị ToggleGroup cho «Bỏ cả hai». */
const NONE = "none";

/** Giá trị đề xuất hiện bằng nhãn tiếng Việt khi là mã loại hình (ON12); trường khác giữ nguyên. */
function fieldValue(field: string, value: string) {
  return field === "property_type" && propertyTypeLabel(value).known ? propertyTypeLabel(value).label : value;
}

/** Field có từ hai đề xuất chờ (luật E1 trái LLM): hai bên kèm căn cứ + ô chọn một bên. */
function ConflictField({ options, value, onChange, disabled }: {
  options: EnrichField[];
  value: string | undefined;
  onChange: (v: string | undefined) => void;
  disabled: boolean;
}) {
  const field = options[0].field;
  return (
    <div role="listitem" className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium">{FIELD_LABEL[field] ?? <>Trường khác <code>{field}</code></>}</span>
        <Badge variant="warning-light">Luật và AI khác nhau — chọn một bên</Badge>
      </div>
      {options.map((o) => (
        <Item key={o.proposal_id} variant="outline" size="xs">
          <ItemContent>
            <ItemTitle>
              <Badge variant={o.source === "e1_rule" ? "info-light" : "primary-light"}>
                {SOURCE_LABEL[o.source ?? ""] ?? o.source}
              </Badge>
              {fieldValue(field, o.value)}
            </ItemTitle>
            {o.basis && <ItemDescription data-review-quote>{o.basis}</ItemDescription>}
          </ItemContent>
        </Item>
      ))}
      <ToggleGroup
        variant="outline"
        size="sm"
        value={value ? [value] : []}
        onValueChange={(v) => onChange(v[0])}
        disabled={disabled}
      >
        {options.map((o) => (
          <ToggleGroupItem key={o.proposal_id} value={String(o.proposal_id)}>
            {CHOICE_LABEL[o.source ?? ""] ?? o.value}
          </ToggleGroupItem>
        ))}
        <ToggleGroupItem value={NONE}>Bỏ cả hai</ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
}

type CardProps = { item: ReviewItem; media?: ReviewMedia; render: (parts: ReviewCardParts) => ReactNode };

function AgentOutputCard({ item, media, render }: CardProps) {
  const { pending, msg, decide } = useDecide(item.id);
  const [picked, setPicked] = useState<Record<string, string | undefined>>({});
  const ev = item.evidence as EnrichEvidence;
  const fields = Array.isArray(ev.fields) ? ev.fields : [];
  const conflictFields = [...new Set(fields.filter((f) => f.conflict).map((f) => f.field))];
  const ready = conflictFields.every((f) => picked[f] !== undefined);
  const approve = () => {
    if (conflictFields.length === 0) return decide("approved");
    const choices: EnrichChoices = {};
    for (const f of conflictFields) choices[f] = picked[f] === NONE ? null : Number(picked[f]);
    decide("approved", choices);
  };
  const body = (
    <div className="flex flex-col gap-3">
      {ev.text && (
        <p className="text-muted-foreground text-xs" translate="no" data-review-quote>
          {ev.group_name ? `${ev.group_name} · ` : ""}
          {ev.text}
        </p>
      )}
      <ReviewPhotos label="Tin" images={media?.offer} />
      {fields.length === 0 ? (
        <p className="text-muted-foreground text-xs">Thẻ thiếu dữ liệu đề xuất.</p>
      ) : (
        <ItemGroup>
          {conflictFields.map((f) => (
            <ConflictField
              key={f}
              options={fields.filter((x) => x.field === f)}
              value={picked[f]}
              onChange={(v) => setPicked((p) => ({ ...p, [f]: v }))}
              disabled={item.status !== "pending" || pending}
            />
          ))}
          {fields.filter((f) => !f.conflict).map((f) => (
            <Item key={f.proposal_id} size="xs" role="listitem">
              <ItemContent>
                <ItemDescription>{FIELD_LABEL[f.field] ?? <>Trường khác <code>{f.field}</code></>}</ItemDescription>
                <ItemTitle>{fieldValue(f.field, f.value)}</ItemTitle>
              </ItemContent>
            </Item>
          ))}
        </ItemGroup>
      )}
    </div>
  );
  const actions = fields.length === 0 ? null : item.status === "pending" ? (
    <div className="flex flex-wrap items-center gap-2">
      <Button size="sm" onClick={approve} disabled={pending || !ready}>
        Áp dụng
      </Button>
      <Button size="sm" variant="destructive" onClick={() => decide("rejected")} disabled={pending}>
        Bỏ
      </Button>
      <Button size="sm" variant="outline" onClick={() => decide("deferred")} disabled={pending}>
        Để sau
      </Button>
      {!ready && <span className="text-muted-foreground text-xs">Chọn một bên cho trường xung đột trước khi áp.</span>}
      {msg && <span className="text-muted-foreground text-xs" role="status">{msg}</span>}
    </div>
  ) : (
    <DoneBadge item={item} />
  );
  return render({ body, actions });
}

function EntityMatchCard({ item, media, render }: CardProps) {
  const { pending, msg, decide } = useDecide(item.id);
  const ev = item.evidence as ReviewEvidence;
  const body = (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {item.ai_suggestion && (
          <Badge variant="outline">
            AI: <RawLabel n={aiSuggestionLabel(item.ai_suggestion)} raw={item.ai_suggestion} />
          </Badge>
        )}
        <Badge variant="outline">Điểm B: {ev.stage_b_score}</Badge>
      </div>
      {item.ai_reasoning && (
        <p className="text-muted-foreground text-xs" translate="no" data-review-quote>{item.ai_reasoning}</p>
      )}
      <div className="grid gap-3 md:grid-cols-2">
        <div className="flex min-w-0 flex-col gap-2">
          <OfferCard label="Tin A" offer={ev.offer_a} />
          <ReviewPhotos label="Tin A" images={media?.offer_a} />
        </div>
        <div className="flex min-w-0 flex-col gap-2">
          <OfferCard label="Tin B" offer={ev.offer_b} />
          <ReviewPhotos label="Tin B" images={media?.offer_b} />
        </div>
      </div>
    </div>
  );
  const actions = item.status === "pending" ? (
    <div className="flex flex-wrap items-center gap-2">
      <Button size="sm" onClick={() => decide("approved")} disabled={pending}>
        <CheckIcon data-icon="inline-start" aria-hidden />
        Cùng căn
      </Button>
      <Button size="sm" variant="destructive" onClick={() => decide("rejected")} disabled={pending}>
        <XIcon data-icon="inline-start" aria-hidden />
        Khác căn
      </Button>
      <Button size="sm" variant="outline" onClick={() => decide("deferred")} disabled={pending}>
        <CircleHelpIcon data-icon="inline-start" aria-hidden />
        Không chắc
      </Button>
      {msg && <span className="text-muted-foreground text-xs" role="status">{msg}</span>}
    </div>
  ) : (
    <DoneBadge item={item} />
  );
  return render({ body, actions });
}
