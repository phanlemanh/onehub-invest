"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { CheckIcon, CircleHelpIcon, SparklesIcon, XIcon } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/reui/alert";
import { Badge } from "@/components/reui/badge";
import { Button } from "@/components/ui/button";
import { Item, ItemContent, ItemDescription, ItemGroup, ItemTitle } from "@/components/ui/item";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { EnrichChoices } from "@/lib/enrich-choices";
import { aiSuggestionLabel, propertyTypeLabel } from "@/lib/ops-labels";
import { CHUA_CAN_CU, lyDoHopLe, soTruongGhepCan } from "@/lib/ops/review-can-cu";
import type { ReviewContext } from "@/lib/ops/review-context";
import type { ReviewItem } from "@/lib/ops/review-queue";
import { RawLabel } from "./raw-label";
import type { ReviewMedia } from "@/lib/ops/review-media";

import { ReviewCompare } from "./review/review-compare";
import { ReviewFullText } from "./review/review-full-text";
import { ReviewReason } from "./review/review-reason";
import { ReviewPhotos } from "./review-photos";

export type { ReviewItem } from "@/lib/ops/review-queue";

/**
 * Nội dung một thẻ hàng duyệt — rẽ nhánh theo item_type:
 * - entity_match: bảng so từng trường Tin A/Tin B kèm căn cứ (PL3) + suy luận AI tách riêng + ảnh + toàn văn + 3 nút.
 * - agent_output (enrich:<offer_id>): mọi trường đề xuất kèm phương pháp + căn cứ; «Áp dụng» → route decide →
 *   decide_enrichment_review (migration 033). Field luật E1 trái LLM (conflict) hiện hai bên; chọn một bên trước khi áp.
 * - loại khác: một dòng báo, không làm sập trang.
 * Không độ tự tin, không điểm Stage B (Q9, RV-L04). Không nút nào đổi theo `ai_suggestion`. Mọi quyết định kèm lý do
 * (PL3): nút tắt khi ô «Lý do» trống; route ghi lý do vào decision_note + ops_audit cùng transaction.
 * `context` (toàn văn + căn cứ, loadReviewContext) và `media` (loadReviewMedia) vắng khi dựng thẻ đứng riêng.
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

type DecideStatus = "approved" | "rejected" | "deferred";

const DONE_LABEL: Record<string, Record<string, string>> = {
  entity_match: { approved: "Đã duyệt", rejected: "Đã từ chối", deferred: "Hoãn" },
  agent_output: { approved: "Đã áp", rejected: "Đã bỏ", deferred: "Hoãn" },
};

/** Gửi quyết định (kèm lý do) lên route decide rồi làm mới danh sách. Lý do giữ nguyên khi route trả lỗi. */
function useDecide(id: number) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const lyDo = lyDoHopLe(reason);
  const decide = (status: DecideStatus, choices?: EnrichChoices) => {
    if (lyDo === null) return;
    start(async () => {
      const res = await fetch(`/api/v1/ops/review/${id}/decide`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(choices ? { status, choices, reason: lyDo } : { status, reason: lyDo }),
      });
      if (res.ok) {
        setMsg(status === "approved" ? "Đã duyệt" : status === "rejected" ? "Đã từ chối" : "Đã hoãn");
        router.refresh();
      } else {
        setMsg(`Lỗi: ${(await res.json().catch(() => ({}))).error ?? "không rõ"}`);
      }
    });
  };
  return { pending, msg, decide, reason, setReason, ready: lyDo !== null };
}

/** Thẻ đã quyết: nhãn trạng thái + lý do đã ghi (thẻ quyết trước PL3 không có lý do). */
function DoneState({ item }: { item: ReviewItem }) {
  const label = DONE_LABEL[item.item_type]?.[item.status] ?? "Đã quyết";
  return (
    <div className="flex flex-col gap-1.5">
      <div>
        <Badge variant={item.status === "approved" ? "success-light" : "outline"}>{label}</Badge>
      </div>
      {item.decision_note && (
        <p className="text-muted-foreground text-xs break-words whitespace-pre-line" data-review-decision-note>
          Lý do: {item.decision_note}
        </p>
      )}
    </div>
  );
}

