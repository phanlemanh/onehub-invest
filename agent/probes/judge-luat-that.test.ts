// judge-luat-that.test.ts — hai ca LT-AC-6 của hồ sơ judge-luat-loai-tru-dac-trung (HD2), dời khỏi suite chung (hồ sơ
// l2-bao-thu-doi-probe-that): luật loại trừ trên thẻ ghép căn đã quyết và bộ nạp cặp trên tin thật của DB máy thu (chỉ SELECT).
// Chạy ở: executors.test.judge_luat (eval đã ký) và scripts/probe-du-lieu-that.sh (/ops-check mục B5).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import pg from "pg";
import type { PairData } from "../src/tools/native.js";
import { queryPair } from "../src/tools/native.js";
import * as that from "../src/agents/judge-entity.js";
import { dotBienLuoi, giaDo, trongScript } from "./chung.js";

type Mod = typeof that;
/** Bản luật cũ pl25-1 (tests/fixtures/judge-entity-pl25-1.ts.txt) — chiều đỏ. */
const cu = () => dotBienLuoi<Mod>("judge-entity", "lt-cu", "pl25-1", () => readFileSync(join(import.meta.dirname, "../tests/fixtures/judge-entity-pl25-1.ts.txt"), "utf8"));
const dotBien = (doi: (s: string) => string) => dotBienLuoi<Mod>("judge-entity", "lt", "bo-dien-tich", doi);

// ---------- LT-AC-6: probe DB máy thu (chỉ SELECT) ----------
type Ben = Record<string, unknown>;
const so = (v: unknown) => (v === null || v === undefined || v === "" ? null : Number(v));
const chu = (v: unknown) => (typeof v === "string" && v.trim() ? v : null);
function tuEvidence(a: Ben, b: Ben): PairData {
  const ben = (t: Ben) => ({
    offerId: String(t.offer_id), source: String(t.source ?? ""), kind: "sale",
    priceVnd: so(t.price_vnd), areaM2: so(t.area_m2), pricePerm2: so(t.price_perm2), bedrooms: so(t.bedrooms),
    phuong: chu(t.phuong), propertyType: chu(t.property_type), sellerName: null,
    street: chu(t.street), block: chu(t.block), floor: chu(t.floor), bathrooms: so(t.bathrooms),
  });
  return { a: { ...ben(a), text: null }, b: { ...ben(b), subject: null }, score: 0, signals: {} };
}
/** Tính độc lập «có ≥1 đặc trưng khác ở cả hai bên» — viết lại trong test, không import khoá hay NGUONG của luật: số
 *  viết thẳng (1 m², căn hộ 10%); đường/toà/tầng chuẩn hoá theo cách đọc rộng nhất (Ngoài-8 của Cổng 2 lần 1). */
