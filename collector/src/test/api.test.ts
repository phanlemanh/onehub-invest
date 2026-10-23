import { createRequire } from "node:module";
import { strict as assert } from "node:assert";
import { gunzipSync } from "node:zlib";
import { existsSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

import { createAgentServer } from "../api/server.js";

const require = createRequire(import.meta.url);

const BODY = {
  agent_id: "agent-1",
  group: "BĐS Hà Nội",
  messages: [
    { text: "Bán CHCC 2PN 65m² Tây Hồ, 45tr/m², 2.93tỷ. LH 0901234567", ts: "2026-10-19T10:00:00Z" },
    { text: "Bán CHCC 2PN 65m² Tây Hồ, 45tr/m², 2.93tỷ. LH 0901234567", ts: "2026-10-19T10:00:00Z" }, // trùng
    { text: "Cho thuê căn hộ 1PN 40m² Đống Đa, 8tr/tháng", ts: "2026-10-19T10:05:00Z", extracted: { kind: "rent_lt" } },
  ],
};

function fresh() {
  const root = join(tmpdir(), `agent-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  return root;
}

test("ingest: key đúng → 202, đếm accepted vs duplicates", async () => {
  const s = await createAgentServer({ snapshotRoot: fresh(), city: "hanoi", keys: ["k1"] });
  const r = s.ingest(BODY, "Bearer k1");
  assert.equal(r.status, 202);
  assert.equal(r.body.accepted, 2);
  assert.equal(r.body.duplicates, 1);
});

test("ingest: sai key → 401; keys rỗng → 401 mọi request (fail closed)", async () => {
  const s = await createAgentServer({ snapshotRoot: fresh(), city: "hanoi", keys: ["k1"] });
  assert.equal(s.ingest(BODY, "Bearer wrong").status, 401);
  const closed = await createAgentServer({ snapshotRoot: fresh(), city: "hanoi", keys: [] });
  assert.equal(closed.ingest(BODY, "Bearer k1").status, 401);
  assert.equal(closed.ingest(BODY, null).status, 401);
});

test("ingest: thiếu text/ts hoặc messages rỗng → 400, không ghi gì", async () => {
  const root = fresh();
  const s = await createAgentServer({ snapshotRoot: root, city: "hanoi", keys: ["k1"] });
  assert.equal(s.ingest({ agent_id: "a", group: "g", messages: [{ text: "thiếu ts" }] }, "Bearer k1").status, 400);
  assert.equal(s.ingest({ agent_id: "a", group: "g", messages: [] }, "Bearer k1").status, 400);
  assert.equal(s.ingest({ agent_id: "a", group: "g" }, "Bearer k1").status, 400);
  assert.equal(s.ingest("not an object", "Bearer k1").status, 400);
  assert.equal(existsSync(root), false); // chưa flush → chưa ghi gì xuống đĩa
});

test("ingest: sourceId lọc theo tập seen — post lại sau flush vẫn dedup", async () => {
  const root = fresh();
  const s = await createAgentServer({ snapshotRoot: root, city: "hanoi", keys: ["k1"] });
  s.ingest(BODY, "Bearer k1");
  return s.flush().then(() => {
    const r2 = s.ingest(BODY, "Bearer k1"); // cùng 3 message sau khi đã flush
    assert.equal(r2.status, 202);
    assert.equal(r2.body.accepted, 0);
    assert.equal(r2.body.duplicates, 3);
  });
});

test("flush: snapshot items-0001 + manifest sha256 khớp DATA-CONTRACT, source=zalo-agent", async () => {
  const root = fresh();
  const s = await createAgentServer({ snapshotRoot: root, city: "hanoi", keys: ["k1"] });
  s.ingest(BODY, "Bearer k1");
  return s.flush().then((m) => {
    assert.ok(m && m.snapshotId.startsWith("hanoi__zalo-agent__"));
    const dir = join(root, "hanoi", m.snapshotId);
    const manifest = JSON.parse(readFileSync(join(dir, "manifest.json"), "utf8"));
    assert.equal(manifest.schemaVersion, 3);
    assert.equal(manifest.counts.items, 2);
    assert.equal(manifest.source, "zalo-agent");
    const f = manifest.files[0];
    const gz = readFileSync(join(dir, f.name));
    assert.equal(gz.length, f.bytes);
    const { createHash } = require("node:crypto");
    assert.equal(createHash("sha256").update(gz).digest("hex"), f.sha256);
    const items = JSON.parse(gunzipSync(gz).toString());
    assert.equal(items.length, 2);
    assert.equal(items[0].source, "zalo-agent");
    assert.equal(items[0].payload.text, BODY.messages[0].text);
    assert.equal(items[0].payload.extracted, undefined); // extracted chỉ khi agent gửi
    assert.equal(items[1].payload.extracted.kind, "rent_lt"); // nguyên vận khi có
    assert.equal(manifest.coverage.methods.agentReport, 2);
  });
});

test("flush: buffer rỗng → null, không tạo thư mục snapshot", async () => {
  const root = fresh();
  const s = await createAgentServer({ snapshotRoot: root, city: "hanoi", keys: ["k1"] });
  return s.flush().then((m) => {
    assert.equal(m, null);
    assert.equal(existsSync(join(root, "hanoi")), false);
  });
});
