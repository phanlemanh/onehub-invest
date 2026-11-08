#!/usr/bin/env node
// danh-ba-vat-the.mjs — DB1 danh-ba-toa-truc-can: dựng danh bạ vật thể toà · trục · căn cao tầng từ danh mục S08 đã nối
// khu (s08_project_links, DN1) + bí danh tên toà từ phát biểu trên tin; chủ đầu tư và phường là phát biểu cấp toà.
// Một giao dịch, khoá cố vấn; tra bí danh trước khi đúc nên chạy lại không đúc thêm (AC-4). Lõi: lib/danh-ba-vat-the.mjs.
// Đích (DB1b, dung-danh-ba-may-thu): DB thử `oneinvest_<việc>` trên máy này ghi không cờ; DB khác trên máy này (gồm máy thu
// `oneinvest`) chỉ với --db-that, và lần dựng đầu (chưa có toà) còn đòi --sao-luu <tệp pg_dump không rỗng>; máy chủ ngoài
// máy này luôn bị từ chối — đọc máy chủ từ connectionParameters của pg (tính cả ?host=, PGHOST). Không in mã S08 ra stdout.
// Bước đêm: buocVatTheDem(c), gọi từ refresh-bait-gap.mjs — chỉ giữ tươi khu đã có toà, không bao giờ dựng lần đầu.
//   node pipeline/danh-ba-vat-the.mjs --db <url> [--db-that] [--sao-luu <tệp>] [--tu-dien <tệp json>] [--khu <slug,slug>]
import { createHash } from "node:crypto";
import { readFileSync, realpathSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import pg from "pg";
import {
  NGUON_DANH_MUC, chuanHoaTenToa, keHoachDung, khuDaDung, kiemDich, phuongCuaToa, thamSoTuUrl, ungVienTuTin, upiToa,
} from "./lib/danh-ba-vat-the.mjs";
import { khoaNhomThat } from "./lib/eval-labels.mjs";

export const KHU_MAC_DINH = Object.freeze(["vinhomes-ocean-park-1", "vinhomes-grand-park"]);
const ISO = Object.freeze({ hanoi: "VN-HN", hcmc: "VN-SG" });
const KHOA_CO_VAN = "danh-ba-vat-the";

/** Lỗi của người gọi (đích, cờ, slug khu) — lệnh thoát 2, khác lỗi chạy (thoát 1). */
export class LoiGoi extends Error {}

const arg = (ten, mac) => {
  const i = process.argv.indexOf(ten);
  return i > 0 ? process.argv[i + 1] : mac;
};

/** Từ điển chủ đầu tư: { "<project_id>": "<BuilderName>" }, khoá mở đầu «_» là ghi chú. */
export function docTuDien(tep) {
  if (!tep) return { giaTri: new Map(), ban: null };
  const tho = readFileSync(tep);
  const j = JSON.parse(tho.toString("utf8"));
  const giaTri = new Map(Object.entries(j).filter(([k, v]) => !k.startsWith("_") && typeof v === "string" && v.trim()));
  return { giaTri, ban: createHash("sha256").update(tho).digest("hex") };
}

/**
 * Dựng trên một kết nối đã mở. Trả tổng kết (không mã S08).
 * @param {import("pg").Client} c
 */
export async function dung(c, { khuSlugs = KHU_MAC_DINH, tuDien = { giaTri: new Map(), ban: null }, runId = `dbv-${Date.now()}` } = {}) {
  if (!Array.isArray(khuSlugs) || khuSlugs.length === 0) throw new LoiGoi("danh sách khu rỗng — không dựng gì");
  await c.query("BEGIN");
  try {
    await c.query("SELECT pg_advisory_xact_lock(hashtext($1))", [KHOA_CO_VAN]);
    const { rows: khuRows } = await c.query(
      "SELECT id::int AS id, slug, area_ids, meta->>'city' AS city FROM asset_nodes WHERE node_type = 'project' AND slug = ANY($1)", [khuSlugs]);
    const khu = new Map(khuRows.map((k) => [k.id, k]));
    const thieu = khuSlugs.filter((s) => !khuRows.some((k) => k.slug === s));
    if (thieu.length) throw new LoiGoi(`khu không có: ${thieu.join(", ")} — kiểm lại slug (--khu)`);
    const khuIds = [...khu.keys()];
    const { rows: pkRows } = await c.query(
      "SELECT id::int AS id, parent_id::int AS parent_id, name, aliases, area_ids FROM asset_nodes WHERE node_type = 'building' AND parent_id = ANY($1)",
      [khuIds]);
    const phanKhuTheoKhu = new Map();
    for (const p of pkRows) {
      const ds = phanKhuTheoKhu.get(p.parent_id) ?? [];
      ds.push({ id: p.id, ten: [p.name, ...(p.aliases ?? [])] });
      phanKhuTheoKhu.set(p.parent_id, ds);
    }
    const nutVung = new Map([...khuRows, ...pkRows].map((n) => [n.id, { id: n.id, area_ids: n.area_ids ?? [] }]));

    const { rows: s08 } = await c.query(
      `SELECT DISTINCT i.project_id, i.product_code, i.subdivision_name AS subdivision, l.asset_node_id::int AS khu_id
         FROM stg_s08_inventory i JOIN s08_project_links l ON l.project_id = i.project_id AND l.status = 'noi'
        WHERE i.project_type = 'high_rise' AND l.asset_node_id = ANY($1)
        ORDER BY 1, 2`, [khuIds]);
    for (const d of s08) d.iso = ISO[khu.get(d.khu_id)?.city] ?? null;
    const khongIso = s08.filter((d) => !d.iso).length;
    if (khongIso) throw new Error(`khu không suy được mã tỉnh (meta.city): ${khongIso} dòng`);

    const { rows: bd } = await c.query(
      "SELECT value, object_key FROM registry_aliases WHERE retired_at IS NULL AND kind = 'ma_nguon' AND source = $1", [NGUON_DANH_MUC]);
    const biDanh = new Map(bd.map((r) => [r.value, r.object_key]));
    const kh = keHoachDung({ dongS08: s08, biDanh, phanKhuTheoKhu });

    // Ghi: toà → trục → căn → bí danh.
    const toaMoi = kh.toa.filter((t) => t.moi);
    if (toaMoi.length) {
      await c.query(
        `INSERT INTO buildings (building_key, region_node_id, upi, iso_region, catalog_tier)
         SELECT k, r, u, i, 'xac_minh' FROM unnest($1::text[], $2::bigint[], $3::text[], $4::text[]) AS x(k, r, u, i)`,
        [toaMoi.map((t) => t.key), toaMoi.map((t) => t.region_node_id), toaMoi.map((t) => upiToa(t.iso, t.key)), toaMoi.map((t) => t.iso)]);
    }
    const trucMoi = kh.truc.filter((s) => s.moi);
    if (trucMoi.length) {
      await c.query(`INSERT INTO stacks (stack_key, building_key, catalog_tier)
                     SELECT k, b, 'xac_minh' FROM unnest($1::text[], $2::text[]) AS x(k, b)`,
                    [trucMoi.map((s) => s.key), trucMoi.map((s) => s.toa_key)]);
    }
    const canMoi = kh.can.filter((u) => u.moi);
    if (canMoi.length) {
      await c.query(`INSERT INTO units (unit_key, building_key, stack_key, floor, sub_id, catalog_tier)
                     SELECT k, b, s, f, s || ':' || f, 'xac_minh' FROM unnest($1::text[], $2::text[], $3::text[], $4::text[]) AS x(k, b, s, f)`,
                    [canMoi.map((u) => u.key), canMoi.map((u) => u.toa_key), canMoi.map((u) => u.truc_key), canMoi.map((u) => u.tang)]);
    }
    if (kh.biDanhMoi.length) {
      await c.query(`INSERT INTO registry_aliases (object_key, kind, value, source)
                     SELECT k, 'ma_nguon', v, $3 FROM unnest($1::text[], $2::text[]) AS x(k, v)`,
                    [kh.biDanhMoi.map((b) => b.object_key), kh.biDanhMoi.map((b) => b.value), NGUON_DANH_MUC]);
    }
    // Tên toà (S08) làm bí danh tên để khớp phát biểu trên tin.
    await c.query(`INSERT INTO registry_aliases (object_key, kind, value, source)
                   SELECT k, 'ten', v, $3 FROM unnest($1::text[], $2::text[]) AS x(k, v)
                   ON CONFLICT (object_key, kind, value) WHERE kind = 'ten' DO NOTHING`,
                  [kh.toa.map((t) => t.key), kh.toa.map((t) => chuanHoaTenToa(t.ma_toa)), NGUON_DANH_MUC]);

    // Phát biểu toà trên tin S03 có khu (sổ nhóm: collection_units.project_node_ids đúng một khu của lát — Hỏi-3).
    const { rows: nhom } = await c.query(
      "SELECT group_key, project_node_ids FROM collection_units WHERE source_code = 'S03' AND cardinality(project_node_ids) > 0");
    const khuCuaNhom = new Map();
    for (const n of nhom) {
      const ids = (n.project_node_ids ?? []).map(Number).filter((id) => khu.has(id));
      if (ids.length === 1 && (n.project_node_ids ?? []).length === 1) {
        khuCuaNhom.set(n.group_key, ids[0]);
        khuCuaNhom.set(khoaNhomThat(n.group_key), ids[0]);
      }
    }
    const { rows: pb } = await c.query(
      `SELECT DISTINCT ON (fa.subject_key, fa.value) fa.subject_key, fa.value, p.sender_id AS nguoi, p.conversation_id AS nhom
         FROM field_assertions fa JOIN stg_zalo_posts p ON fa.subject_key = 'S03:' || p.post_id
        WHERE fa.resource_name = 'Property' AND fa.field = 'block_raw' AND fa.retracted_at IS NULL
        ORDER BY fa.subject_key, fa.value, p.captured_at DESC`);
    const phatBieu = pb.map((r) => ({ ...r, khu_id: khuCuaNhom.get(r.nhom) ?? khuCuaNhom.get(khoaNhomThat(r.nhom ?? "")) ?? null }));
    const toaTheoKhu = new Map();
    for (const t of kh.toa) {
      const m = toaTheoKhu.get(t.khu_id) ?? new Map();
      const ten = chuanHoaTenToa(t.ma_toa);
      m.set(ten, [...(m.get(ten) ?? []), t.key]);
      toaTheoKhu.set(t.khu_id, m);
    }
    const uv = ungVienTuTin({ phatBieu, toaTheoKhu });
    let biDanhTuTin = 0;
    if (uv.biDanhTen.length) {
      const r = await c.query(`INSERT INTO registry_aliases (object_key, kind, value, source)
                     SELECT k, 'ten', v, s FROM unnest($1::text[], $2::text[], $3::text[]) AS x(k, v, s)
                     ON CONFLICT (object_key, kind, value) WHERE kind = 'ten' DO NOTHING`,
                    [uv.biDanhTen.map((b) => b.object_key), uv.biDanhTen.map((b) => b.value), uv.biDanhTen.map((b) => b.source)]);
      biDanhTuTin = r.rowCount;
    }

    // Chủ đầu tư (Hỏi-2): một phát biểu fact/hitl mỗi toà có dòng từ điển; chạy lại không nhân (field_assertions_live_uq).
    const cdt = kh.toa.filter((t) => tuDien.giaTri.has(t.project_id));
    let builder = 0;
    for (const t of cdt) {
      const r = await c.query(
        `INSERT INTO field_assertions (resource_name, subject_key, field, value, evidence_tier, method, evidence, observed_at, run_id)
         VALUES ('Building', $1, 'builder_name', $2, 'fact', 'hitl', $3::jsonb, now(), $4) ON CONFLICT DO NOTHING`,
        [t.key, tuDien.giaTri.get(t.project_id), JSON.stringify({ tu_dien: "chu-dau-tu", ban: tuDien.ban }), runId]);
      builder += r.rowCount;
    }

    // Phường của toà (Hỏi-5): suy từ nút vùng có đúng một phường.
    const { rows: capRows } = await c.query(
      "SELECT id, region_type FROM areas WHERE id = ANY($1)", [[...new Set([...nutVung.values()].flatMap((n) => n.area_ids))]]);
    const cap = new Map(capRows.map((r) => [r.id, r.region_type]));
    let phuong = 0;
    const lyDoPhuong = {};
    for (const t of kh.toa) {
      const kq = phuongCuaToa({ nutVung: nutVung.get(t.region_node_id), khu: nutVung.get(t.khu_id), cap });
      if (!kq.area_id) {
        lyDoPhuong[kq.ly_do] = (lyDoPhuong[kq.ly_do] ?? 0) + 1;
        continue;
      }
      const r = await c.query(
        `INSERT INTO field_assertions (resource_name, subject_key, field, value, evidence_tier, method, evidence, observed_at, run_id)
         VALUES ('Building', $1, 'area_id', $2, 'inferred', 'registry_inherit', $3::jsonb, now(), $4) ON CONFLICT DO NOTHING`,
        [t.key, kq.area_id, JSON.stringify({ nut_vung: kq.nut_vung }), runId]);
      phuong += r.rowCount;
    }
    await c.query("COMMIT");

    const theoKhu = {};
    for (const [id, k] of khu) {
      theoKhu[k.slug] = {
        toa: kh.toa.filter((t) => t.khu_id === id).length,
        truc: kh.truc.filter((s) => kh.toa.find((t) => t.key === s.toa_key)?.khu_id === id).length,
        can: kh.can.filter((u) => kh.toa.find((t) => t.key === u.toa_key)?.khu_id === id).length,
        ti_le_tach: kh.tiLe[id] ? Number((kh.tiLe[id].tach / kh.tiLe[id].n).toFixed(4)) : null,
        ma: kh.tiLe[id]?.n ?? 0,
      };
    }
    const lyDo = {};
    for (const l of kh.soLyDo) lyDo[l.ly_do] = (lyDo[l.ly_do] ?? 0) + l.so;
    const khuKhongS08 = [...khu.values()].filter((k) => !s08.some((d) => d.khu_id === k.id)).map((k) => k.slug);
    for (const s of khuKhongS08) console.warn(`danh-ba-vat-the: cảnh báo — khu ${s} có nút nhưng 0 dòng danh mục cao tầng đã nối`);
    return {
      khu: theoKhu,
      khu_khong_s08: khuKhongS08,
      khoa_moi: toaMoi.length + trucMoi.length + canMoi.length,
      ly_do: lyDo,
      bi_danh_ten_tu_tin: biDanhTuTin,
      ung_vien: uv.ungVien.length,
      builder_name_moi: builder,
      phuong_moi: phuong,
      ly_do_phuong: lyDoPhuong,
    };
  } catch (e) {
    await c.query("ROLLBACK").catch(() => {});
    throw e;
  }
}

/**
 * Bước đêm (gọi từ refresh-bait-gap.mjs sau danh bạ Người): giữ tươi khu đã có toà; không dựng lần đầu, không từ điển
 * chủ đầu tư (phát biểu builder_name là hitl — chỉ lệnh tay ghi). Đích ngoài máy này → ném trước câu truy vấn đầu tiên.
 * @param {import("pg").Client} c
 */
export async function buocVatTheDem(c, { log = console.log } = {}) {
  const kq = kiemDich(c.connectionParameters, { dbThat: true });
  if (!kq.ok) throw new Error(`danh-ba-vat-the: ${kq.ly_do}`);
  if (!(await c.query("SELECT to_regclass('public.buildings') AS t")).rows[0].t) {
    log("danh-ba-vat-the: bỏ qua — DB chưa áp 082");
    return { bo_qua: "chua-ap-082" };
  }
  const khuSlugs = await khuDaDung(c);
  if (khuSlugs.length === 0) {
    log("danh-ba-vat-the: bỏ qua — chưa dựng lần đầu (lần đầu là lệnh tay --db-that --sao-luu)");
    return { bo_qua: "chua-dung-lan-dau" };
  }
  const tk = await dung(c, { khuSlugs, runId: `dbv-dem-${Date.now()}` });
  log(`danh-ba-vat-the: đêm ${JSON.stringify({ khu: khuSlugs.length, khoa_moi: tk.khoa_moi })}`);
  return tk;
}

/** Tệp sao lưu dùng được: có thật, là tệp, không rỗng. */
function tepSaoLuuDung(tep) {
  try {
    const st = statSync(tep);
    return st.isFile() && st.size > 0;
  } catch {
    return false;
  }
}

async function main() {
  const url = arg("--db", process.env.DATABASE_URL);
  const dbThat = process.argv.includes("--db-that");
  const kq = kiemDich(thamSoTuUrl(url), { dbThat });
  if (!kq.ok) throw new LoiGoi(url ? kq.ly_do : "thiếu --db");
  const khuSlugs = (arg("--khu", null)?.split(",") ?? KHU_MAC_DINH).map((s) => s.trim()).filter(Boolean);
  if (!khuSlugs.length) throw new LoiGoi("--khu rỗng");
  const tuDien = docTuDien(arg("--tu-dien", null));
  const c = new pg.Client({ connectionString: url });
  await c.connect();
  try {
    if (kq.loai === "that") {
      // Lần dựng đầu trên DB thật (chưa có toà): bắt buộc chỉ ra bản sao lưu — lời «sao lưu trước» của Mạnh thành rào máy.
      const coBang = (await c.query("SELECT to_regclass('public.buildings') AS t")).rows[0].t;
      const soToa = coBang ? (await c.query("SELECT count(*)::int AS n FROM buildings")).rows[0].n : 0;
      const tep = arg("--sao-luu", null);
      if (soToa === 0 && !(tep && tepSaoLuuDung(tep))) {
        throw new LoiGoi("lần dựng đầu trên DB không phải DB thử — khai --sao-luu <tệp pg_dump không rỗng> đã làm trước");
      }
    }
    const tk = await dung(c, { khuSlugs, tuDien });
    console.log(`tong_ket ${JSON.stringify(tk)}`);
  } finally {
    await c.end();
  }
}

// So bằng realpath: launchd và lệnh cũ gọi qua symlink ~/dev/one-invest (khuôn của scripts/entrypoint-symlink.test.mjs).
if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((e) => {
    console.error(`danh-ba-vat-the: ${e.message}`);
    process.exit(e instanceof LoiGoi ? 2 : 1);
  });
}
