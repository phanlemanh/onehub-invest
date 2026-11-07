// 0711-6: test khô — chia cụm 20 + writer thật + đứt giữa chừng giữ được
// các cụm đã finalize. Chạy node --test; không đụng mạng/Chrome.
import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { gunzipSync } from "zlib";
import { join } from "node:path";
import { tmpdir } from "node:os";

const REPO = new URL("..", import.meta.url).pathname; // pipeline/
const COLLECTOR_DIST = "/Users/manhphan/dev/onehub-invest-zcode/collector/dist/core/storage.js";

function demItem(root) {
  let tong = 0, snaps = [];
  for (const v of readdirSync(root)) {
    const dir = join(root, v);
    for (const s of readdirSync(dir).filter((x) => !x.startsWith("."))) {
      if (!s.includes("airbnb-listing")) continue;
      const manP = join(dir, s, "manifest.json");
      if (!existsSync(manP)) continue;
      const man = JSON.parse(readFileSync(manP));
      for (const f of man.files ?? []) {
        if (!f.name.startsWith("items-")) continue;
        tong += JSON.parse(gunzipSync(readFileSync(join(dir, s, f.name)))).length;
      }
      snaps.push(s);
    }
  }
  return { tong, snaps };
}

test("cụm 20: writer thật — đứt giữa cụm 3 vẫn giữ 2 cụm đầu (40 item) trên đĩa", async () => {
  const root = mkdtempSync(join(tmpdir(), "s01-kho-"));
  const { SnapshotWriter } = await import(COLLECTOR_DIST);
  let daFinalize = 0;
  await assert.rejects(async () => {
    for (let cum = 0; cum < 3; cum++) {
      const w = new SnapshotWriter(root, "hcmc", "airbnb-listing");
      const items = Array.from({ length: 20 }, (_, i) => ({
        source: "airbnb-listing", sourceId: String(cum * 20 + i + 1), kind: "listing",
        fetchedAt: new Date().toISOString(), payload: { cum, i },
      }));
      if (cum === 2) throw new Error("browser has been closed"); // đứt trước write cụm 3
      await w.write(items);
      await w.finalize({ discovered: 20, captured: 20, failed: 0, methods: { roomsPage: 20 }, notes: [] });
      daFinalize++;
    }
  }, /browser has been closed/);
  const { tong, snaps } = demItem(root);
  assert.equal(daFinalize, 2, "2 cụm đã finalize trước khi đứt");
  assert.equal(tong, 40, `đĩa giữ 40 item của 2 cụm (thấy ${tong})`);
  assert.equal(snaps.length, 2, "2 snapshot hoàn chỉnh trên đĩa");
  rmSync(root, { recursive: true, force: true });
});

test("script có --danh-sach/--snapshot-root: thiếu danh sách → lỗi rõ, không chạy", () => {
  const r = spawnSync("node", [join(REPO, "s01", "thu-theo-danh-sach.mjs"), "--danh-sach", "/tmp/khong-ton-tai.json"], {
    encoding: "utf8", timeout: 15000,
  });
  assert.ok(r.status !== 0, "phải lỗi khi danh sách không tồn tại");
});


// 0711-11: test import CHÍNH luat-dung.mjs (không còn bản sao trong test)
test("luat-dung: 5-FAIL liền (có tốt xen trước) dừng; 3-mất-giá dừng; không đủ liền không dừng", async () => {
  const { taoBoDem } = await import(new URL("../s01/luat-dung.mjs", import.meta.url).href);
  const b1 = taoBoDem();
  ["[1/9] a price=1", "[2/9] b FAIL", "[3/9] c FAIL", "[4/9] d price=2", "[5/9] e FAIL", "[6/9] f FAIL", "[7/9] g FAIL", "[8/9] h FAIL", "[9/9] i FAIL"].forEach((d) => b1.can(d));
  assert.equal(b1.state.vungDung, "5-lien-FAIL", "5 FAIL liền dừng");
  const b2 = taoBoDem();
  ["[1/3] a price=—", "[2/3] b price=—", "[3/3] c price=—"].forEach((d) => b2.can(d));
  assert.equal(b2.state.vungDung, "3-lien-mat-gia", "3 mất giá liền dừng");
  const b3 = taoBoDem();
  ["[1] FAIL", "[2] FAIL", "[3] ok price=9", "[4] FAIL", "[5] FAIL"].forEach((d) => b3.can(d));
  assert.equal(b3.state.vungDung, null, "không đủ liền → không dừng");
});


