import { Hono } from "hono";
import type { Context } from "hono";
import { pool } from "../db/client.js";
import { BUILDING_KEY_NAMES, PROPERTY_SUB_TYPE, UNIT_ASSERTION_FIELDS, UNIT_KEY_NAMES, truongCua } from "../contract/property.js";

/**
 * GET /v1/properties… — Property (danh bạ nhà): toà và căn của danh bạ vật thể (ADR-0016), PB6.
 *
 *   GET /v1/properties?project=<id nút | tên dự án>&limit&offset   danh sách TOÀ của một dự án (không liệt kê căn)
 *   GET /v1/properties/lookup?project=&building=&unitNumber=        tra MỘT căn bằng dự án + toà + mã căn khách đã biết
 *   GET /v1/properties/<UniversalPropertyId>                        một toà
 *   GET /v1/properties/<UniversalPropertyId>/units/<unitKey>        một căn
 *
 * Luật (hợp đồng `_acceptance/data-api-property-danh-ba-nha`):
 *   - không trả mã căn, mã dự án, mã toà của nguồn; `unitNumber` chỉ nhắc lại chuỗi khách nhập ở /lookup;
 *   - không trả UniversalPropertySubId hay khoá trục (dò tầng ra cả cột căn); căn chỉ mang `unitKey` mờ;
 *   - mã nguồn làm đầu vào → 400 SOURCE_CODE_NOT_ACCEPTED (API không thành chỗ đổi mã nguồn sang UPI);
 *   - không đọc view `v_unit_thuoc_tinh` (864 ms/căn) và `offer_building` (501 ms/toà) lúc request: thuộc tính đọc thẳng
 *     `field_assertions` theo chỉ mục, số tin đang rao gom một câu cho mọi toà, giữ trong bộ nhớ 10 phút;
 *   - danh bạ chưa có ở DB (cloud hôm nay) → 503 DIRECTORY_UNAVAILABLE.
 */
export const propertiesRoute = new Hono();

/** Thứ tự nguồn khi chọn tên toà (bí danh `ten`). */
const THU_TU_TEN = ["S09", "S08", "S16", "S03"];
const LAM_TUOI_MS = 10 * 60 * 1000;
const TRAN_LIMIT = 100;

type Json = Record<string, unknown>;
type Dong = Record<string, unknown>;

const loi = (c: Context, status: 400 | 404 | 503, code: string, message: string, them: Json = {}) =>
  c.json({ error: { code, message, ...them } }, status);

/** Gập chữ để so tên: bỏ dấu, đ → d, hoa thường, mọi khoảng trắng. */
export function gapChu(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[đĐ]/g, "d")
    .toLowerCase()
    .replace(/\s+/g, "");
}

// ── Bộ nhớ đệm: chỉ những thứ rẻ để giữ và đắt để tính lại mỗi lần gọi ─────────────────────────────────────────────
let coDanhBaLuc = 0;
let coDanhBa = false;
let soTin: Map<string, number> | null = null;
let soTinLuc = 0;
let nguonMa: string[] | null = null;

/** Xoá bộ nhớ đệm (test dùng sau khi cấy dữ liệu). */
export function xoaBoNhoProperty() {
  coDanhBaLuc = 0;
  soTin = null;
  soTinLuc = 0;
  nguonMa = null;
}

async function danhBaCoMat(): Promise<boolean> {
  if (coDanhBa && Date.now() - coDanhBaLuc < LAM_TUOI_MS) return true;
  const { rows } = await pool.query(
    `SELECT to_regclass('public.buildings') IS NOT NULL AND to_regclass('public.units') IS NOT NULL
        AND to_regclass('public.registry_aliases') IS NOT NULL AND to_regclass('public.field_assertions') IS NOT NULL
        AND to_regclass('public.asset_nodes') IS NOT NULL AS co`,
  );
  coDanhBa = rows[0]?.co === true;
  coDanhBaLuc = Date.now();
  return coDanhBa;
}

