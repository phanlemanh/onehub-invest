// danh-ba-nguoi.mjs — DB2b ho-nguoi-theo-nguon: danh bạ Người theo từng nguồn + vai «người đăng» là phát biểu
// (ADR-0016 §3, §8, §10 Đợt 2b; design docs/superpowers/specs/2026-10-30-ho-nguoi-theo-nguon-design.md).
// Phần thuần (rút định danh, giải người, chọn vai rút) tách khỏi phần DB để đo không cần DB.
import { randomBytes } from "node:crypto";
import { ALIAS_KIND, ASSERTION_METHOD, EVIDENCE_TIER, PARTY_ROLE } from "./vocab.generated.mjs";

/** Vai bộ dựng được ghi — không vai suy luận (môi giới, sàn) ở hàng này (AC-9). */
export const VAI_GHI = Object.freeze([PARTY_ROLE.nguoi_dang]);
/** Phương pháp bộ dựng được ghi: trường có cấu trúc của nguồn (lớp sự thật) hoặc bộ đọc chữ (lớp quan sát). */
export const PHUONG_PHAP_GHI = Object.freeze([ASSERTION_METHOD.source_field, ASSERTION_METHOD.parser]);
export const LY_DO_RUT = "thay-boi-luot";
/** Kênh bài trong stg_zalo_posts → mã nguồn. */
export const KENH_NGUON = Object.freeze({ "openclaw-hook": "S03", "apify-facebook": "S05" });
/** Bảng tầng A (người dùng app, tài khoản thu, tên nguồn thật) — bộ dựng không được đọc (AC-9). */
export const BANG_TANG_A = Object.freeze(["users", "sessions", "user_events", "user_profile", "source_registry"]);

const CROCKFORD = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

/** Khoá người mờ `pty_<ULID>`: 10 ký tự thời gian (ms) + 16 ký tự ngẫu nhiên, mã Crockford. */
export function moiKhoaNguoi(now = Date.now(), rand = randomBytes) {
  let t = "";
  let ms = now;
  for (let i = 0; i < 10; i++) { t = CROCKFORD[ms % 32] + t; ms = Math.floor(ms / 32); }
  const b = rand(16);
  let r = "";
  for (let i = 0; i < 16; i++) r += CROCKFORD[b[i] % 32];
  return `pty_${t}${r}`;
}

/** Khoá bí danh trong bộ nhớ: định danh (tài khoản, SĐT) duy nhất mỗi nguồn; tên duy nhất trong một người. */
export function khoaBiDanh(source, kind, value, objectKey) {
  return kind === ALIAS_KIND.ten ? `${source}|${kind}|${objectKey}|${value}` : `${source}|${kind}|${value}`;
}

const sach = (s) => (typeof s === "string" && s.trim() !== "" ? s.trim() : null);

/**
 * Định danh người đăng của một tin.
 * S06: tài khoản = phần số của seller_ref `ct:<số>`. S03/S05: người gửi của từng bài trong post_ids, cùng nguồn.
 * @param {{ source: string, seller_ref?: string|null, seller_name?: string|null, seller_phone_hash?: string|null, post_ids?: string[]|null }} tin
 * @param {Map<string, { source: string, sender_id: string|null, sender_name: string|null }>} baiTheoId
 */
export function rutDinhDanh(tin, baiTheoId) {
  const taiKhoan = [];
  let field = null;
  if (tin.source === "S06") {
    const m = /^ct:([0-9]+)$/.exec(tin.seller_ref ?? "");
    if (m) { taiKhoan.push({ value: m[1], ten: sach(tin.seller_name), post_ids: [] }); field = "seller_ref"; }
  } else {
    const theo = new Map();
    for (const pid of tin.post_ids ?? []) {
      const b = baiTheoId.get(pid);
      const ai = b && b.source === tin.source ? sach(b.sender_id) : null;
      if (!ai) continue;
      if (!theo.has(ai)) theo.set(ai, { value: ai, ten: null, post_ids: [] });
      const tk = theo.get(ai);
      tk.post_ids.push(pid);
      tk.ten ??= sach(b.sender_name);
    }
    taiKhoan.push(...theo.values());
    if (taiKhoan.length) field = "post_ids";
  }
  return { taiKhoan, sdt: sach(tin.seller_phone_hash), field };
}

const thoiDiem = (x) => (x == null ? Number.POSITIVE_INFINITY : +new Date(x));

