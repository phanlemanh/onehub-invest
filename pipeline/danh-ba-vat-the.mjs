#!/usr/bin/env node
// danh-ba-vat-the.mjs — DB1 danh-ba-toa-truc-can: dựng danh bạ vật thể toà · trục · căn cao tầng từ danh mục S08 đã nối
// khu (s08_project_links, DN1) + bí danh tên toà từ phát biểu trên tin; chủ đầu tư và phường là phát biểu cấp toà.
// Một giao dịch, khoá cố vấn; tra bí danh trước khi đúc nên chạy lại không đúc thêm (AC-4). Lõi: lib/danh-ba-vat-the.mjs.
// Đích (DB1b, dung-danh-ba-may-thu): DB thử `oneinvest_<việc>` trên máy này ghi không cờ; DB khác trên máy này (gồm máy thu
// `oneinvest`) chỉ với --db-that, và lần dựng đầu (chưa có toà) còn đòi --sao-luu <tệp pg_dump không rỗng>; máy chủ ngoài
// máy này luôn bị từ chối — đọc máy chủ từ connectionParameters của pg (tính cả ?host=, PGHOST). Không in mã S08 ra stdout.
// Bước đêm: buocVatTheDem(c), gọi từ refresh-bait-gap.mjs — chỉ giữ tươi khu đã có toà, không bao giờ dựng lần đầu.
//   node pipeline/danh-ba-vat-the.mjs --db <url> [--db-that] [--sao-luu <tệp>] [--tu-dien <tệp json>] [--khu <slug,slug>]
// DV1 (nut-du-an-tro-xa-moi): --sua-xa [--tep <tệp>] [--thu] ghi mã xã hiện hành cho mọi nút dự án từ tệp xã của nút
// (xã cũ có nguồn → area_aliases của PX1, tra theo mã), rút phường kế thừa của toà không còn đúng; cùng rào đích.
//   node pipeline/danh-ba-vat-the.mjs --sua-xa --db <url> [--db-that] [--tep pipeline/data/xa-nut-du-an.json] [--thu]
import { createHash } from "node:crypto";
import { readFileSync, realpathSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { join } from "node:path";
import {
  NGUON_DANH_MUC, chuanHoaTenToa, isoCuaKhu, keHoachDung, khuDaDung, kiemDich, kiemTepXa, phuongCuaToa, thamSoTuUrl,
  ungVienTuTin, upiToa, xaMoiCuaNut,
} from "./lib/danh-ba-vat-the.mjs";
import { basename } from "node:path";
import { khoaNhomThat } from "./lib/eval-labels.mjs";
import { NOI_KHU_S09 } from "./lib/s09-du-an.mjs";
import { buocS09 } from "./lib/s09-dung.mjs";

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
  if (!tep) return { giaTri: new Map(), ban: null, tep: null };
  const tho = readFileSync(tep);
  const j = JSON.parse(tho.toString("utf8"));
  const giaTri = new Map(Object.entries(j).filter(([k, v]) => !k.startsWith("_") && typeof v === "string" && v.trim()));
  return { giaTri, ban: createHash("sha256").update(tho).digest("hex"), tep: basename(tep) };
}

/**
 * DA1: bảng ISO từ DB — khu vực (loại, cha) và ISO của mỗi thị trường qua admin_code → iso_regions (088). Chưa áp 088 → null.
 * @param {import("pg").Client} c
 */
export async function napBangIso(c) {
  if (!(await c.query("SELECT to_regclass('public.iso_regions') AS t")).rows[0].t) return null;
  const { rows: v } = await c.query("SELECT id, region_type, parent_id FROM areas");
  const { rows: m } = await c.query(
    "SELECT a.id, r.iso_region FROM areas a JOIN iso_regions r ON r.admin_code = a.admin_code WHERE a.region_type = 'market'");
  return {
    vung: new Map(v.map((r) => [r.id, { region_type: r.region_type, parent_id: r.parent_id }])),
    isoCuaThiTruong: new Map(m.map((r) => [r.id, r.iso_region])),
  };
}

/**
 * Dựng trên một kết nối đã mở. Trả tổng kết (không mã S08).
 * @param {import("pg").Client} c
 */
