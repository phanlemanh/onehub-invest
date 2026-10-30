// eval-classify.mjs — PL9 `eval-classify-wilson`: chấm độ đúng của từng ô (cách đọc × trường × phân khúc) theo cận dưới
// Wilson so với ngưỡng F3 (docs/architecture/classification-enrich-review.md F3, §3.5, §0.4). Lõi thuần + hai hàm DB:
// `docNhanNguoi` (chỉ đọc) và `ghiKetQua` (chỉ ghi dq_check_results, một giao dịch). Tập mẫu PL8 đọc từ tệp JSONL — không
// nạp bộ sinh lib/tap-mau.mjs (AC-8 của PL8 chặn đường ấy).
import { parsePost, maToaCan } from "../transform-zalo.mjs";

/** Chín trường của bảng nhãn PL7 (054), đúng thứ tự màn gắn nhãn. */
export const TRUONG = Object.freeze([
  "listing_intent", "kind", "property_type", "project", "building",
  "price_min_vnd", "price_max_vnd", "area_m2", "bedrooms",
]);

/** Nhóm F3: A định nhóm/định danh, B số. Nhóm C (mô tả) chưa có trường nhãn. */
export const NHOM_TRUONG = Object.freeze({
  listing_intent: "A", kind: "A", property_type: "A", project: "A", building: "A",
  price_min_vnd: "B", price_max_vnd: "B", area_m2: "B", bedrooms: "B",
});
export const NGUONG = Object.freeze({ A: 0.95, B: 0.9 });

/** Lý do bỏ qua một ô — mã ghi vào detail; chữ hiện ở /ops/quality do app/src/lib/dq-labels.ts dịch. */
export const LY_DO = Object.freeze({ chuaCoCachDoc: "chua-co-cach-doc", chuaCoNhan: "chua-co-nhan-nguoi" });

const Z95 = 1.96;

/** Cận dưới khoảng tin cậy 95% hai phía của Wilson cho tỉ lệ `dung/n`; `n = 0` → null (không có số, không phải 0). */
export function wilsonDuoi(dung, n) {
  if (n === 0) return null;
  const p = dung / n;
  const z2 = Z95 * Z95;
  return (p + z2 / (2 * n) - Z95 * Math.sqrt((p * (1 - p)) / n + z2 / (4 * n * n))) / (1 + z2 / n);
}

/** Trạng thái một ô theo cận dưới (không theo tỉ lệ thô). */
export function xepTrangThai(truong, n, dung, coCachDoc = true) {
  const nhom = NHOM_TRUONG[truong];
  const nguong = NGUONG[nhom];
  if (!coCachDoc) return { nhom, nguong, can_duoi: null, trang_thai: "skip", ly_do: LY_DO.chuaCoCachDoc };
  if (n === 0) return { nhom, nguong, can_duoi: null, trang_thai: "skip", ly_do: LY_DO.chuaCoNhan };
  const can_duoi = wilsonDuoi(dung, n);
  return { nhom, nguong, can_duoi, trang_thai: can_duoi >= nguong ? "pass" : "fail", ly_do: null };
}

const chuanChu = (s) => String(s).normalize("NFC").trim().replace(/\s+/g, " ").toLowerCase();
const TRUONG_SO_NGUYEN = new Set(["price_min_vnd", "price_max_vnd", "bedrooms"]);

/**
 * Một trường của một tin đúng hay sai. `vang` = `{value, not_stated}`; `doc` = chuỗi cách đọc trả, hoặc null khi không trả.
 * Không nêu: đúng khi cách đọc cũng không trả. Giá, phòng ngủ: bằng nhau. Diện tích: lệch ≤ 3% (F3). Còn lại: chữ chuẩn hoá.
 */
export function soKhop(truong, vang, doc) {
  if (vang.not_stated) return doc == null;
  if (doc == null) return false;
  if (TRUONG_SO_NGUYEN.has(truong)) return /^\d+$/.test(doc) && /^\d+$/.test(vang.value) && BigInt(doc) === BigInt(vang.value);
  if (truong === "area_m2") {
    const g = Number(vang.value);
    return Math.abs(Number(doc) - g) <= 0.03 * g + 1e-9;
  }
  return chuanChu(doc) === chuanChu(vang.value);
}