/**
 * Giải người cho các tin theo thứ tự tất định (first_seen, offer_id). Luật Hỏi-4: SĐT luôn là bí danh của người theo
 * SĐT riêng của nguồn, không gắn vào người tài khoản; tin có tài khoản mang vai tới người tài khoản (source_field/fact),
 * tin chỉ SĐT mang vai tới người theo SĐT (parser/observed); không có cả hai → đếm khong_dinh_danh.
 * Nhiều bản ghi cùng chủ thể (tin nghỉ `doi_khoa` giữ originating_system_key của tin thay nó) gộp thành một vai mỗi
 * (chủ thể, người), bằng chứng lấy từ bản ghi sống; khong_dinh_danh đếm theo chủ thể.
 * @param {object[]} tins
 * @param {Map<string, string>} biDanh khoaBiDanh → party_key (không bị đột biến)
 */
export function giaiNguoi(tins, biDanh, { baiTheoId = new Map(), taoKhoa = moiKhoaNguoi } = {}) {
  const bd = new Map(biDanh);
  const nguoiMoi = [];
  const biDanhMoi = [];
  const vaiTheo = new Map();
  const tinCuaVai = new Map();
  const chuThe = new Map();
  const themBiDanh = (source, kind, value, object_key) => {
    const k = khoaBiDanh(source, kind, value, object_key);
    if (bd.has(k)) return bd.get(k);
    bd.set(k, object_key);
    biDanhMoi.push({ object_key, source, kind, value });
    return object_key;
  };
  const layNguoi = (source, kind, value) => {
    const k = khoaBiDanh(source, kind, value);
    if (bd.has(k)) return bd.get(k);
    const party_key = taoKhoa();
    nguoiMoi.push({ party_key, source });
    return themBiDanh(source, kind, value, party_key);
  };
  const thuTu = [...tins].sort((a, b) => thoiDiem(a.first_seen) - thoiDiem(b.first_seen) || String(a.offer_id).localeCompare(String(b.offer_id)));
  for (const t of thuTu) {
    const d = rutDinhDanh(t, baiTheoId);
    const subject_key = `${t.source}:${t.originating_system_key}`;
    if (!chuThe.has(subject_key)) chuThe.set(subject_key, t.source);
    const ghiVai = (v) => {
      const k = `${subject_key}|${v.party_key}`;
      const cu = tinCuaVai.get(k);
      if (cu && !(cu.retired_at != null && t.retired_at == null)) return;
      vaiTheo.set(k, v);
      tinCuaVai.set(k, t);
    };
    for (const tk of d.taiKhoan) {
      const party_key = layNguoi(t.source, ALIAS_KIND.tai_khoan_nguon, tk.value);
      if (tk.ten) themBiDanh(t.source, ALIAS_KIND.ten, tk.ten, party_key);
      const evidence = { offer_id: t.offer_id, field: d.field, ...(tk.post_ids.length ? { post_ids: tk.post_ids } : {}) };
      ghiVai({ subject_key, party_key, role: PARTY_ROLE.nguoi_dang, method: ASSERTION_METHOD.source_field, evidence_tier: EVIDENCE_TIER.fact, evidence });
    }
    const nguoiSdt = d.sdt ? layNguoi(t.source, ALIAS_KIND.sdt_bam, d.sdt) : null;
    if (!d.taiKhoan.length && nguoiSdt) {
      ghiVai({
        subject_key, party_key: nguoiSdt, role: PARTY_ROLE.nguoi_dang, method: ASSERTION_METHOD.parser,
        evidence_tier: EVIDENCE_TIER.observed, evidence: { offer_id: t.offer_id, field: "seller_phone_hash" },
      });
    }
  }
  const vai = [...vaiTheo.values()];
  const coVai = new Set(vai.map((v) => v.subject_key));
  const khongDinhDanh = {};
  for (const [sk, source] of chuThe) if (!coVai.has(sk)) khongDinhDanh[source] = (khongDinhDanh[source] ?? 0) + 1;
  return { nguoiMoi, biDanhMoi, vai, khongDinhDanh };
}

/**
 * Vai sống phải rút ở lượt này: chỉ khi có BẰNG CHỨNG THAY (design §2.2 bước 3) — bài làm bằng chứng vẫn nối được mà
 * người gửi đã khác; vai từ seller_ref S06 hay vai parser mà lượt này sinh vai khác cho tin. Tin vắng lượt, bài không còn
 * nối được ở stg_zalo_posts → giữ (stg_zalo_posts có thể nạp lại thiếu bài).
 */