/** Số tin đang rao gắn mỗi toà — một câu cho mọi toà, làm tươi 10 phút. */
async function bangSoTin(): Promise<Map<string, number>> {
  if (soTin && Date.now() - soTinLuc < LAM_TUOI_MS) return soTin;
  const { rows } = await pool.query(
    `SELECT ob.building_key, count(DISTINCT ob.offer_id)::int AS n
       FROM offer_building ob JOIN sale_offers o ON o.offer_id = ob.offer_id
      WHERE ob.muc = 'toa' AND ob.status = 'gan' AND o.offer_status = 'active'
      GROUP BY ob.building_key`,
  );
  soTin = new Map(rows.map((r) => [String(r.building_key), Number(r.n)]));
  soTinLuc = Date.now();
  return soTin;
}

/** Các nguồn có bí danh mã nguồn — dùng để đi chỉ mục (source, kind, value). */
async function cacNguonMa(): Promise<string[]> {
  if (nguonMa) return nguonMa;
  const { rows } = await pool.query(`SELECT code FROM source_registry WHERE code ~ '^S[0-9]{2}$' ORDER BY code`);
  nguonMa = rows.map((r) => String(r.code));
  return nguonMa;
}

/** Đầu vào trùng nguyên văn một mã nguồn còn sống (mọi nguồn, mọi loại vật thể) → true. */
async function laMaNguon(gtri: string[]): Promise<boolean> {
  const vao = [...new Set(gtri.map((g) => g.trim()).filter(Boolean))];
  if (vao.length === 0) return false;
  const nguon = await cacNguonMa();
  const { rows } = await pool.query(
    `SELECT 1 FROM registry_aliases
      WHERE source = ANY($1) AND kind = 'ma_nguon' AND retired_at IS NULL AND (value = ANY($2) OR upper(value) = ANY($3))
      LIMIT 1`,
    [nguon, vao, vao.map((v) => v.toUpperCase())],
  );
  return rows.length > 0;
}

