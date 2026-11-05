import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { gunzipSync } from "node:zlib";
import { test } from "node:test";

import { createAgentServer } from "../api/server.js";
import { ZALO_AGENT_SCHEMA_VERSION } from "../core/storage.js";

/**
 * ma-album-s03 (E4/AC-4): RawItem.meta.albumMeta giữ nguyên khi hợp lệ; sai
 * dạng → bỏ trường, bài vẫn nhận; không có → item như cũ; manifest kênh S03
 * ghi schemaVersion số kế tiếp (6), kênh khác giữ SNAPSHOT_SCHEMA_VERSION.
 */

function fresh(): string {
  return join(tmpdir(), `album-meta-${Date.now()}-${Math.random().toString(36).slice(2)}`);
}

function snapshotItems(root: string, snapshotId: string) {
  const dir = join(root, "hanoi", snapshotId);
  const manifest = JSON.parse(readFileSync(join(dir, "manifest.json"), "utf8"));
  const out: Array<{ sourceId: string; meta?: Record<string, unknown> }> = [];
  for (const f of manifest.files) {
    if (!(f.name as string).startsWith("items-")) continue;
    out.push(...JSON.parse(gunzipSync(readFileSync(join(dir, f.name))).toString()));
  }
  return { manifest, out };
}

const ALBUM = {
  group_layout_id: "g-456",
  id_in_group: "123",
  total_item_in_group: 3,
  is_group_layout: true,
  child_number: 2,
  msg_type: "chat.photo",
};

test("album-meta: hợp lệ → meta.albumMeta nguyên vẹn; manifest kênh S03 ghi schemaVersion 6", async () => {
  const root = fresh();
  const s = await createAgentServer({ snapshotRoot: root, city: "hanoi", keys: ["k1"] });
  const r = s.ingest({
    agent_id: "openclaw-hook",
    group: "NhomX",
    messages: [
      { text: "anh.jpg", ts: "2026-11-06T05:00:00Z", senderId: "100", albumMeta: { ...ALBUM } },
      { text: "thuờng", ts: "2026-11-06T05:00:01Z" },
      { text: "sai-dạng", ts: "2026-11-06T05:00:02Z", albumMeta: "chuoi" as unknown as Record<string, unknown> },
      { text: "thiếu-khoá", ts: "2026-11-06T05:00:03Z", albumMeta: { group_layout_id: "g" } as unknown as Record<string, unknown> },
    ],
  }, "Bearer k1");
  assert.equal(r.status, 202);
  assert.equal((r.body as { accepted: number }).accepted, 4, "sai dạng KHÔNG làm mất bài");
  const snap = await s.flush();
  const { manifest, out } = snapshotItems(root, snap!.snapshotId);
  assert.equal(manifest.schemaVersion, ZALO_AGENT_SCHEMA_VERSION, "manifest kênh S03 = số kế tiếp");
  assert.equal(manifest.schemaVersion, 6);
  const co = out.find((x) => (x as { payload?: { text?: string } }).payload?.text === "anh.jpg");
  assert.deepEqual(co?.meta?.albumMeta, ALBUM, "meta.albumMeta giữ nguyên");
  const thuong = out.find((x) => x.meta === undefined || !("albumMeta" in (x.meta ?? {})));
  assert.ok(thuong, "tin không albumMeta vẫn vào snapshot");
  const sai = out.filter((x) => x.meta && "albumMeta" in x.meta);
  assert.equal(sai.length, 1, "chỉ tin hợp lệ có albumMeta — sai dạng bị bỏ trường");
});

test("album-meta: không có albumMeta → item như cũ (meta không có khoá mới)", async () => {
  const root = fresh();
  const s = await createAgentServer({ snapshotRoot: root, city: "hanoi", keys: ["k1"] });
  s.ingest({ agent_id: "a", group: "G", messages: [{ text: "x", ts: "2026-11-06T05:01:00Z" }] }, "Bearer k1");
  const snap = await s.flush();
  const { out } = snapshotItems(root, snap!.snapshotId);
  assert.ok(!("albumMeta" in (out[0].meta ?? {})), "không sinh albumMeta");
});