// Đuôi căn của mã toà/căn (maToaCan): ".03", "-1203", "xx13".
const DUOI_CAN = /(?:[.\-]\d{2,4}|x{2}\d{2})$/;

/** Sổ cách đọc chạy được trên chữ tin. Mỗi mục: tên, trường nó trả, hàm đọc → {trường: chuỗi khuôn nhãn PL7 | null}. */
export const CACH_DOC = Object.freeze({
  parser: Object.freeze({
    ten: "parser",
    truong: Object.freeze(["kind", "building", "price_min_vnd", "price_max_vnd", "area_m2", "bedrooms"]),
    doc(text) {
      const p = parsePost(text);
      const gia = p.priceVnd == null ? null : String(Math.round(p.priceVnd));
      const toa = [...new Set(maToaCan(text).map((m) => m.replace(DUOI_CAN, "")))];
      return {
        kind: p.kind ?? null,
        building: toa.length === 1 ? toa[0].toLowerCase() : null,
        price_min_vnd: gia,
        price_max_vnd: gia,
        area_m2: p.areaM2 == null ? null : String(p.areaM2),
        bedrooms: p.bedrooms == null ? null : String(p.bedrooms),
      };
    },
  }),
});

/** Phân khúc của tin (FRAMING §3.4: thị trường × loại hình): loại hình theo nhãn vàng; vắng (bất đồng) → không có. */
export function phanKhuc(nhan) {
  const pt = nhan.property_type;
  if (!pt) return null;
  return pt.not_stated ? "khong-neu" : chuanChu(pt.value);
}

/**
 * Chấm mọi ô. `tin` = [{id, text, nhan: {trường: {value, not_stated}}}] — trường vắng là chưa có vàng (bất đồng).
 * Phân khúc `tat-ca` luôn đủ (số cách đọc × 9) ô; thêm một phân khúc cho mỗi loại hình có trong vàng.
 */
export function chamO({ tin, cachDoc = [CACH_DOC.parser] }) {
  const doc = tin.map((t) => new Map(cachDoc.map((c) => [c.ten, c.doc(t.text)])));
  const pk = tin.map((t) => phanKhuc(t.nhan));
  const phanKhucs = ["tat-ca", ...[...new Set(pk.filter(Boolean))].sort()];
  const o = [];
  for (const phan_khuc of phanKhucs) {
    const chiSo = tin.map((_, i) => i).filter((i) => phan_khuc === "tat-ca" || pk[i] === phan_khuc);
    for (const c of cachDoc) {
      for (const truong of TRUONG) {
        const coVang = chiSo.filter((i) => tin[i].nhan[truong]);
        const coCachDoc = c.truong.includes(truong);
        const n = coVang.length;
        const dung = coCachDoc ? coVang.filter((i) => soKhop(truong, tin[i].nhan[truong], doc[i].get(c.ten)[truong])).length : null;
        const x = xepTrangThai(truong, n, dung, coCachDoc);
        o.push({ phan_khuc, cach_doc: c.ten, truong, n, dung, ti_le: dung == null || n === 0 ? null : dung / n, ...x });
      }
    }
  }
  return o;
}

/** Khoá của detail, đúng thứ tự (AC-7). */
export const KHOA_DETAIL = Object.freeze(["run", "tap", "split", "n", "dung", "ti_le", "can_duoi", "nguong", "nhom", "ly_do", "bat_dong", "mat_chu"]);

const so4 = (x) => (x == null ? "-" : x.toFixed(4));

/** Một ô → chuỗi `khoá=giá trị` (khuôn dq-labels.ts đọc). */
export function veDetail(o, meta) {
  const v = {
    run: meta.run, tap: meta.tap, split: meta.split ?? "-", n: o.n, dung: o.dung ?? "-", ti_le: so4(o.ti_le),
    can_duoi: so4(o.can_duoi), nguong: o.nguong.toFixed(2), nhom: o.nhom, ly_do: o.ly_do ?? "-",
    bat_dong: meta.bat_dong ?? 0, mat_chu: meta.mat_chu ?? 0,
  };
  return KHOA_DETAIL.map((k) => `${k}=${v[k]}`).join(" ");
}

export const veEntity = (lat, o) => `${lat}|${o.phan_khuc}|${o.cach_doc}|${o.truong}`;