// ── Dựng phần tử ────────────────────────────────────────────────────────────────────────────────────────────────────
/** Phần tử toà cho một danh sách building_key active, giữ thứ tự đầu vào. */
async function phanTuToa(keys: string[]): Promise<Map<string, Json>> {
  const ra = new Map<string, Json>();
  if (keys.length === 0) return ra;
  const [toa, ten, dem, tin] = await Promise.all([
    pool.query(
      `SELECT b.building_key, b.upi, b.catalog_tier, b.iso_region,
              n.id AS n_id, n.node_type, n.name AS n_name, n.area_ids,
              p.id AS p_id, p.node_type AS p_type, p.name AS p_name
         FROM buildings b
         JOIN asset_nodes n ON n.id = b.region_node_id
         LEFT JOIN asset_nodes p ON p.id = n.parent_id
        WHERE b.building_key = ANY($1) AND b.status = 'active'`,
      [keys],
    ),
    pool.query(
      `SELECT object_key, source, value FROM registry_aliases
        WHERE kind = 'ten' AND retired_at IS NULL AND object_key = ANY($1)
        ORDER BY object_key, first_seen, id`,
      [keys],
    ),
    pool.query(
      `SELECT building_key, count(*)::int AS n FROM units WHERE status = 'active' AND building_key = ANY($1) GROUP BY 1`,
      [keys],
    ),
    bangSoTin(),
  ]);
  const tenCua = new Map<string, Dong[]>();
  for (const r of ten.rows) {
    const k = String(r.object_key);
    if (!tenCua.has(k)) tenCua.set(k, []);
    tenCua.get(k)!.push(r);
  }
  const demCua = new Map(dem.rows.map((r) => [String(r.building_key), Number(r.n)]));

  // Phường: nút toà nằm trong đúng một phường thì lấy tên phường.
  const moiKhu = [...new Set(toa.rows.flatMap((r) => (Array.isArray(r.area_ids) ? (r.area_ids as string[]) : [])))];
  const tenPhuong = new Map<string, string>();
  if (moiKhu.length) {
    const { rows } = await pool.query(
      `SELECT id, name FROM areas WHERE id = ANY($1) AND region_type = 'ward'`,
      [moiKhu],
    );
    for (const r of rows) tenPhuong.set(String(r.id), String(r.name));
  }

  for (const r of toa.rows) {
    const k = String(r.building_key);
    const tens = tenCua.get(k) ?? [];
    let buildingName: string | null = null;
    for (const nguon of THU_TU_TEN) {
      const t = tens.find((x) => x.source === nguon);
      if (t) {
        buildingName = String(t.value);
        break;
      }
    }
    // Dự án / phân khu theo ADR-0013 §2: dự án → SubdivisionName, phân khu → ComplexName.
    let du_an: { id: number; name: string } | null = null;
    let complexName: string | null = null;
    if (r.node_type === "project") du_an = { id: Number(r.n_id), name: String(r.n_name) };
    if (r.node_type === "subzone") {
      complexName = String(r.n_name);
      if (r.p_type === "project") du_an = { id: Number(r.p_id), name: String(r.p_name) };
    }
    const phuong = (Array.isArray(r.area_ids) ? (r.area_ids as string[]) : []).filter((a) => tenPhuong.has(a));
    ra.set(k, {
      universalPropertyId: String(r.upi),
      buildingKey: k,
      buildingName,
      complexName,
      subdivisionName: null as string | null,
      projectId: null as number | null,
      city: phuong.length === 1 ? tenPhuong.get(phuong[0])! : null,
      stateOrProvince: r.iso_region ? String(r.iso_region) : null,
      country: "VN",
      catalogTier: String(r.catalog_tier),
      unitCount: demCua.get(k) ?? 0,
      activeListingCount: tin.get(k) ?? 0,
      _nut: { type: r.node_type, du_an },
    });
  }
  for (const v of ra.values()) {
    const du_an = (v._nut as { du_an: { id: number; name: string } | null }).du_an;
    v.subdivisionName = du_an?.name ?? null;
    v.projectId = du_an?.id ?? null;
    delete v._nut;
  }
  // Thứ tự khoá đúng tệp hợp đồng.
  for (const [k, v] of ra) ra.set(k, Object.fromEntries(BUILDING_KEY_NAMES.map((n) => [n, v[n] ?? null])));
  return ra;
}

/** Thuộc tính một căn: cùng luật thắng của v_unit_thuoc_tinh, đọc thẳng theo chỉ mục (subject_key, field). */
async function thuocTinhCan(unitKey: string): Promise<Json> {
  const { rows } = await pool.query(
    `SELECT DISTINCT ON (fa.field) fa.field, fa.value
       FROM field_assertions fa
      WHERE fa.subject_key = $1 AND fa.resource_name = 'Unit' AND fa.retracted_at IS NULL
        AND fa.method <> 'registry_inherit'
        AND fa.field = ANY ($2)
      ORDER BY fa.field,
               CASE fa.evidence_tier WHEN 'fact' THEN 3 WHEN 'observed' THEN 2 ELSE 1 END DESC,
               fa.observed_at DESC, fa.id DESC`,
    [unitKey, UNIT_ASSERTION_FIELDS],
  );
  const f = new Map(rows.map((r) => [String(r.field), String(r.value)]));
  const so = (key: string) => {
    const v = f.get(truongCua(key));
    return v !== undefined && Number.isFinite(Number(v)) ? Number(v) : null;
  };
  const livingArea = so("livingArea");
  const loai = f.get(truongCua("propertySubType"));
  return {
    livingArea,
    livingAreaUnits: livingArea === null ? null : "Square Meters",
    bedroomsTotal: so("bedroomsTotal"),
    bathroomsTotalInteger: so("bathroomsTotalInteger"),
    // Giá trị nội bộ không có dòng đổi → null: giá trị local không bao giờ ra API.
    propertySubType: loai !== undefined && loai in PROPERTY_SUB_TYPE ? PROPERTY_SUB_TYPE[loai] : null,
  };
}