export async function dung(c, {
  khuSlugs = KHU_MAC_DINH, tuDien = { giaTri: new Map(), ban: null, tep: null }, runId = `dbv-${Date.now()}`, log = console.log, isoTheo = null,
  noiS09 = NOI_KHU_S09,
} = {}) {
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
    // DA1: ISO của khu suy từ khu vực (088 iso_regions); chưa áp 088 → chỉ dựng lại khu đã có toà theo meta.city.
    const isoKhu = new Map();
    const bangIso = await napBangIso(c);
    if (bangIso) {
      for (const k of khu.values()) {
        const kq = isoTheo ? { iso: isoTheo(k) } : isoCuaKhu(k, bangIso);
        if (kq.loi) throw new LoiGoi(`khu ${k.slug}: ${kq.loi}`);
        isoKhu.set(k.id, kq.iso);
      }
    } else {
      const daCoToa = new Set(await khuDaDung(c));
      const moi = [...khu.values()].filter((k) => !daCoToa.has(k.slug)).map((k) => k.slug);
      if (moi.length) throw new LoiGoi(`chưa áp 088 — chỉ dựng lại khu đã có toà (${moi.join(", ")})`);
      log("danh-ba-vat-the: chưa áp 088 — ISO theo meta.city");
      for (const k of khu.values()) isoKhu.set(k.id, isoTheo ? isoTheo(k) : (ISO[k.city] ?? null));
    }
    for (const d of s08) d.iso = isoKhu.get(d.khu_id) ?? null;
    const khongIso = s08.filter((d) => !d.iso).length;
    if (khongIso) throw new Error(`khu không suy được mã tỉnh: ${khongIso} dòng`);

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

    // Chủ đầu tư (Hỏi-2, DA1): một phát biểu fact/source_field mỗi toà có dòng từ điển (nguồn là tệp, không có người duyệt); chạy lại không nhân (field_assertions_live_uq).
    const cdt = kh.toa.filter((t) => tuDien.giaTri.has(t.project_id));
    let builder = 0;
    for (const t of cdt) {
      const r = await c.query(
        `INSERT INTO field_assertions (resource_name, subject_key, field, value, evidence_tier, method, evidence, observed_at, run_id)
         VALUES ('Building', $1, 'builder_name', $2, 'fact', 'source_field', $3::jsonb, now(), $4) ON CONFLICT DO NOTHING`,
        [t.key, tuDien.giaTri.get(t.project_id), JSON.stringify({ tu_dien: "chu-dau-tu", ban: tuDien.ban, tep: tuDien.tep }), runId]);
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

    // DA31: phân khu, cụm, toà S09 (sau bước S08, cùng giao dịch). Chưa áp 097 hay khu không có dòng S09 → bỏ qua có lý do.
    const s09 = await buocS09(c, { khu, isoKhu, noi: noiS09, log });
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
      s09,
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
  const tk = await dung(c, { khuSlugs, runId: `dbv-dem-${Date.now()}`, log });
  log(`danh-ba-vat-the: đêm ${JSON.stringify({ khu: khuSlugs.length, khoa_moi: tk.khoa_moi })}`);
  return tk;
}

/** Tệp xã của nút dự án (DV1), một mục mỗi nút: xã cũ + nguồn, chọn khi tách, hay cấp tỉnh + lý do. */
export const TEP_XA = join(import.meta.dirname, "data/xa-nut-du-an.json");

const noiMa = (ds) => (ds?.length ? ds.join(",") : "∅");

/**
 * Bảng tra của DV1 từ DB: bí danh xã cũ (area_aliases, PX1) cho các mã trong tệp, mã xã → khu vực, tập thị trường.
 * @param {import("pg").Client} c @param {Record<string, object>} muc
 */
export async function napBangXa(c, muc) {
  const oldCodes = [...new Set(Object.values(muc).flatMap((m) => (m.xa_cu ?? []).map((x) => x.old_code)))];
  const { rows: al } = await c.query("SELECT old_code, targets, split FROM area_aliases WHERE old_code = ANY($1)", [oldCodes]);
  const { rows: ax } = await c.query(
    "SELECT id, region_type, admin_code FROM areas WHERE admin_code IS NOT NULL OR region_type = 'market'");
  return {
    biDanh: new Map(al.map((r) => [r.old_code, { targets: r.targets, split: r.split }])),
    maXa: new Map(ax.filter((r) => r.admin_code).map((r) => [r.admin_code, { id: r.id, region_type: r.region_type }])),
    thiTruong: new Set(ax.filter((r) => r.region_type === "market").map((r) => r.id)),
  };
}

/**
 * DV1: ghi mã xã hiện hành cho mọi nút dự án theo tệp xã. Một giao dịch, khoá cố vấn của danh bạ vật thể. Tệp phải khớp
 * một-một với nút dự án trong DB; một mục lỗi → LoiGoi, không ghi gì. Toà dưới nút đổi: phường kế thừa (registry_inherit)
 * khác phường mà toà nay được kế thừa thì bị rút (sua-xa-nut); phát biểu mới do lần dựng kế sinh.
 * @param {import("pg").Client} c
 * @param {{ tep?: string, thu?: boolean, rut?: boolean }} [o] rut=false chỉ cho chiều đỏ của test
 */
export async function suaXaNut(c, { tep = TEP_XA, thu = false, rut = true } = {}) {
  const tepXa = JSON.parse(readFileSync(tep, "utf8"));
  await c.query("BEGIN");
  try {
    await c.query("SELECT pg_advisory_xact_lock(hashtext($1))", [KHOA_CO_VAN]);
    const { rows: nut } = await c.query(
      "SELECT id::int AS id, slug, area_ids FROM asset_nodes WHERE node_type = 'project' ORDER BY slug");
    const loiTep = kiemTepXa(tepXa, nut.map((n) => n.slug));
    if (loiTep.length) throw new LoiGoi(loiTep.join("; "));
    const muc = tepXa.nut;
    const bang = await napBangXa(c, muc);
    const loi = [];
    const doi = [];
    for (const n of nut) {
      const kq = xaMoiCuaNut(muc[n.slug], bang);
      if (kq.loi) { loi.push(`${n.slug}: ${kq.loi}`); continue; }
      const cu = [...(n.area_ids ?? [])].sort();
      if (cu.join(",") !== kq.area_ids.join(",")) doi.push({ id: n.id, slug: n.slug, cu, moi: kq.area_ids });
    }
    if (loi.length) throw new LoiGoi(loi.join("; "));
    for (const d of doi) await c.query("UPDATE asset_nodes SET area_ids = $2 WHERE id = $1", [d.id, d.moi]);

    let soRut = 0;
    const coToa = (await c.query("SELECT to_regclass('public.buildings') AS t")).rows[0].t;
    if (doi.length && coToa) {
      const khuMoi = new Map(doi.map((d) => [d.id, { id: d.id, area_ids: d.moi }]));
      const { rows: con } = await c.query(
        "SELECT id::int AS id, parent_id::int AS parent_id, area_ids FROM asset_nodes WHERE parent_id = ANY($1)", [[...khuMoi.keys()]]);
      const nutVung = new Map([...khuMoi.values()].map((k) => [k.id, { ...k, khu: k.id }]));
      for (const n of con) nutVung.set(n.id, { id: n.id, area_ids: n.area_ids ?? [], khu: n.parent_id });
      const { rows: toa } = await c.query(
        "SELECT building_key, region_node_id::int AS r FROM buildings WHERE region_node_id = ANY($1)", [[...nutVung.keys()]]);
      const { rows: capRows } = await c.query("SELECT id, region_type FROM areas WHERE id = ANY($1)",
        [[...new Set([...nutVung.values()].flatMap((n) => n.area_ids))]]);
      const cap = new Map(capRows.map((r) => [r.id, r.region_type]));
      for (const t of toa) {
        const v = nutVung.get(t.r);
        const kq = phuongCuaToa({ nutVung: v, khu: khuMoi.get(v.khu), cap });
        if (!rut) continue;
        const r = await c.query(
          `UPDATE field_assertions SET retracted_at = clock_timestamp(), retract_reason = 'sua-xa-nut'
            WHERE retracted_at IS NULL AND resource_name = 'Building' AND subject_key = $1 AND field = 'area_id'
              AND method = 'registry_inherit' AND value IS DISTINCT FROM $2`, [t.building_key, kq.area_id ?? null]);
        soRut += r.rowCount;
      }
    }
    await c.query(thu ? "ROLLBACK" : "COMMIT");
    return { doi: doi.length, giu: nut.length - doi.length, rut: soRut, thu, bang: doi.map(({ slug, cu, moi }) => ({ slug, cu, moi })) };
  } catch (e) {
    await c.query("ROLLBACK").catch(() => {});
    throw e;
  }
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
  if (process.argv.includes("--sua-xa")) {
    const c = new pg.Client({ connectionString: url });
    await c.connect();
    try {
      const tk = await suaXaNut(c, { tep: arg("--tep", TEP_XA), thu: process.argv.includes("--thu") });
      for (const d of tk.bang) console.log(`${d.slug} · ${noiMa(d.cu)} → ${noiMa(d.moi)}`);
      console.log(`tong_ket ${JSON.stringify({ doi: tk.doi, giu: tk.giu, rut: tk.rut, thu: tk.thu })}`);
    } finally {
      await c.end();
    }
    return;
  }
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
