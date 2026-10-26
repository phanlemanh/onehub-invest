// node --test pipeline/scripts/vong-doi.itest.mjs — cần DB local :5433 (ngoài `npm test`: CI không có DB).
// TV2a `vong-doi-nguon` ca «VD-*»: mỗi ca một lược đồ tạm dựng ở khuôn TRƯỚC migration 047 rồi chạy nguyên tệp 047 trên
// đó. Trước và sau cả tệp chụp public — 047 chỉ áp lên public sau gộp, ca nào chạm public là đỏ.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { after, before, test } from "node:test";
import pg from "pg";
import { localDbUrl } from "./capture-ops-facts.mjs";
import { schemaUrl } from "./ops-facts-fixture.mjs";
import { COT_047, DAU, MIGRATION_047, chay047, chupPublic, dungKhuonTruoc, xoaLuocDo } from "./vong-doi-fixture.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const LIB = path.join(ROOT, "pipeline", "lib", "vong-doi.mjs");
const admin = new pg.Client({ connectionString: localDbUrl() });
const daMo = [];
let publicTruoc;

before(async () => {
  await admin.connect();
  publicTruoc = await chupPublic(admin);
});
after(async () => {
  for (const [S, c] of daMo) {
    await c.end().catch(() => {});
    await xoaLuocDo(admin, S).catch(() => {});
  }
  const publicSau = await chupPublic(admin);
  await admin.end().catch(() => {});
  assert.deepEqual(publicSau, publicTruoc, "public đã bị chạm — 047 chỉ được áp sau gộp");
});

/** Lược đồ tạm khuôn trước 047 + client trỏ đúng lược đồ đó. */
async function moLuocDo(ca, opts) {
  const S = `vd_${process.pid}_${ca}`;
  await dungKhuonTruoc(admin, S, opts);
  const c = new pg.Client({ connectionString: schemaUrl(S) });
  await c.connect();
  daMo.push([S, c]);
  return { S, c };
}
const loi = async (p) => {
  try {
    await p;
  } catch (e) {
    return String(e.message);
  }
  return null;
};
const dong = async (c, sql, args) => (await c.query(sql, args)).rows;

async function nguon(c, code, status = "active", extra = {}) {
  await c.query(`INSERT INTO source_registry (code, real_name, label_vi, status, note) VALUES ($1, $2, 'thử', $3, $4)`,
    [code, `${DAU}-ten-${code}`, status, extra.note ?? null]);
}

// ---------------------------------------------------------------- khuôn --
test("VD-KHUON khuôn trước của fixture = cột public trừ cột 047 thêm", async () => {
  const { S } = await moLuocDo("khuon");
  for (const t of ["source_registry", "source_groups"]) {
    const cot = async (schema) =>
      (await dong(admin, `SELECT column_name FROM information_schema.columns WHERE table_schema = $1 AND table_name = $2 ORDER BY 1`, [schema, t]))
        .map((r) => r.column_name);
    const pub = (await cot("public")).filter((x) => !COT_047[t].includes(x));
    assert.deepEqual(await cot(S), pub, `khuôn ${t} của fixture lệch public`);
  }
});

