// hang-ngay.ts — PL34 `doc-gop-hang-ngay`: đọc gộp toàn bộ bài S03 mới của một ngày (giờ VN) đã khử trùng theo tin, bằng
// model của bảng chọn PL30, trần tiền theo NGÀY CHI (giờ VN lúc chạy), chạy lại không gọi lại bài đã đọc.
// Luật 7: chỉ ghi silver_labels + ai_calls (qua chayLuot). Thiết kế: docs/superpowers/specs/2026-11-08-doc-gop-hang-ngay-design.md.
import { keHoach, napCauHinh } from "./cau-hinh.js";
import { chayLuot, dongDung, uocThe, type TomTatChay } from "./chay.js";
import type { TaoAnthropic, TaoModel } from "./doc.js";
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

export type CoHangNgay = {
  ngay?: string; tranNgayUsd: number; cauHinh?: string; thu: boolean;
  /** HT6: số lời cùng lúc (cờ --song-song hay biến DOC_GOP_SONG_SONG; mặc định 1). */
  songSong?: number;
  /** HT6: mốc hết giờ (cờ --het-gio hay biến DOC_GOP_HET_GIO, ISO). */
  hetGio?: Date | null;
};
export type TomTatHangNgay = {
  ngay_bai: string; ngay_chi: string; tho: number; bai_thu: number; su_kien: number; trung: number; don_vi: number;
  da_doc: number; bo: number; can_goi: number; goi: number; loi: number; json_hong: number; ghi: number; usd: number;
  chi_ngay_truoc: number; tran: number; cham_tran: boolean; con_lai: number; uoc_usd: number;
  dung?: "het-tien" | "khoa" | null; loi_dung?: string | null; chuyen_duong?: string[];
  het_gio?: boolean; bay_max?: number;
};
/** Mã thoát: 0 xong · 1 mọi lời gọi hỏng hoặc dừng vì khoá sai · 3 chạm trần · 4 dừng vì hết tiền (goi-thang-anthropic) ·
 * 6 đang có lượt đọc gộp khác (HT6) · 75 hết giờ, dừng đúng hẹn — đi tiếp, lượt sau đọc nốt (HT6, thống nhất với ZCode qua LL). */
export type KetQuaHangNgay = { ma: 0 | 1 | 3 | 4 | 6 | 75; tomTat: TomTatHangNgay; seGoi: string[] };
export const MA_HET_GIO = 75;
export const MA_DANG_CO_LUOT = 6;
export const DONG_DANG_CO_LUOT = "JOB FAIL [doc-gop-s03] dang-co-luot-khac";
/** Khoá phiên DB (pg advisory lock) cho MỘT lượt đọc gộp thật; tự nhả khi kết nối đóng. */
export const KHOA_LUOT: [number, number] = [7303, 34];
export const dongHetGio = (ngay: string, conLai: number): string => `JOB WARN [doc-gop-hang-ngay] het-gio: ${ngay} con lai ${conLai} loi goi`;

const CO = new Set(["--ngay", "--tran-ngay-usd", "--cau-hinh", "--thu", "--song-song", "--het-gio"]);

/** Số lời cùng lúc: số nguyên 1–16. */
function docSongSong(s: string | undefined, nhan: string): number | undefined {
  if (s === undefined || s === "") return undefined;
  const n = Number(s);
  if (!Number.isInteger(n) || n < 1 || n > 16) throw new Error(`SONG SONG SAI: ${nhan}=${s} (can so nguyen 1-16)`);
  return n;
}
/** Mốc hết giờ: thời điểm ISO đọc được. */
function docHetGio(s: string | undefined, nhan: string): Date | null {
  if (s === undefined || s === "") return null;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) throw new Error(`HET GIO SAI: ${nhan}=${s} (can thoi diem ISO)`);
  return d;
}

/** Ngày giờ VN của một thời điểm, dạng YYYY-MM-DD. */
export const ngayVn = (d: Date): string => new Date(d.getTime() + VN_MS).toISOString().slice(0, 10);

