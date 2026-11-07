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


// 0711-11 dựng, 0711-29(1) sửa: test import CHÍNH luat-dung.mjs — luật tỉ lệ
// có giá thay cho 3-liền-mất-giá; nhịp sàn 12s theo nghỉ 12–20 giây.
test("luat-dung: 5-FAIL liền dừng; tỉ lệ có giá 20 căn đầu <40% dừng; ≥40% không dừng; nhịp sàn 12s", async () => {
  const { taoBoDem } = await import(new URL("../s01/luat-dung.mjs", import.meta.url).href);
  const b1 = taoBoDem();
  ["[1/9] a price=1", "[2/9] b FAIL", "[3/9] c FAIL", "[4/9] d price=2", "[5/9] e FAIL", "[6/9] f FAIL", "[7/9] g FAIL", "[8/9] h FAIL", "[9/9] i FAIL"].forEach((d) => b1.can(d));
  assert.equal(b1.state.vungDung, "5-lien-FAIL", "5 FAIL liền dừng");
  // 0711-29(1): 20 căn đầu chỉ 7 căn có giá (35% < 40%) → dừng đúng căn 20
  // đồng hồ giả cách 15 giây/căn để KHÔNG vỉ sàn nhịp trước khi tới luật tỉ lệ
  const dongHo = (batDau) => { let t = batDau; return () => (t += 15_000); };
  const b2 = taoBoDem({ now: dongHo(0) });
  for (let i = 1; i <= 13; i++) b2.can(`[${i}/20] x price=—`);
  for (let i = 14; i <= 20; i++) b2.can(`[${i}/20] x price=9`);
  assert.match(b2.state.vungDung ?? "", /ti-le-co-gia-7-tren-20-duoi-40phan-tram/, "7/20 có giá → dừng tỉ lệ");
  // 8/20 có giá (40%) → KHÔNG dừng (luật cũ 3-liền-mất-giá đã BỎ)
  const b3 = taoBoDem({ now: dongHo(0) });
  for (let i = 1; i <= 12; i++) b3.can(`[${i}/20] x price=—`);
  for (let i = 13; i <= 20; i++) b3.can(`[${i}/20] x price=9`);
  assert.equal(b3.state.vungDung, null, "12 mất giá LIỀN nhưng 8/20 có giá ≥40% → không dừng (bỏ luật 3-liền)");
  // 0711-29(2): sàn nhịp 12 giây — chạy 10 căn tức thì → trung bình ~0 < 12 → dừng
  const b5 = taoBoDem();
  for (let i = 1; i <= 10; i++) b5.can(`[${i}/10] x price=1`);
  assert.equal(b5.state.vungDung, "nhip-duoi-12s", "10 căn quá nhanh (<12s trung bình) → dừng");
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


// 0711-21: discovery giả phải nằm dưới SNAP_ROOT đúng nơi collect đọc
test("duDiscovery ghi dưới SNAP_ROOT (khớp paths.snapshotRoot của collect)", async () => {
  const { spawnSync: sp } = await import("node:child_process");
  const fs = await import("node:fs");
  const { tmpdir } = await import("node:os");
  const dir = fs.mkdtempSync((await import("node:path")).default.join(tmpdir(), "s01-disc-"));
  fs.writeFileSync((await import("node:path")).default.join(dir, "id.json"), JSON.stringify({ hcm: ["abnb_9"] }));
  fs.writeFileSync((await import("node:path")).default.join(dir, "gia.mjs"), "export const airbnbListing = { requestsPerSecond: 1, async collect(ctx) { const fsx = await import('node:fs'); const dirs = fsx.readdirSync(ctx.paths.snapshotRoot + '/hcmc').filter(x => !x.startsWith('.')); ctx.log('discovery-dir=' + dirs.join(',')); return { items: [], coverage: { discovered: 1, captured: 0, failed: 0, methods: {}, notes: [] } }; } };");
  const r = sp("node", [(await import("node:path")).default.join(REPO, "s01", "thu-theo-danh-sach.mjs"),
    "--danh-sach", (await import("node:path")).default.join(dir, "id.json"), "--snapshot-root", (await import("node:path")).default.join(dir, "snaps")], {
    encoding: "utf8", timeout: 30000, env: { ...process.env, S01_COLLECTOR_GIA: (await import("node:path")).default.join(dir, "gia.mjs") },
  });
  const out = (r.stdout || "") + (r.stderr || "");
  assert.ok(out.includes("discovery-dir=hcmc__airbnb-discovery__n1"), `collect phải THẤY discovery dưới snapshot-root (log: ${out.slice(0, 250)})`);
  fs.rmSync(dir, { recursive: true, force: true });
});


// 0711-29(2): --vung chỉ MỘT vùng mỗi lượt; --toi-da cắt số căn; tên vùng sai thoát 2
test("--vung lọc đúng một vùng · --vung sai thoát 2 · --toi-da cắt danh sách", async () => {
  const { spawnSync: sp } = await import("node:child_process");
  const fs = await import("node:fs");
  const { join: J } = await import("node:path");
  const { tmpdir } = await import("node:os");
  const dir = fs.mkdtempSync(J(tmpdir(), "s01-vung-"));
  fs.writeFileSync(J(dir, "id.json"), JSON.stringify({
    hcm: ["abnb_1", "abnb_2"], hanoi: ["abnb_3"], danang: ["abnb_4"],
  }));
  fs.writeFileSync(J(dir, "gia.mjs"),
    "export const airbnbListing = { requestsPerSecond: 1, async collect(ctx) {\n" +
    "  for (const d of [\"[1/2] a price=1\", \"[2/2] b price=2\"]) ctx.log(d);\n" +
    "  return { items: [], coverage: { discovered: 2, captured: 2, failed: 0, methods: {}, notes: [] } };\n" +
    "} };\n");
  const env = { ...process.env, S01_COLLECTOR_GIA: J(dir, "gia.mjs") };
  const co = (r) => (r.stdout || "") + (r.stderr || "");
  // --vung hcm: KHÔNG có dòng cụm của hanoi/danang
  const r1 = sp("node", [J(REPO, "s01", "thu-theo-danh-sach.mjs"), "--danh-sach", J(dir, "id.json"),
    "--snapshot-root", J(dir, "snaps"), "--vung", "hcm"], { encoding: "utf8", timeout: 30000, env });
  const out1 = co(r1);
  assert.ok(/== hcmc cụm/.test(out1), "phải chạy hcm");
  assert.ok(!/== hanoi ==|== danang ==/.test(out1), "KHÔNG chạy hanoi/danang khi --vung hcm");
  // --vung sai tên → thoát 2, không chạy gì
  const r2 = sp("node", [J(REPO, "s01", "thu-theo-danh-sach.mjs"), "--danh-sach", J(dir, "id.json"),
    "--snapshot-root", J(dir, "snaps"), "--vung", "saigon"], { encoding: "utf8", timeout: 30000, env });
  assert.equal(r2.status, 2, `--vung sai phải thoát 2 (được ${r2.status}): ${co(r2).slice(0, 200)}`);
  // --toi-da 1: mỗi vùng chỉ 1 căn (discovery giả của hcm chỉ 1 item)
  const r3 = sp("node", [J(REPO, "s01", "thu-theo-danh-sach.mjs"), "--danh-sach", J(dir, "id.json"),
    "--snapshot-root", J(dir, "snaps2"), "--vung", "hcm", "--toi-da", "1"], { encoding: "utf8", timeout: 30000, env });
  assert.ok(/\(1 căn\)/.test(co(r3)), "--toi-da 1 → cụm 1 căn");
  fs.rmSync(dir, { recursive: true, force: true });
});


// 0711-29(3): dấu vết khung hỏi giá — collector giả ghi meta.khungGia đủ 4 nhóm
// thông tin (2 khung hỏi · có trường giá · đêm trống đúng khung mặc định);
// script đưa meta nguyên vẹn vào snapshot ghi đĩa.
test("khungGia: meta từng căn trong snapshot có đủ macDinh/thuLai/coGia/demTrongKhungMacDinh", async () => {
  const { spawnSync: sp } = await import("node:child_process");
  const fs = await import("node:fs");
  const { gunzipSync } = await import("node:zlib");
  const { join: J } = await import("node:path");
  const { tmpdir } = await import("node:os");
  const dir = fs.mkdtempSync(J(tmpdir(), "s01-khung-"));
  fs.writeFileSync(J(dir, "id.json"), JSON.stringify({ hcm: ["abnb_1"] }));
  fs.writeFileSync(J(dir, "gia.mjs"),
    "export const airbnbListing = { requestsPerSecond: 1, async collect(ctx) {\n" +
    "  ctx.log(\"[1/1] a price=9\");\n" +
    "  return { items: [{ source: \"airbnb-listing\", sourceId: \"1\", kind: \"listing\", fetchedAt: \"2026-11-07T10:00:00Z\",\n" +
    "    payload: { url: \"u\" }, meta: { hasPrice: true, khungGia: { macDinh: { ci: \"2026-12-07\", co: \"2026-12-09\" },\n" +
    "      thuLai: { ci: \"2026-11-20\", co: \"2026-11-22\" }, coGia: true, demTrongKhungMacDinh: false } } }],\n" +
    "    coverage: { discovered: 1, captured: 1, failed: 0, methods: {}, notes: [] } };\n" +
    "} };\n");
  const r = sp("node", [J(REPO, "s01", "thu-theo-danh-sach.mjs"), "--danh-sach", J(dir, "id.json"),
    "--snapshot-root", J(dir, "snaps"), "--vung", "hcm"], {
    encoding: "utf8", timeout: 30000,
    env: { ...process.env, S01_COLLECTOR_GIA: J(dir, "gia.mjs") },
  });
  assert.equal(r.status, 0, `phải thoát 0: ${((r.stdout||"")+(r.stderr||"")).slice(0,300)}`);
  // đọc items từ snapshot mới nhất dưới snaps/hcmc
  const hcmc = J(dir, "snaps", "hcmc");
  const snap = fs.readdirSync(hcmc).filter((d) => d.includes("airbnb-listing")).sort().pop();
  const itemsGz = fs.readdirSync(J(hcmc, snap)).find((f) => f.startsWith("items-"));
  const items = JSON.parse(gunzipSync(fs.readFileSync(J(hcmc, snap, itemsGz))).toString());
  const k = items[0]?.meta?.khungGia;
  assert.ok(k, "meta.khungGia phải có trong item trên đĩa");
  assert.equal(k.macDinh.ci, "2026-12-07");
  assert.equal(k.thuLai.co, "2026-11-22");
  assert.equal(k.coGia, true);
  assert.equal(k.demTrongKhungMacDinh, false);
  fs.rmSync(dir, { recursive: true, force: true });
});
