import { strict as assert } from "node:assert";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { gunzipSync } from "node:zlib";
import { test } from "node:test";

import { createAgentServer } from "../api/server.js";

/**
 * Kev-nhãn (claudedp-2310-11): hook đổi BỘ LỌC (bỏ tin p<0.9) thành NHÃN —
 * MỌI tin đẩy vào collector kèm điểm kev; collector ghi nguyên vẹn vào
 * RawItem.meta.kev; p=null (gate down) vẫn nhận tin.
 */

function fresh(): string {
  return join(tmpdir(), `kev-nhan-${Date.now()}-${Math.random().toString(36).slice(2)}`);
}

function snapshotItems(
  root: string,
  snapshotId: string,
): Array<{ sourceId: string; meta: Record<string, unknown> }> {
  const dir = join(root, "hanoi", snapshotId);
  const manifest = JSON.parse(readFileSync(join(dir, "manifest.json"), "utf8"));
  const out = [];
  for (const f of manifest.files) {
    if (!(f.name as string).startsWith("items-")) continue;
    out.push(...JSON.parse(gunzipSync(readFileSync(join(dir, f.name))).toString()));
  }
  return out;
}

test("kev-nhãn: p thấp vẫn nhận 202, meta.kev nguyên vẹn; không kev → meta.kev vắng", async () => {
  const root = fresh();
  const s = await createAgentServer({ snapshotRoot: root, city: "hanoi", keys: ["k1"] });
  const kev = { p: 0.42, model: "kev-latest", threshold: 0.9, at: "2026-10-23T03:00:00Z" };
  const r = s.ingest(
    {
      agent_id: "openclaw-hook",
      group: "g",
      messages: [
        { text: "tin p thấp vẫn phải vào snapshot", ts: "2026-10-23T03:00:00Z", kev },
        { text: "tin không kèm kev", ts: "2026-10-23T03:01:00Z" },
      ],
    },
    "Bearer k1",
  );
  assert.equal(r.status, 202, "p=0.42 không bị từ chối — nhãn, không phải lọc");
  assert.equal(r.body.accepted, 2);
  const m = await s.flush();
  assert.ok(m);
  const items = snapshotItems(root, m.snapshotId);
  assert.equal(items.length, 2);
  const withKev = items.find((i) => (i.meta as { ts?: string }).ts === "2026-10-23T03:00:00Z");
  const noKev = items.find((i) => (i.meta as { ts?: string }).ts === "2026-10-23T03:01:00Z");
  assert.deepEqual(withKev?.meta.kev, kev, "meta.kev giữ nguyên vẹn điểm/model/ngưỡng/thời điểm");
  assert.equal(noKev?.meta.kev, undefined, "tin không kev không sinh meta.kev");
});

test("kev-nhãn: p=null (gate down) vẫn nhận, meta.kev.p = null", async () => {
  const root = fresh();
  const s = await createAgentServer({ snapshotRoot: root, city: "hanoi", keys: ["k1"] });
  const r = s.ingest(
    {
      agent_id: "openclaw-hook",
      group: "g",
      messages: [{ text: "gate chết vẫn phải vào", ts: "2026-10-23T03:02:00Z", kev: { p: null, model: "kev-latest", threshold: 0.9, at: "2026-10-23T03:02:00Z" } }],
    },
    "Bearer k1",
  );
  assert.equal(r.status, 202);
  const m = await s.flush();
  assert.ok(m);
  const items = snapshotItems(root, m.snapshotId);
  assert.equal((items[0].meta.kev as { p: number | null }).p, null);
  assert.ok(existsSync(join(root, "hanoi", m.snapshotId)));
});

test("kev-nhãn: flush tin có kev → manifest khai schemaVersion 3 (PL4, claudedp-2310-11 mở lại)", async () => {
  const root = fresh();
  const s = await createAgentServer({ snapshotRoot: root, city: "hanoi", keys: ["k1"] });
  s.ingest(
    {
      agent_id: "openclaw-hook",
      group: "g",
      messages: [{ text: "manifest phải là v3", ts: "2026-10-23T03:03:00Z", kev: { p: 0.91, model: "kev-latest", threshold: 0.9, at: "2026-10-23T03:03:00Z" } }],
    },
    "Bearer k1",
  );
  const m = await s.flush();
  assert.ok(m);
  const manifest = JSON.parse(readFileSync(join(root, "hanoi", m.snapshotId, "manifest.json"), "utf8"));
  assert.equal(manifest.schemaVersion, 3, "hợp đồng DATA-CONTRACT v3 — bộ ghi phải khai đúng");
  const items = snapshotItems(root, m.snapshotId);
  assert.ok((items[0].meta as { kev?: unknown }).kev, "items có meta.kev");
});

test("ZC1: hai tin CHỈ ẢNH cùng nhóm cùng ts → 2 RawItem; tin chữ giữ nguyên sourceId cũ", async () => {
  const root = fresh();
  const s = await createAgentServer({ snapshotRoot: root, city: "hanoi", keys: ["k1"] });
  // tin chữ — phải giữ nguyên công thức cũ sha256(group|ts|text)
  const r1 = s.ingest(
    {
      agent_id: "openclaw-hook",
      group: "g",
      messages: [{ text: "tin chữ bình thường", ts: "2026-10-23T04:00:00Z", senderId: "u1", media: [{ url: null, path: "/p/a.jpg", type: "photo" }] }],
    },
    "Bearer k1",
  );
  assert.equal(r1.status, 202);
  assert.equal(r1.body.accepted, 1);
  const crypto = await import("node:crypto");
  const legacyId = crypto.createHash("sha256").update("g|2026-10-23T04:00:00Z|tin chữ bình thường").digest("hex").slice(0, 32);

  // hai tin media-only text rỗng, cùng nhóm, cùng ts, URL ảnh khác nhau
  const r2 = s.ingest(
    {
      agent_id: "openclaw-hook",
      group: "g",
      messages: [
        { text: "", ts: "2026-10-23T04:01:00Z", senderId: "moi-gioi-a", media: [{ url: "https://img.zdn.vn/a.jpg", type: "photo" }] },
        { text: "", ts: "2026-10-23T04:01:00Z", senderId: "moi-gioi-a", media: [{ url: "https://img.zdn.vn/b.jpg", type: "photo" }] },
      ],
    },
    "Bearer k1",
  );
  assert.equal(r2.status, 202);
  assert.equal(r2.body.accepted, 2, "hai tin ảnh phải thành 2 RawItem — không bị dedup");

  const m = await s.flush();
  assert.ok(m);
  const items = snapshotItems(root, m.snapshotId);
  assert.equal(items.length, 3);
  const chu = items.find((i) => i.meta.ts === "2026-10-23T04:00:00Z");
  assert.equal((chu as { sourceId: string }).sourceId, legacyId, "tin chữ giữ nguyên sourceId công thức cũ");
  const anhIds = items.filter((i) => i.meta.ts === "2026-10-23T04:01:00Z").map((i) => (i as { sourceId: string }).sourceId);
  assert.equal(new Set(anhIds).size, 2, "hai tin ảnh có sourceId khác nhau");
});
