import { strict as assert } from "node:assert";
import { createServer } from "node:http";
import { existsSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { gunzipSync } from "node:zlib";
import { test } from "node:test";

import { createAgentServer } from "../api/server.js";

/**
 * Seen-cap 5000 (claudedp-2510-2): vòng cap cũ trong flush() đếm trùng
 * seen + newIds và chỉ xoá seen, nên một lượt flush với >5000 id mới xoá
 * seen tới rỗng rồi quay vô hạn — chặn event loop, SIGTERM không chạy,
 * launchd không restart. Ở đây: lượt flush lớn phải kết thúc nhanh, state
 * giữ đúng 5000 id MỚI NHẤT, và dedup sau hai lượt vẫn đúng với id gần.
 */

const TS = "2026-10-25T00:00:00Z";

function fresh(): { root: string; state: string } {
  const base = join(tmpdir(), `seen-cap-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  return { root: join(base, "snap"), state: join(base, "state") };
}

/** Lô n tin, text `tin-<số thứ tự>` — mỗi tin một sourceId duy nhất. */
function batch(n: number, offset = 0) {
  return {
    agent_id: "agent-1",
    group: "G",
    messages: Array.from({ length: n }, (_, i) => ({
      text: `tin ${offset + i + 1}`,
      ts: TS,
    })),
  };
}

function one(text: string) {
  return { agent_id: "agent-1", group: "G", messages: [{ text, ts: TS }] };
}

/** Đọc sourceIds của mọi item trong snapshot vừa ghi, theo thứ tự file. */
async function snapshotIds(root: string, city: string, snapshotId: string): Promise<string[]> {
  const manifest = JSON.parse(
    readFileSync(join(root, city, snapshotId, "manifest.json"), "utf8"),
  );
  const ids: string[] = [];
  for (const f of manifest.files) {
    if (!(f.name as string).startsWith("items-")) continue;
    const items = JSON.parse(
      gunzipSync(readFileSync(join(root, city, snapshotId, f.name))).toString(),
    );
    for (const it of items) ids.push(it.sourceId as string);
  }
  return ids;
}

function readState(stateDir: string): string[] {
  return JSON.parse(readFileSync(join(stateDir, "agent-seen.json"), "utf8"));
}

test("flush 6000 id mới: kết thúc <1s, state giữ đúng 5000 id MỚI NHẤT", async () => {
  const { root, state } = fresh();
  const s = await createAgentServer({
    snapshotRoot: root,
    stateDir: state,
    city: "hanoi",
    keys: ["k1"],
    flushAfterItems: 10_000,
  });
  s.ingest(batch(6000), "Bearer k1");
  const t0 = Date.now();
  const m = await s.flush();
  const ms = Date.now() - t0;
  assert.ok(m, "flush phải ghi snapshot");
  assert.ok(ms < 1000, `flush 6000 id phải kết thúc <1s (thực tế ${ms}ms)`);

  const ids = await snapshotIds(root, "hanoi", m.snapshotId);
  assert.equal(ids.length, 6000);
  const persisted = readState(state);
  assert.equal(persisted.length, 5000);
  // 5000 id MỚI NHẤT = đúng 1000 id cuối bị bỏ, giữ nguyên thứ tự ingest
  assert.deepEqual(persisted, ids.slice(1000));
});

test("4000 + 2000 qua hai lượt flush: dedup vẫn đúng với id gần nhất", async () => {
  const { root, state } = fresh();
  const s = await createAgentServer({
    snapshotRoot: root,
    stateDir: state,
    city: "hanoi",
    keys: ["k1"],
    flushAfterItems: 10_000,
  });

  s.ingest(batch(4000), "Bearer k1");
  const m1 = await s.flush();
  assert.ok(m1);
  const ids1 = await snapshotIds(root, "hanoi", m1.snapshotId);
  assert.equal(readState(state).length, 4000);

  s.ingest(batch(2000, 4000), "Bearer k1");
  const m2 = await s.flush();
  assert.ok(m2);
  const ids2 = await snapshotIds(root, "hanoi", m2.snapshotId);
  const persisted = readState(state);
  assert.equal(persisted.length, 5000);
  // 1000 id cũ nhất của lượt 1 rơi khỏi cửa sổ; mọi id của lượt 2 còn nguyên
  assert.deepEqual(persisted, [...ids1.slice(1000), ...ids2]);

  // post lại cả lô 2000 vừa flush → dedup hết (id gần nhất còn trong seen)
  const again = s.ingest(batch(2000, 4000), "Bearer k1");
  assert.equal(again.body.accepted, 0);
  assert.equal(again.body.duplicates, 2000);

  // tin ĐẦU lượt 1 đã trượt khỏi cửa sổ 5000 → được nhận lại như tin mới
  const replay = s.ingest(one("tin 1"), "Bearer k1");
  assert.equal(replay.body.accepted, 1);
  assert.equal(replay.body.duplicates, 0);
});

test("HTTP trần lô: >1000 tin/lô → 413 rõ ràng; đúng 1000 → 202", async () => {
  const { root } = fresh();
  const s = await createAgentServer({
    snapshotRoot: root,
    city: "hanoi",
    keys: ["k1"],
    flushAfterItems: 10_000,
  });
  const http = createServer((req, res) => {
    s.handle(req, res).catch(() => {});
  });
  await new Promise<void>((done) => http.listen(0, "127.0.0.1", done));
  const port = (http.address() as { port: number }).port;

  const post = (body: unknown) =>
    fetch(`http://127.0.0.1:${port}/agent-report`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: "Bearer k1" },
      body: JSON.stringify(body),
    });

  try {
    const tooBig = await post(batch(1001));
    assert.equal(tooBig.status, 413);
    const err = (await tooBig.json()) as { error: string };
    assert.match(err.error, /1001 tin vượt trần 1000 tin mỗi lô/);
    assert.equal(existsSync(join(root, "hanoi")), false); // không ghi gì

    const ok = await post(batch(1000));
    assert.equal(ok.status, 202);
    const body = (await ok.json()) as { accepted: number };
    assert.equal(body.accepted, 1000);
  } finally {
    http.close();
  }
});