/** Đọc tập mẫu PL8 (JSONL của label-mau.mjs --out). Dòng đầu phải là dấu tập mẫu. */
export function docTapMau(noiDung) {
  const dong = noiDung.split("\n").filter((l) => l.trim());
  let dau;
  try {
    dau = JSON.parse(dong[0] ?? "null");
  } catch {
    dau = null;
  }
  if (!dau || dau.loai !== "tap-nhan-mau" || dau.mau !== true) {
    throw new Error("eval-classify: tệp khong phai tap nhan mau — dòng đầu phải có loai \"tap-nhan-mau\" và mau: true");
  }
  const tin = dong.slice(1).map((l) => JSON.parse(l)).map((t) => ({ id: t.id, text: t.text, nhan: t.nhan }));
  return { lat: dau.lat, seed: dau.seed, n: dau.n, tin };
}

/**
 * Nhãn vàng từ người cho một lát + split (mặc định test), trong giao dịch chỉ đọc. Một trường: một người, hoặc nhiều
 * người cùng nhãn → nhãn đó; khác nhau → loại, đếm `bat_dong`. Tin có nhãn mà mất chữ ở stg → loại, đếm `mat_chu`.
 */
export async function docNhanNguoi(client, { lat, split = "test" }) {
  await client.query("BEGIN TRANSACTION READ ONLY");
  try {
    const { rows: tins } = await client.query(
      `SELECT i.item_id::text AS item_id, i.ref_id, p.text
       FROM eval_label_items i
       LEFT JOIN LATERAL (SELECT text FROM stg_zalo_posts WHERE post_id = i.ref_id ORDER BY captured_at DESC LIMIT 1) p ON true
       WHERE i.lat = $1 AND i.split = $2
       ORDER BY i.item_id`,
      [lat, split],
    );
    const { rows: nhans } = await client.query(
      `SELECT l.item_id::text AS item_id, l.labeler_id, l.field, l.value, l.not_stated
       FROM eval_labels l JOIN eval_label_items i USING (item_id)
       WHERE i.lat = $1 AND i.split = $2`,
      [lat, split],
    );
    await client.query("COMMIT");
    return gopNhan(tins, nhans);
  } catch (e) {
    await client.query("ROLLBACK").catch(() => {});
    throw e;
  }
}

/** Gộp dòng nhãn thành nhãn vàng từng tin (hàm thuần của docNhanNguoi). */
export function gopNhan(tins, nhans) {
  const theoTin = new Map();
  for (const r of nhans) {
    if (!theoTin.has(r.item_id)) theoTin.set(r.item_id, new Map());
    const f = theoTin.get(r.item_id);
    if (!f.has(r.field)) f.set(r.field, new Map());
    f.get(r.field).set(r.labeler_id, { value: r.not_stated ? null : r.value, not_stated: r.not_stated });
  }
  let bat_dong = 0;
  let mat_chu = 0;
  const tin = [];
  for (const t of tins) {
    const f = theoTin.get(t.item_id);
    if (!f) continue; // chưa ai gắn
    if (t.text == null || t.text.trim() === "") {
      mat_chu++;
      continue;
    }
    const nhan = {};
    for (const [truong, nguoi] of f) {
      const khac = new Set([...nguoi.values()].map((x) => (x.not_stated ? "\u0000" : x.value)));
      if (khac.size === 1) nhan[truong] = [...nguoi.values()][0];
      else bat_dong++;
    }
    tin.push({ id: t.ref_id, text: t.text, nhan });
  }
  return { tin, bat_dong, mat_chu };
}

/** Ghi mỗi ô một dòng dq_check_results trong MỘT giao dịch; lỗi giữa chừng → không dòng nào ở lại. */
export async function ghiKetQua(client, o, meta) {
  await client.query("BEGIN");
  try {
    for (const x of o) {
      await client.query(
        `INSERT INTO dq_check_results (check_name, entity, status, detail) VALUES ('eval-classify', $1, $2, $3)`,
        [veEntity(meta.lat, x), x.trang_thai, veDetail(x, meta)],
      );
    }
    await client.query("COMMIT");
    return o.length;
  } catch (e) {
    await client.query("ROLLBACK").catch(() => {});
    throw e;
  }
}
