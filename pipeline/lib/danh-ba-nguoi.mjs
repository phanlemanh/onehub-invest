// danh-ba-nguoi.mjs — DB2b ho-nguoi-theo-nguon: danh bạ Người theo từng nguồn + vai «người đăng» là phát biểu
// (ADR-0016 §3, §8, §10 Đợt 2b; design docs/superpowers/specs/2026-10-30-ho-nguoi-theo-nguon-design.md).
// Phần thuần (rút định danh, giải người, chọn vai rút) tách khỏi phần DB để đo không cần DB.
import { createHash, randomBytes } from "node:crypto";
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
 * @param {{ source: string, seller_ref?: string|null, seller_name?: string|null, seller_phone?: string|null, post_ids?: string[]|null }} tin
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
  return { taiKhoan, sdt: sach(tin.seller_phone), field };
}

/** Khoá bí danh `sdt_bam` đời trước của một số E.164: sha256 của dạng «0…» cắt 32 ký tự (SD3 nối người cũ qua nó). */
export function khoaBamCu(e164) {
  return createHash("sha256").update("0" + e164.slice(3)).digest("hex").slice(0, 32);
}

const thoiDiem = (x) => (x == null ? Number.POSITIVE_INFINITY : +new Date(x));

/**
 * Giải người cho các tin theo thứ tự tất định (first_seen, offer_id). Luật Hỏi-4: SĐT luôn là bí danh của người theo
 * SĐT riêng của nguồn, không gắn vào người tài khoản; tin có tài khoản mang vai tới người tài khoản (source_field/fact),
 * tin chỉ SĐT mang vai tới người theo SĐT (parser/observed); không có cả hai → đếm khong_dinh_danh.
 * Nhiều bản ghi cùng chủ thể (tin nghỉ `doi_khoa` giữ originating_system_key của tin thay nó) gộp thành một vai mỗi
 * (chủ thể, người), bằng chứng lấy từ bản ghi sống; khong_dinh_danh đếm theo chủ thể.
 * Chủ thể trong `giuBaiMat` (vai theo bài đang được giữ vì bài mất) không nhận vai parser thay và không đếm khong_dinh_danh.
 * @param {object[]} tins
 * @param {Map<string, string>} biDanh khoaBiDanh → party_key (không bị đột biến)
 */
export function giaiNguoi(tins, biDanh, { baiTheoId = new Map(), taoKhoa = moiKhoaNguoi, giuBaiMat = new Set() } = {}) {
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
  // SD3: người theo SĐT tra bí danh `sdt` (số gốc E.164); chưa có thì tra `sdt_bam` đời trước của cùng số để GIỮ
  // party_key, rồi thêm `sdt` cho đúng người ấy. Bí danh `sdt_bam` nghỉ ở bước ghi (dungNguoi), không sửa tại chỗ.
  const layNguoiSdt = (source, e164) => {
    if (bd.has(khoaBiDanh(source, ALIAS_KIND.sdt, e164))) return bd.get(khoaBiDanh(source, ALIAS_KIND.sdt, e164));
    const cu = bd.get(khoaBiDanh(source, ALIAS_KIND.sdt_bam, khoaBamCu(e164)));
    if (cu) return themBiDanh(source, ALIAS_KIND.sdt, e164, cu);
    return layNguoi(source, ALIAS_KIND.sdt, e164);
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
    const nguoiSdt = d.sdt ? layNguoiSdt(t.source, d.sdt) : null;
    if (!d.taiKhoan.length && nguoiSdt && !giuBaiMat.has(subject_key)) {
      ghiVai({
        subject_key, party_key: nguoiSdt, role: PARTY_ROLE.nguoi_dang, method: ASSERTION_METHOD.parser,
        evidence_tier: EVIDENCE_TIER.observed, evidence: { offer_id: t.offer_id, field: "seller_phone" },
      });
    }
  }
  const vai = [...vaiTheo.values()];
  const coVai = new Set(vai.map((v) => v.subject_key));
  const khongDinhDanh = {};
  for (const [sk, source] of chuThe) if (!coVai.has(sk) && !giuBaiMat.has(sk)) khongDinhDanh[source] = (khongDinhDanh[source] ?? 0) + 1;
  return { nguoiMoi, biDanhMoi, vai, khongDinhDanh };
}

