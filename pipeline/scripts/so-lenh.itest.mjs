// so-lenh.itest.mjs — hồ sơ _acceptance/so-lenh-bo-ap (TV4), ca DB phía máy thu: «SL-AC-1» (migration 091 hai khuôn),
// «SL-AC-1b» (khoá Data API), «SL-AC-6b», «SL-AC-7» (apLenh), «SL-AC-6», «SL-AC-10» (bộ áp ops-apply với cloud giả).
// Chạy dưới `db/db-thu.sh oneinvest_suite_tv4 --chay` (executor so_lenh_db): mỗi ca dựng lược đồ tạm `sl_<pid>_<ca>`,
// public không được chạm (chụp trước/sau). Role là đối tượng cấp cluster: ca 1b KHÔNG tạo role anon — dùng tên riêng.
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { after, before, test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import pg from "pg";

import { kiemLenh, apLenh, LOAI_LENH } from "../lib/lenh.mjs";
import { docTrangThai } from "../lib/vong-doi.mjs";
import { localDbUrl } from "./capture-ops-facts.mjs";
import { schemaUrl } from "./ops-facts-fixture.mjs";
import {
  COT_OPS_AUDIT, chay091, docMigration091, dungCloud, dungMayThu, loaiTuAdr, trangThaiTuAdr,
} from "./so-lenh-fixture.mjs";
import { chay047, chupPublic, xoaLuocDo } from "./vong-doi-fixture.mjs";

const DIR = path.dirname(fileURLToPath(import.meta.url));
const PID = process.pid;
const admin = new pg.Client({ connectionString: localDbUrl() });
const mo = [];
let publicTruoc;

before(async () => {
  await admin.connect();
  publicTruoc = await chupPublic(admin);
});
after(async () => {
  for (const [c, S] of mo) {
    await c.end().catch(() => {});
    await xoaLuocDo(admin, S).catch(() => {});
  }
  const sau = await chupPublic(admin);
  await admin.end().catch(() => {});
  assert.deepEqual(sau, publicTruoc, "public đã bị chạm");
});

/** Lược đồ máy thu đã chạy 047 + 091, kèm client trỏ search_path lược đồ ấy. */
async function mayThu(ca) {
  const S = `sl_${PID}_${ca}`;
  await dungMayThu(admin, S);
  const c = new pg.Client({ connectionString: schemaUrl(S) });
  await c.connect();
  mo.push([c, S]);
  await chay047(c);
  await chay091(c);
  return { S, c };
}
async function cloud(ca, sql) {
  const S = `sl_${PID}_${ca}`;
  await dungCloud(admin, S);
  const c = new pg.Client({ connectionString: schemaUrl(S) });
  await c.connect();
  mo.push([c, S]);
  await chay091(c, sql);
  return { S, c };
}
const loaiTrongRangBuoc = async (c, S) => {
  const def = (await c.query(
    `SELECT pg_get_constraintdef(oid) AS d FROM pg_constraint WHERE conname = 'change_requests_type_chk' AND connamespace = $1::regnamespace`, [S],
  )).rows[0].d;
  return [...def.matchAll(/'([^']+)'/g)].map((m) => m[1]);
};
const loiCua = async (p) => {
  try { await p; } catch (e) { return e; }
  return null;
};
let dem = 0;
const khoa = () => `sl-${PID}-${++dem}`;
const chen = (c, type, status = "submitted", k = khoa()) =>
  c.query(`INSERT INTO change_requests (type, target, status, requested_by, idempotency_key) VALUES ($1, 'S05', $2, 'user:x', $3)`, [type, status, k]);

test("SL-AC-1 091 chạy hai lần trên hai khuôn; CHECK loại, trạng thái, khoá chống lặp đúng ADR-0015", async () => {
  const may = await mayThu("ac1m");
  await chay091(may.c); // lần hai
  const cl = await cloud("ac1c");
  await chay091(cl.c); // lần hai
  for (const { S } of [may, cl]) {
    const bang = (await admin.query(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = $1 ORDER BY 1`, [S],
    )).rows.map((r) => r.table_name);
    for (const t of ["change_request_applies", "change_requests", "machine_tokens", "ops_audit", "ops_heartbeat"]) {
      assert.ok(bang.includes(t), `${S} thiếu bảng ${t}`);
    }
  }
  const cotAudit = (await admin.query(
    `SELECT column_name FROM information_schema.columns WHERE table_schema = $1 AND table_name = 'ops_audit' ORDER BY 1`, [cl.S],
  )).rows.map((r) => r.column_name);
  assert.deepEqual(cotAudit, COT_OPS_AUDIT, "ops_audit của lược đồ cloud lệch khuôn 018");

  const loai = loaiTuAdr();
  const tt = trangThaiTuAdr();
  assert.equal(loai.length, 14, "ADR-0015 §4 phải có 14 loại");
  assert.equal(tt.length, 9, "ADR-0015 §5 phải có 9 trạng thái");
  const { tsImport } = await import(pathToFileURL(path.join(DIR, "..", "..", "app", "node_modules", "tsx", "dist", "esm", "api", "index.mjs")).href);
  const T = await tsImport(pathToFileURL(path.join(DIR, "..", "..", "app", "src", "lib", "lenh.ts")).href, import.meta.url);
  const sx = (a) => [...a].sort();
  assert.deepEqual(sx(await loaiTrongRangBuoc(cl.c, cl.S)), sx(loai), "CHECK loại lệch ADR-0015 §4");
  assert.deepEqual(sx(LOAI_LENH), sx(loai), "LOAI_LENH .mjs lệch ADR");
  assert.deepEqual(sx(T.LOAI_LENH), sx(loai), "LOAI_LENH TS lệch ADR");

  for (const t of loai) await chen(cl.c, t);
  for (const sai of ["source.purge", "", "Source.Pause"]) {
    const e = await loiCua(chen(cl.c, sai));
    assert.match(String(e?.message), /change_requests_type_chk/, `loại «${sai}» phải bị CHECK từ chối`);
  }
  for (const s of tt) await chen(cl.c, "source.pause", s);
  assert.match(String((await loiCua(chen(cl.c, "source.pause", "done")))?.message), /change_requests_status_chk/);
  assert.match(String((await loiCua(chen(cl.c, "source.pause", null)))?.message), /null value/);
  const k = khoa();
  await chen(cl.c, "source.pause", "submitted", k);
  assert.match(String((await loiCua(chen(cl.c, "source.pause", "submitted", k)))?.message), /unique/);

  // Đối chứng hai: bản chép 091 đổi tên một loại → tập loại của CHECK lệch, ca nêu đúng tên.
  const lech = await cloud("ac1d", docMigration091().replace("'job.rerun'", "'job.rerunx'"));
  const tap = await loaiTrongRangBuoc(lech.c, lech.S);
  const thieu = loai.filter((t) => !tap.includes(t));
  assert.deepEqual(thieu, ["job.rerun"], "đối chứng đổi tên một loại phải lệch đúng job.rerun");
});

test("SL-AC-1b khối khoá Data API: dò đúng role anon; bản chép với role riêng của lượt thu quyền và bật RLS năm bảng", async () => {
  const sql = docMigration091();
  assert.ok(sql.includes("WHERE rolname = 'anon'"), "091 phải dò đúng rolname = 'anon'");
  assert.ok(sql.includes("rolname IN ('anon', 'authenticated')"), "091 phải thu quyền cả anon lẫn authenticated");
  const r1 = `sl_anon_${PID}`;
  const r2 = `sl_auth_${PID}`;
  const BANG = ["ops_heartbeat", "ops_audit", "change_requests", "machine_tokens", "change_request_applies"];
  const banChep = (s) => s.replaceAll("'anon'", `'${r1}'`).replaceAll("'authenticated'", `'${r2}'`);
  const chay = async (ca, sqlKhoa) => {
    const { S, c } = await cloud(ca);
    await admin.query(`GRANT USAGE ON SCHEMA "${S}" TO ${r1}, ${r2}`);
    await admin.query(`GRANT SELECT ON ALL TABLES IN SCHEMA "${S}" TO ${r1}, ${r2}`);
    await c.query(sqlKhoa);
    const quyen = [];
    for (const t of BANG) {
      const r = (await admin.query(
        `SELECT has_table_privilege($1, $2, 'SELECT') AS sel, (SELECT relrowsecurity FROM pg_class WHERE oid = $2::regclass) AS rls`,
        [r1, `"${S}".${t}`],
      )).rows[0];
      quyen.push({ t, ...r });
    }
    await admin.query(`REVOKE ALL ON ALL TABLES IN SCHEMA "${S}" FROM ${r1}, ${r2}`).catch(() => {});
    await admin.query(`REVOKE ALL ON ALL SEQUENCES IN SCHEMA "${S}" FROM ${r1}, ${r2}`).catch(() => {});
    await admin.query(`REVOKE ALL ON SCHEMA "${S}" FROM ${r1}, ${r2}`).catch(() => {});
    return quyen;
  };
  await admin.query(`CREATE ROLE ${r1} NOLOGIN`);
  await admin.query(`CREATE ROLE ${r2} NOLOGIN`);
  try {
    const khoaThat = await chay("ac1b", banChep(sql));
    for (const q of khoaThat) {
      assert.equal(q.sel, false, `${q.t}: role lượt vẫn SELECT được sau khối khoá`);
      assert.equal(q.rls, true, `${q.t}: RLS chưa bật`);
    }
    const goDo = banChep(sql).replace(/DO \$\$[\s\S]*?END \$\$;/, "");
    const mo = await chay("ac1bd", goDo);
    assert.ok(mo.every((q) => q.sel === true), "gỡ khối khoá anon thì mở — đối chứng phải thấy role lượt SELECT được");
  } finally {
    await admin.query(`DROP OWNED BY ${r1}, ${r2}`).catch(() => {});
    await admin.query(`DROP ROLE IF EXISTS ${r1}`).catch(() => {});
    await admin.query(`DROP ROLE IF EXISTS ${r2}`).catch(() => {});
  }
});

const nguon = async (c, rows) => {
  for (const [code, status, reason] of rows) {
    await c.query(
      `INSERT INTO source_registry (code, real_name, label_vi, status, reason) VALUES ($1, $2, 'thu', $3, $4)`,
      [code, `sl-thu-${code.toLowerCase()}`, status, reason ?? null],
    );
  }
};
const dong = async (c, code) => (await c.query(`SELECT * FROM source_registry WHERE code = $1`, [code])).rows[0] ?? null;
const so = async (c, k) => (await c.query(`SELECT * FROM change_request_applies WHERE idempotency_key = $1`, [k])).rows;
const lenh = (type, target, payload = {}) => ({
  id: crypto.randomUUID(), type, target, payload, idempotency_key: khoa(), requested_by: "user:a", approved_by: "user:b",
});

test("SL-AC-7 tiền điều kiện hỏng và kiểm sau hỏng: nguồn không đổi, sổ áp đúng một dòng mang kết quả", async () => {
  const { c } = await mayThu("ac7");
  await nguon(c, [["S91", "active"], ["S92", "paused", "cho credit"], ["S93", "retired"]]);
  const ca = [
    [lenh("source.pause", "S92", { reason: "x" }), "failed", "tien-dieu-kien:nguon-paused", "S92"],
    [lenh("source.pause", "S93", { reason: "x" }), "failed", "tien-dieu-kien:nguon-retired", "S93"],
    [lenh("source.pause", "S99", { reason: "x" }), "failed", "tien-dieu-kien:nguon-khong-co", "S99"],
    [lenh("source.resume", "S91"), "failed", "tien-dieu-kien:nguon-active", "S91"],
  ];
  for (const [cmd, outcome, ly_do, code] of ca) {
    const truoc = await dong(c, code);
    const kq = await apLenh(c, cmd);
    assert.equal(kq.outcome, outcome, `${code}: outcome`);
    assert.equal(kq.ly_do, ly_do, `${code}: lý do`);
    assert.deepEqual(await dong(c, code), truoc, `${code}: dòng nguồn đổi`);
    const s = await so(c, cmd.idempotency_key);
    assert.equal(s.length, 1);
    assert.equal(s[0].outcome, outcome);
  }
  const hong = lenh("source.pause", "S91", { reason: "x" });
  const truocA = await dong(c, "S91");
  const kq = await apLenh(c, hong, { kiemSau: async () => { throw new Error("ép hỏng"); } });
  assert.equal(kq.outcome, "reverted");
  assert.deepEqual(await dong(c, "S91"), truocA, "kiểm sau hỏng mà S91 đổi — không hoàn tác");
  const s = await so(c, hong.idempotency_key);
  assert.equal(s.length, 1);
  assert.equal(s[0].outcome, "reverted");

  // Đối chứng dương: bật lại S92.
  const bat = await apLenh(c, lenh("source.resume", "S92"));
  assert.equal(bat.outcome, "applied");
  const b = await dong(c, "S92");
  assert.equal(b.status, "active");
  assert.equal(b.reason, null);
  assert.equal(b.resume_when, null);
  assert.deepEqual(await docTrangThai(c, "S92"), { run: true, ly_do: "chay" });

  // Đối chứng đỏ: đột biến nuốt lỗi kiểm sau thì S91 bị tạm dừng.
  const goc = readFileSync(path.join(DIR, "..", "lib", "lenh.mjs"), "utf8");
  const dongKiem = "await kiemSau(client, cmd, sau);";
  assert.equal(goc.split(dongKiem).length, 2, "không thấy đúng một lời gọi kiemSau để đột biến");
  const dir = mkdtempSync(path.join(tmpdir(), "lenh-ac7-"));
  try {
    for (const f of ["vong-doi.mjs", "loai-lenh.mjs"]) writeFileSync(path.join(dir, f), readFileSync(path.join(DIR, "..", "lib", f), "utf8"));
    writeFileSync(path.join(dir, "lenh.mjs"), goc.replace(dongKiem, "await kiemSau(client, cmd, sau).catch(() => {});"));
    const D = await import(pathToFileURL(path.join(dir, "lenh.mjs")).href);
    const r = await D.apLenh(c, lenh("source.pause", "S91", { reason: "x" }), { kiemSau: async () => { throw new Error("ép hỏng"); } });
    assert.equal((await dong(c, "S91")).status, "paused", "không hoàn tác — đột biến phải để S91 paused");
    assert.equal(r.outcome, "applied");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("SL-AC-6b hai bộ áp song song trên cùng lệnh: đúng một lần ghi", async () => {
  const { S, c } = await mayThu("ac6b");
  await nguon(c, [["S05", "active"]]);
  const c2 = new pg.Client({ connectionString: schemaUrl(S) });
  await c2.connect();
  try {
    const cmd = lenh("source.pause", "S05", { reason: "het credit", resume_when: "" });
    const [a, b] = await Promise.all([apLenh(c, cmd), apLenh(c2, cmd)]);
    assert.deepEqual([a.outcome, b.outcome], ["applied", "applied"]);
    assert.equal((await so(c, cmd.idempotency_key)).length, 1);
    const n = (await c.query(`SELECT count(*)::int AS n FROM ops_audit WHERE detail->>'idempotency_key' = $1`, [cmd.idempotency_key])).rows[0].n;
    assert.equal(n, 1, "hai bộ áp ghi nhật ký hai lần — áp lần hai");
    const r = await dong(c, "S05");
    assert.equal(r.status, "paused");
    assert.equal(r.resume_when, null, "resume_when rỗng phải lưu NULL");
  } finally {
    await c2.end();
  }
});

test("kiemLenh hỏng thì apLenh ghi failed, không chạm nguồn", async () => {
  const { c } = await mayThu("ackl");
  await nguon(c, [["S05", "active"]]);
  const cmd = lenh("source.pause", "S05", { reason: "x", groupPolicy: "open" });
  assert.equal(kiemLenh(cmd).ok, false);
  const kq = await apLenh(c, cmd);
  assert.deepEqual([kq.outcome, kq.ly_do], ["failed", "khoa-cam:groupPolicy"]);
  assert.equal((await dong(c, "S05")).status, "active");
});

// ---- Bộ áp ops-apply với cloud giả (SL-AC-6, SL-AC-10) ----
import { spawn } from "node:child_process";
import http from "node:http";

const OPS_APPLY = path.join(DIR, "..", "ops-apply.mjs");
const TOKEN = `om_${"ab".repeat(32)}`;

/** Cloud giả: /pull trả `lenhKeo()` (hoặc mã `ma`), /ingest ghi bản tin. Đếm mọi yêu cầu. */
async function cloudGia({ lenhKeo = () => [], ma = 200 } = {}) {
  const st = { yeuCau: 0, keo: 0, banTin: [], authKeo: [] };
  const server = http.createServer((req, res) => {
    st.yeuCau++;
    let body = "";
    req.on("data", (d) => (body += d));
    req.on("end", () => {
      if (ma !== 200) {
        res.writeHead(ma).end("loi");
        return;
      }
      if (req.url === "/api/v1/ops/change-requests/pull") {
        st.keo++;
        st.authKeo.push(req.headers.authorization);
        res.writeHead(200, { "content-type": "application/json" }).end(JSON.stringify({ commands: lenhKeo() }));
      } else if (req.url === "/api/v1/ops/ingest") {
        const b = JSON.parse(body);
        st.banTin.push(b);
        res.writeHead(200, { "content-type": "application/json" }).end(JSON.stringify({ ok: true, cap_nhat: b.results.length, bo_qua: 0 }));
      } else res.writeHead(404).end();
    });
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const url = `http://127.0.0.1:${server.address().port}`;
  return { st, url, dong: () => new Promise((r) => server.close(r)) };
}

/** Thư mục cấu hình tạm có cloud.env (token) — `token: false` thì không có token. */
function cauHinh({ token = true } = {}) {
  const d = mkdtempSync(path.join(tmpdir(), "ops-apply-ch-"));
  if (token) writeFileSync(path.join(d, "cloud.env"), `OPS_MACHINE_TOKEN=${TOKEN}\n`);
  return d;
}

/** Chạy ops-apply (hoặc bản `tep` khác) như tiến trình con, không chặn vòng sự kiện của cloud giả. */
function chayApply(S, url, ch, tep = OPS_APPLY) {
  const env = { ...process.env, DATABASE_URL: schemaUrl(S), OPS_APPLY_CLOUD: url, INGEST_URL: `${url}/api/v1/ops/ingest`, OPS_APPLY_CONFIG_DIR: ch };
  delete env.OPS_MACHINE_TOKEN;
  return new Promise((resolve) => {
    const p = spawn(process.execPath, [tep], { env });
    let out = "";
    let err = "";
    p.stdout.on("data", (d) => (out += d));
    p.stderr.on("data", (d) => (err += d));
    p.on("close", (code) => resolve({ code, out, err }));
  });
}
const xmin = async (c, code) => (await c.query(`SELECT xmin::text AS x FROM source_registry WHERE code = $1`, [code])).rows[0]?.x;

test("SL-AC-6 mười lượt kéo cùng lệnh: áp đúng một lần, mỗi lượt báo lại cùng kết quả", async () => {
  const { S, c } = await mayThu("ac6");
  await nguon(c, [["S05", "active"]]);
  const cmd = lenh("source.pause", "S05", { reason: "het credit" });
  const gia = await cloudGia({ lenhKeo: () => [cmd] });
  const ch = cauHinh();
  try {
    let x1;
    for (let i = 1; i <= 10; i++) {
      const r = await chayApply(S, gia.url, ch);
      assert.equal(r.code, 0, `lượt ${i}: ${r.err}`);
      assert.ok(!r.out.includes(TOKEN) && !r.err.includes(TOKEN), "token lộ ra đầu ra");
      if (i === 1) {
        const d = await dong(c, "S05");
        assert.deepEqual([d.status, d.reason], ["paused", "het credit"]);
        assert.deepEqual(await docTrangThai(c, "S05"), { run: false, ly_do: "nguon-paused" });
        x1 = await xmin(c, "S05");
      }
    }
    assert.equal(await xmin(c, "S05"), x1, "dòng S05 bị ghi lại sau lượt đầu — áp lần hai");
    const s = await so(c, cmd.idempotency_key);
    assert.equal(s.length, 1);
    assert.equal(s[0].outcome, "applied");
    assert.deepEqual(s[0].before, { status: "active", reason: null, resume_when: null });
    assert.deepEqual(s[0].after, { status: "paused", reason: "het credit", resume_when: null });
    const n = (await c.query(`SELECT count(*)::int AS n FROM ops_audit WHERE actor = 'machine:ops-apply' AND detail->>'idempotency_key' = $1`, [cmd.idempotency_key])).rows[0].n;
    assert.equal(n, 1);
    assert.equal(gia.st.banTin.length, 10, "mỗi lượt phải báo lại kết quả");
    for (const b of gia.st.banTin) {
      assert.equal(b.kind, "change_request_results");
      assert.equal(b.results.length, 1);
      assert.equal(b.results[0].idempotency_key, cmd.idempotency_key);
      assert.deepEqual(b.results[0].after, { status: "paused", reason: "het credit", resume_when: null });
    }
    assert.ok(gia.st.authKeo.every((a) => a === `Bearer ${TOKEN}`), "kéo phải xưng bằng token máy");
  } finally {
    await gia.dong();
    rmSync(ch, { recursive: true, force: true });
  }
});

test("SL-AC-10 phanh, cloud lỗi, thiếu token: không đổi gì; plist hợp lệ 60 giây", async () => {
  const { S, c } = await mayThu("ac10");
  await nguon(c, [["S05", "active"]]);
  const cmd = lenh("source.pause", "S05", { reason: "het credit" });
  const anh = async () => (await c.query(`SELECT * FROM source_registry ORDER BY code`)).rows;
  const ch = cauHinh();
  const gia = await cloudGia({ lenhKeo: () => [cmd] });
  try {
    writeFileSync(path.join(ch, "ops-apply.dung"), "");
    const truoc = await anh();
    const r = await chayApply(S, gia.url, ch);
    assert.equal(r.code, 0);
    assert.match(r.out, /phanh/);
    assert.equal(gia.st.yeuCau, 0, "phanh bật mà vẫn gọi cloud");
    assert.deepEqual(await anh(), truoc);

    // Đối chứng đỏ: bản sao bỏ kiểm phanh thì vẫn gọi cloud.
    const dot = path.join(DIR, "..", `.ops-apply-dot-${PID}.mjs`);
    try {
      const goc = readFileSync(OPS_APPLY, "utf8");
      const kiem = 'if (existsSync(path.join(CAU_HINH, "ops-apply.dung"))) {';
      assert.equal(goc.split(kiem).length, 2, "không thấy đúng một chỗ kiểm phanh để đột biến");
      writeFileSync(dot, goc.replace(kiem, "if (false) {"));
      const rd = await chayApply(S, gia.url, ch, dot);
      assert.equal(rd.code, 0, rd.err);
      assert.ok(gia.st.keo >= 1, "phanh — bản bỏ kiểm phanh phải gọi cloud");
    } finally {
      rmSync(dot, { force: true });
    }
    // Trả nguồn về active để lượt gỡ phanh áp được (đối chứng vừa áp lệnh).
    await c.query(`UPDATE source_registry SET status = 'active', reason = NULL WHERE code = 'S05'`);
    rmSync(path.join(ch, "ops-apply.dung"));
    const cmd2 = lenh("source.pause", "S05", { reason: "het credit" });
    const gia2 = await cloudGia({ lenhKeo: () => [cmd2] });
    try {
      const r2 = await chayApply(S, gia2.url, ch);
      assert.equal(r2.code, 0, r2.err);
      assert.ok(gia2.st.keo >= 1);
      assert.equal((await dong(c, "S05")).status, "paused");
    } finally {
      await gia2.dong();
    }
  } finally {
    await gia.dong();
  }
  // Cloud trả 503, cổng đóng, thiếu token.
  await c.query(`UPDATE source_registry SET status = 'active', reason = NULL WHERE code = 'S05'`);
  const truoc = await anh();
  const g503 = await cloudGia({ ma: 503 });
  const r503 = await chayApply(S, g503.url, ch);
  await g503.dong();
  assert.equal(r503.code, 2);
  assert.deepEqual(await anh(), truoc);
  const rDong = await chayApply(S, g503.url, ch); // server đã đóng → cổng không ai nghe
  assert.equal(rDong.code, 2);
  assert.deepEqual(await anh(), truoc);
  const chKhong = cauHinh({ token: false });
  const gKhong = await cloudGia({ lenhKeo: () => [cmd] });
  const rKhong = await chayApply(S, gKhong.url, chKhong);
  await gKhong.dong();
  assert.equal(rKhong.code, 2);
  assert.equal(gKhong.st.yeuCau, 0);
  for (const r of [r503, rDong, rKhong]) assert.ok(!r.out.includes(TOKEN) && !r.err.includes(TOKEN), "token lộ ra đầu ra");
  rmSync(ch, { recursive: true, force: true });
  rmSync(chKhong, { recursive: true, force: true });

  // Plist: hợp lệ, 60 giây, gọi đúng bộ áp.
  const plist = path.join(DIR, "..", "cron", "com.oneinvest.ops-apply.plist");
  const { spawnSync } = await import("node:child_process");
  const lint = spawnSync("plutil", ["-lint", plist], { encoding: "utf8" });
  if (lint.error) {
    assert.match(readFileSync(plist, "utf8"), /^<\?xml[\s\S]*<plist version="1.0">[\s\S]*<\/plist>\s*$/);
  } else assert.equal(lint.status, 0, lint.stdout + lint.stderr);
  const x = readFileSync(plist, "utf8");
  assert.match(x, /<key>StartInterval<\/key><integer>60<\/integer>/);
  assert.match(x, /<string>__ROOT__\/pipeline\/ops-apply\.mjs<\/string>/);
});
