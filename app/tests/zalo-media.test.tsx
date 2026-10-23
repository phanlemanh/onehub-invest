// zalo-media.test.tsx — serveZaloMedia (lõi GET /api/zalo-media): ảnh tầng A chỉ admin,
// chế độ snapshot+file trong gốc snapshots, chế độ path cũ của OpenClaw (PR #5).
// Hồ sơ nghiệm thu: _acceptance/review-media-backend (AC-1…AC-4).
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import type { User } from "../src/lib/auth";
import { serveZaloMedia, snapshotMediaUrl } from "../src/lib/ops/zalo-media";

const SNAP = "hcmc__zalo-agent__2026-10-23T000000";
const JPG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3, 4, 5]);
const SECRET = Buffer.from("SECRET-BYTES-KHONG-DUOC-RA");
const user = (role: User["role"]): User => ({ id: "1", email: `${role}@x.vn`, plan: "pro", role });
const ADMIN = user("admin");

let tmp = "";
let env: { HOME?: string; SNAPSHOTS_DIR?: string } = {};

before(() => {
  tmp = mkdtempSync(join(tmpdir(), "zalo-media-"));
  const snapDir = join(tmp, "snapshots", "hcmc", SNAP);
  mkdirSync(join(snapDir, "media"), { recursive: true });
  mkdirSync(join(snapDir, "other"), { recursive: true });
  writeFileSync(join(snapDir, "media", "a.jpg"), JPG);
  writeFileSync(join(snapDir, "media", "note.txt"), SECRET);
  writeFileSync(join(snapDir, "other", "b.jpg"), SECRET);
  writeFileSync(join(snapDir, "manifest.json"), SECRET);
  // Thư mục anh em trùng tiền tố chuỗi + file bí mật ngoài gốc.
  mkdirSync(join(tmp, "snapshots-evil", "hcmc", SNAP, "media"), { recursive: true });
  writeFileSync(join(tmp, "snapshots-evil", "hcmc", SNAP, "media", "a.jpg"), SECRET);
  mkdirSync(join(tmp, "outside"), { recursive: true });
  writeFileSync(join(tmp, "outside", "secret.jpg"), SECRET);
  symlinkSync(join(tmp, "outside", "secret.jpg"), join(snapDir, "media", "evil.jpg"));
  // Symlink tới một thư mục `media/` NGOÀI gốc — chỉ lớp realpath chặn được.
  symlinkSync(join(tmp, "snapshots-evil", "hcmc", SNAP, "media", "a.jpg"), join(snapDir, "media", "evil-media.jpg"));
  // Symlink trong media/ trỏ tới ảnh CÙNG gốc nhưng ngoài media/ — chỉ ràng media/ theo đĩa chặn được.
  symlinkSync(join(snapDir, "other", "b.jpg"), join(snapDir, "media", "to-other.jpg"));
  // HOME giả cho gốc OpenClaw.
  mkdirSync(join(tmp, "home", ".openclaw", "media", "inbound"), { recursive: true });
  writeFileSync(join(tmp, "home", ".openclaw", "media", "inbound", "x.png"), JPG);
  writeFileSync(join(tmp, "home", ".openclaw", "openclaw.json"), SECRET);

  env = { HOME: process.env.HOME, SNAPSHOTS_DIR: process.env.SNAPSHOTS_DIR };
  process.env.HOME = join(tmp, "home");
  process.env.SNAPSHOTS_DIR = join(tmp, "snapshots");
});

after(() => {
  for (const [k, v] of Object.entries(env)) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
  rmSync(tmp, { recursive: true, force: true });
});

const get = (qs: string, u: User | null = ADMIN) =>
  serveZaloMedia(new Request(`http://localhost:3456/api/zalo-media?${qs}`), u);
const snapQs = (snapshot: string, file: string) =>
  `snapshot=${encodeURIComponent(snapshot)}&file=${encodeURIComponent(file)}`;
const bodyOf = async (r: Response) => Buffer.from(await r.arrayBuffer());