/** Chân thẻ chờ: ô lý do trên hàng nút; mọi nút tắt khi lý do trống (PL3). */
function PendingActions({ d, extraBlock, children }: {
  d: ReturnType<typeof useDecide>;
  extraBlock?: string | null;
  children: ReactNode;
}) {
  return (
    <div className="flex w-full flex-col gap-3">
      <ReviewReason value={d.reason} onChange={d.setReason} disabled={d.pending} />
      <div className="flex flex-wrap items-center gap-2" data-review-actions>
        {children}
        {extraBlock && <span className="text-muted-foreground text-xs">{extraBlock}</span>}
        {d.msg && <span className="text-muted-foreground text-xs" role="status">{d.msg}</span>}
      </div>
    </div>
  );
}

/** Xếp chồng thân + nút khi không có `children` (dáng thẻ đứng riêng, dùng trong test và nơi khác). */
const stacked = ({ body, actions }: ReviewCardParts) => (
  <div className="flex flex-col gap-3">
    {body}
    {actions}
  </div>
);

export function ReviewCard({ item, media, context, children = stacked }: {
  item: ReviewItem;
  media?: ReviewMedia;
  context?: ReviewContext;
  children?: (parts: ReviewCardParts) => ReactNode;
}) {
  if (item.item_type === "entity_match") return <EntityMatchCard item={item} media={media} context={context} render={children} />;
  if (item.item_type === "agent_output") return <AgentOutputCard item={item} media={media} context={context} render={children} />;
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

/** Phương pháp + căn cứ của một đề xuất; không `basis` → nói thẳng là chưa ghi căn cứ (PL3). */
function ProposalBasis({ o }: { o: EnrichField }) {
  return (
    <ItemDescription className="flex flex-wrap items-center gap-1.5">
      <Badge variant={o.source === "e1_rule" ? "info-light" : "primary-light"}>
        {SOURCE_LABEL[o.source ?? ""] ?? o.source ?? "Chưa rõ phương pháp"}
      </Badge>
      {o.basis ? (
        <span data-review-quote data-review-can-cu>{o.basis}</span>
      ) : (
        <span data-review-can-cu>{CHUA_CAN_CU}</span>
      )}
    </ItemDescription>
  );
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
    <div role="listitem" className="flex flex-col gap-2" data-review-field={field}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium">{FIELD_LABEL[field] ?? <>Trường khác <code>{field}</code></>}</span>
        <Badge variant="warning-light">Luật và AI khác nhau — chọn một bên</Badge>
      </div>
      {options.map((o) => (
        <Item key={o.proposal_id} variant="outline" size="xs">
          <ItemContent>
            <ItemTitle>{fieldValue(field, o.value)}</ItemTitle>
            <ProposalBasis o={o} />
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

type CardProps = {
  item: ReviewItem;
  media?: ReviewMedia;
  context?: ReviewContext;
  render: (parts: ReviewCardParts) => ReactNode;
};

/** Đoạn đầu tin lưu trong evidence (300 ký tự) — chỉ khi không có toàn văn từ loadReviewContext (thẻ đứng riêng). */
function EvidenceExcerpt({ text, group }: { text?: string | null; group?: string | null }) {
  if (!text) return null;
  return (
    <div className="flex flex-col gap-1">
      {group && <p className="text-muted-foreground text-xs" translate="no" data-review-group>Nhóm: {group}</p>}
      <p className="text-muted-foreground text-xs break-words whitespace-pre-line" translate="no" data-review-quote>{text}</p>
    </div>
  );
}

function AgentOutputCard({ item, media, context, render }: CardProps) {
  const d = useDecide(item.id);
  const [picked, setPicked] = useState<Record<string, string | undefined>>({});
  const ev = item.evidence as EnrichEvidence;
  const fields = Array.isArray(ev.fields) ? ev.fields : [];
  const conflictFields = [...new Set(fields.filter((f) => f.conflict).map((f) => f.field))];
  const chosen = conflictFields.every((f) => picked[f] !== undefined);
  const approve = () => {
    if (conflictFields.length === 0) return d.decide("approved");
    const choices: EnrichChoices = {};
    for (const f of conflictFields) choices[f] = picked[f] === NONE ? null : Number(picked[f]);
    d.decide("approved", choices);
  };
  const body = (
    <div className="flex flex-col gap-4">
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
              disabled={item.status !== "pending" || d.pending}
            />
          ))}
          {fields.filter((f) => !f.conflict).map((f) => (
            <Item key={f.proposal_id} size="xs" role="listitem" data-review-field={f.field}>
              <ItemContent>
                <ItemDescription>{FIELD_LABEL[f.field] ?? <>Trường khác <code>{f.field}</code></>}</ItemDescription>
                <ItemTitle>{fieldValue(f.field, f.value)}</ItemTitle>
                <ProposalBasis o={f} />
              </ItemContent>
            </Item>
          ))}
        </ItemGroup>
      )}
      <ReviewPhotos label="Tin" images={media?.offer} chiGoc={media?.chiGoc?.offer} />
      {context?.offer ? (
        <ReviewFullText label="Tin" ctx={context.offer} doanDau={ev.text} />
      ) : (
        <EvidenceExcerpt text={ev.text} group={ev.group_name} />
      )}
    </div>
  );
  const actions = fields.length === 0 ? null : item.status === "pending" ? (
    <PendingActions d={d} extraBlock={chosen ? null : "Chọn một bên cho trường xung đột trước khi áp."}>
      <Button size="sm" onClick={approve} disabled={d.pending || !d.ready || !chosen}>
        Áp dụng
      </Button>
      <Button size="sm" variant="destructive" onClick={() => d.decide("rejected")} disabled={d.pending || !d.ready}>
        Bỏ
      </Button>
      <Button size="sm" variant="outline" onClick={() => d.decide("deferred")} disabled={d.pending || !d.ready}>
        Để sau
      </Button>
    </PendingActions>
  ) : (
    <DoneState item={item} />
  );
  return render({ body, actions });
}

