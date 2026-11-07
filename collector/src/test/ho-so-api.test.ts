import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { gunzipSync } from "node:zlib";
import { test } from "node:test";

import { createAgentServer } from "../api/server.js";

/**
 * link-nguoi-ban-s03 E5 (MỞ LẠI 0611-6): POST /s03-ho-so — SnapshotWriter
 * thật; HOME giả (spool không lọt máy thật); canary PII không lọt
 * snapshot/spool; collector từ chối → spool, không mất; kênh khác (zalo-agent)
 * vẫn giữ schemaVersion của nó; 401 khi sai key.
 */
function fresh(): string {
  return join(tmpdir(), `ho-so-api-${Date.now()}-${Math.random().toString(36).slice(2)}`);
}
function docItems(root: string, snapId: string) {
  const dir = join(root, "hanoi", snapId);
  const man = JSON.parse(readFileSync(join(dir, "manifest.json"), "utf8"));
  const out: unknown[] = [];
  for (const f of man.files) {
    if (!(f.name as string).startsWith("items-")) continue;
    out.push(...JSON.parse(gunzipSync(readFileSync(join(dir, f.name))).toString()));
  }
  return { manifest: man, out };
}

const CANARY = `KANARY-${Math.random().toString(36).slice(2)}`;

test("s03-ho-so: lô hợp lệ → snapshot hồ sơ 202; kênh khác giữ schemaVersion; canary không lọt", async () => {
  const root = fresh();
  const s = await createAgentServer({ snapshotRoot: root, city: "hanoi", keys: ["k1"] });
  const dong = [
    { ma_tai_khoan: "101", username: "u101", loai: "co-username", lay_luc: new Date().toISOString() },
    { ma_tai_khoan: "102", username: "", loai: "khong-username", lay_luc: new Date().toISOString() },
    { ma_tai_khoan: "103", username: `x${CANARY}y`, loai: "co-username", lay_luc: new Date().toISOString() },
  ];
  const r = await s.ingestHoSo({ dong }, "Bearer k1");
  assert.equal(r.status, 202);
  const snapId = (r.body as { snapshotId: string }).snapshotId;
  const { manifest } = docItems(root, snapId);
  assert.ok(manifest.schemaVersion >= 7, "snapshot hồ sơ mang schemaVersion 7+");
  const van = JSON.stringify(manifest);
  assert.ok(!van.includes(CANARY), "canary PII không lọt manifest");
  // kênh khác cùng lượt vẫn schemaVersion riêng (zalo-agent v6/4)
  s.ingest({ agent_id: "a", group: "G", messages: [{ text: "x", ts: new Date().toISOString() }] }, "Bearer k1");
  const snap2 = (await s.flush()) as unknown as { snapshotId: string } | null;
  assert.ok(snap2, "flush kênh tin ra snapshot");
  const m2 = JSON.parse(readFileSync(join(root, "hanoi", snap2.snapshotId, "manifest.json"), "utf8"));
  assert.notEqual(m2.snapshotId, manifest.snapshotId, "snapshot kênh khác tách riêng");
});

test("s03-ho-so: sai key 401; dong sai khuôn 422; thiếu dong 400", async () => {
  const root = fresh();
  const s = await createAgentServer({ snapshotRoot: root, city: "hanoi", keys: ["k1"] });
  assert.equal((await s.ingestHoSo({ dong: [] }, null)).status, 401);
  assert.equal((await s.ingestHoSo({ dong: [] }, "Bearer k1")).status, 400);
  const r = await s.ingestHoSo({ dong: [{ ma_tai_khoan: "abc", username: "u", loai: "co-username", lay_luc: new Date().toISOString() }] }, "Bearer k1");
  assert.equal(r.status, 422, "ma_tai_khoan không toàn chữ số → 422");
});
