"use client";

import { useState, useTransition, type ComponentProps, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { CheckIcon, CircleHelpIcon, SparklesIcon, TriangleAlertIcon, XIcon } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/reui/alert";
import { Badge } from "@/components/reui/badge";
import { Button } from "@/components/ui/button";
import { Item, ItemContent, ItemDescription, ItemGroup, ItemTitle } from "@/components/ui/item";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { EnrichChoices } from "@/lib/enrich-choices";
import { aiSuggestionLabel, listingIntentLabel, propertyTypeLabel } from "@/lib/ops-labels";
import { doiChieuCua, type DoiChieu } from "@/lib/ops/doi-chieu";
import { CHUA_CAN_CU, lyDoHopLe, soNguoiDang, soTruongGhepCan, fmtGia } from "@/lib/ops/review-can-cu";
import type { OfferContext, ReviewContext } from "@/lib/ops/review-context";
import type { ReviewItem } from "@/lib/ops/review-queue";
import { answerLabel, batGoLyDo } from "@/lib/ops/review-hang-muc";
import { Kbd } from "@/components/ui/kbd";
import { useHangGui } from "./review/hang-gui";
import { RawLabel } from "./raw-label";
import type { ReviewMedia } from "@/lib/ops/review-media";

import { ReviewCompare } from "./review/review-compare";
import { ReviewFullText } from "./review/review-full-text";
import { ReviewReason } from "./review/review-reason";
import { ReviewPhotos } from "./review-photos";
import { NguoiCard } from "./review-card-nguoi";

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

/** Đồng hồ đơn điệu của trình duyệt (OD1 · ĐC6): khoảng không lệch theo giờ máy khách. */
const dongHo = () => (typeof performance !== "undefined" ? performance.now() : Date.now());

/** Khoảng mở thẻ gửi route decide: số nguyên mili-giây; route tự quy ra opened_at bằng giờ của giao dịch. */
export function khoangMo(t0: number, t1: number): number {
  return Math.max(0, Math.round(t1 - t0));
}

/**
 * Gửi quyết định (kèm lý do) lên route decide rồi làm mới danh sách. Lý do giữ nguyên khi route trả lỗi.
 * Đồng hồ thẻ (OD1 · ĐC6): `t0` ghi lúc thẻ dựng — sheet dựng thẻ theo `key={item.id}` nên mở thẻ khác là đặt lại; body
 * gửi `elapsed_ms` = khoảng tới lúc bấm.
 */
export function useDecide(item: Pick<ReviewItem, "id" | "item_type" | "item_id" | "evidence">) {
  const router = useRouter();
  const hang = useHangGui();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  // Hoàn tác (OD2 · ĐC5) dựng lại thẻ với chữ người đã gõ.
  const [reason, setReason] = useState(() => hang?.lyDoGiu(item.id) ?? "");
  const [t0] = useState(dongHo);
  const lyDo = lyDoHopLe(reason);
  /** Lý do gửi đi: chữ gõ thắng; trống thì nhãn đáp án (Q4), trừ đáp án còn bắt gõ → null (nút tắt). */
  const lyDoGui = (status: DecideStatus) => lyDo ?? (reason.trim() === "" && !batGoLyDo(item, status) ? answerLabel(item, status) : null);
  const decide = (status: DecideStatus, choices?: EnrichChoices) => {
    const lyDoChot = lyDoGui(status);
    if (lyDoChot === null) return;
    const elapsed_ms = khoangMo(t0, dongHo());
    const body = choices ? { status, choices, reason: lyDoChot, elapsed_ms } : { status, reason: lyDoChot, elapsed_ms };
    // Chế độ duyệt: lệnh vào hàng chờ 5 giây, sheet sang thẻ kế; thẻ dựng riêng gửi thẳng như OD1.
    if (hang) return hang.xep({ id: item.id, body, nhan: answerLabel(item, status), lyDoGo: reason, lamMoi: () => router.refresh() });
    start(async () => {
      const res = await fetch(`/api/v1/ops/review/${item.id}/decide`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setMsg(answerLabel(item, status));
        router.refresh();
      } else {
        setMsg(`Lỗi: ${(await res.json().catch(() => ({}))).error ?? "không rõ"}`);
      }
    });
  };
  /** Nút của đáp án `status` bấm được: có lý do gõ hợp lệ, hoặc trống mà đáp án không bắt gõ. */
  const sanSang = (status: DecideStatus) => lyDoGui(status) !== null;
  return { pending, msg, decide, reason, setReason, sanSang, batGo: (status: DecideStatus) => batGoLyDo(item, status) };
}

/** Thẻ đã quyết: nhãn đáp án đã bấm (cùng bảng với badge danh sách) + lý do đã ghi (thẻ quyết trước PL3 không có lý do). */
export function DoneState({ item }: { item: ReviewItem }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div>
        <Badge variant={item.status === "approved" ? "success-light" : "outline"} data-review-done>{answerLabel(item, item.status)}</Badge>
      </div>
      {item.decision_note && (
        <p className="text-muted-foreground text-xs break-words whitespace-pre-line" data-review-decision-note>
          Lý do: {item.decision_note}
        </p>
      )}
    </div>
  );
}