// ---------------------------------------------------------------- AC-1 --
test("VD-AC-1 trạng thái ngoài năm giá trị bị từ chối, năm giá trị hợp lệ được nhận", async () => {
  const { c } = await moLuocDo("ac1");
  await nguon(c, "S0A");
  await c.query(`INSERT INTO source_groups (source_code, group_key, name) VALUES ('S0A', '${DAU}-g', 'g')`);
  await chay047(c);
  const SAI = ["deprecated", "", "Active", null];
  const ten = { source_registry: "source_registry_status_chk", source_groups: "source_groups_status_chk" };
  let n = 0;
  for (const v of SAI) {
    // INSERT
    const mRe = await loi(c.query(`INSERT INTO source_registry (code, real_name, label_vi, status) VALUES ('S0X', 'x', 'x', $1)`, [v]));
    assert.ok(mRe, `INSERT source_registry status=${v} phải bị từ chối`);
    assert.match(mRe, v === null ? /null value/ : new RegExp(ten.source_registry), `INSERT source_registry ${v}`);
    n++;
    if (v === null) {
      // Đường ghi cũ: INSERT không nêu status (NULL) thì trigger suy từ enabled — design doc, AC-10.
      await c.query(`INSERT INTO source_groups (source_code, group_key, name, status) VALUES ('S0A', '${DAU}-null', 'n', NULL)`);
      assert.equal((await dong(c, `SELECT status FROM source_groups WHERE group_key = '${DAU}-null'`))[0].status, "active");
      await c.query(`DELETE FROM source_groups WHERE group_key = '${DAU}-null'`);
    } else {
      const mGi = await loi(c.query(`INSERT INTO source_groups (source_code, group_key, name, status) VALUES ('S0A', '${DAU}-x', 'x', $1)`, [v]));
      assert.ok(mGi, `INSERT source_groups status=${v} phải bị từ chối`);
      assert.match(mGi, new RegExp(ten.source_groups));
      n++;
    }
    // UPDATE
    const uRe = await loi(c.query(`UPDATE source_registry SET status = $1 WHERE code = 'S0A'`, [v]));
    assert.match(uRe ?? "", v === null ? /null value/ : new RegExp(ten.source_registry), `UPDATE source_registry ${v}`);
    const uGi = await loi(c.query(`UPDATE source_groups SET status = $1 WHERE group_key = '${DAU}-g'`, [v]));
    assert.match(uGi ?? "", v === null ? /null value/ : new RegExp(ten.source_groups), `UPDATE source_groups ${v}`);
    n += 2;
  }
  assert.equal(n, 15, "4 giá trị sai × 2 bảng × 2 lệnh, trừ INSERT NULL vào source_groups (đường ghi cũ)");
  for (const [i, v] of ["draft", "active", "paused", "retired", "completed"].entries()) {
    const reason = v === "paused" ? "het credit" : null;
    await c.query(`INSERT INTO source_registry (code, real_name, label_vi, status, reason) VALUES ($1, 'x', 'x', $2, $3)`, [`S1${i}`, v, reason]);
    await c.query(`INSERT INTO source_groups (source_code, group_key, name, status, reason) VALUES ('S0A', $1, 'x', $2, $3)`, [`${DAU}-ok${i}`, v, reason]);
  }
  // đối chứng: gỡ CHECK thì chữ lạ được nhận — thước này từng đỏ thật
  await c.query(`ALTER TABLE source_registry DROP CONSTRAINT source_registry_status_chk`);
  await c.query(`ALTER TABLE source_groups DROP CONSTRAINT source_groups_status_chk`);
  assert.equal(await loi(c.query(`INSERT INTO source_registry (code, real_name, label_vi, status) VALUES ('S0Y', 'x', 'x', 'deprecated')`)), null, "gỡ CHECK thì nhận");
  assert.equal(await loi(c.query(`INSERT INTO source_groups (source_code, group_key, name, status) VALUES ('S0A', '${DAU}-y', 'y', 'deprecated')`)), null, "gỡ CHECK thì nhận");
});

// ---------------------------------------------------------------- AC-2 --
test("VD-AC-2 tạm dừng thiếu lý do bị từ chối, có lý do thì nhận", async () => {
  const { c } = await moLuocDo("ac2");
  await nguon(c, "S0A");
  await c.query(`INSERT INTO source_groups (source_code, group_key, name) VALUES ('S0A', '${DAU}-g', 'g')`);
  await chay047(c);
  const BANG = { source_registry: ["code = 'S0A'", "source_registry_paused_reason_chk"], source_groups: [`group_key = '${DAU}-g'`, "source_groups_paused_reason_chk"] };
  let n = 0;
  for (const [t, [where, rb]] of Object.entries(BANG)) {
    for (const r of [null, "", "   "]) {
      const m = await loi(c.query(`UPDATE ${t} SET status = 'paused', reason = $1 WHERE ${where}`, [r]));
      assert.match(m ?? "", new RegExp(rb), `${t} paused reason=${JSON.stringify(r)}`);
      n++;
    }
    await c.query(`UPDATE ${t} SET status = 'paused', reason = 'het credit', resume_when = NULL WHERE ${where}`);
    await c.query(`UPDATE ${t} SET status = 'paused', reason = 'het credit', resume_when = 'credit reset 7/11' WHERE ${where}`);
    await c.query(`UPDATE ${t} SET status = 'active', reason = NULL, resume_when = NULL WHERE ${where}`);
  }
  assert.equal(n, 6);
  // đối chứng: gỡ ràng buộc thì paused thiếu lý do được nhận
  await c.query(`ALTER TABLE source_registry DROP CONSTRAINT source_registry_paused_reason_chk`);
  await c.query(`ALTER TABLE source_groups DROP CONSTRAINT source_groups_paused_reason_chk`);
  assert.equal(await loi(c.query(`UPDATE source_registry SET status = 'paused', reason = NULL WHERE code = 'S0A'`)), null);
  assert.equal(await loi(c.query(`UPDATE source_groups SET status = 'paused', reason = NULL WHERE group_key = '${DAU}-g'`)), null);
});