function EntityMatchCard({ item, media, context, render }: CardProps) {
  const d = useDecide(item.id);
  const ev = item.evidence as ReviewEvidence;
  const rows = soTruongGhepCan(ev.offer_a ?? {}, ev.offer_b ?? {}, context?.offer_a?.canCu, context?.offer_b?.canCu);
  const body = (
    <div className="flex flex-col gap-4">
      <ReviewCompare rows={rows} />
      {(item.ai_suggestion || item.ai_reasoning) && (
        <Alert variant="info" data-review-ai>
          <SparklesIcon aria-hidden />
          <AlertTitle>Suy luận của AI — không phải căn cứ</AlertTitle>
          <AlertDescription>
            {item.ai_suggestion && (
              <p>
                AI cho là: <RawLabel n={aiSuggestionLabel(item.ai_suggestion)} raw={item.ai_suggestion} />
              </p>
            )}
            {item.ai_reasoning && <p translate="no" data-review-quote>{item.ai_reasoning}</p>}
          </AlertDescription>
        </Alert>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="flex min-w-0 flex-col gap-2">
          <ReviewPhotos label="Tin A" images={media?.offer_a} chiGoc={media?.chiGoc?.offer_a} />
          {context?.offer_a ? (
            <ReviewFullText label="Tin A" ctx={context.offer_a} doanDau={ev.offer_a?.text} />
          ) : (
            <EvidenceExcerpt text={ev.offer_a?.text} />
          )}
        </div>
        <div className="flex min-w-0 flex-col gap-2">
          <ReviewPhotos label="Tin B" images={media?.offer_b} chiGoc={media?.chiGoc?.offer_b} />
          {context?.offer_b ? (
            <ReviewFullText label="Tin B" ctx={context.offer_b} doanDau={ev.offer_b?.subject} />
          ) : (
            <EvidenceExcerpt text={ev.offer_b?.subject} />
          )}
        </div>
      </div>
    </div>
  );
  const actions = item.status === "pending" ? (
    <PendingActions d={d}>
      <Button size="sm" onClick={() => d.decide("approved")} disabled={d.pending || !d.ready}>
        <CheckIcon data-icon="inline-start" aria-hidden />
        Cùng căn
      </Button>
      <Button size="sm" variant="destructive" onClick={() => d.decide("rejected")} disabled={d.pending || !d.ready}>
        <XIcon data-icon="inline-start" aria-hidden />
        Khác căn
      </Button>
      <Button size="sm" variant="outline" onClick={() => d.decide("deferred")} disabled={d.pending || !d.ready}>
        <CircleHelpIcon data-icon="inline-start" aria-hidden />
        Không chắc
      </Button>
    </PendingActions>
  ) : (
    <DoneState item={item} />
  );
  return render({ body, actions });
}
