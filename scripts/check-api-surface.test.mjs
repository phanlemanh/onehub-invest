// node --test scripts/check-api-surface.test.mjs — tin-rao-tren-invest E6: khoá publicOffers của sổ bề mặt.
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { MSG, MUTATIONS, checkApiSurface, loadEntries, loadFiles } from "./check-api-surface.mjs";

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
