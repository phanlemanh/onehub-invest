import { strict as assert } from "node:assert";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { readdirSync } from "node:fs";
import { test } from "node:test";

import { kevScore, deliverWithSpool, spoolKey, type SpoolMessage } from "../core/agent-delivery.js";

/**
 * ZC6 (claudedp-2310-5): hook không retry — tin tới lúc collector restart
 * mất ở NGUỒN. Spool cục bộ append-only (mỗi tin 1 file, tên = sourceId tương
 * ứng server) + gửi lại khi collector sống lại; dedup server gánh trùng.
 * Kèm: Kev fetch có timeout (treo → p=null), noul không hữu hạn → p=null.
 */

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function fresh(): string {
  return join(tmpdir(), `zc6-${Date.now()}-${Math.random().toString(36).slice(2)}`);
}

type Msg = SpoolMessage;

/** Collector giả: nhận POST, trả 202 khi 'sống', đóng socket khi 'chết'. */
async function fakeCollector(alive: () => boolean, sink: Array<{ group: string; messages: Msg[] }>) {
  const server = createServer((req, res) => {
    if (!alive()) {
      res.socket?.destroy(); // collector đang tắt — kết nối chết như ECONNREFUSED
      return;
    }
    const chunks: Buffer[] = [];
    req.on("data", (c: Buffer) => chunks.push(c));
    req.on("end", () => {
      sink.push(JSON.parse(Buffer.concat(chunks).toString()));
      res.writeHead(202, { "content-type": "application/json" });
      res.end(JSON.stringify({ accepted: 1, duplicates: 0 }));
    });
  });
  await new Promise<void>((d) => server.listen(0, "127.0.0.1", d));
  return { server, url: `http://127.0.0.1:${(server.address() as AddressInfo).port}` };
}

test("ZC6: collector chết khi N tin tới → spool đủ N; sống lại → gửi đủ, không trùng, spool rỗng", async () => {
  const spoolDir = join(fresh(), "spool");
  const sink: Array<{ group: string; messages: Msg[] }> = [];
  let up = false;
  const fc = await fakeCollector(() => up, sink);

  // 3 tin tới lúc collector đang chết
  const msgs: Msg[] = [
    { text: "tin 1 chết collector", ts: "2026-10-23T08:00:00Z" },
    { text: "tin 2 chết collector", ts: "2026-10-23T08:01:00Z" },
    { text: "tin 3 chết collector", ts: "2026-10-23T08:02:00Z", kev: { p: 0.55, model: "kev-latest", threshold: 0.9, at: "2026-10-23T08:02:00Z" } },
  ];
  for (const m of msgs) {
    const ok = await deliverWithSpool({ api: fc.url, key: "k1", spoolDir }, "g", m);
    assert.equal(ok, false, "deliver phải báo fail khi collector chết");
  }
  assert.equal(readdirSync(spoolDir).length, 3, "spool giữ đủ 3 tin");
  const key2 = spoolKey({ group: "g", message: msgs[0] });
  assert.match(key2, /^[0-9a-f]{32}$/, "tên file spool = sourceId server sẽ tính (sha256 32 hex)");

  // collector sống lại, một tin MỚI tới → drain xả đủ cả 3 cũ + đẩy tin mới
  up = true;
  const okNew = await deliverWithSpool({ api: fc.url, key: "k1", spoolDir }, "g", { text: "tin 4 sau khi sống", ts: "2026-10-23T08:05:00Z" });
  assert.equal(okNew, true, "tin mới đẩy thẳng thành công");
  assert.equal(readdirSync(spoolDir).length, 0, "spool rỗng sau drain");

  const got = sink.flatMap((b) => b.messages);
  assert.equal(got.length, 4, "đủ 4 tin (3 spool + 1 mới)");
  assert.deepEqual(
    got.map((m) => m.ts).sort(),
    ["2026-10-23T08:00:00Z", "2026-10-23T08:01:00Z", "2026-10-23T08:02:00Z", "2026-10-23T08:05:00Z"],
    "đúng 4 tin, không trùng lặp",
  );
  assert.deepEqual(got.find((m) => m.ts === "2026-10-23T08:02:00Z")?.kev, msgs[2].kev, "kev đi theo tin qua spool nguyên vẹn");

  // drain lần nữa (spool rỗng) — không gửi thêm gì
  const again = await deliverWithSpool({ api: fc.url, key: "k1", spoolDir }, "g", { text: "tin 5", ts: "2026-10-23T08:06:00Z" });
  assert.equal(again, true);
  assert.equal(sink.flatMap((b) => b.messages).length, 5, "không phát sinh trùng từ spool");

  fc.server.closeAllConnections?.();
  fc.server.close();
});

test("ZC6: spoolPut tin TRÙNG (cùng group|ts|text|sender|media) không nhân file", async () => {
  const { spoolPut } = await import("../core/agent-delivery.js");
  const spoolDir = join(fresh(), "spool");
  const rec = { group: "g", message: { text: "trùng", ts: "2026-10-23T09:00:00Z", senderId: "u1", media: [{ path: null, url: "https://img.zdn.vn/x.jpg", type: "photo" }] } };
  await spoolPut(spoolDir, rec);
  await spoolPut(spoolDir, rec); // gửi lại y hệt — phải idempotent
  assert.equal(readdirSync(spoolDir).length, 1, "1 file cho 1 tin trùng");
});

test("ZC6: Kev treo (không đáp ứng) → kevScore trả null sau timeout, không treo vĩnh viễn", async () => {
  const stuck = createServer(() => {
    /* im lặng mãi */
  });
  await new Promise<void>((d) => stuck.listen(0, "127.0.0.1", d));
  const kevUrl = `http://127.0.0.1:${(stuck.address() as AddressInfo).port}`;
  const t0 = Date.now();
  const p = await kevScore("tin gì đó", { kev: kevUrl, timeoutMs: 400 });
  const elapsed = Date.now() - t0;
  assert.equal(p, null, "treo → p=null (chưa phân loại), không throw");
  assert.ok(elapsed < 2_500, `phải quay về sau timeout (${elapsed}ms)`);
  stuck.closeAllConnections?.();
  stuck.close();
});

test("ZC6: noul không phải số hữu hạn (NaN/Infinity/string) → p=null", async () => {
  const { parseNoul } = await import("../core/agent-delivery.js");
  assert.equal(parseNoul(NaN), null);
  assert.equal(parseNoul(Infinity), null);
  assert.equal(parseNoul("0.9"), null, "string không phải số");
  assert.equal(parseNoul(0.9), 0.9);
  assert.equal(parseNoul(null), null);
});
