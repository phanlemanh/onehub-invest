import { strict as assert } from "node:assert";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

import { createAgentServer } from "../api/server.js";

/**
 * ZC1 nối tiếp (claudedp-2310-6): cứng hoá ingest — media hỏng (không phải
 * mảng / chứa null / phần tử rác) làm CẢ LÔ 500 thay vì bỏ qua; URL media cần
 * sort trước khi băm (thứ tự không ổn định làm 2 tin trùng nhau ra 2 id);
 * chuẩn hoá url/path; trim text toàn khoảng trắng.
 */

function fresh(): string {
  return join(tmpdir(), `zc1cung-${Date.now()}-${Math.random().toString(36).slice(2)}`);
}

test("media hỏng (string/null/phần tử null) không làm 500 — lô vẫn nhận tin lành", async () => {
  const s = await createAgentServer({ snapshotRoot: fresh(), city: "hanoi", keys: ["k1"] });
  const r = s.ingest(
    {
      agent_id: "a",
      group: "g",
      messages: [
        { text: "tin media=null", ts: "2026-10-23T10:00:00Z", media: null },
        { text: "tin media=string", ts: "2026-10-23T10:01:00Z", media: "not-array" },
        { text: "tin media có null", ts: "2026-10-23T10:02:00Z", media: [null, { url: "https://img.zdn.vn/a.jpg" }, { junk: 1 }] },
        { text: "tin media rác toàn phần", ts: "2026-10-23T10:03:00Z", media: [null, 42, "x"] },
        // ca 500 THẬT: text rỗng → sourceId băm media → .map trên string/null
        { text: "", ts: "2026-10-23T10:04:00Z", senderId: "u9", media: "not-array" },
        { text: "", ts: "2026-10-23T10:05:00Z", senderId: "u9", media: [null, 42] },
      ],
    },
    "Bearer k1",
  );
  assert.equal(r.status, 202, "không 500 — ingest phải sống qua media hỏng");
  assert.equal(r.body.accepted, 6, "cả 6 tin đều vào (media hỏng bị bỏ, tin vẫn nhận)");
});

test("sort URL trước băm: cùng tin gửi lại với media đảo thứ tự → dedup (1 id)", async () => {
  const s = await createAgentServer({ snapshotRoot: fresh(), city: "hanoi", keys: ["k1"] });
  const a = s.ingest(
    {
      agent_id: "a",
      group: "g",
      messages: [{ text: "", ts: "2026-10-23T11:00:00Z", senderId: "u1", media: [{ url: "https://img.zdn.vn/a.jpg" }, { url: "https://img.zdn.vn/b.jpg" }] }],
    },
    "Bearer k1",
  );
  const b = s.ingest(
    {
      agent_id: "a",
      group: "g",
      messages: [{ text: "", ts: "2026-10-23T11:00:00Z", senderId: "u1", media: [{ url: "https://img.zdn.vn/b.jpg" }, { url: "https://img.zdn.vn/a.jpg" }] }],
    },
    "Bearer k1",
  );
  assert.equal(a.body.accepted, 1);
  assert.equal(b.body.accepted, 0, "thứ tự URL đảo không tạo id mới");
  assert.equal(b.body.duplicates, 1);
});

test("chuẩn hoá url/path: query/fragment rác / whitespace không tạo id khác", async () => {
  const s = await createAgentServer({ snapshotRoot: fresh(), city: "hanoi", keys: ["k1"] });
  const a = s.ingest(
    {
      agent_id: "a",
      group: "g",
      messages: [{ text: "", ts: "2026-10-23T11:30:00Z", senderId: "u1", media: [{ url: " https://img.zdn.vn/a.jpg " }] }],
    },
    "Bearer k1",
  );
  const b = s.ingest(
    {
      agent_id: "a",
      group: "g",
      messages: [{ text: "", ts: "2026-10-23T11:30:00Z", senderId: "u1", media: [{ url: "https://img.zdn.vn/a.jpg?" }] }],
    },
    "Bearer k1",
  );
  assert.equal(a.body.accepted, 1);
  assert.equal(b.body.duplicates, 1, "query rỗng + whitespace trim ra cùng id");
});

test("trim text toàn khoảng trắng → coi là media-only (text rỗng), không 500", async () => {
  const s = await createAgentServer({ snapshotRoot: fresh(), city: "hanoi", keys: ["k1"] });
  const r = s.ingest(
    {
      agent_id: "a",
      group: "g",
      messages: [{ text: "   \n\t  ", ts: "2026-10-23T12:00:00Z", senderId: "u1", media: [{ url: "https://img.zdn.vn/z.jpg" }] }],
    },
    "Bearer k1",
  );
  assert.equal(r.status, 202);
  assert.equal(r.body.accepted, 1);
});

test("GIỮ id tin chữ cũ: text có nội dung băm đúng công thức legacy", async () => {
  const s = await createAgentServer({ snapshotRoot: fresh(), city: "hanoi", keys: ["k1"] });
  s.ingest({ agent_id: "a", group: "g", messages: [{ text: "tin chữ", ts: "2026-10-23T12:30:00Z" }] }, "Bearer k1");
  const { createHash } = await import("node:crypto");
  const legacy = createHash("sha256").update("g|2026-10-23T12:30:00Z|tin chữ").digest("hex").slice(0, 32);
  const again = s.ingest({ agent_id: "a", group: "g", messages: [{ text: "tin chữ", ts: "2026-10-23T12:30:00Z" }] }, "Bearer k1");
  assert.equal(again.body.duplicates, 1, "khớp id legacy → dedup");
});

