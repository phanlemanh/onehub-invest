#!/usr/bin/env node
// sinh-dong-that.mjs — ZC16 round-trip (chép từ bản ZC15): sinh meta.mediaFiles bằng CHÍNH collector API (createAgentServer → flush) của
// một bản dist, trong hộp cát: snapshot vào thư mục tạm, stateDir tạm có tệp hậu tố ghi host đích giả «dich.test», và
// fetch toàn cục của tiến trình con thay bằng CDN giả trong bộ nhớ (theo chuyển hướng như fetch thật, đặt res.url là URL
// cuối) — không ra mạng, không chạm máy thu. Bộ tải, danh sách cho phép, kiểm host cuối là mã THẬT của bản dist.
//
//   node sinh-dong-that.mjs <collector dist> <rows.json ra>
//
// CDN giả (tiến trình con): cdn.zdn.vn/jpg/x.jpg → 400, cdn.zdn.vn/x.jpg → 200 byte JPEG (header image/jxl như CDN thật);
// cdn.zdn.vn/ok.jpg → JPEG. Đầu ra: [{post_id, media_files}] cho kiem-sau.mjs --tu-tep.
import { spawn } from "node:child_process";
import { mkdtempSync, writeFileSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { gunzipSync } from "node:zlib";
import { pathToFileURL } from "node:url";

const JPG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]);

if (process.argv[2] === "--con") {
  // tiến trình con: CDN giả thay fetch toàn cục, rồi chạy collector API của bản dist
  const [, , , dist, stateDir, root, out] = process.argv;
  const cdn = (u) => {
    if (u.hostname === "cdn.zdn.vn" && u.pathname === "/jpg/x.jpg") return { status: 400 };
    if (u.hostname === "cdn.zdn.vn") return { body: JPG };
    return { status: 404 };
  };
  globalThis.fetch = async (input) => {
    let u = new URL(String(input));
    for (let i = 0; i < 5; i++) {
      const r = cdn(u);
      if (r.to) { u = new URL(r.to); continue; }
      const res = new Response(r.body ?? "", { status: r.status ?? 200, headers: { "content-type": "image/jpeg" } });
      Object.defineProperty(res, "url", { value: u.href });
      return res;
    }
    throw new TypeError("quá nhiều chuyển hướng");
  };
  const { createAgentServer } = await import(pathToFileURL(join(dist, "api/server.js")).href);
  const s = await createAgentServer({ snapshotRoot: root, stateDir, city: "hanoi", keys: ["k1"], log: () => {} });
  const urls = ["http://cdn.zdn.vn/jpg/x.jpg", "http://cdn.zdn.vn/ok.jpg"];
  const r = s.ingest({ agent_id: "a", group: "g", messages: urls.map((u, i) => ({ text: `bài ${i}`, ts: `2026-11-25T02:0${i}:00Z`, media: [{ path: null, url: u, type: "image/jpeg" }] })) }, "Bearer k1");
  if (r.status !== 202) throw new Error(`ingest ${r.status}`);
  const m = await s.flush();
  const dir = join(root, "hanoi", m.snapshotId);
  const items = readdirSync(dir).filter((f) => f.startsWith("items-")).flatMap((f) => JSON.parse(gunzipSync(readFileSync(join(dir, f))).toString()));
  writeFileSync(out, JSON.stringify(items.map((it) => ({ post_id: it.sourceId, media_files: it.meta?.mediaFiles ?? [] })), null, 1));
  process.exit(0);
}

const [dist, out] = process.argv.slice(2);
if (!dist || !out) { console.error("dùng: sinh-dong-that.mjs <collector dist> <rows.json ra>"); process.exit(2); }
const tam = mkdtempSync(join(tmpdir(), "zc15-rt-"));
const stateDir = join(tam, "state");
const root = join(tam, "snapshots");
const { mkdirSync } = await import("node:fs");
mkdirSync(stateDir, { recursive: true });
writeFileSync(join(stateDir, "media-host-suffixes.txt"), "# host đích giả của hộp cát\ndich.test\n");
const code = await new Promise((ok) => {
  const env = { ...process.env };
  delete env.ONEINVEST_MEDIA_HOST_SUFFIXES;
  const c = spawn(process.execPath, [new URL(import.meta.url).pathname, "--con", resolve(dist), stateDir, root, resolve(out)], { env, stdio: "inherit" });
  c.on("exit", ok);
});
rmSync(tam, { recursive: true, force: true });
process.exit(code ?? 1);
