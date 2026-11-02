// vlm-anh.mjs — KC3 `vlm-anh-tin-s03`: chọn bài S03 mà chữ không đủ, dựng danh sách ảnh trên đĩa, đếm nhãn ảnh, rút phiếu gắn tay.
// Không gọi model (không import gói `ai`, không fetch): phần gọi model ở agent/src/agents/vlm-anh-s03.ts. Hàm thuần trừ phần đọc đĩa.
import { createHash } from "node:crypto";
import { closeSync, existsSync, mkdirSync, openSync, readFileSync, readSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { coDauHieuBds, gatSo, laYeuCau, parsePost } from "../transform-zalo.mjs";
import { localFile } from "../media-rows.mjs";
import { textHash } from "./eval-labels.mjs";
import { ganBaiAnh, laChiAnh } from "./gop-anh.mjs";
import { loadStgPosts, testMarker } from "./test-posts.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
export const ROOT = resolve(HERE, "../..");
export const TRAN_ANH = 4;
export const MAX_BYTES = 5 * 1024 * 1024; // giới hạn 5 MB mỗi ảnh của tài liệu Claude Vision
export const NGUONG_DUNG_CHUNG = 10;
const SHA = /^[0-9a-f]{64}$/;

// Loại hình trên chữ bài: không có trường riêng ở parsePost, đo 02/11 bằng đúng biểu thức này.
const LOAI_HINH = /(căn\s*hộ|chung\s*cư|\bstudio\b|\bccmn\b|duplex|penthouse|shophouse|biệt\s*thự|liền\s*kề|nhà\s*phố|nhà\s*riêng|nhà\s*mặt|\bđất\b|phòng\s*trọ|\d+\s*(?:pn|phòng\s*ngủ)\b|\d+\s*n\s*\+?\s*\d?(?![a-zà-ỹđ]))/iu;

/** Lý do chữ bài chưa đủ — rỗng là đủ cả ba. */
export function lyDoThieu(text) {
  const pr = parsePost(text);
  const out = [];
  if (pr.priceVnd == null && pr.pricePerm2Vnd == null) out.push("thieu_gia");
  if (!coDauHieuBds(text)) out.push("thieu_dau_hieu");
  if (!LOAI_HINH.test(gatSo(text ?? ""))) out.push("thieu_loai_hinh");
  return out;
}

/** Gốc thư mục ảnh: SNAPSHOTS_DIR, rồi snapshots của kho, rồi của checkout chính khi đang đứng trong worktree. */
export function gocAnh() {
  if (process.env.SNAPSHOTS_DIR) return process.env.SNAPSHOTS_DIR;
  const tai = join(ROOT, "collector/snapshots");
  if (existsSync(tai)) return tai;
  const m = ROOT.match(/^(.*)[/\\]\.claude[/\\]worktrees[/\\][^/\\]+$/);
  return m ? join(m[1], "collector/snapshots") : tai;
}

function mimeTuByte(b) {
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return "image/png";
  if (b.toString("latin1", 0, 4) === "RIFF" && b.toString("latin1", 8, 12) === "WEBP") return "image/webp";
  return null;
}

function docDau(tep) {
  const fd = openSync(tep, "r");
  try {
    const b = Buffer.alloc(12);
    readSync(fd, b, 0, 12, 0);
    return b;
  } finally {
    closeSync(fd);
  }
}

/** Một dòng stg → các lượt ảnh của nó. */
export function luotTuDong(dong, nguon) {
  if (!dong || !Array.isArray(dong.media_files)) return [];
  return dong.media_files.map((entry) => ({ entry, snapshot: dong.snapshot_id, nguon }));
}

/**
 * Lượt ảnh → ảnh dùng được: chỉ tệp thật, gộp sha256 trong bài TRƯỚC khi tính trần, ảnh riêng trước ảnh ghép.
 * @returns {{ anh: {sha256:string, tep:string, local:string, mime:string, nguon:string}[], bo: Record<string, number> }}
 */
export function danhSachAnh(luot, { goc = gocAnh(), tran = TRAN_ANH, maxBytes = MAX_BYTES } = {}) {
  const bo = {};
  const tang = (k, n = 1) => { bo[k] = (bo[k] ?? 0) + n; };
  const theoSha = new Map();
  for (const { entry, snapshot, nguon } of luot) {
    if (entry.error) { tang("entry-loi"); continue; }
    const local = localFile(entry, snapshot);
    if (!local) { tang("duong-xau"); continue; }
    const tep = join(goc, local.split("__")[0], local);
    let st;
    try { st = statSync(tep); } catch { tang("thieu-tep"); continue; }
    if (!st.isFile()) { tang("thieu-tep"); continue; }
    if (st.size > maxBytes) { tang("qua-co"); continue; }
    const mime = mimeTuByte(docDau(tep));
    if (!mime) { tang("sai-dinh-dang"); continue; }
    const sha256 = typeof entry.sha256 === "string" && SHA.test(entry.sha256)
      ? entry.sha256
      : createHash("sha256").update(readFileSync(tep)).digest("hex");
    const co = theoSha.get(sha256);
    if (co) {
      tang("trung-sha");
      if (nguon === "rieng") co.nguon = "rieng";
      continue;
    }
    theoSha.set(sha256, { sha256, tep, local, mime, nguon });
  }
  const tatCa = [...theoSha.values()];
  const xep = [...tatCa.filter((a) => a.nguon === "rieng"), ...tatCa.filter((a) => a.nguon !== "rieng")];
  if (xep.length > tran) tang("qua-tran", xep.length - tran);
  return { anh: xep.slice(0, tran), bo };
}

/** Theo từng sha256 trên cả tập đọc: số bài, số lượt riêng, số lượt ghép, các bài dùng. */
export function thongKeSha(tap) {
  const m = new Map();
  for (const b of tap) {
    for (const a of b.anh) {
      if (!m.has(a.sha256)) m.set(a.sha256, { sha256: a.sha256, tep: a.tep, local: a.local, mime: a.mime, so_bai: 0, so_luot_rieng: 0, so_luot_ghep: 0, bai: [] });
      const s = m.get(a.sha256);
      s.so_bai += 1;
      if (a.nguon === "ghep") s.so_luot_ghep += 1;
      else s.so_luot_rieng += 1;
      s.bai.push({ post_id: b.post_id, text: b.text, nguon: a.nguon });
    }
  }
  return m;
}

/**
 * Chọn tập đọc: bài chữ thật, không phải Yêu cầu, thiếu ít nhất một dữ kiện, còn ít nhất một ảnh dùng được (riêng + ghép).
 * @param {object[]} posts dòng stg (post_id, text, posted_at, sender_id, conversation_id, snapshot_id…)
 * @param {Map<string, {snapshot_id: string, media_files: unknown[]}>} media ảnh theo post_id
 */
export function chonTapDoc(posts, media, opts = {}) {
  const loai = [];
  const that = posts.filter((p) => {
    if (!testMarker(p)) return true;
    loai.push({ post_id: p.post_id, ly_do: "bai-thu" });
    return false;
  });
  const chu = that.filter((p) => !laChiAnh(p.text));
  const baiAnh = that.filter((p) => laChiAnh(p.text));
  const gan = ganBaiAnh(chu, baiAnh);
  const theoChu = new Map();
  for (const a of baiAnh) {
    const c = gan.get(a.post_id);
    loai.push({ post_id: a.post_id, ly_do: c ? "chi-anh-da-gan" : "chi-anh-khong-gan" });
    if (c) theoChu.set(c, [...(theoChu.get(c) ?? []), a.post_id]);
  }
  const tap = [];
  const bo = {};
  for (const p of chu) {
    const boLoai = (ly_do) => loai.push({ post_id: p.post_id, ly_do });
    const luot = [...luotTuDong(media.get(p.post_id), "rieng"), ...(theoChu.get(p.post_id) ?? []).flatMap((a) => luotTuDong(media.get(a), "ghep"))];
    if (laYeuCau(p.text)) { boLoai("yeu-cau"); continue; }
    const ly_do = lyDoThieu(p.text);
    if (!ly_do.length) { boLoai("du-ca-ba"); continue; }
    if (!luot.length) { boLoai("khong-anh"); continue; }
    const ds = danhSachAnh(luot, opts);
    for (const [k, n] of Object.entries(ds.bo)) bo[k] = (bo[k] ?? 0) + n;
    if (!ds.anh.length) { boLoai("het-anh"); continue; }
    tap.push({ post_id: p.post_id, text: p.text, text_hash: textHash(p.text), posted_at: p.posted_at, ly_do, anh: ds.anh });
  }
  const sha = thongKeSha(tap);
  for (const b of tap) for (const a of b.anh) a.so_bai_dung_chung = sha.get(a.sha256).so_bai;
  // Mới trước, post_id ngắt hoà: lô --limit lặp lại được.
  tap.sort((x, y) => (new Date(y.posted_at).getTime() || 0) - (new Date(x.posted_at).getTime() || 0) || String(x.post_id).localeCompare(String(y.post_id)));
  return { tap, loai, bo };
}

/** Tập đọc từ DB local: bài thật qua loadStgPosts, ảnh theo dòng mới nhất có media_files. */
export async function napTapDoc(client, opts = {}) {
  const { posts } = await loadStgPosts(client, "zalo");
  const { rows } = await client.query(
    `SELECT DISTINCT ON (post_id) post_id, snapshot_id, media_files FROM stg_zalo_posts
     WHERE jsonb_typeof(media_files) = 'array' ORDER BY post_id, captured_at DESC`);
  return chonTapDoc(posts, new Map(rows.map((r) => [r.post_id, r])), opts);
}

// ==== phiếu gắn tay ====
const bam = (s) => createHash("sha256").update(s).digest("hex");
const TANG = ["dung-tu-10-bai", "co-luot-ghep", "con-lai"];
const tangCua = (s) => (s.so_bai >= NGUONG_DUNG_CHUNG ? TANG[0] : s.so_luot_ghep > 0 ? TANG[1] : TANG[2]);

/** Ô đáp án của phiếu — để trống cho người điền; không có khoá dự đoán model. */
export const NHAN_TRONG = Object.freeze({ gia: null, loai_hinh: null, thuoc_bai: null, lo_nguon: null, bedrooms_total: null, living_area_m2: null, unit_number: null, building_name: null, subdivision_name: null, loai_anh: null });

/**
 * Rút phiếu: mỗi sha256 tối đa một lần, chia đều ba tầng (tầng cạn thì tầng khác bù), tái lập theo seed.
 * Bài đại diện chọn theo seed, ưu tiên bài có ảnh này qua ghép.
 */
export function rutMau(tap, { n, seed, boQua = new Set() }) {
  const theoTang = new Map(TANG.map((t) => [t, []]));
  for (const s of thongKeSha(tap).values()) if (!boQua.has(s.sha256)) theoTang.get(tangCua(s)).push(s);
  for (const ds of theoTang.values()) ds.sort((a, b) => bam(`${seed}|${a.sha256}`).localeCompare(bam(`${seed}|${b.sha256}`)));
  const hang = [];
  for (let i = 0; hang.length < n && TANG.some((t) => theoTang.get(t).length > i); i++) {
    for (const t of TANG) {
      const s = theoTang.get(t)[i];
      if (!s || hang.length >= n) continue;
      const ghep = s.bai.filter((b) => b.nguon === "ghep");
      const ungVien = ghep.length ? ghep : s.bai;
      const dd = [...ungVien].sort((a, b) => bam(`${seed}|${a.post_id}`).localeCompare(bam(`${seed}|${b.post_id}`)))[0];
      hang.push({ sha256: s.sha256, tep: s.tep, local: s.local, mime: s.mime, tang: t, so_luot_rieng: s.so_luot_rieng, so_luot_ghep: s.so_luot_ghep, so_bai_dung_chung: s.so_bai, bai_dai_dien: { post_id: dd.post_id, nguon: dd.nguon, chu: dd.text }, nhan: { ...NHAN_TRONG } });
    }
  }
  return hang;
}

/** Đường phiếu tuyệt đối — chỉ nhận đích trong research-local/ (phiếu mang chữ bài, không rời máy). */
export function dichPhieu(out, root = ROOT) {
  const goc = join(root, "research-local") + sep;
  const dich = resolve(root, out);
  if (!dich.startsWith(goc)) throw new Error("vlm-anh: phiếu chỉ được ghi trong research-local/");
  return dich;
}

/** Đọc phiếu JSONL; tệp chưa có → rỗng. */
export function docPhieu(tep) {
  if (!existsSync(tep)) return [];
  return readFileSync(tep, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l));
}