/** Ngày đúng khuôn và có thật (2026-13-40 bị từ chối). */
function ngayHopLe(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

/** Cờ của lệnh hang-ngay; sai thì ném lỗi gọi tên chỗ sai (lệnh thoát 2, chưa nối DB, chưa gọi model). */
export function docCoHangNgay(argv: string[], env: NodeJS.ProcessEnv = process.env): CoHangNgay {
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
  const songSong = m.has("--song-song") ? docSongSong(m.get("--song-song"), "--song-song") : docSongSong(env.DOC_GOP_SONG_SONG, "DOC_GOP_SONG_SONG");
  const hetGio = m.has("--het-gio") ? docHetGio(m.get("--het-gio"), "--het-gio") : docHetGio(env.DOC_GOP_HET_GIO, "DOC_GOP_HET_GIO");
  return { ngay, tranNgayUsd: tran, cauHinh: m.get("--cau-hinh"), thu: m.has("--thu"), songSong, hetGio };
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
  client: Q; co: CoHangNgay; bayGio?: Date; taoModel?: TaoModel; taoAnthropic?: TaoAnthropic; recordCall?: RecordCall;
  uoc?: (t: The, gia: { vao: number; ra: number }) => number; log?: (s: string) => void; logLoi?: (s: string) => void;
  /** HT6 lượt bù: trần tiền còn lại của riêng lượt (bên cạnh trần ngày chi) và nhãn run_id. */
  tranLuotConLai?: number; nhanRun?: string;
  /** HT6: tiêm đồng hồ và nhịp 429 cho test. */
  dongHo?: () => number; nhip?: { tamDungMs?: number; tangLaiMs?: number };
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

  // HT6: một lượt thật tại một thời điểm — lượt bù lỡ chồng lượt đêm thì lượt sau lui, không gọi đôi, không giữ chỗ tiền đôi.
  const { rows: [khoa] } = await o.client.query(`SELECT pg_try_advisory_lock($1, $2) AS ok`, KHOA_LUOT);
  if (!(khoa as { ok: boolean }).ok) {
    logLoi(`${DONG_DANG_CO_LUOT}: ngay ${ngayBai} chua goi model lan nao`);
    return { ma: MA_DANG_CO_LUOT, tomTat: tom, seGoi };
  }
  try {
    return await chayCoKhoa();
  } finally {
    await o.client.query(`SELECT pg_advisory_unlock($1, $2)`, KHOA_LUOT).catch(() => {});
  }

  async function chayCoKhoa(): Promise<KetQuaHangNgay> {
  const conTran = Math.min(o.co.tranNgayUsd - chiTruoc, o.tranLuotConLai ?? Infinity);
  let kq: TomTatChay | null = null;
  if (canDoc.length && conTran <= 0) {
    tom.cham_tran = true;
    tom.con_lai = canDoc.length;
  } else if (canDoc.length) {
    kq = await chayLuot({
      client: o.client, the: canDoc, doDaDoc: true, goiDenTran: true, taoModel: o.taoModel, taoAnthropic: o.taoAnthropic, recordCall: o.recordCall, uoc, log,
      dongHo: o.dongHo, nhip: o.nhip,
      co: {
        post: seGoi, tranUsd: conTran, cauHinh: o.co.cauHinh, songSong: o.co.songSong, hetGio: o.co.hetGio,
        runId: `pl34-${ngayChi}-b${ngayBai}-${o.nhanRun ? `${o.nhanRun}-` : ""}${bayGio.toISOString()}`,
      },
    });
    Object.assign(tom, { goi: kq.goi, loi: kq.loi, json_hong: kq.hong, ghi: kq.ghi, usd: Number(kq.usd.toFixed(6)), cham_tran: kq.dungTran, con_lai: kq.conLai, dung: kq.dung, loi_dung: kq.loiDung, chuyen_duong: kq.chuyenDuong, het_gio: kq.hetGio, bay_max: kq.bayMax });
    for (const d of kq.chuyenDuong) logLoi(d); // stderr: cảnh báo bám vào «credit một đường đã cạn»
  }
  if (kq?.dung) {
    logLoi(dongDung(kq));
    return { ma: kq.dung === "het-tien" ? 4 : 1, tomTat: tom, seGoi };
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
  if (kq?.hetGio) {
    logLoi(dongHetGio(ngayBai, tom.con_lai));
    return { ma: MA_HET_GIO, tomTat: tom, seGoi };
  }
  return { ma: 0, tomTat: tom, seGoi };
  }
}

// ── HT6 lượt bù theo khoảng ngày ────────────────────────────────────────────────────────────────────────────────────────────
export const BU_TOI_DA_NGAY = 14;
export type CoBu = { tu: string; den: string; tranNgayUsd: number; tranLuotUsd: number | null; cauHinh?: string; thu: boolean; songSong?: number; hetGio?: Date | null };
const CO_BU = new Set(["--tu", "--den", "--tran-ngay-usd", "--tran-luot-usd", "--cau-hinh", "--thu", "--song-song", "--het-gio"]);

/** Cờ của lệnh bu; sai thì ném lỗi gọi tên chỗ sai (lệnh thoát 2, chưa nối DB). */
export function docCoBu(argv: string[], env: NodeJS.ProcessEnv = process.env): CoBu {
  const m = new Map<string, string>();
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith("--")) throw new Error(`doi so la: ${a}`);
    if (!CO_BU.has(a)) throw new Error(`co khong nhan: ${a} (chi ${[...CO_BU].join(" ")})`);
    if (a === "--thu") m.set(a, "1");
    else m.set(a, argv[++i] ?? "");
  }
  const tu = m.get("--tu"), den = m.get("--den");
  if (!tu || !ngayHopLe(tu)) throw new Error(`NGAY SAI KHUON: --tu ${tu ?? "(vang)"} (can YYYY-MM-DD)`);
  if (!den || !ngayHopLe(den)) throw new Error(`NGAY SAI KHUON: --den ${den ?? "(vang)"} (can YYYY-MM-DD)`);
  if (tu > den) throw new Error(`KHOANG NGUOC: --tu ${tu} sau --den ${den}`);
  const soNgay = Math.round((Date.parse(`${den}T00:00:00Z`) - Date.parse(`${tu}T00:00:00Z`)) / 86400e3) + 1;
  if (soNgay > BU_TOI_DA_NGAY) throw new Error(`KHOANG QUA DAI: ${soNgay} ngay (toi da ${BU_TOI_DA_NGAY})`);
  const so = (k: string): number | null => {
    const s = m.get(k);
    if (s === undefined) return null;
    const n = Number(s);
    if (s.trim() === "" || !Number.isFinite(n) || n < 0) throw new Error(`TRAN SAI: ${k} ${s} (can so USD >= 0)`);
    return n;
  };
  const hn = docCoHangNgay([...(m.has("--song-song") ? ["--song-song", m.get("--song-song")!] : []), ...(m.has("--het-gio") ? ["--het-gio", m.get("--het-gio")!] : [])], env);
  return {
    tu, den, tranNgayUsd: so("--tran-ngay-usd") ?? TRAN_NGAY_MAC_DINH, tranLuotUsd: so("--tran-luot-usd"), cauHinh: m.get("--cau-hinh"),
    thu: m.has("--thu"), songSong: hn.songSong, hetGio: hn.hetGio,
  };
}

