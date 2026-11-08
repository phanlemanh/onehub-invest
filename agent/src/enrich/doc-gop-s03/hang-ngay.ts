// hang-ngay.ts — PL34 `doc-gop-hang-ngay`: đọc gộp toàn bộ bài S03 mới của một ngày (giờ VN) đã khử trùng theo tin, bằng
// model của bảng chọn PL30, trần tiền theo NGÀY CHI (giờ VN lúc chạy), chạy lại không gọi lại bài đã đọc.
// Luật 7: chỉ ghi silver_labels + ai_calls (qua chayLuot). Thiết kế: docs/superpowers/specs/2026-11-08-doc-gop-hang-ngay-design.md.
import { keHoach, napCauHinh } from "./cau-hinh.js";
import { chayLuot, uocThe, type TomTatChay } from "./chay.js";
import type { TaoModel } from "./doc.js";
import { PROMPT_VERSION } from "./prompt.js";
import type { RecordCall } from "../../runtime/ai-call-log.js";
import { docTheTheoPost, type Q, type The } from "./the.js";
// @ts-expect-error — mô-đun .mjs của pipeline, không có kiểu
import { khuTrung } from "../../../../pipeline/lib/eval-labels.mjs";
// @ts-expect-error — mô-đun .mjs của pipeline, không có kiểu
import { testMarker } from "../../../../pipeline/lib/test-posts.mjs";

export const TRAN_NGAY_MAC_DINH = 20;
export const DONG_CHAM_TRAN = "CHAM TRAN DOC GOP HANG NGAY";
const VN_MS = 7 * 3600e3;

export type CoHangNgay = { ngay?: string; tranNgayUsd: number; cauHinh?: string; thu: boolean };
export type TomTatHangNgay = {
  ngay_bai: string; ngay_chi: string; tho: number; bai_thu: number; su_kien: number; trung: number; don_vi: number;
  da_doc: number; bo: number; can_goi: number; goi: number; loi: number; json_hong: number; ghi: number; usd: number;
  chi_ngay_truoc: number; tran: number; cham_tran: boolean; con_lai: number; uoc_usd: number;
};
export type KetQuaHangNgay = { ma: 0 | 1 | 3; tomTat: TomTatHangNgay; seGoi: string[] };

const CO = new Set(["--ngay", "--tran-ngay-usd", "--cau-hinh", "--thu"]);

/** Ngày giờ VN của một thời điểm, dạng YYYY-MM-DD. */
export const ngayVn = (d: Date): string => new Date(d.getTime() + VN_MS).toISOString().slice(0, 10);

/** Ngày đúng khuôn và có thật (2026-13-40 bị từ chối). */
function ngayHopLe(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

/** Cờ của lệnh hang-ngay; sai thì ném lỗi gọi tên chỗ sai (lệnh thoát 2, chưa nối DB, chưa gọi model). */
export function docCoHangNgay(argv: string[]): CoHangNgay {
  const m = new Map<string, string>();
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith("--")) throw new Error(`doi so la: ${a}`);
    if (!CO.has(a)) throw new Error(`co khong nhan: ${a} (chi ${[...CO].join(" ")})`);
    if (a === "--thu") m.set(a, "1");
    else m.set(a, argv[++i] ?? "");
  }
  const ngay = m.get("--ngay");
  if (ngay !== undefined && !ngayHopLe(ngay)) throw new Error(`NGAY SAI KHUON: ${ngay} (can YYYY-MM-DD)`);
  const tranTho = m.get("--tran-ngay-usd");
  const tran = tranTho === undefined ? TRAN_NGAY_MAC_DINH : Number(tranTho);
  if (tranTho !== undefined && (tranTho.trim() === "" || !Number.isFinite(tran) || tran < 0)) throw new Error(`TRAN SAI: ${tranTho} (can so USD >= 0)`);
  return { ngay, tranNgayUsd: tran, cauHinh: m.get("--cau-hinh"), thu: m.has("--thu") };
}

