// kev-phat-bieu.itest.mjs — PL5 cột Kev ở bảng nạp + phát biểu Kev (KP-AC-n ↔ _acceptance/meta-kev-thanh-phat-bieu/evals.yaml).
// Chạy trên DB thử (bash db/db-thu.sh oneinvest_p1_n1), mọi ca trong BEGIN … ROLLBACK, nạp 045 + 057 trong giao dịch
// (napKev giữ pg_advisory_xact_lock(33033)). Ca đỏ chạy trên bản sao đột biến chép cạnh tệp thật rồi xoá.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import pg from "pg";
import { napPhatBieu } from "../lib/nap-045.mjs";
import { MIG_057, napKev } from "../lib/nap-057.mjs";

const DB_URL = process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest_p1_n1";

let c;
before(async () => { c = new pg.Client({ connectionString: DB_URL }); await c.connect(); });
after(async () => { await c.end(); });

/** BEGIN, nạp 045 + 057, chạy fn, ROLLBACK. */
async function trongGiaoDich(fn, { sql057 } = {}) {
  await c.query("BEGIN");
  try {
    await c.query("SELECT pg_advisory_xact_lock(33033)");
    await napPhatBieu(c);
    await napKev(c, sql057 ? { sql: sql057 } : {});
    return await fn();
  } finally {
    await c.query("ROLLBACK");
  }
}

/** Thông điệp lỗi chặn lệnh, hoặc null khi lệnh vào được. Mỗi lệnh một SAVEPOINT. */
async function chan(sql, vals = []) {
  await c.query("SAVEPOINT ca");
  try {
    await c.query(sql, vals);
    await c.query("RELEASE SAVEPOINT ca");
    return null;
  } catch (e) {
    await c.query("ROLLBACK TO SAVEPOINT ca");
    return `${e.constraint ?? ""} ${e.message}`;
  }
}

const SQL_PHAT_BIEU = `INSERT INTO field_assertions (subject_key, field, value, evidence_tier, method, evidence, observed_at)
  VALUES ($1, $2, $3, $4, $5, '{}'::jsonb, now())`;
// snapshot_id có khoá ngoại tới bảng snapshot: mượn một snapshot có sẵn (dòng ghi trong giao dịch, ROLLBACK).
const SQL_STG = `INSERT INTO stg_zalo_posts (post_id, snapshot_id, text, kev_intent, kev_kind)
  SELECT $1, (SELECT snapshot_id FROM stg_zalo_posts LIMIT 1), 'bài giả', $2, $3`;

const COT_KEV = [
  ["kev_p", "real"], ["kev_intent", "text"], ["kev_intent_p", "real"], ["kev_kind", "text"], ["kev_kind_p", "real"],
  ["kev_model", "text"], ["kev_at", "timestamp with time zone"],
];

async function kiemLuocDo() {
  const { rows } = await c.query(`SELECT column_name, data_type FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'stg_zalo_posts' AND column_name LIKE 'kev\\_%' ORDER BY ordinal_position`);
  assert.deepEqual(rows.map((r) => [r.column_name, r.data_type]), COT_KEV, "bảy cột kev_* đúng kiểu");
  assert.equal(await chan(SQL_PHAT_BIEU, ["S03:kp-1", "listing_intent", "inquiry", "inferred", "kev"]), null, "listing_intent/kev/inferred bị chặn");
  assert.equal(await chan(SQL_PHAT_BIEU, ["S03:kp-1", "kind", "rent_lt", "inferred", "kev"]), null, "kind/kev/inferred bị chặn");
  for (const tier of ["observed", "fact"]) {
    assert.match(await chan(SQL_PHAT_BIEU, ["S03:kp-1", "listing_intent", "offer", tier, "kev"]) ?? "vào được",
      /cặp lớp\/phương pháp/, `kev/${tier} không bị hàm canh từ chối`);
  }
  assert.match(await chan(SQL_STG, ["kp-stg-1", "mua", null]) ?? "vào được", /stg_zalo_posts_kev_intent_chk/, "kev_intent='mua' vào được");
  assert.match(await chan(SQL_STG, ["kp-stg-2", null, "rent_lt"]) ?? "vào được", /stg_zalo_posts_kev_kind_chk/, "kev_kind='rent_lt' vào được");
  assert.equal(await chan(SQL_STG, ["kp-stg-3", "inquiry", "rent"]), null, "dòng hợp lệ bị chặn");
}

test("KP-AC-1 057 áp hai lần: bảy cột kev_*, CHECK trường/phương pháp, kev chỉ đi với inferred, CHECK bảng nạp", async () => {
  await trongGiaoDich(async () => {
    await napKev(c); // lần áp thứ hai trong cùng giao dịch — không lỗi
    await kiemLuocDo();
  });
});

test("KP-AC-1 đối chứng: bản sao 057 bỏ kev khỏi nhánh inferred của hàm canh → (kev, inferred) bị từ chối", async () => {
  const goc = readFileSync(MIG_057, "utf8");
  const dotBien = goc.replace("NEW.method IN ('e1_rule', 'e2_llm', 'kev'))) THEN", "NEW.method IN ('e1_rule', 'e2_llm'))) THEN");
  assert.notEqual(dotBien, goc, "bản sao đột biến không đổi gì");
  await trongGiaoDich(async () => {
    const m = await chan(SQL_PHAT_BIEU, ["S03:kp-1", "listing_intent", "inquiry", "inferred", "kev"]);
    assert.match(m ?? "vào được", /cặp lớp\/phương pháp không hợp lệ \(inferred \/ kev\)/, "ca đỏ không ghim «kev / inferred»");
  }, { sql057: dotBien });
});

test("KP-AC-1b vai người: CHECK nhận kev theo sổ nhưng hàm canh party_roles (055) vẫn từ chối kev ở mọi lớp", async () => {
  await trongGiaoDich(async () => {
    if (!(await c.query("SELECT to_regclass('party_roles') AS t")).rows[0].t) return; // DB chưa áp 055: không có gì để kiểm
    for (const tier of ["fact", "observed", "inferred"]) {
      const m = await chan(`INSERT INTO party_roles (party_key, role, subject_key, evidence_tier, method, evidence, observed_at, run_id)
        VALUES ('pty_01ARZ3NDEKTSV4RRFFQ69G5FAV', 'nguoi_dang', 'S03:kp-1', $1, 'kev', '{}'::jsonb, now(), 'kp-test')`, [tier]);
      assert.match(m ?? "vào được", /cặp lớp\/phương pháp/, `party_roles nhận kev/${tier}`);
    }
  });
});