const tron = (v: string) => v.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/gi, "d").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
function cachDocDuong(v: string): string[] {
  const t = tron(v);
  const bo = t.replace(/^(?:duong|pho|d) /, "");
  return [t, bo];
}
function maToa(v: string): string | null {
  const t = tron(v).replace(/^(?:toa|block|thap|tower|lo|building) /, "");
  if (t.includes(" ") || !t || t.length > 8) return null;
  return /\d/.test(t) || t.length <= 3 ? t : null;
}
const soDau = (v: string) => (v.match(/\d+/) ?? [null])[0];
function coDacTrungKhac(p: PairData): boolean {
  const { a, b } = p;
  const hai = (x: unknown, y: unknown) => x !== null && y !== null;
  if (hai(a.bedrooms, b.bedrooms) && a.bedrooms !== b.bedrooms) return true;
  if (hai(a.bathrooms, b.bathrooms) && a.bathrooms !== b.bathrooms) return true;
  if (a.areaM2 && b.areaM2) {
    const d = Math.abs(a.areaM2 - b.areaM2);
    const canHo = a.propertyType === "apartment" || b.propertyType === "apartment";
    if (d > 1 + 1e-9 && (!canHo || d / Math.max(a.areaM2, b.areaM2) > 0.1)) return true;
  }
  if (a.street && b.street) {
    const da = cachDocDuong(a.street);
    if (!cachDocDuong(b.street).some((k) => k && da.includes(k))) return true;
  }
  if (a.block && b.block) {
    const ta = maToa(a.block);
    const tb = maToa(b.block);
    if (ta !== null && tb !== null && ta !== tb) return true;
  }
  if (a.floor && b.floor) {
    const fa = soDau(a.floor);
    const fb = soDau(b.floor);
    if (fa !== null && fb !== null && Number(fa) !== Number(fb)) return true;
  }
  return false;
}
async function docThe(c: pg.Client) {
  const { rows } = await c.query(
    `SELECT id::int AS id, status, evidence FROM review_queue WHERE item_type = 'entity_match' AND status IN ('approved','rejected') ORDER BY id`,
  );
  return rows.map((r) => ({ id: r.id as number, status: r.status as string, p: tuEvidence(r.evidence.offer_a, r.evidence.offer_b) }));
}
/** Luật trên mọi thẻ đã quyết, theo TÍNH CHẤT chứ không theo danh sách id (Ngoài-6 của Cổng 2 lần 1): người quyết thêm
 *  thẻ thì phép đo vẫn đứng. Trả số thẻ từ chối có đặc trưng khác. */
function kiemAc6(mod: Mod, the: Awaited<ReturnType<typeof docThe>>) {
  const loai = the.filter((t) => t.status === "rejected" && coDacTrungKhac(t.p)).map((t) => t.id);
  for (const t of the) {
    const kq = mod.apNguong(t.p).same_house;
    if (loai.includes(t.id)) assert.equal(kq, "no", `LT-AC-6 thẻ người từ chối không bị loại: #${t.id}`);
    if (t.status === "approved") assert.notEqual(kq, "no", `LT-AC-6 thẻ người nhận bị loại: #${t.id}`);
  }
  return loai.length;
}

test("LT-AC-6 probe thẻ đã quyết", async (t) => {
  if (process.env.CI) return t.skip("cần DB máy thu có thẻ ghép căn đã quyết — CI chỉ có lược đồ");
  giaDo("judge-luat-that");
  const c = new pg.Client({ connectionString: process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest" });
  await c.connect();
  try {
    const the = await docThe(c);
    if (the.length === 0) return t.skip("máy thu chưa có thẻ ghép căn đã quyết — bàn đo rỗng");
    assert.ok(kiemAc6(that, the) >= 1, "LT-AC-6 không có thẻ từ chối nào có đặc trưng khác — bàn đo không phân biệt");
    if (trongScript()) return;
    await assert.rejects(async () => kiemAc6(await cu(), the), /LT-AC-6 thẻ người từ chối không bị loại/);
    const boDienTich = await dotBien((s) => s.replace("let khacDacTrung = khacDienTich;", "let khacDacTrung = false;"));
    await assert.rejects(async () => kiemAc6(boDienTich, the), /LT-AC-6 thẻ người từ chối không bị loại/);
  } finally {
    await c.end();
  }
});

test("LT-AC-6 bộ nạp cặp thật", async (t) => {
  if (process.env.CI) return t.skip("cần DB máy thu có tin thật — CI chỉ có lược đồ");
  const c = new pg.Client({ connectionString: process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest" });
  await c.connect();
  try {
    const { rows } = await c.query(
      `SELECT offer_id FROM sale_offers WHERE source = 'S06' AND street_raw IS NOT NULL AND bathrooms IS NOT NULL ORDER BY offer_id LIMIT 2`,
    );
    if (rows.length < 2) return t.skip("máy thu không có hai tin S06 có đường và WC");
    const p = await queryPair(rows[0].offer_id, rows[1].offer_id, c);
    assert.ok(p, "queryPair trả null cho hai tin sống");
    assert.ok(p.a.street !== null && p.a.bathrooms !== null, "LT-AC-6 bộ nạp cặp thiếu trường đặc trưng");
  } finally {
    await c.end();
  }
});