async function phanTuCan(u: Dong, toa: Json): Promise<Json> {
  const tt = await thuocTinhCan(String(u.unit_key));
  const v: Json = { ...toa, unitKey: String(u.unit_key), unitFloorLocation: u.floor ? String(u.floor) : null, ...tt };
  return Object.fromEntries(UNIT_KEY_NAMES.map((n) => [n, v[n] ?? null]));
}

/** Toà theo UPI: active → khoá; merged → khoá đích; khác → null. */
async function toaTheoUpi(upi: string) {
  const { rows } = await pool.query(
    `SELECT b.building_key, b.status, m.upi AS merged_upi
       FROM buildings b LEFT JOIN buildings m ON m.building_key = b.merged_into
      WHERE b.upi = $1`,
    [upi],
  );
  return rows[0] as { building_key: string; status: string; merged_upi: string | null } | undefined;
}

// ── Đường ───────────────────────────────────────────────────────────────────────────────────────────────────────────
propertiesRoute.use("*", async (c, next) => {
  if (!(await danhBaCoMat())) return loi(c, 503, "DIRECTORY_UNAVAILABLE", "danh bạ chưa lên cloud");
  await next();
});

/** Dự án theo id nút hoặc tên (gập chữ, gồm bí danh của nút). */
async function duAnTheo(vao: string): Promise<{ id: number } | "mo-ho" | null> {
  if (/^[0-9]+$/.test(vao)) {
    const { rows } = await pool.query(`SELECT id FROM asset_nodes WHERE id = $1 AND node_type = 'project'`, [Number(vao)]);
    return rows[0] ? { id: Number(rows[0].id) } : null;
  }
  const { rows } = await pool.query(`SELECT id, name, aliases FROM asset_nodes WHERE node_type = 'project'`);
  const g = gapChu(vao);
  const khop = rows.filter((r) =>
    [String(r.name), ...((r.aliases as string[] | null) ?? [])].some((t) => gapChu(String(t)) === g),
  );
  if (khop.length > 1) return "mo-ho";
  return khop[0] ? { id: Number(khop[0].id) } : null;
}

/** building_key active của một dự án (nút dự án hoặc phân khu con trực tiếp). */
async function toaCuaDuAn(duAnId: number): Promise<string[]> {
  const { rows } = await pool.query(
    `SELECT b.building_key FROM buildings b JOIN asset_nodes n ON n.id = b.region_node_id
      WHERE b.status = 'active' AND (n.id = $1 OR (n.node_type = 'subzone' AND n.parent_id = $1))
      ORDER BY b.building_key`,
    [duAnId],
  );
  return rows.map((r) => String(r.building_key));
}

propertiesRoute.get("/", async (c) => {
  const project = (c.req.query("project") ?? "").trim();
  if (!project) return loi(c, 400, "BAD_REQUEST", "Cần ?project=<id nút hoặc tên dự án>");
  if (await laMaNguon([project])) return loi(c, 400, "SOURCE_CODE_NOT_ACCEPTED", "Không nhận mã của nguồn — dùng id nút hoặc tên dự án");
  const limit = Math.min(TRAN_LIMIT, Math.max(1, Number(c.req.query("limit") ?? 50) || 50));
  const offset = Math.max(0, Number(c.req.query("offset") ?? 0) || 0);
  const duAn = await duAnTheo(project);
  if (duAn === "mo-ho") return loi(c, 400, "AMBIGUOUS_PROJECT", "Tên dự án khớp nhiều dự án — dùng id nút");
  const keys = duAn ? await toaCuaDuAn(duAn.id) : [];
  const trang = keys.slice(offset, offset + limit);
  const pt = await phanTuToa(trang);
  return c.json({ data: trang.map((k) => pt.get(k)).filter(Boolean), meta: { total: keys.length, limit, offset } });
});

