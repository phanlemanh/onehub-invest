// judge-pair.test.ts — hồ sơ `judge-evidence-du-truong` AC-2 (E2): queryPair THẬT đọc street_raw, block_raw, floor_raw,
// bathrooms của đúng tin mỗi bên. DB thử riêng trên :5433 (tạo đầu tệp, xoá cuối tệp); sale_offers dựng theo kiểu cột của
// oneinvest.sale_offers (đọc information_schema — chỉ SELECT trên oneinvest), cùng property_candidates (027),
// stg_zalo_posts/stg_chotot_ads tối thiểu và pgcrypto. Đối chứng đỏ chạy ĐÚNG hàm kiểm trên vật hỏng, thông điệp ghim.
import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import pg from "pg";
import { queryPair, type PairData } from "../src/tools/native.js";
import { dungSaleOffers } from "./judge-chung.js";

const SERVER = process.env.SCA_PG_SERVER ?? "postgres://oneinvest:oneinvest@localhost:5433";
const TEN_DB = `oneinvest_p3_pair_test_${process.pid}`;

let db: pg.Client;
before(async () => {
  const admin = new pg.Client({ connectionString: `${SERVER}/postgres` });
  await admin.connect();
  await admin.query(`DROP DATABASE IF EXISTS ${TEN_DB}`);
  await admin.query(`CREATE DATABASE ${TEN_DB}`);
  await admin.end();
  db = new pg.Client({ connectionString: `${SERVER}/${TEN_DB}` });
  await db.connect();
  await dungSaleOffers(db);
});

after(async () => {
  await db?.end();
  const admin = new pg.Client({ connectionString: `${SERVER}/postgres` });
  await admin.connect();
  await admin.query(`DROP DATABASE IF EXISTS ${TEN_DB}`);
  await admin.end();
});

const BON = ["street", "block", "floor", "bathrooms"] as const;
type Bon = Record<(typeof BON)[number], string | number | null>;
/** Giá trị viết trước — mỗi giá trị khác nhau giữa hai bên để bắt hoán đổi bên. */
const CO: Record<string, Bon> = {
  p1: { street: "Đường Phan Văn Trị", block: "A1", floor: "12", bathrooms: 2 },
  p2: { street: "Phan Văn Trị", block: "B2", floor: "7", bathrooms: 3 },
};
const RONG: Bon = { street: null, block: null, floor: null, bathrooms: null };
const KIEU = { street: "string", block: "string", floor: "string", bathrooms: "number" } as const;

/** 16 ô giá trị (4 trường × 2 bên × {có, null}) + 8 ô kiểu cho các ô 'có'. Trả số assert. */
function kiemCap(pCo: PairData, pRong: PairData): number {
  let n = 0;
  for (const [ben, id] of [["a", "p1"], ["b", "p2"]] as const)
    for (const k of BON) {
      // kiểu xét trước giá trị (chuỗi '2' khác số 2 cả hai phép); giá trị vắng (undefined) để phép giá trị bắt
      if (pCo[ben][k] != null) assert.equal(typeof pCo[ben][k], KIEU[k], `JE-AC-2 sai kiểu: ${ben}.${k}`);
      assert.equal(pCo[ben][k], CO[id][k], `JE-AC-2 sai giá trị: ${ben}.${k}`);
      assert.equal(pRong[ben][k], null, `JE-AC-2 sai giá trị: ${ben}.${k}`);
      n += 2;
    }
  return n;
}

const napTin = async (id: string, v: Bon) =>
  db.query(
    `INSERT INTO sale_offers (offer_id, source, kind, street_raw, block_raw, floor_raw, bathrooms)
     VALUES ($1, 'S06', 'sale', $2, $3, $4, $5)`,
    [id, v.street, v.block, v.floor, v.bathrooms],
  );

test("JE-AC-2 queryPair đọc bốn trường — ma trận 16 ô trên câu SELECT thật", async () => {
  await napTin("p1", CO.p1);
  await napTin("p2", CO.p2);
  await napTin("p3", RONG);
  await napTin("p4", RONG);
  const pCo = await queryPair("p1", "p2", db);
  const pRong = await queryPair("p3", "p4", db);
  assert.ok(pCo && pRong, "queryPair không trả cặp");
  assert.equal(kiemCap(pCo, pRong), 16);

  // đối chứng đỏ (1): street hai bên bị hoán đổi
  const trao: PairData = { ...pCo, a: { ...pCo.a, street: pCo.b.street }, b: { ...pCo.b, street: pCo.a.street } };
  assert.throws(() => kiemCap(trao, pRong), /JE-AC-2 sai giá trị: a\.street/);
  // đối chứng đỏ (3): bathrooms là chuỗi
  const chuoi = { ...pCo, a: { ...pCo.a, bathrooms: "2" as unknown as number } };
  assert.throws(() => kiemCap(chuoi, pRong), /JE-AC-2 sai kiểu: a\.bathrooms/);
  // đối chứng đỏ (2): bản chép native.ts bỏ 'street_raw' khỏi câu SELECT
  const src = await readFile(join(import.meta.dirname, "../src/tools/native.ts"), "utf8");
  assert.ok(src.includes("o.street_raw, "), "native.ts không còn chọn o.street_raw");
  const tam = join(import.meta.dirname, `.tam-native-${process.pid}.ts`);
  await writeFile(tam, src.replace("o.street_raw, ", ""));
  try {
    const hong = (await import(pathToFileURL(tam).href)) as { queryPair: typeof queryPair };
    const pHong = await hong.queryPair("p1", "p2", db);
    assert.ok(pHong);
    assert.throws(() => kiemCap(pHong, pRong), /JE-AC-2 sai giá trị: a\.street/);
  } finally {
    await rm(tam, { force: true });
  }
});