export function chonVaiRut(vaiSong, vaiLuotNay, tinsLuotNay, baiTheoId) {
  const sinh = new Set(vaiLuotNay.map((v) => `${v.subject_key}|${v.party_key}`));
  const coVaiMoi = new Set(vaiLuotNay.map((v) => v.subject_key));
  const tinTheo = new Map(tinsLuotNay.map((t) => [`${t.source}:${t.originating_system_key}`, t]));
  return vaiSong.filter((r) => {
    if (sinh.has(`${r.subject_key}|${r.party_key}`)) return false;
    const t = tinTheo.get(r.subject_key);
    if (!t) return false;
    if (r.method === ASSERTION_METHOD.parser || r.evidence?.field === "seller_ref") return coVaiMoi.has(r.subject_key);
    return (r.evidence?.post_ids ?? []).some((p) => {
      const b = baiTheoId.get(p);
      return b && b.source === t.source && sach(b.sender_id) !== null;
    });
  });
}

/** Mọi câu SQL của mô-đun (AC-9 quét chính các chuỗi này). */
export const SQL = Object.freeze({
  tin: `SELECT offer_id, source, originating_system_key, seller_ref, seller_name, seller_phone_hash, post_ids, first_seen, retired_at
          FROM sale_offer_records WHERE source = ANY($1::text[]) AND originating_system_key IS NOT NULL`,
  bai: `SELECT DISTINCT ON (post_id) post_id, agent_id, sender_id, sender_name FROM stg_zalo_posts
         WHERE post_id = ANY($1::text[]) AND agent_id = ANY($2::text[]) ORDER BY post_id, captured_at DESC`,
  biDanh: `SELECT object_key, source, kind, value FROM registry_aliases WHERE retired_at IS NULL AND object_key LIKE 'pty\\_%'`,
  vaiSong: `SELECT id, subject_key, party_key, method, evidence FROM party_roles WHERE retracted_at IS NULL`,
  themNguoi: `INSERT INTO parties (party_key, source) SELECT * FROM unnest($1::text[], $2::text[])`,
  // Định danh (tài khoản, SĐT): KHÔNG nuốt trùng — trùng nghĩa là bộ dựng không tra bí danh (đối chứng E7 đỏ ở đây).
  themDinhDanh: `INSERT INTO registry_aliases (object_key, source, kind, value) SELECT * FROM unnest($1::text[], $2::text[], $3::text[], $4::text[])`,
  themTen: `INSERT INTO registry_aliases (object_key, source, kind, value) SELECT * FROM unnest($1::text[], $2::text[], $3::text[], $4::text[])
            ON CONFLICT (object_key, kind, value) WHERE kind = 'ten' DO NOTHING`,
  themVai: `INSERT INTO party_roles (subject_key, party_key, role, method, evidence_tier, evidence, run_id)
            SELECT s, p, r, m, e, ev, $7 FROM unnest($1::text[], $2::text[], $3::text[], $4::text[], $5::text[], $6::jsonb[]) AS x(s, p, r, m, e, ev)`,
  rutVai: `UPDATE party_roles SET retracted_at = now(), retract_reason = $2 WHERE id = ANY($1::bigint[]) AND retracted_at IS NULL`,
  sellersThieu: `SELECT s.phone_hash || ':' || src AS k FROM sellers s CROSS JOIN LATERAL unnest(s.sources) AS src
                  WHERE NOT EXISTS (SELECT 1 FROM registry_aliases a WHERE a.retired_at IS NULL AND a.kind = 'sdt_bam'
                                      AND a.source = src AND a.value = s.phone_hash)
                  ORDER BY 1`,
});

/** Khoá advisory của bộ dựng — hai lượt chồng nhau (job đêm, --thu) xếp hàng thay vì va chỉ mục duy nhất. */
export const KHOA_DANH_BA = 55055;

/**
 * Dựng danh bạ Người + vai người đăng từ mọi sale_offer_records (kể cả tin nghỉ). Chạy trong giao dịch của người gọi;
 * chỉ thêm (rút vai có lý do, không xoá). `traBiDanh: false` bỏ tra bí danh — CHỈ cho đối chứng của thước E7.
 * @param {import("pg").Client} c
 */