/** Nút đáp án ở chân thẻ: mang số phím (OD2 · ĐC4) — phím `so` bấm đúng nút này, nút tắt thì phím không làm gì. */
export function NutDapAn({ so, children, ...props }: ComponentProps<typeof Button> & { so: number }) {
  // Kbd đứng cạnh nút, không trong nút: tên nút (chữ đáp án) giữ nguyên cho trình đọc màn hình; phím khai ở aria-keyshortcuts.
  return (
    <span className="inline-flex items-center gap-1">
      <Button size="sm" data-review-answer={so} aria-keyshortcuts={String(so)} {...props}>
        {children}
      </Button>
      <Kbd data-review-kbd aria-hidden>{so}</Kbd>
    </span>
  );
}

/** Chân thẻ chờ: ô lý do trên hàng nút. Lý do trống thì ghi nhãn đáp án (Q4); đáp án còn bắt gõ thì nút đó tắt. */
export function PendingActions({ d, extraBlock, batBo = false, children }: {
  d: ReturnType<typeof useDecide>;
  extraBlock?: string | null;
  /** Thẻ có đáp án «Bỏ» còn bắt gõ lý do (Bổ sung tin). */
  batBo?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="flex w-full flex-col gap-3">
      <ReviewReason value={d.reason} onChange={d.setReason} disabled={d.pending} batBo={batBo} />
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
  // HD17: thẻ Người dùng loại data_quality + mã `nguoi:` (theo tiền lệ agent_output + `enrich:`).
  if (item.item_type === "data_quality" && item.item_id?.startsWith("nguoi:")) return <NguoiCard item={item} render={children} />;
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

const DOI_CHIEU_LABEL: Record<DoiChieu["loai"], string> = { y_dinh: "Ý định tin", gia: "Giá rao", dien_tich: "Diện tích" };

function giaTriDoiChieu(loai: DoiChieu["loai"], v: string | number) {
  if (loai === "y_dinh") return listingIntentLabel(String(v)).label;
  const n = Number(v);
  if (!Number.isFinite(n)) return String(v);
  return loai === "gia" ? fmtGia(n) : `${String(n).replace(".", ",")} m²`;
}

/** Bộ đọc và AI khác nhau về ý định, giá, diện tích: hiện hai giá trị + câu trích; quyết định chỉ ghi nhật ký, tin không đổi. */
function DoiChieuBlock({ items }: { items: DoiChieu[] }) {
  return (
    <div className="flex flex-col gap-2" data-review-doi-chieu>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium">Đối chiếu</span>
        <Badge variant="warning-light">AI và bộ đọc khác nhau</Badge>
      </div>
      <p className="text-muted-foreground text-xs">Duyệt hay bỏ phần này chỉ ghi vào nhật ký, không đổi tin.</p>
      <ItemGroup>
        {items.map((x) => (
          <Item key={x.loai} variant="outline" size="xs" role="listitem" data-review-doi-chieu-loai={x.loai}>
            <ItemContent>
              <ItemDescription>{DOI_CHIEU_LABEL[x.loai] ?? x.loai}</ItemDescription>
              <ItemTitle>
                <span className="tabular-nums">Bộ đọc: {giaTriDoiChieu(x.loai, x.bo_doc)} · AI: {giaTriDoiChieu(x.loai, x.ai)}</span>
              </ItemTitle>
              <ItemDescription data-review-quote>«{x.trich}»</ItemDescription>
            </ItemContent>
          </Item>
        ))}
      </ItemGroup>
    </div>
  );
}

function AgentOutputCard({ item, media, context, render }: CardProps) {
  const d = useDecide(item);
  const [picked, setPicked] = useState<Record<string, string | undefined>>({});
  const ev = item.evidence as EnrichEvidence;
  const fields = Array.isArray(ev.fields) ? ev.fields : [];
  const doiChieu = doiChieuCua(ev);
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
        doiChieu.length === 0 ? <p className="text-muted-foreground text-xs">Thẻ thiếu dữ liệu đề xuất.</p> : null
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
      {doiChieu.length > 0 ? <DoiChieuBlock items={doiChieu} /> : null}
      <ReviewPhotos label="Tin" images={media?.offer} chiGoc={media?.chiGoc?.offer} />
      {context?.offer ? (
        <ReviewFullText label="Tin" ctx={context.offer} doanDau={ev.text} />
      ) : (
        <EvidenceExcerpt text={ev.text} group={ev.group_name} />
      )}
    </div>
  );
  const actions = fields.length === 0 && doiChieu.length === 0 ? null : item.status === "pending" ? (
    <PendingActions d={d} batBo extraBlock={chosen ? null : "Chọn một bên cho trường xung đột trước khi áp."}>
      <NutDapAn so={1} onClick={approve} disabled={d.pending || !d.sanSang("approved") || !chosen}>
        {fields.length === 0 ? "Ghi phán quyết" : "Áp dụng"}
      </NutDapAn>
      <NutDapAn so={2} variant="destructive" onClick={() => d.decide("rejected")} disabled={d.pending || !d.sanSang("rejected")}>
        Bỏ
      </NutDapAn>
      <NutDapAn so={3} variant="outline" onClick={() => d.decide("deferred")} disabled={d.pending || !d.sanSang("deferred")}>
        Để sau
      </NutDapAn>
    </PendingActions>
  ) : (
    <DoneState item={item} />
  );
  return render({ body, actions });
}

function EntityMatchCard({ item, media, context, render }: CardProps) {
  const d = useDecide(item);
  const ev = item.evidence as ReviewEvidence;
  // HD6: bảng so đọc giá trị sống (`ben`) khi ngữ cảnh có; `evidence` chỉ còn để hiện «Lúc chấm». `ben === null` = rời kho.
  const benA = context?.offer_a?.ben;
  const benB = context?.offer_b?.ben;
  const roiKho = [benA === null && "Tin A", benB === null && "Tin B"].filter((x): x is string => Boolean(x));
  const hangSo = soTruongGhepCan(
    benA ?? ev.offer_a ?? {},
    benB ?? ev.offer_b ?? {},
    context?.offer_a?.canCu,
    context?.offer_b?.canCu,
    { a: benA ? ev.offer_a : undefined, b: benB ? ev.offer_b : undefined },
  );
  // Không có khoá người = không biết (không hàng); `ben: null` = bên đã rời kho (ô «—», So Thiếu).
  const nguoiCua = (c: OfferContext | undefined) => (c?.ben === null ? null : c?.nguoiDang);
  const nguoiA = nguoiCua(context?.offer_a);
  const nguoiB = nguoiCua(context?.offer_b);
  const rows = nguoiA === undefined && nguoiB === undefined ? hangSo : [soNguoiDang(nguoiA ?? null, nguoiB ?? null, context?.offer_a?.toanVan), ...hangSo];
  const khoa = roiKho.length > 0;
  const body = (
    <div className="flex flex-col gap-4">
      {khoa && (
        <Alert variant="warning" data-review-roi-kho>
          <TriangleAlertIcon aria-hidden />
          {roiKho.map((ben) => (
            <AlertTitle key={ben} data-review-roi-kho-ben>{ben} không còn trong kho</AlertTitle>
          ))}
        </Alert>
      )}
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
      <NutDapAn so={1} onClick={() => d.decide("approved")} disabled={d.pending || !d.sanSang("approved") || khoa}>
        <CheckIcon data-icon="inline-start" aria-hidden />
        Cùng căn
      </NutDapAn>
      <NutDapAn so={2} variant="destructive" onClick={() => d.decide("rejected")} disabled={d.pending || !d.sanSang("rejected") || khoa}>
        <XIcon data-icon="inline-start" aria-hidden />
        Khác căn
      </NutDapAn>
      <NutDapAn so={3} variant="outline" onClick={() => d.decide("deferred")} disabled={d.pending || !d.sanSang("deferred") || khoa}>
        <CircleHelpIcon data-icon="inline-start" aria-hidden />
        Không chắc
      </NutDapAn>
    </PendingActions>
  ) : (
    <DoneState item={item} />
  );
  return render({ body, actions });
}
