"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/reui/badge";
import { Button } from "@/components/ui/button";
import { Item, ItemContent, ItemDescription, ItemGroup, ItemTitle } from "@/components/ui/item";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { EnrichChoices } from "@/lib/enrich-choices";

/**
 * HITL Review Card — rẽ nhánh theo item_type:
 * - entity_match: 2 offers side-by-side + AI suggestion + 3 nút quyết định.
 * - agent_output (enrich:<offer_id>): đoạn tin + danh sách giá trị đề xuất;
 *   «Áp dụng» → route decide → decide_enrichment_review (migration 033). Field luật E1 trái
 *   LLM (conflict) hiện hai bên kèm căn cứ; người chọn một bên trước khi áp (AC-11).
 * - loại khác: một dòng báo, không làm sập trang.
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
  confidence: number | null;
  source?: string;
  basis?: string | null;
  conflict?: boolean;
};

export type ReviewItem = {
  id: number;
  item_type: string;
  title: string;
  evidence: Record<string, unknown>;
  ai_suggestion: string | null;
  ai_reasoning: string | null;
  ai_confidence: number | null;
  status: string;
};

function fmtPrice(v: number | null) {
  if (v === null) return "—";
  if (v >= 1e9) return `${(v / 1e9).toFixed(2)} tỷ`;
  return `${Math.round(v / 1e6)}tr`;
}
function fmtPerm2(v: number | null) {
  if (v === null) return "—";
  return `${Math.round(v / 1e6)}tr/m²`;
}

type OfferData = ReviewEvidence["offer_a"] | ReviewEvidence["offer_b"];
function OfferCard({ label, offer }: { label: string; offer: OfferData }) {
  return (
    <div className="flex-1 rounded-lg border p-3 text-xs">
      <div className="mb-2 flex items-center justify-between">
        <Badge variant="outline">{label}</Badge>
        <span className="text-muted-foreground">{offer.source}</span>
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-1">
        <div>
          <p className="text-muted-foreground text-[10px]">Giá</p>
          <p className="tabular-nums font-medium">{fmtPrice(offer.price_vnd)}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-[10px]">Diện tích</p>
          <p className="tabular-nums font-medium">{offer.area_m2 ?? "—"} m²</p>
        </div>
        <div>
          <p className="text-muted-foreground text-[10px]">Giá/m²</p>
          <p className="tabular-nums font-medium">{fmtPerm2(offer.price_perm2)}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-[10px]">Phường</p>
          <p className="truncate font-medium">{offer.phuong ?? "—"}</p>
        </div>
        {offer.bedrooms !== null && (
          <div>
            <p className="text-muted-foreground text-[10px]">PN/WC</p>
            <p className="font-medium">{offer.bedrooms}PN{"bathrooms" in offer && ((offer as unknown) as Record<string, number | null>).bathrooms ? `/${((offer as unknown) as Record<string, number | null>).bathrooms}WC` : ""}</p>
          </div>
        )}
        <div>
          <p className="text-muted-foreground text-[10px]">Loại</p>
          <p className="font-medium">{offer.property_type ?? "?"}</p>
        </div>
        <div className="col-span-2">
          <p className="text-muted-foreground text-[10px]">Địa chỉ</p>
          <p className="truncate font-medium">{((offer as unknown) as Record<string, string | null>).street ?? "—"}</p>
        </div>
      </div>
      {(() => { const desc = (offer as Record<string, string | null>).text ?? (offer as Record<string, string | null>).subject; return desc ? (
        <p className="text-muted-foreground mt-2 line-clamp-2 border-t pt-2 text-[11px]">{desc}</p>
      ) : null; })()}
    </div>
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
        setMsg(status === "approved" ? "✓ Đã duyệt" : status === "rejected" ? "✓ Đã từ chối" : "⏸ Hoãn");
        router.refresh();
      } else {
        setMsg(`❌ ${(await res.json().catch(() => ({}))).error ?? "lỗi"}`);
      }
    });
  };
  return { pending, msg, decide };
}

function DoneBadge({ item }: { item: ReviewItem }) {
  const label = DONE_LABEL[item.item_type]?.[item.status] ?? item.status;
  return <Badge variant={item.status === "approved" ? "success-light" : "outline"}>{label}</Badge>;
}

export function ReviewCard({ item }: { item: ReviewItem }) {
  if (item.item_type === "entity_match") return <EntityMatchCard item={item} />;
  if (item.item_type === "agent_output") return <AgentOutputCard item={item} />;
  return (
    <div className="flex flex-col gap-1 rounded-xl border p-4">
      <h3 className="text-sm font-medium">{item.title}</h3>
      <p className="text-muted-foreground text-xs">
        Loại «{item.item_type}» chưa có giao diện duyệt.
      </p>
    </div>
  );
}

const FIELD_LABEL: Record<string, string> = {
  property_type: "Loại BĐS",
  bedrooms: "Phòng ngủ",
  bathrooms: "WC",
  street_raw: "Đường",
  block_raw: "Toà",
};

const SOURCE_LABEL: Record<string, string> = { e1_rule: "Theo luật", e2_llm: "Theo LLM" };
const CHOICE_LABEL: Record<string, string> = { e1_rule: "Chọn luật", e2_llm: "Chọn LLM" };
/** Giá trị ToggleGroup cho «Bỏ cả hai». */
const NONE = "none";

