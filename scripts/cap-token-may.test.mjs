// cap-token-may.test.mjs — hồ sơ _acceptance/so-lenh-sua-sau-tv4, ca «SS-AC-8» (cấp qua mgmt, ghi cloud.env trên dòng
// riêng), «SS-AC-8b» (mgmtExec THẬT của pipeline/sync-cloud.mjs, chỉ lớp mạng giả), «SS-AC-9» (từ chối, thu hồi).
// Không DB, không mạng: exec giả hoặc fetchImpl giả, HOME tạm.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const DIR = path.dirname(fileURLToPath(import.meta.url));
const TEP = path.join(DIR, "cap-token-may.mjs");
const sha = (s) => createHash("sha256").update(s).digest("hex");
const TOKEN_RE = /om_[0-9a-f]{64}/;

/** HOME tạm có .oneinvest/cloud.env mang `noiDung` (null = không có tệp). */
function homeTam(noiDung) {
  const h = mkdtempSync(path.join(tmpdir(), "cap-token-"));
  mkdirSync(path.join(h, ".oneinvest"));
  if (noiDung !== null) writeFileSync(path.join(h, ".oneinvest", "cloud.env"), noiDung);
  return h;
}
const tepEnv = (h) => path.join(h, ".oneinvest", "cloud.env");
const ghiLai = () => {
  const o = { s: "", write: (x) => (o.s += x) };
  return o;
};
/** exec giả: ghi lại mọi câu SQL, trả `rows`. */
const execGia = (rows) => {
  const cau = [];
  return { cau, exec: async (sql) => (cau.push(sql), rows) };
};

/** Bản sao cap-token-may.mjs có sửa chuỗi, đặt cạnh tệp gốc. */
async function banSao(tu, thanh, dung) {
  const goc = readFileSync(TEP, "utf8");
  assert.equal(goc.split(tu).length, 2, `không thấy đúng một chỗ «${tu}» để đột biến`);
  const tep = path.join(DIR, `.cap-token-ss-${process.pid}-${Math.random().toString(36).slice(2)}.mjs`);
  writeFileSync(tep, goc.replace(tu, thanh));
  try {
    return await dung(await import(pathToFileURL(tep).href));
  } finally {
    rmSync(tep, { force: true });
  }
}

const ARGV = ["--name", "may-thu-x", "--scope", "ops:pull", "--qua-mgmt", "--ghi-cloud-env"];

/** Chạy một lượt cấp với exec giả trên cloud.env 'A=1\nB=2'; trả mọi thứ cần kiểm. */
async function capMot(chayFn) {
  const h = homeTam("A=1\nB=2");
  try {
    const g = execGia([{ name: "may-thu-x" }]);
    const out = ghiLai();
    const err = ghiLai();
    const ma = await chayFn({ argv: ARGV, home: h, exec: g.exec, out, err });
    return { ma, cau: g.cau, out: out.s, err: err.s, tep: readFileSync(tepEnv(h), "utf8") };
  } finally {
    rmSync(h, { recursive: true, force: true });
  }
}
function kiemCap(k) {
  assert.equal(k.ma, 0, k.err);
  assert.ok(!TOKEN_RE.test(k.out) && !TOKEN_RE.test(k.err), "token lộ ra stdout/stderr");
  const dong = k.tep.split("\n");
  assert.equal(dong[0], "A=1");
  assert.equal(dong[1], "B=2", "dính dòng: dòng B bị nối với token");
  assert.match(dong[2] ?? "", /^OPS_MACHINE_TOKEN=om_[0-9a-f]{64}$/);
  assert.deepEqual(dong.slice(3), [""], "tệp phải kết thúc bằng đúng một xuống dòng sau token");
  const token = dong[2].split("=")[1];
  assert.equal(k.cau.length, 1);
  assert.ok(k.cau[0].includes(sha(token)), "câu SQL thiếu băm của token trong tệp");
  assert.ok(!k.cau[0].includes(token), "câu SQL chứa token");
}

test("SS-AC-8 cấp qua mgmt, ghi cloud.env trên dòng riêng, không in token; chỉ băm rời máy", async () => {
  const { chay } = await import(pathToFileURL(TEP).href);
  kiemCap(await capMot(chay));
  // Đối chứng đỏ: bỏ vế thêm xuống dòng → dòng B bị nối.
  await banSao('${cu && !cu.endsWith("\\n") ? "\\n" : ""}', "", async (D) => {
    const k = await capMot(D.chay);
    assert.throws(() => kiemCap(k), /dính dòng/);
  });
});