export async function dungNguoi(c, { runId = new Date().toISOString(), traBiDanh = true, out = console.log } = {}) {
  await c.query("SELECT pg_advisory_xact_lock($1)", [KHOA_DANH_BA]);
  const tins = (await c.query(SQL.tin, [["S03", "S05", "S06"]])).rows;
  const postIds = [...new Set(tins.flatMap((t) => (t.source === "S06" ? [] : t.post_ids ?? [])))];
  const baiTheoId = new Map(
    (await c.query(SQL.bai, [postIds, Object.keys(KENH_NGUON)])).rows
      .map((b) => [b.post_id, { source: KENH_NGUON[b.agent_id], sender_id: b.sender_id, sender_name: b.sender_name }]),
  );
  const biDanh = new Map(
    traBiDanh ? (await c.query(SQL.biDanh)).rows.map((a) => [khoaBiDanh(a.source, a.kind, a.value, a.object_key), a.object_key]) : [],
  );
  const kq = giaiNguoi(tins, biDanh, { baiTheoId });

  if (kq.nguoiMoi.length) await c.query(SQL.themNguoi, [kq.nguoiMoi.map((p) => p.party_key), kq.nguoiMoi.map((p) => p.source)]);
  const cot = (ds) => [ds.map((a) => a.object_key), ds.map((a) => a.source), ds.map((a) => a.kind), ds.map((a) => a.value)];
  const dinhDanh = kq.biDanhMoi.filter((a) => a.kind !== ALIAS_KIND.ten);
  const ten = kq.biDanhMoi.filter((a) => a.kind === ALIAS_KIND.ten);
  let biDanhMoi = 0;
  if (dinhDanh.length) biDanhMoi += (await c.query(SQL.themDinhDanh, cot(dinhDanh))).rowCount;
  if (ten.length) biDanhMoi += (await c.query(SQL.themTen, cot(ten))).rowCount;

  const vaiSong = (await c.query(SQL.vaiSong)).rows;
  const dangSong = new Set(vaiSong.map((v) => `${v.subject_key}|${v.party_key}`));
  const rut = chonVaiRut(vaiSong, kq.vai, tins, baiTheoId);
  if (rut.length) await c.query(SQL.rutVai, [rut.map((r) => r.id), LY_DO_RUT]);
  const moi = kq.vai.filter((v) => !dangSong.has(`${v.subject_key}|${v.party_key}`));
  if (moi.length) {
    await c.query(SQL.themVai, [
      moi.map((v) => v.subject_key), moi.map((v) => v.party_key), moi.map((v) => v.role), moi.map((v) => v.method),
      moi.map((v) => v.evidence_tier), moi.map((v) => JSON.stringify(v.evidence)), runId,
    ]);
  }

  const theo_nguon = {};
  const cong = (s, k) => { theo_nguon[s] ??= { nguoi_moi: 0, vai_moi: 0 }; theo_nguon[s][k]++; };
  for (const p of kq.nguoiMoi) cong(p.source, "nguoi_moi");
  for (const v of moi) cong(v.subject_key.slice(0, 3), "vai_moi");
  const kqDem = {
    nguoi_moi: kq.nguoiMoi.length, bi_danh_moi: biDanhMoi, vai_moi: moi.length, vai_rut: rut.length,
    khong_dinh_danh: kq.khongDinhDanh, theo_nguon,
  };
  const kdd = Object.entries(kq.khongDinhDanh).map(([s, n]) => `${s}=${n}`).join(" ") || "0";
  out(`danh-ba-nguoi: +${kqDem.nguoi_moi} người · +${biDanhMoi} bí danh · +${moi.length} vai · rút ${rut.length} · không định danh ${kdd}`);
  return kqDem;
}

/** «<phone_hash>:<S0x>» cho mỗi (dòng sellers, nguồn trong sources) chưa có người sống mang bí danh sdt_bam đúng nguồn. */
export async function sellersThieuNguoi(c) {
  return (await c.query(SQL.sellersThieu)).rows.map((r) => r.k);
}

/** Bảng tầng A mà một câu SQL nhắc tới (sau FROM/JOIN/INTO/UPDATE). */
export function bangDuocDoc(sql) {
  const ten = [...sql.matchAll(/\b(?:FROM|JOIN|INTO|UPDATE)\s+"?([A-Za-z_][A-Za-z0-9_]*)"?/gi)].map((m) => m[1].toLowerCase());
  return [...new Set(ten.filter((t) => BANG_TANG_A.includes(t)))];
}

/**
 * Chốt DB thử: không chạy thước/test trên DB `oneinvest` dùng chung khi 055 chưa áp (luật đo đợt dot0-cam-mau 27/10).
 * @returns {string|null} lời từ chối, hoặc null khi được chạy
 */
export function chotDbThuNguoi(dbName, coBangParties) {
  if (dbName === "oneinvest" && !coBangParties) {
    return "DATABASE_URL trỏ DB oneinvest dùng chung khi chưa có bảng parties — chạy trên DB thử (bash db/db-thu.sh oneinvest_p3_nguoi)";
  }
  return null;
}