function fmtConfidence(c: number | null) {
  return c === null ? null : `AI tự tin ${Math.round(c * 100)}%`;
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
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">{FIELD_LABEL[field] ?? field}</span>
        <Badge variant="warning-light">Luật và LLM khác nhau — chọn một bên</Badge>
      </div>
      {options.map((o) => (
        <Item key={o.proposal_id} variant="outline" size="xs">
          <ItemContent>
            <ItemTitle>
              <Badge variant={o.source === "e1_rule" ? "info-light" : "primary-light"}>
                {SOURCE_LABEL[o.source ?? ""] ?? o.source}
              </Badge>
              {o.value}
            </ItemTitle>
            {o.basis && <ItemDescription>{o.basis}</ItemDescription>}
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

function AgentOutputCard({ item }: { item: ReviewItem }) {
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
  return (
    <div className="flex flex-col gap-3 rounded-xl border p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-medium">{item.title}</h3>
        <Badge variant="outline">Bổ sung dữ liệu tin</Badge>
      </div>
      {ev.text && (
        <p className="text-muted-foreground line-clamp-3 text-xs">
          {ev.group_name ? `${ev.group_name} · ` : ""}
          {ev.text}
        </p>
      )}
      {fields.length === 0 ? (
        <p className="text-muted-foreground text-xs">Thẻ thiếu dữ liệu đề xuất.</p>
      ) : (
        <>
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
                  <ItemDescription>{FIELD_LABEL[f.field] ?? f.field}</ItemDescription>
                  <ItemTitle>{f.value}</ItemTitle>
                </ItemContent>
                {fmtConfidence(f.confidence) && (
                  <span className="text-muted-foreground text-xs tabular-nums">{fmtConfidence(f.confidence)}</span>
                )}
              </Item>
            ))}
          </ItemGroup>
          {item.status === "pending" ? (
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
              {msg && <span className="text-muted-foreground text-xs">{msg}</span>}
            </div>
          ) : (
            <DoneBadge item={item} />
          )}
        </>
      )}
    </div>
  );
}

function EntityMatchCard({ item }: { item: ReviewItem }) {
  const { pending, msg, decide } = useDecide(item.id);
  const ev = item.evidence as ReviewEvidence;
  return (
    <div className="flex flex-col gap-2 rounded-xl border p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-medium">{item.title}</h3>
        <div className="flex items-center gap-2">
          {item.ai_suggestion && (
            <Badge variant={item.ai_suggestion === "yes" ? "success-light" : "outline"}>
              AI: {item.ai_suggestion} {item.ai_confidence ? `(${Math.round(item.ai_confidence * 100)}%)` : ""}
            </Badge>
          )}
          <Badge variant="outline">B: {ev.stage_b_score}</Badge>
        </div>
      </div>
      {item.ai_reasoning && (
        <p className="text-muted-foreground rounded-md bg-muted/30 px-2 py-1 text-[11px]">
          🤖 {item.ai_reasoning}
        </p>
      )}
      <div className="flex gap-2">
        <OfferCard label="Tin A" offer={ev.offer_a} />
        <OfferCard label="Tin B" offer={ev.offer_b} />
      </div>
      {item.status === "pending" ? (
        <div className="flex items-center gap-2">
          <button
            onClick={() => decide("approved")}
            disabled={pending}
            className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            ✅ Cùng căn
          </button>
          <button
            onClick={() => decide("rejected")}
            disabled={pending}
            className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            ❌ Khác căn
          </button>
          <button
            onClick={() => decide("deferred")}
            disabled={pending}
            className="rounded-md border px-3 py-1.5 text-xs hover:bg-muted/50 disabled:opacity-50"
          >
            ⏸ Không chắc
          </button>
          {msg && <span className="text-muted-foreground text-xs">{msg}</span>}
        </div>
      ) : (
        <DoneBadge item={item} />
      )}
    </div>
  );
}