test("AC-1 admin lấy được ảnh snapshot: 200, đúng content-type, đúng byte, cache private", async () => {
  const r = await get(snapQs(SNAP, "media/a.jpg"));
  assert.equal(r.status, 200);
  assert.equal(r.headers.get("content-type"), "image/jpeg");
  assert.match(r.headers.get("cache-control") ?? "", /^private/);
  assert.deepEqual(await bodyOf(r), JPG);
  // URL loader dựng ra trỏ đúng route này.
  assert.equal(snapshotMediaUrl(SNAP, "media/a.jpg"), `/api/zalo-media?${snapQs(SNAP, "media/a.jpg")}`);
});

test("AC-1 should-NOT-fire: cùng snapshot mà file không có trên đĩa → 404", async () => {
  const r = await get(snapQs(SNAP, "media/khong-co.jpg"));
  assert.equal(r.status, 404);
});

test("AC-2 không phải admin → 404 ở cả hai chế độ, kể cả file hợp lệ", async () => {
  const okSnap = snapQs(SNAP, "media/a.jpg");
  const okPath = `path=${encodeURIComponent(join(tmp, "home", ".openclaw", "media", "inbound", "x.png"))}`;
  for (const u of [null, user("user"), user("ops")]) {
    for (const qs of [okSnap, okPath]) {
      const r = await get(qs, u);
      assert.equal(r.status, 404, `${u?.role ?? "khách"} ${qs}`);
      assert.equal((await bodyOf(r)).toString(), "not found");
    }
  }
});

test("AC-3 should-NOT-fire: tham số cố ra khỏi vùng cho phép không bao giờ trả byte đích", async () => {
  const cases: Array<[string, string]> = [
    ["snapshot có ..", snapQs(`../snapshots-evil/hcmc/${SNAP}`, "media/a.jpg")],
    ["snapshot chỉ là ..", snapQs("..", "media/a.jpg")],
    ["snapshot có /", snapQs(`hcmc/${SNAP}`, "media/a.jpg")],
    ["file có ..", snapQs(SNAP, "media/../manifest.json")],
    ["file ..jpg lồng", snapQs(SNAP, "media/../../../../outside/secret.jpg")],
    ["file ngoài media/", snapQs(SNAP, "other/b.jpg")],
    ["file lồng sâu trong media/", snapQs(SNAP, "media/x/a.jpg")],
    ["file đường tuyệt đối", snapQs(SNAP, join(tmp, "outside", "secret.jpg"))],
    ["đuôi không phải ảnh", snapQs(SNAP, "media/note.txt")],
    ["symlink trong media/ trỏ ra ngoài", snapQs(SNAP, "media/evil.jpg")],
    ["symlink tới media/ của gốc khác", snapQs(SNAP, "media/evil-media.jpg")],
    ["symlink tới ảnh cùng gốc ngoài media/", snapQs(SNAP, "media/to-other.jpg")],
    ["thiếu file", `snapshot=${encodeURIComponent(SNAP)}`],
    ["thiếu snapshot", `file=${encodeURIComponent("media/a.jpg")}`],
    ["snapshot rỗng", `snapshot=&file=${encodeURIComponent("media/a.jpg")}`],
    ["thiếu mọi tham số", ""],
  ];
  for (const [name, qs] of cases) {
    const r = await get(qs);
    assert.ok([400, 403, 404].includes(r.status), `${name}: status ${r.status}`);
    const body = await bodyOf(r);
    assert.ok(!body.includes(SECRET), `${name}: lộ byte đích`);
    assert.ok(!body.equals(JPG), `${name}: trả ảnh`);
  }
});

test("AC-4 chế độ path cũ: OpenClaw media 200, openclaw.json 403, ảnh gốc snapshots 403", async () => {
  const p = (f: string) => `path=${encodeURIComponent(f)}`;
  const ok = await get(p(join(tmp, "home", ".openclaw", "media", "inbound", "x.png")));
  assert.equal(ok.status, 200);
  assert.equal(ok.headers.get("content-type"), "image/png");
  assert.deepEqual(await bodyOf(ok), JPG);

  const cfg = await get(p(join(tmp, "home", ".openclaw", "openclaw.json")));
  assert.equal(cfg.status, 403);
  assert.ok(!(await bodyOf(cfg)).includes(SECRET));

  const snap = await get(p(join(tmp, "snapshots", "hcmc", SNAP, "media", "a.jpg")));
  assert.equal(snap.status, 403);

  const prefix = await get(p(join(tmp, "home", ".openclaw", "media-evil", "x.png")));
  assert.equal(prefix.status, 403);
});