/** Ghi hàng vào phiếu. Đã có phiếu thì nối đuôi, không bao giờ đè đáp án người đã gắn. */
export function ghiPhieu(out, hang, root = ROOT) {
  const dich = dichPhieu(out, root);
  mkdirSync(dirname(dich), { recursive: true });
  const cu = docPhieu(dich);
  writeFileSync(dich, [...cu, ...hang].map((h) => JSON.stringify(h)).join("\n") + "\n");
  return dich;
}

// ==== đếm ====
const TRUONG = ["price_vnd", "property_type", "bedrooms_total", "living_area_m2", "unit_number", "building_name", "subdivision_name"];
const coGiaTri = (v) => v !== null && v !== undefined && v !== "";

/** Bài có lấp đúng một lý do thiếu của nó không (dấu hiệu BĐS: có giá hoặc loại hình đều tính). */
function lapDung(lyDo, p) {
  const gia = coGiaTri(p.price_vnd), loai = coGiaTri(p.property_type);
  return lyDo.some((l) => (l === "thieu_gia" ? gia : l === "thieu_loai_hinh" ? loai : gia || loai));
}

const nhomMoi = () => ({ bai: 0, tot: 0, rong: 0, loi: 0, chuaDoc: 0, lapDung: 0 });

/**
 * Bảng đếm theo model + bản prompt. Bốn nhóm (tốt · rỗng · lỗi · chưa đọc) cộng bằng tập đọc.
 * @param {object[]} tap từ chonTapDoc
 * @param {{post_id:string,text_hash:string,model:string,prompt_version:string,probabilities:any,error_kind:string|null,json_ok:boolean,latency_ms:number|null}[]} rows dòng silver_labels nguồn ảnh
 */