test("MỞ LẠI 2310-6: tin chữ ' abc ' (khoảng trắng 2 đầu) GIỮ id legacy; payload NGUYÊN VẸN; text không chuỗi không 500", async () => {
  const { createHash } = await import("node:crypto");
  const s = await createAgentServer({ snapshotRoot: fresh(), city: "hanoi", keys: ["k1"] });
  // a) tin chữ có khoảng trắng: trim CHỈ để quyết định media-only — băm bằng text NGUYÊN BẢN
  const r1 = s.ingest({ agent_id: "a", group: "g", messages: [{ text: "  abc  ", ts: "2026-10-24T01:00:00Z" }] }, "Bearer k1");
  assert.equal(r1.status, 202);
  const legacy = createHash("sha256").update("g|2026-10-24T01:00:00Z|  abc  ").digest("hex").slice(0, 32);
  const again = s.ingest({ agent_id: "a", group: "g", messages: [{ text: "  abc  ", ts: "2026-10-24T01:00:00Z" }] }, "Bearer k1");
  assert.equal(again.body.duplicates, 1, "khớp id legacy (băm text nguyên bản) → dedup");

  // b) payload nguyên vẹn: media rác + text thừa khoảng trắng giữ đúng như gửi
  const root = fresh();
  const s2 = await createAgentServer({ snapshotRoot: root, city: "hanoi", keys: ["k1"] });
  s2.ingest({ agent_id: "a", group: "g", messages: [{ text: "  xyz  ", ts: "2026-10-24T01:01:00Z", media: [null, 42, "rác"] }] }, "Bearer k1");
  const m = await s2.flush();
  assert.ok(m);
  const { gunzipSync } = await import("node:zlib");
  const { readFileSync, readdirSync } = await import("node:fs");
  const { join: j } = await import("node:path");
  const dir = j(root, "hanoi", m.snapshotId);
  const itemsFile = readdirSync(dir).find((f) => f.startsWith("items-"))!;
  const items = JSON.parse(gunzipSync(readFileSync(j(dir, itemsFile))).toString());
  assert.equal(items[0].payload.text, "  xyz  ", "payload.text NGUYÊN BẢN (trim chỉ để quyết media-only)");
  assert.deepEqual(items[0].payload.media, [null, 42, "rác"], "payload.media nguyên vẹn — chuẩn hoá chỉ nằm ở pipeline");
  assert.equal(items[0].sourceId, createHash("sha256").update("g|2026-10-24T01:01:00Z|  xyz  ").digest("hex").slice(0, 32), "băm text nguyên bản");

  // c) m.text không phải chuỗi (null/số) → không 500, không crash cả lô
  const r3 = s.ingest({ agent_id: "a", group: "g", messages: [{ text: null, ts: "2026-10-24T01:02:00Z" }] } as never, "Bearer k1");
  assert.equal(r3.status, 400, "text null → 400 rõ ràng, không 500");
  const r4 = s.ingest({ agent_id: "a", group: "g", messages: [{ text: 123, ts: "2026-10-24T01:03:00Z" }] } as never, "Bearer k1");
  assert.equal(r4.status, 400, "text số → 400, không 500");
});

test("MỞ LẠI 2310-6 vòng 2: url không phải chuỗi ({url:5},{url:{}}) không 500; url rỗng + path khác nhau = 2 tin", async () => {
  const s = await createAgentServer({ snapshotRoot: fresh(), city: "hanoi", keys: ["k1"] });
  // (1) url là SỐ/object nhưng path là chuỗi → trước đây m.url ?? m.path → 5.trim() TypeError → 500
  const r1 = s.ingest(
    {
      agent_id: "a", group: "g",
      messages: [{ text: "", ts: "2026-10-24T02:00:00Z", senderId: "u1", media: [{ url: 5, path: "/a.jpg" }] }],
    } as never,
    "Bearer k1",
  );
  assert.equal(r1.status, 202, "url=5 (số) không được 500 — path chuỗi được dùng cho băm");
  const r2 = s.ingest(
    {
      agent_id: "a", group: "g",
      messages: [{ text: "", ts: "2026-10-24T02:01:00Z", senderId: "u1", media: [{ url: {}, path: "/b.jpg" }] }],
    } as never,
    "Bearer k1",
  );
  assert.equal(r2.status, 202, "url={} không được 500");

  // (2) url rỗng + path khác nhau, cùng nhóm/ts/sender → PHẢI 2 RawItem khác id
  const r3 = s.ingest(
    {
      agent_id: "a", group: "g",
      messages: [
        { text: "", ts: "2026-10-24T02:02:00Z", senderId: "u2", media: [{ url: "", path: "/a.jpg" }] },
        { text: "", ts: "2026-10-24T02:02:00Z", senderId: "u2", media: [{ url: "", path: "/b.jpg" }] },
      ],
    },
    "Bearer k1",
  );
  assert.equal(r3.status, 202);
  assert.equal(r3.body.accepted, 2, "hai tin url rỗng + path khác nhau = 2 RawItem (trước đây gộp 1 vì url rỗng che path)");
});