propertiesRoute.get("/lookup", async (c) => {
  const project = (c.req.query("project") ?? "").trim();
  const building = (c.req.query("building") ?? "").trim();
  const unitNumber = c.req.query("unitNumber") ?? "";
  if (!project || !building || !unitNumber.trim()) {
    return loi(c, 400, "BAD_REQUEST", "Cần đủ ?project=, ?building=, ?unitNumber=");
  }
  if (await laMaNguon([project, building, unitNumber])) {
    return loi(c, 400, "SOURCE_CODE_NOT_ACCEPTED", "Không nhận mã của nguồn — dùng tên dự án, tên toà và mã căn");
  }
  const rong = () => c.json({ data: [], meta: { total: 0 } });
  const duAn = await duAnTheo(project);
  if (duAn === "mo-ho") return loi(c, 400, "AMBIGUOUS_PROJECT", "Tên dự án khớp nhiều dự án — dùng id nút");
  if (!duAn) return rong();
  const toaDuAn = await toaCuaDuAn(duAn.id);
  let toa: string[];
  if (/^bld_/.test(building)) toa = toaDuAn.filter((k) => k === building);
  else {
    const { rows } = await pool.query(
      `SELECT DISTINCT object_key, value FROM registry_aliases
        WHERE kind = 'ten' AND retired_at IS NULL AND object_key = ANY($1)`,
      [toaDuAn],
    );
    const g = gapChu(building);
    toa = [...new Set(rows.filter((r) => gapChu(String(r.value)) === g).map((r) => String(r.object_key)))];
  }
  if (toa.length > 1) return loi(c, 400, "AMBIGUOUS_BUILDING", "Tên toà khớp nhiều toà trong dự án — dùng buildingKey");
  if (toa.length === 0) return rong();
  const nguon = await cacNguonMa();
  const { rows: can } = await pool.query(
    `SELECT DISTINCT u.unit_key, u.floor
       FROM units u JOIN registry_aliases r ON r.object_key = u.unit_key
      WHERE u.building_key = $1 AND u.status = 'active'
        AND r.source = ANY($2) AND r.kind = 'ma_nguon' AND r.retired_at IS NULL
        AND upper(btrim(split_part(r.value, '/', 2))) = $3`,
    [toa[0], nguon, unitNumber.trim().toUpperCase()],
  );
  if (can.length > 1) return loi(c, 400, "AMBIGUOUS_UNIT", "Mã căn khớp nhiều căn trong toà");
  if (can.length === 0) return rong();
  const pt = (await phanTuToa(toa)).get(toa[0]);
  if (!pt) return rong();
  return c.json({ data: [{ ...(await phanTuCan(can[0], pt)), unitNumber }], meta: { total: 1 } });
});

propertiesRoute.get("/:upi", async (c) => {
  const upi = c.req.param("upi");
  const b = await toaTheoUpi(upi);
  if (b?.status === "merged") {
    return loi(c, 404, "MERGED", "Toà đã gộp vào bản ghi khác", { mergedInto: b.merged_upi });
  }
  if (!b || b.status !== "active") return loi(c, 404, "NOT_FOUND", "Không có toà này");
  const pt = (await phanTuToa([b.building_key])).get(b.building_key);
  if (!pt) return loi(c, 404, "NOT_FOUND", "Không có toà này");
  return c.json({ data: pt });
});

propertiesRoute.get("/:upi/units/:unitKey", async (c) => {
  const upi = c.req.param("upi");
  const unitKey = c.req.param("unitKey");
  const b = await toaTheoUpi(upi);
  if (!b) return loi(c, 404, "NOT_FOUND", "Không có toà này");
  const { rows } = await pool.query(
    `SELECT unit_key, building_key, floor, status, merged_into FROM units WHERE unit_key = $1`,
    [unitKey],
  );
  const u = rows[0];
  if (!u || String(u.building_key) !== b.building_key) return loi(c, 404, "NOT_FOUND", "Không có căn này");
  if (u.status === "merged") return loi(c, 404, "MERGED", "Căn đã gộp vào bản ghi khác", { mergedInto: u.merged_into });
  if (u.status !== "active" || b.status !== "active") return loi(c, 404, "NOT_FOUND", "Không có căn này");
  const pt = (await phanTuToa([b.building_key])).get(b.building_key);
  if (!pt) return loi(c, 404, "NOT_FOUND", "Không có căn này");
  return c.json({ data: await phanTuCan(u, pt) });
});
