// E2/AC-2 (ma-album-s03): đưa canonical của AC-1 qua đúng
// toInternalMessageReceivedContext của RUNTIME PHÁT HÀNH ĐANG CHẠY (không
// phải bản ~/dev) — chứng minh media[].albumMeta tới nguyên vẹn tới handler
// (internal hook), mẫu không khoá đủ trường cũ. Ca «bộ chiếu giả làm rơi»:
// một mapper giả bỏ mục media phải bị phép kiểm BẮT (kỳ vọng dương của phép
// phát hiện). In phiên bản runtime dùng. Chạy bằng bun nếu có (gateway chạy
// bun — Notes hồ sơ), node nếu không; runtime in ra cuối.
import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const RUNTIME_DIR = process.env.OPENCLAW_RUNTIME_DIR
  ?? `${process.env.HOME}/.openclaw/runtime/current`;
const MAPPER_GLOB = "message-hook-mappers-*.mjs";

// tìm mapper trong dist runtime phát hành
import { readdirSync } from "node:fs";
const distDir = join(RUNTIME_DIR, "lib/node_modules/openclaw/dist");
const mapperFile = readdirSync(distDir).find((f) => new RegExp(`^${MAPPER_GLOB.replace("*", ".*")}$`).test(f));
assert.ok(mapperFile, `không tìm thấy ${MAPPER_GLOB} trong ${distDir}`);
const mapper = await import(join(distDir, mapperFile));
// export 'a' = toInternalMessageReceivedContext (bản 2026.10.5 đã đối chiếu)
const toInternal = mapper.a ?? mapper.toInternalMessageReceivedContext;
assert.ok(typeof toInternal === "function", "mapper không xuất toInternalMessageReceivedContext");

// phiên bản runtime đang chạy (in ra theo yêu cầu AC-2)
const runtimeVersion = JSON.parse(readFileSync(join(RUNTIME_DIR, "lib/node_modules/openclaw/package.json"), "utf8")).version;
const runtimeKind = typeof Bun !== "undefined" ? `bun ${Bun.version}` : `node ${process.version}`;

// canonical đúng như monitor SAU VÁ (AC-1) dựng cho tin ảnh album:
const ALBUM_META = {
  group_layout_id: "g-456",
  id_in_group: "123",
  total_item_in_group: 3,
  is_group_layout: true,
  child_number: 2,
  msg_type: "chat.photo",
};
const canonicalAlbum = {
  channelId: "zalouser",
  accountId: "default",
  conversationId: "200",
  threadId: "200",
  from: "zalouser:group:200",
  content: "https://cdn.example/anh.jpg",
  isGroup: true,
  groupId: "200",
  channelName: "N",
  timestamp: 1793328800000,
  messageId: "m1",
  senderId: "100",
  senderName: "S",
  media: [{ albumMeta: { ...ALBUM_META } }],
};
const canonicalKhongKhoa = { ...canonicalAlbum, media: undefined };
delete canonicalKhongKhoa.media;

// phép kiểm dùng lại cho mapper thật lẫn mapper giả
function kiemTra(ev) {
  assert.ok(ev, "bộ chiếu trả undefined");
  assert.equal(ev.content, "https://cdn.example/anh.jpg", "content tới");
  assert.equal(ev.metadata?.senderName, "S", "metadata.senderName tới (trường cũ)");
  assert.equal(ev.metadata?.senderId, "100", "metadata.senderId tới (trường cũ)");
  assert.ok(Array.isArray(ev.media), "media là mảng");
  const m0 = ev.media[0];
  assert.ok(m0 && typeof m0 === "object", "media[0] là object");
  assert.deepEqual(m0.albumMeta, ALBUM_META, "media[0].albumMeta NGUYÊN VẸN");
  assert.ok(!("albumMeta" in (ev.metadata ?? {})), "không lọt metadata.albumMeta");
}

test(`E2: mapper runtime ${runtimeVersion} (${runtimeKind}) — albumMeta qua internal context`, () => {
  const ev = toInternal(canonicalAlbum);
  kiemTra(ev);
  // mẫu KHÔNG khoá: đủ trường cũ, không có media
  const ev2 = toInternal(canonicalKhongKhoa);
  assert.equal(ev2.content, "https://cdn.example/anh.jpg");
  assert.equal(ev2.metadata?.senderName, "S");
  assert.ok(ev2.media === undefined || ev2.media.length === 0, "không sinh media khi canonical không có");
});

test("E2: bộ chiếu GIẢ làm rơi mục media — phép kiểm PHẢI BẮT được", () => {
  const mapperGia = (c) => { const { media, ...rest } = c; return toInternal(rest); };
  assert.throws(() => kiemTra(mapperGia(canonicalAlbum)), "mapper giả bỏ media mà phép kiểm không bắt → phép thử phải đỏ");
});

test("E2: in phiên bản runtime dùng", () => {
  console.log(`[E2] runtime=${runtimeVersion} mapper=${mapperFile} runner=${runtimeKind}`);
});