// ---- HD13 nguoi-noi-theo-sdt: gộp người theo SĐT vào người theo tài khoản cùng nguồn khi nối một–một ----

/** Lý do rút vai của người vừa bị gộp; lý do sự kiện gộp; người làm ghi vào registry_events. */
export const LY_DO_GOP = "gop-nguoi";
export const LUAT_GOP = "sdt-mot-mot";
export const NGUOI_LAM = "dung-nguoi";
/** Nguồn có cả người gửi lẫn SĐT trên tin; S06 chưa có SĐT (HD12), khác nguồn ngoài hàng này. */
export const NGUON_GOP = Object.freeze(["S03", "S05"]);

/**
 * Cặp (SĐT, người gửi) một–một trên tin SỐNG, theo từng nguồn: SĐT có đúng một người gửi và người gửi ấy có đúng một SĐT
 * (cùng định nghĩa N1 của do-danh-ba-sdt). `motSdtMoiNguoi: false` bỏ vế sau (và rào người cuối một SĐT của chonGop) — CHỈ
 * cho đối chứng của thước.
 */
export function capMotMot(tins, baiTheoId, { motSdtMoiNguoi = true } = {}) {
  const cap = [];
  const nhieuNhieu = {};
  for (const source of NGUON_GOP) {
    const nguoiCuaSdt = new Map();
    const sdtCuaNguoi = new Map();
    for (const t of tins) {
      if (t.source !== source || t.retired_at != null) continue;
      const d = rutDinhDanh(t, baiTheoId);
      if (!d.sdt) continue;
      for (const tk of d.taiKhoan) {
        if (!nguoiCuaSdt.has(d.sdt)) nguoiCuaSdt.set(d.sdt, new Set());
        nguoiCuaSdt.get(d.sdt).add(tk.value);
        if (!sdtCuaNguoi.has(tk.value)) sdtCuaNguoi.set(tk.value, new Set());
        sdtCuaNguoi.get(tk.value).add(d.sdt);
      }
    }
    for (const [sdt, ng] of [...nguoiCuaSdt].sort(([a], [b]) => a.localeCompare(b))) {
      if (ng.size !== 1) continue;
      const taiKhoan = [...ng][0];
      if (motSdtMoiNguoi && sdtCuaNguoi.get(taiKhoan).size !== 1) continue;
      cap.push({ source, sdt, taiKhoan });
    }
    nhieuNhieu[source] = {
      sdt_nhieu_nguoi: [...nguoiCuaSdt.values()].filter((s) => s.size > 1).length,
      nguoi_nhieu_sdt: [...sdtCuaNguoi.values()].filter((s) => s.size > 1).length,
    };
  }
  return { cap, nhieuNhieu };
}

/** Người cuối của chuỗi merged_into (chặn vòng). */
export function nguoiCuoi(gopVao, k) {
  const da = new Set();
  let x = k;
  while (gopVao.has(x) && !da.has(x)) { da.add(x); x = gopVao.get(x); }
  return x;
}

/**
 * Lần gộp mới của lượt: người theo SĐT `tu` vào người theo tài khoản `vao` cùng nguồn, cả hai đang active (người split hay
 * merged không bao giờ bị gộp tự động), và người cuối của `vao` chưa mang SĐT nào khác — không Người nào hai SĐT (AC-7).
 * @param {Map<string,string>} biDanh khoaBiDanh → party_key (đã gồm bí danh mới của lượt)
 * @param {Map<string,string>} trangThai party_key → status (vắng = active)
 */
