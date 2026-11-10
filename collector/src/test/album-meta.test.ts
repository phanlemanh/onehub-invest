import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { gunzipSync } from "node:zlib";
import { test } from "node:test";

import { createAgentServer } from "../api/server.js";
import { KENH_TIN_SCHEMA_VERSION } from "../core/storage.js";

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
      { text: "khoa-la", ts: "2026-11-06T05:00:04Z", albumMeta: { group_layout_id: "g2", id_in_group: "9", khoa_la: "bỏ", width: 999 } as unknown as Record<string, unknown> },
    ],
  }, "Bearer k1");
  assert.equal(r.status, 202);
  assert.equal((r.body as { accepted: number }).accepted, 5, "sai dạng KHÔNG làm mất bài");
  const snap = await s.flush();
  const { manifest, out } = snapshotItems(root, snap!.snapshotId);
  assert.equal(manifest.schemaVersion, KENH_TIN_SCHEMA_VERSION, "manifest kênh S03 = số kế tiếp");
  assert.equal(manifest.schemaVersion, 6);
  const co = out.find((x) => (x as { payload?: { text?: string } }).payload?.text === "anh.jpg");
  assert.deepEqual(co?.meta?.albumMeta, ALBUM, "meta.albumMeta giữ nguyên");
  const thuong = out.find((x) => x.meta === undefined || !("albumMeta" in (x.meta ?? {})));
  assert.ok(thuong, "tin không albumMeta vẫn vào snapshot");
  const sai = out.filter((x) => x.meta && "albumMeta" in x.meta);
  assert.equal(sai.length, 2, "tin hợp lệ có albumMeta — sai dạng bị bỏ trường");
  const khoaLa = sai.find((x) => (x as { payload?: { text?: string } }).payload?.text === "khoa-la");
  const amKl = (khoaLa?.meta?.albumMeta ?? {}) as Record<string, unknown>;
  assert.ok(!("khoa_la" in amKl) && !("width" in amKl) && amKl.group_layout_id === "g2" && amKl.id_in_group === "9", "khoá lạ bị bỏ, 6 khoá hợp lệ giữ");
});

test("album-meta: không có albumMeta → item như cũ (meta không có khoá mới)", async () => {
  const root = fresh();
  const s = await createAgentServer({ snapshotRoot: root, city: "hanoi", keys: ["k1"] });
  s.ingest({ agent_id: "a", group: "G", messages: [{ text: "x", ts: "2026-11-06T05:01:00Z" }] }, "Bearer k1");
  const snap = await s.flush();
  const { out } = snapshotItems(root, snap!.snapshotId);
  assert.ok(!("albumMeta" in (out[0].meta ?? {})), "không sinh albumMeta");
});