export function demNhan(tap, rows) {
  const sha = thongKeSha(tap);
  const theoLyDo = {};
  for (const b of tap) for (const l of b.ly_do) theoLyDo[l] = (theoLyDo[l] ?? 0) + 1;
  const nhomModel = new Map();
  for (const r of rows) {
    const k = `${r.model}|${r.prompt_version}`;
    if (!nhomModel.has(k)) nhomModel.set(k, { model: r.model, prompt_version: r.prompt_version, dong: new Map() });
    nhomModel.get(k).dong.set(`${r.post_id}|${r.text_hash}`, r);
  }
  const models = [...nhomModel.values()].map(({ model, prompt_version, dong }) => {
    const m = { model, prompt_version, ...nhomMoi(), lapTheoLyDo: {}, dungChung10: nhomMoi(), tapAnhDoi: 0, anhTheoLoai: {}, anhLoNguon: 0, baiLoNguon: 0, jsonHong: 0, loUrl: 0, loiTheoLop: {}, coTruong: Object.fromEntries(TRUONG.map((t) => [t, 0])), xungDot: 0, anhDaDoc: 0, shaChuaDoc: 0, tongMs: 0, soAnhGoi: 0 };
    delete m.bai;
    const anhTot = new Map();
    for (const b of tap) {
      const r = dong.get(`${b.post_id}|${b.text_hash}`);
      const n10 = b.anh.every((a) => sha.get(a.sha256).so_bai >= NGUONG_DUNG_CHUNG);
      if (n10) m.dungChung10.bai += 1;
      const dem = (k) => { m[k] += 1; if (n10) m.dungChung10[k] += 1; };
      if (!r) { dem("chuaDoc"); continue; }
      const p = r.probabilities ?? {};
      for (const a of p.anh ?? []) if (!a.error_kind) anhTot.set(a.sha256, a);
      const daDoc = new Set((p.anh ?? []).map((a) => a.sha256));
      const hienTai = new Set(b.anh.map((a) => a.sha256));
      if (daDoc.size !== hienTai.size || [...hienTai].some((s) => !daDoc.has(s))) m.tapAnhDoi += 1;
      m.tongMs += r.latency_ms ?? 0;
      m.soAnhGoi += p.so_anh_goi ?? 0;
      if (r.json_ok === false) m.jsonHong += 1;
      if (r.error_kind === "lo-url") m.loUrl += 1;
      if (r.error_kind) m.loiTheoLop[r.error_kind] = (m.loiTheoLop[r.error_kind] ?? 0) + 1;
      if ((p.xung_dot ?? []).length) m.xungDot += 1;
      for (const t of TRUONG) if (coGiaTri(p[t])) m.coTruong[t] += 1;
      if ((p.so_anh_lo_nguon ?? 0) > 0) m.baiLoNguon += 1;
      if (r.error_kind) { dem("loi"); continue; }
      if (!coGiaTri(p.price_vnd) && !coGiaTri(p.property_type)) { dem("rong"); continue; }
      dem("tot");
      if (lapDung(b.ly_do, p)) {
        dem("lapDung");
        for (const l of b.ly_do) if (lapDung([l], p)) m.lapTheoLyDo[l] = (m.lapTheoLyDo[l] ?? 0) + 1;
      }
    }
    for (const a of anhTot.values()) {
      const l = a.loai_anh ?? "khong-ro";
      m.anhTheoLoai[l] = (m.anhTheoLoai[l] ?? 0) + 1;
      if (a.lo_nguon === true) m.anhLoNguon += 1;
    }
    m.anhDaDoc = [...sha.keys()].filter((s) => anhTot.has(s)).length;
    m.shaChuaDoc = sha.size - m.anhDaDoc;
    return m;
  });
  return { tapDoc: tap.length, theoLyDo, luotAnh: tap.reduce((s, b) => s + b.anh.length, 0), anhKhacNhau: sha.size, models };
}

/** Lý do lô thật chưa đạt, rỗng là đạt: tập đọc > 0, ≥ 1 dòng Qwen tốt, các nhóm cộng bằng tập đọc. */
export function kiemLoThat(d) {
  const out = [];
  if (d.tapDoc <= 0) out.push("tập đọc rỗng");
  const qwen = d.models.filter((m) => m.model.startsWith("mtplx:"));
  if (!qwen.some((m) => m.tot >= 1)) out.push("chưa có dòng Qwen tốt");
  for (const m of d.models) if (m.tot + m.rong + m.loi + m.chuaDoc !== d.tapDoc) out.push(`nhóm của ${m.model} không cộng bằng tập đọc`);
  return out;
}