export function chonGop(tins, biDanh, trangThai, { baiTheoId = new Map(), gopVao = new Map(), motSdtMoiNguoi = true } = {}) {
  const { cap, nhieuNhieu } = capMotMot(tins, baiTheoId, { motSdtMoiNguoi });
  const vao = new Map(gopVao);
  const sdtCua = new Map(); // `${source}|${người cuối}` → Set SĐT
  const ganSdt = (source, k, sdt) => {
    const kk = `${source}|${nguoiCuoi(vao, k)}`;
    if (!sdtCua.has(kk)) sdtCua.set(kk, new Set());
    sdtCua.get(kk).add(sdt);
  };
  for (const [khoa, k] of biDanh) {
    const [source, kind, ...v] = khoa.split("|");
    if (kind === ALIAS_KIND.sdt) ganSdt(source, k, v.join("|"));
  }
  const active = (k) => (trangThai.get(k) ?? "active") === "active";
  const gop = [];
  for (const { source, sdt, taiKhoan } of cap) {
    const tu = biDanh.get(khoaBiDanh(source, ALIAS_KIND.sdt, sdt));
    const ka = biDanh.get(khoaBiDanh(source, ALIAS_KIND.tai_khoan_nguon, taiKhoan));
    if (!tu || !ka || tu === ka || !active(tu) || !active(ka) || vao.has(tu)) continue;
    const coSdt = sdtCua.get(`${source}|${nguoiCuoi(vao, ka)}`);
    if (motSdtMoiNguoi && coSdt && [...coSdt].some((s) => s !== sdt)) continue;
    vao.set(tu, ka);
    ganSdt(source, ka, sdt);
    gop.push({ tu, vao: ka, source, sdt });
  }
  return { gop, nhieuNhieu };
}

/** Vai của lượt chuyển về người cuối của chuỗi gộp; một vai mỗi (chủ thể, người). */
export function anhXaVai(vai, gopVao) {
  const theo = new Map();
  for (const v of vai) {
    const party_key = nguoiCuoi(gopVao, v.party_key);
    const k = `${v.subject_key}|${party_key}`;
    if (!theo.has(k)) theo.set(k, { ...v, party_key });
  }
  return [...theo.values()];
}

const baiNoiDuoc = (p, source, baiTheoId) => {
  const b = baiTheoId.get(p);
  return Boolean(b && b.source === source && sach(b.sender_id) !== null);
};

/**
 * Chủ thể có vai sống dựa trên bài mà mọi bài bằng chứng đều không còn nối được (AC-6 «bài mất»): vai ấy được giữ,
 * nên lượt này không ghi vai parser thay cho chủ thể.
 * @param {{ subject_key: string, method: string, evidence?: { post_ids?: string[] } }[]} vaiSong
 */
export function giuVaiBaiMat(vaiSong, baiTheoId) {
  const giu = new Set();
  for (const r of vaiSong) {
    const ps = r.method === ASSERTION_METHOD.source_field ? r.evidence?.post_ids ?? [] : [];
    if (ps.length && !ps.some((p) => baiNoiDuoc(p, r.subject_key.slice(0, 3), baiTheoId))) giu.add(r.subject_key);
  }
  return giu;
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
    return (r.evidence?.post_ids ?? []).some((p) => baiNoiDuoc(p, t.source, baiTheoId));
  });
}

// ---- cong-tac-gop-nguoi-dem: công tắc ops_audit cho bước gộp, mặc định tắt (cùng nếp cổng phat-bieu:cat-chuyen) ----

/** action của dòng công tắc trong ops_audit; detail = { bat: boolean, ly_do }. */
export const CONG_TAC_GOP = "danh-ba:gop-sdt";

/**
 * Công tắc từ các dòng ops_audit của nó: dòng id lớn nhất thắng (bất kể thứ tự mảng); chỉ `detail.bat === true` là bật —
 * không dòng, bat thiếu hay bat không phải boolean đều là tắt.
 * @param {{ id: string|number, detail: any }[]} rows
 * @returns {"bat"|"tat"}
 */
export function docCongTac(rows) {
  let moi = null;
  for (const r of rows) if (!moi || BigInt(String(r.id)) > BigInt(String(moi.id))) moi = r;
  return moi?.detail?.bat === true ? "bat" : "tat";
}

