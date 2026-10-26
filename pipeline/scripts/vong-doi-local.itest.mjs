// node --test pipeline/scripts/vong-doi-local.itest.mjs — cần DB local :5433 (ngoài `npm test`).
// TV2a `vong-doi-nguon` ca «VD-AC-9»: chép NGUYÊN dòng của public.source_registry và public.source_groups (chưa áp 047 —
// 047 chỉ áp lên public sau gộp) vào một lược đồ tạm, chạy 047 trên bản chép, so với ảnh chụp trước. Kèm soát tên nguồn
// thật trên tệp 047 và vong-doi.mjs. Ca không in tên nguồn nào.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import pg from "pg";
import { entriesFromTokens, guardValues } from "../lib/tier-a-guard.mjs";
import { localDbUrl } from "./capture-ops-facts.mjs";
import { schemaUrl } from "./ops-facts-fixture.mjs";
import { MIGRATION_047, chay047, chupPublic, xoaLuocDo } from "./vong-doi-fixture.mjs";

const LIB = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "lib", "vong-doi.mjs");
const RANG_BUOC = ["source_groups_enabled_khop_chk", "source_groups_paused_reason_chk", "source_groups_status_chk",
  "source_registry_paused_reason_chk", "source_registry_status_chk"];

test("VD-AC-9 047 trên bản chép dữ liệu thật: giữ trạng thái, đủ lý do, nhóm khớp, public không đổi, không tên nguồn thật", async () => {
  const admin = new pg.Client({ connectionString: localDbUrl() });
  await admin.connect();
  const S = `vd_local_${process.pid}`;
  const sc = new pg.Client({ connectionString: schemaUrl(S) });
  try {
    const publicTruoc = await chupPublic(admin);
    await xoaLuocDo(admin, S);
    await admin.query(`CREATE SCHEMA "${S}"`);
    for (const t of ["source_registry", "source_groups"]) {
      await admin.query(`CREATE TABLE "${S}".${t} (LIKE public.${t} INCLUDING ALL)`);
      await admin.query(`INSERT INTO "${S}".${t} SELECT * FROM public.${t}`);
    }
    await sc.connect();
    const demTrangThai = async () =>
      Object.fromEntries((await sc.query(`SELECT status, count(*)::int n FROM source_registry GROUP BY 1`)).rows.map((r) => [r.status, r.n]));
    const truocTT = await demTrangThai();
    const truocNhom = (await sc.query(`SELECT id::text, enabled FROM source_groups ORDER BY id`)).rows;
    assert.ok(Object.keys(truocTT).length > 0, "bản chép rỗng — ca không đo gì");

    await chay047(sc);

    assert.deepEqual(await demTrangThai(), truocTT, "số nguồn mỗi trạng thái phải giữ nguyên");
    const thieuLyDo = (await sc.query(`SELECT count(*)::int n FROM source_registry WHERE status = 'paused' AND length(btrim(coalesce(reason, ''))) = 0`)).rows[0].n;
    assert.equal(thieuLyDo, 0, "mọi nguồn tạm dừng phải có lý do");
    const sauNhom = (await sc.query(`SELECT id::text, enabled, status FROM source_groups ORDER BY id`)).rows;
    assert.deepEqual(sauNhom.map((r) => [r.id, r.enabled]), truocNhom.map((r) => [r.id, r.enabled]), "enabled không đổi giá trị");
    for (const r of sauNhom) assert.equal(r.status, r.enabled ? "active" : "paused", `nhóm #${r.id}`);
    const rb = (await admin.query(
      `SELECT c.conname FROM pg_constraint c JOIN pg_namespace n ON n.oid = c.connamespace WHERE n.nspname = $1 AND c.conname = ANY($2) ORDER BY 1`,
      [S, RANG_BUOC])).rows.map((r) => r.conname);
    assert.deepEqual(rb, RANG_BUOC);

    assert.deepEqual(await chupPublic(admin), publicTruoc, "public đã bị chạm — 047 chỉ áp sau gộp");

    // Soát tên nguồn thật (real_name + source_ids của public.source_registry) trên hai tệp công khai.
    const tokens = (await admin.query(
      `SELECT DISTINCT x FROM (SELECT real_name AS x FROM public.source_registry UNION ALL SELECT unnest(source_ids) FROM public.source_registry) s WHERE length(x) > 0`,
    )).rows.map((r) => r.x);
    assert.ok(tokens.length > 0, "không đọc được tên nguồn nào — soát không chạy");
    const entries = entriesFromTokens(tokens);
    for (const tep of [MIGRATION_047, LIB]) {
      const trung = guardValues(readFileSync(tep, "utf8"), entries);
      assert.equal(trung.length, 0, `${path.basename(tep)} mang ${trung.length} chỗ trúng tên nguồn thật`);
    }
    // đối chứng: chuỗi mang tên thật đầu tiên phải bị soát trúng (không in tên)
    assert.ok(guardValues(`x ${tokens[0]} x`, entries).length >= 1, "bộ soát không bắt được tên thật — thước hỏng");
  } finally {
    await sc.end().catch(() => {});
    await xoaLuocDo(admin, S).catch(() => {});
    await admin.end().catch(() => {});
  }
});
