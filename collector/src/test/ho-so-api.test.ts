import { strict as assert } from "node:assert";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { gunzipSync } from "node:zlib";
import { test } from "node:test";

import { createAgentServer, ZALO_AGENT_SCHEMA_VERSION } from "../api/server.js";

/**
 * link-nguoi-ban-s03 E5 (MỞ LẠI 0611-6; U1 điểm 5): POST /s03-ho-so —
 * SnapshotWriter thật; canary PII nhét vào TẤT CẢ trường phải bỏ (tên, SĐT,
 * ảnh, ngày sinh, error_message, cookie) phải vắng trong items snapshot;
 * đối chứng dương: username hợp lệ vẫn còn; collector từ chối (422) thì
 * KHÔNG sinh snapshot hồ sơ (phần giữ-để-phát-lại thuộc bộ tra, kiểm vitest
 * trong .patch); kênh tin giữ schemaVersion đúng HẰNG kênh; 401 sai key.
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
function soSnapHoSo(root: string): number {
  const dir = join(root, "hanoi");
  if (!existsSync(dir)) return 0; // chưa từng ghi → đương nhiên 0 snapshot
  return readdirSync(dir).filter((d) => d.includes("__s03-ho-so__")).length;
}

const CANARY = `KANARY-${Math.random().toString(36).slice(2)}`;

test("s03-ho-so: lô hợp lệ → 202; canary ở trường PHẢI BỎ vắng trong items; đối chứng dương username còn", async () => {
  const root = fresh();
  const s = await createAgentServer({ snapshotRoot: root, city: "hanoi", keys: ["k1"] });
  const dong = [
    {
      ma_tai_khoan: "101", username: "u101", loai: "co-username", lay_luc: new Date().toISOString(),
      // U1(5): canary nhét vào MỌI trường phải bỏ — không được lọt items snapshot
      ten: `TEN_${CANARY}`, sdt: `SDT_${CANARY}`, anh: `ANH_${CANARY}`,
      ngay_sinh: `SINH_${CANARY}`, error_message: `LOI_${CANARY}`, cookie: `zpw_en=${CANARY}`,
    },
    { ma_tai_khoan: "102", username: "", loai: "khong-username", lay_luc: new Date().toISOString() },
  ];
  const r = await s.ingestHoSo({ dong }, "Bearer k1");
  assert.equal(r.status, 202);
  const snapId = (r.body as { snapshotId: string }).snapshotId;
  const { manifest, out } = docItems(root, snapId);
  assert.ok(manifest.schemaVersion >= 7, "snapshot hồ sơ mang schemaVersion 7+");
  const vanItems = JSON.stringify(out);
  assert.ok(!vanItems.includes(CANARY), `canary PII (ten/sdt/anh/ngay_sinh/error_message/cookie) không lọt items: ${vanItems.slice(0, 200)}`);
  assert.ok(!JSON.stringify(manifest).includes(CANARY), "canary không lọt manifest");
  // đối chứng dương: username hợp lệ VẪN còn trong items (lọc không bỏ lố)
  assert.ok(out.some((it) => (it as { payload?: { username?: string } }).payload?.username === "u101"),
    "username hợp lệ còn nguyên trong items");
  assert.equal((out[0] as { payload?: Record<string, unknown> }).payload?.ten, undefined, "trường lạ ten bị bỏ khỏi payload");
  // kênh khác cùng lượt giữ schemaVersion đúng HẰNG của kênh (U1(5): so với hằng)
  s.ingest({ agent_id: "a", group: "G", messages: [{ text: "x", ts: new Date().toISOString() }] }, "Bearer k1");
  const snap2 = (await s.flush()) as unknown as { snapshotId: string } | null;
  assert.ok(snap2, "flush kênh tin ra snapshot");
  const m2 = JSON.parse(readFileSync(join(root, "hanoi", snap2.snapshotId, "manifest.json"), "utf8"));
  assert.notEqual(m2.snapshotId, manifest.snapshotId, "snapshot kênh khác tách riêng");
  assert.equal(m2.schemaVersion, ZALO_AGENT_SCHEMA_VERSION, "kênh tin dùng đúng hằng ZALO_AGENT_SCHEMA_VERSION");
});

test("s03-ho-so: sai key 401; dong sai khuôn 422 → KHÔNG sinh snapshot hồ sơ; thiếu dong 400", async () => {
  const root = fresh();
  const s = await createAgentServer({ snapshotRoot: root, city: "hanoi", keys: ["k1"] });
  assert.equal((await s.ingestHoSo({ dong: [] }, null)).status, 401);
  assert.equal((await s.ingestHoSo({ dong: [] }, "Bearer k1")).status, 400);
  const r = await s.ingestHoSo({ dong: [{ ma_tai_khoan: "abc", username: "u", loai: "co-username", lay_luc: new Date().toISOString() }] }, "Bearer k1");
  assert.equal(r.status, 422, "ma_tai_khoan không toàn chữ số → 422");
  // U1(5): collector từ chối thì KHÔNG ghi gì xuống đĩa — dữ liệu chỉ sống
  // lại ở SPOOL phía bộ tra (phatLaiSpool, kiểm vitest trong .patch)
  assert.equal(soSnapHoSo(root), 0, "lô bị từ chối không sinh snapshot s03-ho-so");
});
