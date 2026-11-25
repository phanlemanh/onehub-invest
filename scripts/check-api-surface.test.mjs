// node --test scripts/check-api-surface.test.mjs — tin-rao-tren-invest E6: khoá publicOffers của sổ bề mặt.
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { JOIN_S02_CU, MSG, MUTATIONS, checkApiSurface, loadEntries, loadFiles } from "./check-api-surface.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dong = (entries, route) => entries.find((e) => e.route === route);

test("E6 sổ thật qua; hai route tin rao public + publicOffers; v1/offers, v1/deals vẫn ops", async () => {
  const entries = await loadEntries();
  assert.deepEqual(checkApiSurface({ entries, files: loadFiles() }).violations, []);
  for (const r of ["v1/listings", "v1/listings/[id]/contact"]) {
    assert.equal(dong(entries, r).mode, "public", r);
    assert.equal(dong(entries, r).publicOffers, true, r);
  }
  assert.equal(dong(entries, "v1/offers").mode, "ops");
  assert.equal(dong(entries, "v1/deals").mode, "ops");
  assert.deepEqual(entries.filter((e) => e.publicOffers).map((e) => e.route).sort(), ["v1/listings", "v1/listings/[id]/contact"]);
});

test("E6 đối chứng: mỗi đột biến đỏ đúng thông điệp ghim", async () => {
  const base = { entries: await loadEntries(), files: loadFiles() };
  const ky_vong = {
    M4: MSG.publicSale,
    M21: MSG.publicOffersRoute,
    M22: MSG.publicOffersLib,
    M23: MSG.publicSale,
  };
  for (const [id, msg] of Object.entries(ky_vong)) {
    const m = MUTATIONS.find((x) => x[0] === id);
    assert.ok(m, `thiếu đột biến ${id}`);
    assert.equal(m[2], msg, id);
    const hong = m[3](base);
    assert.ok(hong, `${id} không áp được`);
    assert.ok(checkApiSurface(hong).violations.some((v) => v.includes(msg)), `${id} không đỏ: ${msg}`);
  }
  assert.equal(MSG.publicSale, "đọc sale_offers mà sổ khai public");
});

test("E6 bảng đột biến đầy đủ chạy qua cửa dòng lệnh", () => {
  const r = spawnSync(process.execPath, ["scripts/check-api-surface.mjs", "mutation"], { cwd: root, encoding: "utf8" });
  assert.equal(r.status, 0, r.stdout.split("\n").filter((l) => l.startsWith("FAIL")).join("\n"));
});

test("E6 smoke bề mặt có ca khách gọi tin rao 200 và v1/offers 401", () => {
  const s = readFileSync(path.join(root, "scripts/smoke-api-surface.mjs"), "utf8");
  assert.match(s, /\/api\/v1\/listings\?kind=sale/);
  assert.match(s, /offers khách: 401/);
  execFileSync(process.execPath, ["--check", "scripts/smoke-api-surface.mjs"], { cwd: root });
});

// HT23 api-markets-khong-tra-so-s02 — route public không đọc bảng số S02 (AGENTS.md luật 5).
const routeCua = (r) => `app/src/app/api/${r}/route.ts`;

test("HT23-AC-3 sổ thật 0 vi phạm; route public cấy đọc airdna_scores đỏ đúng MSG.publicS02", async () => {
  const entries = await loadEntries();
  const files = loadFiles();
  assert.deepEqual(checkApiSurface({ entries, files }).violations, []);
  const cay = {
    entries: [...entries, { route: "v1/cay-s02", methods: ["GET"], mode: "public", note: "cấy" }],
    files: { ...files, [routeCua("v1/cay-s02")]: 'import { pool } from "@/lib/db";\nexport async function GET() {\n  return Response.json((await pool.query("SELECT total FROM airdna_scores")).rows);\n}\n' },
  };
  const v = checkApiSurface(cay).violations;
  assert.deepEqual(v, [`v1/cay-s02: ${MSG.publicS02} (app/src/app/api/v1/cay-s02/route.ts)`]);
  // Cùng route nhưng khai ops: không đỏ vì luật này chỉ áp cho public.
  const ops = { ...cay, entries: cay.entries.map((e) => (e.route === "v1/cay-s02" ? { ...e, mode: "admin" } : e)) };
  assert.ok(!checkApiSurface(ops).violations.some((x) => x.includes(MSG.publicS02)), "route không public không chịu luật S02");
});

test("HT23-AC-5 mọi route public 0 vi phạm S02; đối chứng: cấy lại JOIN cũ thì đúng một route v1/markets đỏ", async () => {
  const entries = await loadEntries();
  const files = loadFiles();
  const pubs = entries.filter((e) => e.mode === "public").map((e) => e.route);
  assert.ok(pubs.length >= 4, `sổ phải có ít nhất 4 route public, có ${pubs.length}`);
  assert.ok(!checkApiSurface({ entries, files }).violations.some((x) => x.includes(MSG.publicS02)));
  const f = routeCua("v1/markets");
  assert.ok(files[f].includes("FROM areas a\n"), "route markets không còn mỏ neo để cấy đối chứng");
  const doi = { entries, files: { ...files, [f]: files[f].replace("FROM areas a\n", `FROM areas a\n${JOIN_S02_CU}`) } };
  const v = checkApiSurface(doi).violations.filter((x) => x.includes(MSG.publicS02));
  assert.deepEqual(v.map((x) => x.split(":")[0]), ["v1/markets"]);
});

test("HT23-AC-6 sổ: v1/markets public, GET, ghi chú không mang số S02", async () => {
  const d = (await loadEntries()).find((e) => e.route === "v1/markets");
  assert.equal(d.mode, "public");
  assert.deepEqual(d.methods, ["GET"]);
  assert.equal(d.note, "danh sách thị trường và số tin; không mang số S02");
});
