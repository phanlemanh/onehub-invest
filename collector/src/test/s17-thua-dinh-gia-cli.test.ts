import { strict as assert } from "node:assert";
import { test } from "node:test";

import { checkConfigForPhase, parseCli } from "../collectors/s17-thua-dinh-gia/main.js";
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

test("parseCli: nhịp ngoài 300–400 ms bị từ chối; trong mức thì nhận", () => {
  assert.throws(() => parseCli([...base, "--pace-ms", "200"]));
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

test("checkConfigForPhase: pha cần phiên đòi tên cookie phiên trong cấu hình local; pha công khai không cần", () => {
  const config = {
    hosts: { api: "https://api.gia.test", agent: "https://agent.gia.test", web: "https://web.gia.test" },
    paths: { "project-list": "/v2.x/projects", "project-detail": "/v2.x/projects/{id}", "building-tree": "/v2.x/projects/{id}/tree", gallery: "/v2.x/gallery/{id}", "data-available": "/v2.x/data-available", "asset-type": "/v2.x/asset-type", balance: "/v2.x/balance", "full-config": "/v2.x/configuration" },
  };
  assert.doesNotThrow(() => checkConfigForPhase(loadConfig(JSON.stringify(config)), parseCli([...base, "--phase", "tile-mask", "--grid", "/tmp/luoi.json"])));
  assert.throws(() => checkConfigForPhase(loadConfig(JSON.stringify(config)), parseCli([...base, "--phase", "projects", "--space", "4"])), /cookieName/);
  assert.doesNotThrow(() => checkConfigForPhase(loadConfig(JSON.stringify({ ...config, session: { cookieName: "PHIEN_GIA" } })), parseCli([...base, "--phase", "projects", "--space", "4"])));
  assert.throws(() => checkConfigForPhase(loadConfig(JSON.stringify({ ...config, session: { cookieName: "a b(c" } })), parseCli([...base, "--phase", "projects", "--space", "4"])), /cookieName/);
});