/** Các ngày từ tu tới den (cũ trước). */
export function cacNgay(tu: string, den: string): string[] {
  const ra: string[] = [];
  for (let d = Date.parse(`${tu}T00:00:00Z`); d <= Date.parse(`${den}T00:00:00Z`); d += 86400e3) ra.push(new Date(d).toISOString().slice(0, 10));
  return ra;
}

export type KetQuaBu = { ma: KetQuaHangNgay["ma"]; ngay: TomTatHangNgay[]; tong: { ngay: number; don_vi: number; da_doc: number; can_goi: number; uoc_usd: number; goi: number; usd: number } };

/** Lượt bù: chạy hang-ngay cho từng ngày bài từ cũ tới mới, chung trần ngày chi với lượt đêm, thêm trần riêng của lượt.
 * Dừng ở mã khác 0 đầu tiên (trừ ngày không có gì để gọi). In một dòng «bu tong». */
export async function chayBu(o: {
  client: Q; co: CoBu; bayGio?: Date; taoModel?: TaoModel; taoAnthropic?: TaoAnthropic; recordCall?: RecordCall;
  uoc?: (t: The, gia: { vao: number; ra: number }) => number; log?: (s: string) => void; logLoi?: (s: string) => void;
  dongHo?: () => number; nhip?: { tamDungMs?: number; tangLaiMs?: number };
}): Promise<KetQuaBu> {
  const log = o.log ?? console.log;
  const ngay: TomTatHangNgay[] = [];
  let ma: KetQuaHangNgay["ma"] = 0;
  let daChi = 0;
  for (const d of cacNgay(o.co.tu, o.co.den)) {
    const conLuot = o.co.tranLuotUsd === null ? undefined : o.co.tranLuotUsd - daChi;
    const kq = await chayHangNgay({
      client: o.client, bayGio: o.bayGio, taoModel: o.taoModel, taoAnthropic: o.taoAnthropic, recordCall: o.recordCall, uoc: o.uoc,
      log: o.log, logLoi: o.logLoi, dongHo: o.dongHo, nhip: o.nhip, nhanRun: "bu", tranLuotConLai: conLuot,
      co: { ngay: d, tranNgayUsd: o.co.tranNgayUsd, cauHinh: o.co.cauHinh, thu: o.co.thu, songSong: o.co.songSong, hetGio: o.co.hetGio },
    });
    ngay.push(kq.tomTat);
    daChi += kq.tomTat.usd;
    if (kq.ma !== 0) { ma = kq.ma; break; }
  }
  const tong = {
    ngay: ngay.length, don_vi: ngay.reduce((s, x) => s + x.don_vi, 0), da_doc: ngay.reduce((s, x) => s + x.da_doc, 0),
    can_goi: ngay.reduce((s, x) => s + x.can_goi, 0), uoc_usd: Number(ngay.reduce((s, x) => s + x.uoc_usd, 0).toFixed(6)),
    goi: ngay.reduce((s, x) => s + x.goi, 0), usd: Number(daChi.toFixed(6)),
  };
  log(`bu tong ${o.co.tu}..${o.co.den}: ${tong.ngay} ngay, ${tong.don_vi} don vi, ${tong.da_doc} da doc, ${tong.can_goi} can goi, uoc ${tong.uoc_usd.toFixed(4)} USD, da goi ${tong.goi}, da chi ${tong.usd.toFixed(4)} USD`);
  return { ma, ngay, tong };
}