// ---------------------------------------------------------------- AC-3 --
test("VD-AC-3 nâng cấp giữ trạng thái, điền lý do, enabled khớp, chạy hai lần như một", async () => {
  const { c } = await moLuocDo("ac3");
  await nguon(c, "S0A", "active");
  await nguon(c, "S0B", "paused", { note: "cho credit" });
  await nguon(c, "S0C", "paused");
  await nguon(c, "S0D", "completed");
  await c.query(`INSERT INTO source_groups (source_code, group_key, name, enabled) VALUES ('S0A', '${DAU}-g1', 'g1', true), ('S0A', '${DAU}-g2', 'g2', false)`);
  await chay047(c);
  const chup = async () => ({
    r: await dong(c, `SELECT code, status, reason, resume_when, note FROM source_registry ORDER BY code`),
    g: await dong(c, `SELECT group_key, status, reason, resume_when, enabled FROM source_groups ORDER BY group_key`),
  });
  const lan1 = await chup();
  assert.deepEqual(lan1.r.map((x) => [x.code, x.status, x.reason]), [
    ["S0A", "active", null],
    ["S0B", "paused", "cho credit"],
    ["S0C", "paused", "trước TV2a: chưa ghi lý do"],
    ["S0D", "completed", null],
  ]);
  assert.deepEqual(lan1.g.map((x) => [x.group_key, x.status, x.reason, x.enabled]), [
    [`${DAU}-g1`, "active", null, true],
    [`${DAU}-g2`, "paused", "trước TV2a: tắt bằng công tắc enabled", false],
  ]);
  const def = (await dong(c, `SELECT column_default FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'source_registry' AND column_name = 'status'`))[0].column_default;
  assert.match(def, /'active'/);
  await chay047(c);
  assert.deepEqual(await chup(), lan1, "chạy lần hai phải không đổi gì");
});

test("VD-AC-3c giá trị lạ có sẵn thì nâng cấp lỗi trọn, không áp nửa chừng", async () => {
  const { S, c } = await moLuocDo("ac3c");
  await nguon(c, "S0A", "Active");
  const m = await loi(chay047(c));
  assert.match(m ?? "", /source_registry_status_chk/);
  await c.query("ROLLBACK").catch(() => {});
  const cot = await dong(admin, `SELECT column_name FROM information_schema.columns WHERE table_schema = $1 AND table_name = 'source_registry' AND column_name = 'reason'`, [S]);
  assert.equal(cot.length, 0, "giao dịch phải quay lui — không có cột reason");
});

// ---------------------------------------------------------------- AC-8 --
test("VD-AC-8 tệp 047 không trỏ public, chạy trên lược đồ thiếu bảng thì không tạo gì", async () => {
  const sach = readFileSync(MIGRATION_047, "utf8").split("\n").filter((l) => !/^\s*--/.test(l));
  for (const [i, l] of sach.entries()) assert.ok(!/public\.|search_path/.test(l), `047 dòng mã ${i + 1} trỏ public/search_path: ${l}`);
  const { S, c } = await moLuocDo("ac8", { coRegistry: false, coGroups: false });
  await chay047(c);
  assert.equal((await dong(admin, `SELECT count(*)::int n FROM information_schema.tables WHERE table_schema = $1`, [S]))[0].n, 0);
  assert.equal((await dong(admin, `SELECT count(*)::int n FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace WHERE n.nspname = $1`, [S]))[0].n, 0);
  // đối chứng: có bảng thì 047 tạo cột status — ca đọc đúng lược đồ
  const k = await moLuocDo("ac8dc");
  await chay047(k.c);
  assert.equal((await dong(admin, `SELECT count(*)::int n FROM information_schema.columns WHERE table_schema = $1 AND table_name = 'source_groups' AND column_name = 'status'`, [k.S]))[0].n, 1);
});

test("VD-AC-8b chỉ có source_registry thì khối nguồn chạy, khối đơn vị bỏ qua", async () => {
  const { S, c } = await moLuocDo("ac8b", { coGroups: false });
  await chay047(c);
  assert.equal((await dong(admin, `SELECT count(*)::int n FROM information_schema.columns WHERE table_schema = $1 AND table_name = 'source_registry' AND column_name = 'reason'`, [S]))[0].n, 1);
});