/** Khoảng [00:00, 24:00) giờ VN của một ngày, dạng ISO. */
export function khoangNgayVn(ngay: string): [string, string] {
  const tu = new Date(`${ngay}T00:00:00+07:00`);
  return [tu.toISOString(), new Date(tu.getTime() + 86400e3).toISOString()];
}

type Bai = { post_id: string; snapshot_id: string | null; agent_id: string | null; text: string | null; group_name: string | null };
export type PhamVi = { tho: number; bai_thu: number; su_kien: number; trung: number; donVi: { post_id: string; text_hash: string }[] };

/** Bài S03 của ngày D (giờ VN), gạt bài thử (testMarker) và sự kiện, khử trùng theo tin rồi theo chữ (khuTrung, luật GN2). */
export async function phamViNgay(c: Q, ngay: string): Promise<PhamVi> {
  const [tu, den] = khoangNgayVn(ngay);
  const { rows } = await c.query(
    `SELECT DISTINCT ON (post_id) post_id, snapshot_id, agent_id, text, group_name FROM stg_zalo_posts
      WHERE (agent_id IS NULL OR agent_id <> 'apify-facebook') AND coalesce(posted_at, captured_at) >= $1 AND coalesce(posted_at, captured_at) < $2
      ORDER BY post_id, captured_at DESC`, [tu, den]);
  const tho = rows as Bai[];
  const thuong = tho.filter((r) => !testMarker(r));
  const { rows: tin } = await c.query(
    `SELECT DISTINCT ON (pid) pid, r.offer_id FROM sale_offer_records r, unnest(r.post_ids) AS pid
      WHERE r.source = 'S03' AND pid = ANY ($1) ORDER BY pid, (r.retired_at IS NULL) DESC, r.offer_id`, [thuong.map((r) => r.post_id)]);
  const tinCua = new Map((tin as { pid: string; offer_id: string }[]).map((r) => [r.pid, r.offer_id]));
  const kt = khuTrung(thuong, tinCua) as { dai: { post_id: string; text_hash: string }[]; bo_su_kien: number; bo_vi_trung: number };
  return {
    tho: tho.length, bai_thu: tho.length - thuong.length, su_kien: kt.bo_su_kien, trung: kt.bo_vi_trung,
    donVi: kt.dai.map((p) => ({ post_id: p.post_id, text_hash: p.text_hash })),
  };
}

/** Tiền đã chi của PL34 trong một ngày chi: cost_usd của silver_labels có run_id `pl34-<ngày chi>-…`. */
export async function chiNgay(c: Q, ngayChi: string): Promise<number> {
  const { rows: [r] } = await c.query(
    `SELECT coalesce(sum(cost_usd), 0)::float8 AS usd FROM silver_labels WHERE run_id LIKE $1`, [`pl34-${ngayChi}-%`]);
  return Number(r.usd);
}

/** Cặp (bài, model) đã có nhãn đọc được — đúng luật của chay PL30: cùng post_id, text_hash, model, prompt. */
async function daDoc(c: Q, the: The[], promptVersion: string): Promise<Set<string>> {
  if (!the.length) return new Set();
  const { rows } = await c.query(
    `SELECT post_id, text_hash, model FROM silver_labels WHERE source_code = 'S03' AND prompt_version = $1 AND json_ok AND post_id = ANY ($2)`,
    [promptVersion, the.map((t) => t.post_id)]);
  return new Set((rows as { post_id: string; text_hash: string; model: string }[]).map((r) => `${r.post_id}|${r.text_hash}|${r.model}`));
}