/** Mọi câu SQL của mô-đun (AC-9 quét chính các chuỗi này). */
export const SQL = Object.freeze({
  tin: `SELECT offer_id, source, originating_system_key, seller_ref, seller_name, seller_phone, post_ids, first_seen, retired_at
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
  // SD3: bí danh SĐT băm đời trước nghỉ hết (người giữ party_key qua bí danh `sdt`); chỉ đặt retired_at, đúng luật 055.
  nghiSdtBam: `UPDATE registry_aliases SET retired_at = now() WHERE kind = 'sdt_bam' AND retired_at IS NULL`,
  rutVai: `UPDATE party_roles SET retracted_at = now(), retract_reason = $2 WHERE id = ANY($1::bigint[]) AND retracted_at IS NULL`,
  // HD13: trạng thái người khác active (merged → merged_into); gộp và tách chỉ đổi status/merged_into, sự kiện chỉ thêm.
  trangThai: `SELECT party_key, status, merged_into FROM parties WHERE status <> 'active'`,
  gop: `UPDATE parties SET status = 'merged', merged_into = x.vao FROM unnest($1::text[], $2::text[]) AS x(tu, vao)
         WHERE parties.party_key = x.tu AND parties.status = 'active'`,
  themSuKien: `INSERT INTO registry_events (object_key, kind, related_keys, reason, changed_by)
               SELECT k, $3, ARRAY[r], l, $4 FROM unnest($1::text[], $2::text[], $5::text[]) AS x(k, r, l)`,
  docNguoi: `SELECT status, merged_into FROM parties WHERE party_key = $1 FOR UPDATE`,
  tach: `UPDATE parties SET status = 'split', merged_into = NULL WHERE party_key = $1 AND status = 'merged'`,
  // Đối chiếu trên SĐT của tin, không trên sellers (SD1): sellers từng thiếu dòng nên phép đối chiếu luôn xanh.
  sellersThieu: `SELECT DISTINCT o.seller_phone_hash || ':' || o.source AS k FROM sale_offers o
                  WHERE o.seller_phone IS NOT NULL
                    AND NOT EXISTS (SELECT 1 FROM registry_aliases a WHERE a.retired_at IS NULL AND a.kind = 'sdt'
                                      AND a.source = o.source AND a.value = o.seller_phone)
                  ORDER BY 1`,
  // Công tắc gộp: dò bảng trước (to_regclass, không bắt lỗi — lỗi SELECT làm hỏng giao dịch của buocDem), rồi đọc/ghi.
  coBangAudit: `SELECT to_regclass('public.ops_audit') IS NOT NULL AS co`,
  congTac: `SELECT id, detail FROM ops_audit WHERE action = '${CONG_TAC_GOP}' ORDER BY id DESC LIMIT 1`,
  ghiCongTac: `INSERT INTO ops_audit (actor, action, env, detail) VALUES ($1, '${CONG_TAC_GOP}', 'local', $2::jsonb)`,
});

/**
 * Công tắc gộp hiện hành; DB không có bảng ops_audit → tắt.
 * @param {import("pg").Client} c
 * @returns {Promise<"bat"|"tat">}
 */
export async function congTacGop(c) {
  if (!(await c.query(SQL.coBangAudit)).rows[0].co) return "tat";
  return docCongTac((await c.query(SQL.congTac)).rows);
}

/**
 * Ghi một dòng công tắc (bật/tắt kèm lý do). Chạy trong giao dịch của người gọi; không dựng danh bạ.
 * @param {import("pg").Client} c
 */
export async function ghiCongTac(c, { bat, lyDo }) {
  if (typeof bat !== "boolean") throw loiTach("SAI_CONG_TAC", "dung-nguoi: công tắc gộp chỉ nhận bat | tat");
  if (!sach(lyDo)) throw loiTach("THIEU_LY_DO", "dung-nguoi: --cong-tac-gop cần --ly-do «…»");
  await c.query(SQL.ghiCongTac, [NGUOI_LAM, JSON.stringify({ bat, ly_do: sach(lyDo) })]);
  return { cong_tac_gop: bat ? "bat" : "tat", ly_do: sach(lyDo) };
}

/** Khoá advisory của bộ dựng — hai lượt chồng nhau (job đêm, --thu) xếp hàng thay vì va chỉ mục duy nhất. */
export const KHOA_DANH_BA = 55055;

/**
 * Dựng danh bạ Người + vai người đăng từ mọi sale_offer_records (kể cả tin nghỉ). Chạy trong giao dịch của người gọi;
 * chỉ thêm (rút vai có lý do, không xoá). `traBiDanh: false` bỏ tra bí danh — CHỈ cho đối chứng của thước E7;
 * `motSdtMoiNguoi: false` bỏ vế «người gửi/người cuối có một SĐT» của luật gộp — CHỈ cho đối chứng của thước HD13.
 * `gop` vắng → theo công tắc ops_audit `danh-ba:gop-sdt` (mặc định tắt); `true`/`false` CHỈ cho test và đối chứng của thước.
 * Tắt: vẫn tính cặp đủ luật (báo `gop_cho`) nhưng không ghi gộp mới; người đã gộp giữ nguyên.
 * @param {import("pg").Client} c
 */
export async function dungNguoi(c, { runId = new Date().toISOString(), traBiDanh = true, motSdtMoiNguoi = true, gop: epGop, out = console.log } = {}) {
  await c.query("SELECT pg_advisory_xact_lock($1)", [KHOA_DANH_BA]);
  const congTac = epGop === undefined ? await congTacGop(c) : epGop ? "bat" : "tat";
  const tins = (await c.query(SQL.tin, [["S03", "S05", "S06"]])).rows;
  const postIds = [...new Set(tins.flatMap((t) => (t.source === "S06" ? [] : t.post_ids ?? [])))];
  const baiTheoId = new Map(
    (await c.query(SQL.bai, [postIds, Object.keys(KENH_NGUON)])).rows
      .map((b) => [b.post_id, { source: KENH_NGUON[b.agent_id], sender_id: b.sender_id, sender_name: b.sender_name }]),
  );
  const biDanh = new Map(
    traBiDanh ? (await c.query(SQL.biDanh)).rows.map((a) => [khoaBiDanh(a.source, a.kind, a.value, a.object_key), a.object_key]) : [],
  );
  const vaiSong = (await c.query(SQL.vaiSong)).rows;
  const kq = giaiNguoi(tins, biDanh, { baiTheoId, giuBaiMat: giuVaiBaiMat(vaiSong, baiTheoId) });

  // HD13: gộp một–một cùng nguồn trên bí danh cũ + mới của lượt, rồi vai của lượt về người cuối của chuỗi gộp.
  const trangThaiRows = (await c.query(SQL.trangThai)).rows;
  const trangThai = new Map(trangThaiRows.map((p) => [p.party_key, p.status]));
  const gopVao = new Map(trangThaiRows.filter((p) => p.status === "merged").map((p) => [p.party_key, p.merged_into]));
  const biDanhSau = new Map(biDanh);
  for (const a of kq.biDanhMoi) biDanhSau.set(khoaBiDanh(a.source, a.kind, a.value, a.object_key), a.object_key);
  const { gop: gopDu, nhieuNhieu } = chonGop(tins, biDanhSau, trangThai, { baiTheoId, gopVao, motSdtMoiNguoi });
  const gop = congTac === "bat" ? gopDu : [];
  const gopCho = congTac === "bat" ? [] : gopDu;
  for (const g of gop) gopVao.set(g.tu, g.vao);
  kq.vai = anhXaVai(kq.vai, gopVao);

  if (kq.nguoiMoi.length) await c.query(SQL.themNguoi, [kq.nguoiMoi.map((p) => p.party_key), kq.nguoiMoi.map((p) => p.source)]);
  const cot = (ds) => [ds.map((a) => a.object_key), ds.map((a) => a.source), ds.map((a) => a.kind), ds.map((a) => a.value)];
  const dinhDanh = kq.biDanhMoi.filter((a) => a.kind !== ALIAS_KIND.ten);
  const ten = kq.biDanhMoi.filter((a) => a.kind === ALIAS_KIND.ten);
  let biDanhMoi = 0;
  if (dinhDanh.length) biDanhMoi += (await c.query(SQL.themDinhDanh, cot(dinhDanh))).rowCount;
  if (ten.length) biDanhMoi += (await c.query(SQL.themTen, cot(ten))).rowCount;
  const sdtBamNghi = (await c.query(SQL.nghiSdtBam)).rowCount;
  if (gop.length) {
    await c.query(SQL.gop, [gop.map((g) => g.tu), gop.map((g) => g.vao)]);
    await c.query(SQL.themSuKien, [gop.map((g) => g.tu), gop.map((g) => g.vao), "gop", NGUOI_LAM, gop.map((g) => `${LUAT_GOP} ${g.source}`)]);
  }

  const dangSong = new Set(vaiSong.map((v) => `${v.subject_key}|${v.party_key}`));
  const rut = chonVaiRut(vaiSong, kq.vai, tins, baiTheoId);
  const rutGop = rut.filter((r) => gopVao.has(r.party_key));
  const rutThay = rut.filter((r) => !gopVao.has(r.party_key));
  if (rutGop.length) await c.query(SQL.rutVai, [rutGop.map((r) => r.id), LY_DO_GOP]);
  if (rutThay.length) await c.query(SQL.rutVai, [rutThay.map((r) => r.id), LY_DO_RUT]);
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
  const congNguon = (ds, k) => {
    for (const g of ds) { theo_nguon[g.source] ??= { nguoi_moi: 0, vai_moi: 0 }; theo_nguon[g.source][k] = (theo_nguon[g.source][k] ?? 0) + 1; }
  };
  congNguon(gop, "gop");
  congNguon(gopCho, "gop_cho");
  const kqDem = {
    nguoi_moi: kq.nguoiMoi.length, bi_danh_moi: biDanhMoi, sdt_bam_nghi: sdtBamNghi, vai_moi: moi.length, vai_rut: rut.length,
    gop: gop.length, cong_tac_gop: congTac, gop_cho: gopCho.length, nhieu_nhieu: nhieuNhieu, khong_dinh_danh: kq.khongDinhDanh,
    theo_nguon,
  };
  const kdd = Object.entries(kq.khongDinhDanh).map(([s, n]) => `${s}=${n}`).join(" ") || "0";
  const nn = Object.entries(nhieuNhieu).map(([s, v]) => `${s}=${v.sdt_nhieu_nguoi}/${v.nguoi_nhieu_sdt}`).join(" ");
  const tat = congTac === "tat" ? ` · công tắc gộp tắt (chờ ${gopCho.length})` : "";
  out(`danh-ba-nguoi: +${kqDem.nguoi_moi} người · +${biDanhMoi} bí danh · nghỉ ${sdtBamNghi} sdt_bam · +${moi.length} vai · rút ${rut.length} · gộp ${gop.length}${tat} · nhiều–nhiều (SĐT nhiều người gửi/người gửi nhiều SĐT) ${nn} · không định danh ${kdd}`);
  return kqDem;
}

/** Lỗi tách có mã máy đọc (CLI đổi thành thoát 1). */
function loiTach(code, message) {
  return Object.assign(new Error(message), { code });
}

/**
 * Tách một lần gộp (AC-6): người đang merged về split, bỏ merged_into, một sự kiện `tach`, rồi dựng lại ngay trong cùng giao
 * dịch để vai về người đã tách. Người split không bao giờ bị gộp tự động lại. Chạy trong giao dịch của người gọi.
 * @param {import("pg").Client} c
 */
export async function tachNguoi(c, partyKey, { lyDo, runId = new Date().toISOString(), out = console.log } = {}) {
  if (!sach(lyDo)) throw loiTach("THIEU_LY_DO", "dung-nguoi: tách cần lý do (--ly-do «…»)");
  await c.query("SELECT pg_advisory_xact_lock($1)", [KHOA_DANH_BA]);
  const p = (await c.query(SQL.docNguoi, [partyKey])).rows[0];
  if (!p) throw loiTach("KHONG_CO", `dung-nguoi: không có người ${partyKey}`);
  if (p.status !== "merged") throw loiTach("SAI_TRANG_THAI", `dung-nguoi: người ${partyKey} đang ${p.status}, chỉ tách được người merged`);
  await c.query(SQL.tach, [partyKey]);
  await c.query(SQL.themSuKien, [[partyKey], [p.merged_into], "tach", NGUOI_LAM, [sach(lyDo)]]);
  out(`danh-ba-nguoi: tách ${partyKey} khỏi ${p.merged_into}`);
  const dung = await dungNguoi(c, { runId, out });
  return { tu: partyKey, vao: p.merged_into, dung };
}

/** «<phone_hash>:<S0x>» cho mỗi (SĐT, nguồn) trên tin sống chưa có người sống mang bí danh sdt (E.164) đúng nguồn. */
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