// 0711-12(2): spawn script THẬT + collector giả 5-FAIL — chạy QUA khối chính
test("spawn thật + collector giả 5-FAIL liền → thoát 2, output có 5-lien-FAIL", async () => {
  const fs = await import("node:fs");
  const dir = fs.mkdtempSync(join(tmpdir(), "s01-gia-"));
  fs.writeFileSync(join(dir, "id.json"), JSON.stringify({ hcm: ["abnb_1"] }));
  fs.writeFileSync(join(dir, "gia.mjs"), "export const airbnbListing = { requestsPerSecond: 1,\n  async collect(ctx) {\n    for (const d of [\"[1/7] a price=1\", \"[2/7] b price=2\", \"[3/7] c FAIL x\", \"[4/7] d FAIL x\", \"[5/7] e FAIL x\", \"[6/7] f FAIL x\", \"[7/7] g FAIL x\"]) ctx.log(d);\n    return { items: [], coverage: { discovered: 7, captured: 0, failed: 7, methods: {}, notes: [] } };\n  } };\n");
  const r = spawnSync("node", [join(REPO, "s01", "thu-theo-danh-sach.mjs"),
    "--danh-sach", join(dir, "id.json"), "--snapshot-root", join(dir, "snaps")], {
    encoding: "utf8", timeout: 30000,
    env: { ...process.env, S01_COLLECTOR_GIA: join(dir, "gia.mjs") },
  });
  const out = (r.stdout || "") + (r.stderr || "");
  assert.equal(r.status, 2, `phải thoát 2 (được ${r.status}): ${out.slice(0, 300)}`);
  assert.ok(out.includes("5-lien-FAIL"), `output có 5-lien-FAIL: ${out.slice(0, 300)}`);
  fs.rmSync(dir, { recursive: true, force: true });
});

// 0711-11: spawn script THẬT với danh sách không tồn tại — chứng minh khởi
// động được tới chỗ đọc danh sách (không ReferenceError ở khối import/luat-dung)
test("script thật khởi động không ReferenceError (đến lỗi đọc danh sách)", () => {
  const r = spawnSync("node", [join(REPO, "s01", "thu-theo-danh-sach.mjs"), "--danh-sach", "/tmp/khong-ton-tai-xyz.json"], {
    encoding: "utf8", timeout: 20000,
  });
  assert.ok(r.status !== 0);
  const err = (r.stderr || "") + (r.stdout || "");
  assert.ok(!err.includes("ReferenceError"), `không được ReferenceError: ${err.slice(0, 200)}`);
  assert.ok(err.includes("no such file") || err.includes("ENOENT"), "lỗi là ENOENT đọc danh sách — chứng minh chạy tới đó");
});

// 0711-9(4): đối chiếu đĩa thật — dựng 2 snapshot writer + đọc manifest cộng = đúng
test("0711-9(4): đối chiếu manifest — 2 snapshot cộng counts.items đúng số", async () => {
  const root = mkdtempSync(join(tmpdir(), "s01-doi-"));
  const { SnapshotWriter } = await import(COLLECTOR_DIST);
  let dem = 0;
  for (const n of [20, 20]) {
    const w = new SnapshotWriter(root, "hcmc", "airbnb-listing");
    await w.write(Array.from({ length: n }, (_, i) => ({ source: "airbnb-listing", sourceId: String(++dem), kind: "listing", fetchedAt: new Date().toISOString(), payload: {} })));
    await w.finalize({ discovered: n, captured: n, failed: 0, methods: {}, notes: [] });
  }
  let tong = 0;
  for (const s2 of readdirSync(join(root, "hcmc")).filter((x) => !x.startsWith("."))) {
    const mp = join(root, "hcmc", s2, "manifest.json");
    if (!existsSync(mp)) continue;
    tong += JSON.parse(readFileSync(mp)).counts?.items ?? 0;
  }
  assert.equal(tong, 40, "manifest 2 cụm cộng đúng 40");
  rmSync(root, { recursive: true, force: true });
});