export async function chayHangNgay(o: {
  client: Q; co: CoHangNgay; bayGio?: Date; taoModel?: TaoModel; recordCall?: RecordCall;
  uoc?: (t: The, gia: { vao: number; ra: number }) => number; log?: (s: string) => void; logLoi?: (s: string) => void;
}): Promise<KetQuaHangNgay> {
  const log = o.log ?? console.log;
  const logLoi = o.logLoi ?? console.error;
  const bayGio = o.bayGio ?? new Date();
  const ngayChi = ngayVn(bayGio);
  const ngayBai = o.co.ngay ?? ngayVn(new Date(bayGio.getTime() - 86400e3));
  const cau = napCauHinh(o.co.cauHinh); // bảng sai → ném trước mọi lời gọi
  const uoc = o.uoc ?? uocThe;

  const pv = await phamViNgay(o.client, ngayBai);
  const tatCa = await docTheTheoPost(o.client, pv.donVi.map((d) => d.post_id));
  const the = tatCa.filter((t) => t.text.trim() || t.anh.length);
  const bo = pv.donVi.length - the.length;
  const da = await daDoc(o.client, the, PROMPT_VERSION);
  const { nhom } = keHoach(cau.cauHinh);
  const chuaDoc = (t: The) => nhom.some((n) => !da.has(`${t.post_id}|${t.text_hash}|gateway:${n.gateway}`));
  const canDoc = the.filter(chuaDoc);
  const daDocSo = the.length - canDoc.length;
  const uocUsd = canDoc.reduce((s, t) => s + nhom.reduce((x, n) => x + uoc(t, n.gia), 0), 0);
  const chiTruoc = await chiNgay(o.client, ngayChi);
  const tom: TomTatHangNgay = {
    ngay_bai: ngayBai, ngay_chi: ngayChi, tho: pv.tho, bai_thu: pv.bai_thu, su_kien: pv.su_kien, trung: pv.trung,
    don_vi: pv.donVi.length, da_doc: daDocSo, bo, can_goi: canDoc.length, goi: 0, loi: 0, json_hong: 0, ghi: 0, usd: 0,
    chi_ngay_truoc: chiTruoc, tran: o.co.tranNgayUsd, cham_tran: false, con_lai: 0, uoc_usd: Number(uocUsd.toFixed(6)),
  };
  const seGoi = canDoc.map((t) => t.post_id);
  log(`hang-ngay ${ngayBai} (chi ${ngayChi}): ${pv.tho} bai tho, ${pv.donVi.length} don vi, ${daDocSo} da doc, ${canDoc.length} can goi, uoc ${uocUsd.toFixed(4)} USD / tran ${o.co.tranNgayUsd} (da chi ${chiTruoc.toFixed(4)})`);
  if (o.co.thu) return { ma: 0, tomTat: tom, seGoi };

  const conTran = o.co.tranNgayUsd - chiTruoc;
  let kq: TomTatChay | null = null;
  if (canDoc.length && conTran <= 0) {
    tom.cham_tran = true;
    tom.con_lai = canDoc.length;
  } else if (canDoc.length) {
    kq = await chayLuot({
      client: o.client, the: canDoc, doDaDoc: true, goiDenTran: true, taoModel: o.taoModel, recordCall: o.recordCall, uoc, log,
      co: { post: seGoi, tranUsd: conTran, cauHinh: o.co.cauHinh, runId: `pl34-${ngayChi}-b${ngayBai}-${bayGio.toISOString()}` },
    });
    Object.assign(tom, { goi: kq.goi, loi: kq.loi, json_hong: kq.hong, ghi: kq.ghi, usd: Number(kq.usd.toFixed(6)), cham_tran: kq.dungTran, con_lai: kq.conLai });
  }
  if (tom.cham_tran) {
    logLoi(`${DONG_CHAM_TRAN} ${o.co.tranNgayUsd} USD ngay ${ngayChi}: da chi ${(chiTruoc + tom.usd).toFixed(4)}, con lai ${tom.con_lai} loi goi`);
    return { ma: 3, tomTat: tom, seGoi };
  }
  if (kq && kq.goi > 0 && kq.loi + kq.hong === kq.goi) {
    const lop = [...kq.lopLoi, ...(kq.hong ? ["json-hong"] : [])].join(" + ");
    logLoi(`hang-ngay: moi loi goi hong (${kq.goi}/${kq.goi}: ${lop})`);
    return { ma: 1, tomTat: tom, seGoi };
  }
  return { ma: 0, tomTat: tom, seGoi };
}
