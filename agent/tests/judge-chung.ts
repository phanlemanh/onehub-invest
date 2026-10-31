// judge-chung.ts — dựng cặp tin và hàm soi ngưỡng dùng chung cho judge-nguong.test.ts và judge-run.test.ts (PL25).
import assert from "node:assert/strict";
import { readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import pg from "pg";
import type { PairData } from "../src/tools/native.js";

export type Tin = {
  perm2: number | null; area: number | null; phuong: string | null; loai: string | null;
  street?: string | null; block?: string | null; floor?: string | null; bathrooms?: number | null; pn?: number | null;
};
export const TR = 1e6;

/** Cặp tin từ hai bộ số đo; giá = giá/m² × diện tích như bộ chuẩn hoá ghi. */
export function cap(a: Tin, b: Tin): PairData {
  const tin = (t: Tin, id: string) => ({
    offerId: id,
    source: "S03",
    kind: "sale",
    priceVnd: t.perm2 !== null && t.area !== null ? t.perm2 * t.area : null,
    areaM2: t.area,
    pricePerm2: t.perm2,
    bedrooms: t.pn ?? null,
    phuong: t.phuong,
    propertyType: t.loai,
    sellerName: null,
    street: t.street ?? null,
    block: t.block ?? null,
    floor: t.floor ?? null,
    bathrooms: t.bathrooms ?? null,
  });
  return {
    a: { ...tin(a, "offer_a"), text: "Bán nhà hẻm xe hơi, sổ hồng riêng" },
    b: { ...tin(b, "offer_b"), subject: "Nhà phố hẻm xe hơi" },
    score: 0.92,
    signals: {},
  };
}
/** Soi chữ tìm số ngưỡng — dùng chung với judge-run.test.ts. Trả danh sách chỗ trúng. */
export function soiNguong(text: string): string[] {
  const mau = [/(?<![\d.,])(?:15|10|30)(?:[.,]0+)?\s*%/g, /(?<![\d.,])0\.(?:15|1|3)(?![\d])/g, /[<>≤≥]\s*\d/g];
  return mau.flatMap((m) => [...text.matchAll(m)].map((x) => x[0]));
}
export const kiemKhongNguong = (text: string) => {
  const trung = soiNguong(text);
  assert.equal(trung.length, 0, `AC-2 prompt chứa ngưỡng: ${trung.join(", ")}`);
};


// ── judge-evidence-du-truong: khuôn khoá evidence rút từ HAI tệp thật, không viết tay.
const GOC = join(import.meta.dirname, "../..");
const REVIEW_CAN_CU = join(GOC, "app/src/lib/ops/review-can-cu.ts");

/** Khoá jsonb_build_object của 'offer_a'/'offer_b' trong seed 029. */
export async function khoaSeed029(ben: "offer_a" | "offer_b"): Promise<string[]> {
  const sql = await readFile(join(GOC, "db/migrations/029_review_queue.sql"), "utf8");
  const seed = sql.slice(sql.indexOf("-- Seed"));
  const dau = seed.indexOf(`'${ben}', jsonb_build_object(`);
  const cuoi = ben === "offer_a" ? seed.indexOf(`'offer_b', jsonb_build_object(`) : seed.indexOf(`'stage_b_score'`);
  assert.ok(dau >= 0 && cuoi > dau, `không rút được khối ${ben} từ seed 029`);
  const khoi = seed.slice(seed.indexOf("\n", dau), cuoi);
  return [...khoi.matchAll(/^\s*'(\w+)',/gm)].map((x) => x[1]).sort();
}

/** Khoá 'key:' của TRUONG_GHEP_CAN trong review-can-cu.ts (bảng so mười hàng). `ten` đổi được để dựng đối chứng đỏ. */
export async function khoaBangSo(ten = "TRUONG_GHEP_CAN"): Promise<string[]> {
  const src = await readFile(REVIEW_CAN_CU, "utf8");
  const m = src.match(new RegExp(`export const ${ten}\\b[^=]*=\\s*\\[([\\s\\S]*?)\\n\\];`));
  if (!m) throw new Error("JE-AC-1 không rút được TRUONG_GHEP_CAN");
  return [...m[1].matchAll(/key:\s*"(\w+)"/g)].map((x) => x[1]);
}

/** Khuôn khoá mong đợi của một bên = seed 029 ∪ bảng so. */
export async function khuonBen(ben: "offer_a" | "offer_b"): Promise<string[]> {
  return [...new Set([...(await khoaSeed029(ben)), ...(await khoaBangSo())])].sort();
}

/** Tập khoá của một bên bằng khuôn — lệch thì nêu tên khoá. */
export const kiemKhuonThe = (khoa: string[], mau: string[], ma = "JE-AC-1") => {
  const lech = [...mau.filter((k) => !khoa.includes(k)), ...khoa.filter((k) => !mau.includes(k))];
  assert.equal(lech.length, 0, `${ma} thẻ lệch khuôn: ${lech.join(", ")}`);
};

/** Nạp soTruongGhepCan THẬT: bản chép tạm cạnh tests, chỉ đổi đường import alias '@/lib/vocab.generated'. */
export async function napBangSo(): Promise<{ soTruongGhepCan: (a: object, b: object) => { key: string; a: unknown; b: unknown; so: string }[]; don: () => Promise<void> }> {
  const src = await readFile(REVIEW_CAN_CU, "utf8");
  const vocab = pathToFileURL(join(GOC, "app/src/lib/vocab.generated.ts")).href;
  assert.ok(src.includes(`"@/lib/vocab.generated"`), "review-can-cu.ts đổi đường import — cập nhật napBangSo");
  const tam = join(import.meta.dirname, `.tam-review-can-cu-${process.pid}.ts`);
  await writeFile(tam, src.replace(`"@/lib/vocab.generated"`, JSON.stringify(vocab)));
  const mod = await import(pathToFileURL(tam).href);
  return { soTruongGhepCan: mod.soTruongGhepCan, don: () => rm(tam, { force: true }) };
}

const PG_SERVER = process.env.SCA_PG_SERVER ?? "postgres://oneinvest:oneinvest@localhost:5433";

/** Các cột của sale_offers mà câu SELECT của queryPair đọc. */
export const COT_QUERY_PAIR = [
  "offer_id", "source", "kind", "price_vnd", "area_m2", "price_perm2", "bedrooms", "phuong_raw", "property_type",
  "seller_name", "post_ids", "street_raw", "block_raw", "floor_raw", "bathrooms",
];

/** Dựng sale_offers trên DB thử theo kiểu cột của oneinvest — thiếu cột nào thì nêu tên. Dùng chung với lô thật. */
export async function dungSaleOffers(db: pg.Client, ma = "JE-AC-2"): Promise<void> {
  const goc = new pg.Client({ connectionString: `${PG_SERVER}/oneinvest` });
  await goc.connect();
  try {
    const { rows } = await goc.query(
      `SELECT column_name, format_type(a.atttypid, a.atttypmod) AS kieu
         FROM information_schema.columns c
         JOIN pg_attribute a ON a.attrelid = 'public.sale_offers'::regclass AND a.attname = c.column_name
        WHERE c.table_schema = 'public' AND c.table_name = 'sale_offers' AND c.column_name = ANY($1)`,
      [COT_QUERY_PAIR],
    );
    const kieu = new Map(rows.map((r) => [r.column_name as string, r.kieu as string]));
    for (const c of COT_QUERY_PAIR) if (!kieu.has(c)) throw new Error(`${ma} oneinvest.sale_offers thiếu cột ${c}`);
    const cot = COT_QUERY_PAIR.map((c) => `${c} ${kieu.get(c)}${c === "offer_id" ? " PRIMARY KEY" : ""}`);
    await db.query(`CREATE TABLE sale_offers (${cot.join(", ")})`);
  } finally {
    await goc.end();
  }
  await db.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto`);
  const m027 = await readFile(join(GOC, "db/migrations/027_properties.sql"), "utf8");
  const khoiPC = m027.match(/CREATE TABLE IF NOT EXISTS property_candidates \([\s\S]*?\n\);/);
  assert.ok(khoiPC, "không rút được khối property_candidates từ 027");
  await db.query(khoiPC[0]);
  await db.query(`CREATE TABLE stg_zalo_posts (post_id text, agent_id text, text text, captured_at timestamptz)`);
  await db.query(`CREATE TABLE stg_chotot_ads (list_id bigint, subject text)`);
}