test("SS-AC-9 từ chối khi đã có token trong tệp hoặc tên đang hiệu lực; thu hồi qua mgmt", async () => {
  const { chay } = await import(pathToFileURL(TEP).href);
  // (a) tệp đã có OPS_MACHINE_TOKEN → thoát 2, không gọi cloud, tệp nguyên.
  const nhanhA = async (chayFn) => {
    const h = homeTam("A=1\nOPS_MACHINE_TOKEN=cu\n");
    try {
      const truoc = sha(readFileSync(tepEnv(h)));
      const g = execGia([{ name: "may-thu-x" }]);
      const ma = await chayFn({ argv: ARGV, home: h, exec: g.exec, out: ghiLai(), err: ghiLai() });
      return { ma, goi: g.cau.length, giu: sha(readFileSync(tepEnv(h))) === truoc };
    } finally {
      rmSync(h, { recursive: true, force: true });
    }
  };
  const a = await nhanhA(chay);
  assert.deepEqual(a, { ma: 2, goi: 0, giu: true }, "đã có token: phải từ chối trước khi chạm cloud");
  // (b) cloud trả 0 dòng → thoát 2, tệp nguyên.
  const h = homeTam("A=1\nB=2");
  try {
    const truoc = sha(readFileSync(tepEnv(h)));
    const g = execGia([]);
    const ma = await chay({ argv: ARGV, home: h, exec: g.exec, out: ghiLai(), err: ghiLai() });
    assert.equal(ma, 2);
    assert.equal(g.cau.length, 1);
    assert.equal(sha(readFileSync(tepEnv(h))), truoc, "tệp đổi khi cloud trả 0 dòng");
  } finally {
    rmSync(h, { recursive: true, force: true });
  }
  // (c) --thu-hoi qua mgmt.
  const g = execGia([{ name: "may-thu-x" }]);
  const h2 = homeTam("A=1\n");
  try {
    const ma = await chay({ argv: ["--thu-hoi", "may-thu-x", "--qua-mgmt"], home: h2, exec: g.exec, out: ghiLai(), err: ghiLai() });
    assert.equal(ma, 0);
    assert.equal(g.cau.length, 1);
    assert.match(g.cau[0], /UPDATE machine_tokens SET revoked_at = now\(\)/);
    assert.ok(g.cau[0].includes("'may-thu-x'"));
  } finally {
    rmSync(h2, { recursive: true, force: true });
  }
  // Đối chứng đỏ: bỏ kiểm tệp có sẵn → nhánh (a) gọi cloud 1 lần.
  await banSao('if (ghiEnv && "OPS_MACHINE_TOKEN" in docEnv(tepEnv)) {', "if (false) {", async (D) => {
    const d = await nhanhA(D.chay);
    assert.equal(d.goi, 1, "đối chứng đỏ «đã có token»: bản bỏ kiểm phải gọi cloud");
  });
});

/** Lượt chạy với mgmtExec THẬT, fetchImpl giả trả `phanHoi`. */
async function quaMgmtThat(chayFn, phanHoi) {
  const h = homeTam("SUPABASE_MGMT_TOKEN=t-thu\n");
  const req = [];
  const fetchImpl = async (url, init) => {
    req.push({ url, auth: init.headers.Authorization, body: JSON.parse(init.body) });
    return new Response(phanHoi, { status: 201, headers: { "content-type": "application/json" } });
  };
  try {
    const truoc = sha(readFileSync(tepEnv(h)));
    const ma = await chayFn({ argv: ARGV, home: h, fetchImpl, out: ghiLai(), err: ghiLai() });
    const tep = readFileSync(tepEnv(h), "utf8");
    return { ma, req, tep, giu: sha(tep) === truoc };
  } finally {
    rmSync(h, { recursive: true, force: true });
  }
}

test("SS-AC-8b mgmtExec thật với fetchImpl giả: header Bearer từ cloud.env, body chỉ có băm; [] thoát 2; nạp module không gọi mạng", async () => {
  const { chay } = await import(pathToFileURL(TEP).href);
  const k = await quaMgmtThat(chay, '[{"name":"may-thu-x","scopes":["ops:pull"]}]');
  assert.equal(k.ma, 0);
  assert.equal(k.req.length, 1);
  assert.ok(k.req[0].url.endsWith("/database/query"), k.req[0].url);
  assert.deepEqual(k.req[0].auth, "Bearer t-thu", "mgmt-token: header phải mang khoá trong cloud.env");
  const token = k.tep.match(/^OPS_MACHINE_TOKEN=(om_[0-9a-f]{64})$/m)?.[1];
  assert.ok(token, "token không được ghi vào cloud.env");
  assert.ok(k.req[0].body.query.includes(sha(token)));
  assert.ok(!k.req[0].body.query.includes(token), "body chứa token");
  const rong = await quaMgmtThat(chay, "[]");
  assert.equal(rong.ma, 2);
  assert.ok(rong.giu, "tệp đổi khi cloud trả []");
  // Chỉ nạp module: không lời gọi mạng nào.
  const p = spawnSync(process.execPath, ["--input-type=module", "-e",
    `globalThis.fetch = () => { throw new Error("goi-mang"); }; await import(${JSON.stringify(pathToFileURL(TEP).href)}); console.log("ok");`],
  { encoding: "utf8" });
  assert.equal(p.status, 0, p.stderr);
  assert.equal(p.stdout.trim(), "ok");
  // Đối chứng đỏ: chay() không đọc SUPABASE_MGMT_TOKEN → «Bearer undefined».
  await banSao("mgmtExec(khoa,", "mgmtExec(undefined,", async (D) => {
    const d = await quaMgmtThat(D.chay, '[{"name":"may-thu-x"}]');
    assert.throws(() => assert.deepEqual(d.req[0].auth, "Bearer t-thu", "mgmt-token"), /mgmt-token/);
    assert.equal(d.req[0].auth, "Bearer undefined");
  });
});