// ---------------------------------------------------------------- AC-10 --
test("VD-AC-10 đường ghi cũ và mới giữ enabled khớp status; không bật lại đơn vị đã gỡ", async () => {
  const { c } = await moLuocDo("ac10");
  await nguon(c, "S0A");
  await chay047(c);
  const dat = async (key, status, reason = null, resume = null) => {
    await c.query(`DELETE FROM source_groups WHERE group_key = $1`, [key]);
    await c.query(`INSERT INTO source_groups (source_code, group_key, name, status, reason, resume_when) VALUES ('S0A', $1, 'x', $2, $3, $4)`, [key, status, reason, resume]);
  };
  const doc = async (key) => (await dong(c, `SELECT status, reason, resume_when, enabled FROM source_groups WHERE group_key = $1`, [key]))[0];
  const khop = async () => {
    const lech = await dong(c, `SELECT group_key FROM source_groups WHERE enabled IS DISTINCT FROM (status = 'active')`);
    assert.deepEqual(lech, [], "enabled phải luôn bằng (status = 'active')");
  };
  const CU = "tắt qua cột enabled (đường ghi cũ)";
  // (a) chỉ đổi enabled — 5 trạng thái cũ × 2 giá trị, kỳ vọng viết trước
  const MA_TRAN = [
    ["active", true, { status: "active" }],
    ["active", false, { status: "paused", reason: CU }],
    ["paused", true, { status: "active", reason: null, resume_when: null }],
    ["paused", false, { status: "paused", reason: "x", resume_when: "y" }],
    ["draft", true, { status: "active" }],
    ["draft", false, { status: "draft" }],
    ["retired", true, { loi: /không bật được đơn vị retired qua cột enabled/, status: "retired" }],
    ["retired", false, { status: "retired" }],
    ["completed", true, { loi: /không bật được đơn vị completed qua cột enabled/, status: "completed" }],
    ["completed", false, { status: "completed" }],
  ];
  assert.equal(MA_TRAN.length, 10);
  for (const [tt, en, kq] of MA_TRAN) {
    const key = `${DAU}-${tt}-${en}`;
    await dat(key, tt, tt === "paused" ? "x" : null, tt === "paused" ? "y" : null);
    const m = await loi(c.query(`UPDATE source_groups SET enabled = $1 WHERE group_key = $2`, [en, key]));
    if (kq.loi) assert.match(m ?? "", kq.loi, `ô (${tt}, ${en})`);
    else assert.equal(m, null, `ô (${tt}, ${en}) không được lỗi: ${m}`);
    const d = await doc(key);
    for (const [k, v] of Object.entries(kq)) if (k !== "loi") assert.equal(d[k], v, `ô (${tt}, ${en}) cột ${k}`);
    await khop();
  }
  // (b) INSERT chỉ nêu enabled
  await c.query(`INSERT INTO source_groups (source_code, group_key, name, enabled) VALUES ('S0A', '${DAU}-ins-t', 'x', true), ('S0A', '${DAU}-ins-f', 'x', false)`);
  assert.equal((await doc(`${DAU}-ins-t`)).status, "active");
  assert.deepEqual([(await doc(`${DAU}-ins-f`)).status, (await doc(`${DAU}-ins-f`)).reason], ["paused", CU]);
  // (c) đường mới — đổi status
  await dat(`${DAU}-moi`, "active");
  await c.query(`UPDATE source_groups SET status = 'retired' WHERE group_key = '${DAU}-moi'`);
  assert.equal((await doc(`${DAU}-moi`)).enabled, false);
  await dat(`${DAU}-moi2`, "active");
  await c.query(`UPDATE source_groups SET status = 'paused', reason = 'x' WHERE group_key = '${DAU}-moi2'`);
  assert.equal((await doc(`${DAU}-moi2`)).enabled, false);
  await dat(`${DAU}-lech`, "paused", "x");
  await c.query(`UPDATE source_groups SET status = 'active', enabled = false WHERE group_key = '${DAU}-lech'`);
  assert.deepEqual([(await doc(`${DAU}-lech`)).status, (await doc(`${DAU}-lech`)).enabled], ["active", true], "lệnh lệch thì status thắng");
  await khop();
  // đối chứng: gỡ trigger thì CHECK khớp chặn ghi lệch
  await dat(`${DAU}-dc`, "active");
  await c.query(`DROP TRIGGER source_groups_dong_bo_enabled ON source_groups`);
  const m = await loi(c.query(`UPDATE source_groups SET enabled = false WHERE group_key = '${DAU}-dc'`));
  assert.match(m ?? "", /source_groups_enabled_khop_chk/);
});

export { LIB, ROOT, admin, dong, execFileSync, loi, moLuocDo, nguon };
