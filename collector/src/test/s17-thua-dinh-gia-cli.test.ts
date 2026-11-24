import { strict as assert } from "node:assert";
import { test } from "node:test";

import { checkConfigForPhase, egoOptions, parseCli } from "../collectors/s17-thua-dinh-gia/main.js";
import { loadConfig } from "../collectors/s17-thua-dinh-gia/config.js";

/**
 * Điểm vào của bộ thu S17: trần lời gọi và trần thời gian PHẢI khai khi chạy (không có mặc định), nhịp
 * kẹp trong mức nguồn đã chịu được (0,3–0,4 s/lời), pha cần phiên phải nói rõ chạy trong task space nào.
 */

const base = ["--phase", "reference", "--snapshots-root", "/tmp/snap", "--caps-calls", "1000", "--caps-minutes", "60"];

test("parseCli: thiếu trần lời gọi hoặc trần thời gian thì từ chối", () => {
  assert.throws(() => parseCli(["--phase", "reference", "--snapshots-root", "/tmp/snap", "--caps-minutes", "60"]));
  assert.throws(() => parseCli(["--phase", "reference", "--snapshots-root", "/tmp/snap", "--caps-calls", "1000"]));
  assert.throws(() => parseCli(base.map((a) => (a === "1000" ? "0" : a))), /dương/, "trần phải là số dương");
});

test("parseCli: nhịp ngoài 150–400 ms bị từ chối; trong mức thì nhận", () => {
  assert.throws(() => parseCli([...base, "--pace-ms", "100"]));
  assert.throws(() => parseCli([...base, "--pace-ms", "500"]));
  assert.equal(parseCli([...base, "--pace-ms", "350"]).paceMs, 350);
  assert.equal(parseCli(base).paceMs, 350, "mặc định 350 ms — giữa mức đã đo");
});

test("parseCli: pha công khai đi bằng Node; pha cần phiên đi qua ego và phải khai space", () => {
  assert.equal(parseCli(base).via, "node");
  assert.equal(parseCli([...base, "--phase", "tile-mask", "--grid", "/tmp/luoi.json"]).via, "node");
  assert.throws(() => parseCli([...base, "--phase", "projects"]), /space/);
  const p = parseCli([...base, "--phase", "projects", "--space", "4"]);
  assert.equal(p.via, "ego");
  assert.equal(p.spaceId, 4);
});

test("parseCli: pha lạ, thiếu gốc snapshot, hoặc số không nguyên thì từ chối", () => {
  assert.throws(() => parseCli(base.map((a) => (a === "reference" ? "khac" : a))));
  assert.throws(() => parseCli(base.filter((a, i) => !(a === "/tmp/snap" || base[i - 1] === "--snapshots-root"))));
  assert.throws(() => parseCli(base.map((a) => (a === "1000" ? "1.5" : a))));
});

const CONFIG_DU_AN = {
  hosts: { api: "https://api.gia.test", agent: "https://agent.gia.test", web: "https://web.gia.test" },
  paths: { "project-list": "/v2.x/projects", "project-detail": "/v2.x/projects/{id}", "building-tree": "/v2.x/projects/{id}/tree", gallery: "/v2.x/gallery/{id}", "data-available": "/v2.x/data-available", "asset-type": "/v2.x/asset-type", balance: "/v2.x/balance", "full-config": "/v2.x/configuration" },
};

test("parseCli: nhịp nhanh nhất khi tăng tốc là 150 ms (Mạnh 24/11); dưới đó vẫn từ chối", () => {
  assert.throws(() => parseCli([...base, "--pace-ms", "100"]));
  assert.equal(parseCli([...base, "--pace-ms", "150"]).paceMs, 150);
  assert.equal(parseCli(base).paceMs, 350, "mặc định vẫn là nhịp cũ");
});

test("parseCli: pha thửa cần phiên, cần lưới khu thí điểm; số luồng trong 1–4", () => {
  const thua = [...base, "--phase", "parcels"];
  assert.throws(() => parseCli(thua), /space/);
  assert.throws(() => parseCli([...thua, "--space", "4"]), /parcels-grid/);
  const p = parseCli([...thua, "--space", "4", "--parcels-grid", "/tmp/luoi-thua.json", "--luong-song", "3", "--pace-ms", "200"]);
  assert.equal(p.via, "ego");
  assert.equal(p.concurrency, 3);
  assert.equal(p.parcelsGrid, "/tmp/luoi-thua.json");
  assert.equal(parseCli(base).concurrency, 1, "mặc định một luồng");
  assert.throws(() => parseCli([...thua, "--space", "4", "--parcels-grid", "/tmp/luoi-thua.json", "--luong-song", "5"]), /1 đến 4/);
});

test("checkConfigForPhase: pha cần phiên đòi tên cookie phiên trong cấu hình local; pha công khai không cần", () => {
  const config = CONFIG_DU_AN;
  assert.doesNotThrow(() => checkConfigForPhase(loadConfig(JSON.stringify(config)), parseCli([...base, "--phase", "tile-mask", "--grid", "/tmp/luoi.json"])));
  assert.throws(() => checkConfigForPhase(loadConfig(JSON.stringify(config)), parseCli([...base, "--phase", "projects", "--space", "4"])), /cookieName/);
  assert.doesNotThrow(() => checkConfigForPhase(loadConfig(JSON.stringify({ ...config, session: { cookieName: "PHIEN_GIA" } })), parseCli([...base, "--phase", "projects", "--space", "4"])));
  assert.throws(() => checkConfigForPhase(loadConfig(JSON.stringify({ ...config, session: { cookieName: "a b(c" } })), parseCli([...base, "--phase", "projects", "--space", "4"])), /cookieName/);
});

test("egoOptions: pha qua ego phải mang cờ đọc số dư và tên cookie phiên (lượt thật 24/11 thiếu cờ này)", () => {
  const config = loadConfig(JSON.stringify({ ...CONFIG_DU_AN, session: { cookieName: "PHIEN_GIA" } }));
  const via = parseCli([...base, "--phase", "projects", "--space", "4"]);
  const opts = egoOptions(via, config, { statePath: "/tmp/s.json", logPath: "/tmp/l.jsonl", resultPath: "/tmp/r.json" }, [{ marketId: "vn-a", name: "A", tiles: [] }]);
  assert.equal(opts.checkBalance, true);
  assert.equal(opts.cookieName, "PHIEN_GIA");
  assert.equal(opts.spaceId, 4);
  assert.equal(opts.statePath, "/tmp/s.json");
  assert.equal(opts.snapshotRoot, "/tmp/snap", "thư mục snapshot phải sang được tiến trình ego (lượt thật 24/11 thiếu, mất 4 trang)");
  assert.equal(opts.resultPath, "/tmp/r.json");
  assert.equal(opts.logPath, "/tmp/l.jsonl");
  assert.ok(JSON.stringify(opts).includes("PHIEN_GIA"), "tệp tuỳ chọn là JSON bình thường");
  const congKhai = egoOptions(parseCli(base), config, { statePath: "/tmp/s.json", logPath: "/tmp/l.jsonl", resultPath: "/tmp/r.json" });
  assert.equal(congKhai.checkBalance, false, "pha công khai không đụng tài khoản");
});
