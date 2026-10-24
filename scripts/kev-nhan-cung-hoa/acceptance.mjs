#!/usr/bin/env node
/**
 * Eval máy cho hồ sơ kev-nhan-cung-hoa (ZC1 nối tiếp — cứng hoá ingest của collector API).
 *
 *   node scripts/kev-nhan-cung-hoa/acceptance.mjs <media-junk|payload-intact|dedup-norm|legacy-id|bad-text|url-path>
 *
 * AN TOÀN: gọi thẳng createAgentServer() của bản build (collector/dist) với thư mục snapshot tạm —
 * không mở cổng, không chạm :9210, không ghi DB. URL ảnh giả dùng host `.invalid` (ngoài allowlist)
 * và flush({ skipMedia: true }) nên không có lượt GET nào ra mạng.
 * Cần `cd collector && npm run build` trước.
 */
import { createHash } from "node:crypto";
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { gunzipSync } from "node:zlib";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const SERVER = pathToFileURL(join(ROOT, "collector/dist/api/server.js")).href;

let failures = 0;
function check(ok, line) {
  console.log(`${ok ? "ok  " : "FAIL"} ${line}`);
  if (!ok) failures++;
}
function finish(tag) {
  if (failures > 0) {
    console.log(`${tag} FAIL (${failures} mục)`);
    process.exit(1);
  }
  console.log(`${tag} PASS`);
}
const legacyId = (group, ts, text) => createHash("sha256").update(`${group}|${ts}|${text}`).digest("hex").slice(0, 32);
const img = (u) => ({ url: `https://acc.invalid/${u}.jpg`, type: "photo" });

/** Mỗi ca một server mới + thư mục tạm; trả về hàm post và hàm đọc item đã flush. */
async function withServer(fn) {
  const { createAgentServer } = await import(SERVER);
  const root = mkdtempSync(join(tmpdir(), "acc-zc1b-"));
  try {
    const s = await createAgentServer({ snapshotRoot: root, city: "hanoi", keys: ["k"] });
    const post = (group, messages) => s.ingest({ agent_id: "acc", group, messages }, "Bearer k");
    const items = async () => {
      await s.flush({ skipMedia: true });
      const cityDir = join(root, "hanoi");
      const out = [];
      if (!existsSync(cityDir)) return out;
      for (const dir of readdirSync(cityDir).sort()) {
        const manifest = JSON.parse(readFileSync(join(cityDir, dir, "manifest.json"), "utf8"));
        for (const f of manifest.files.filter((f) => f.name.startsWith("items-"))) {
          out.push(...JSON.parse(gunzipSync(readFileSync(join(cityDir, dir, f.name))).toString()));
        }
      }
      return out;
    };
    await fn({ post, items });
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

const TS = "2026-10-24T03:00:00Z";

// AC-1, AC-2: media rác không làm hỏng lô
async function modeMediaJunk() {
  await withServer(async ({ post, items }) => {
    const g = "acc-junk";
    const cases = [
      ["media là chuỗi", { text: "", ts: TS, senderId: "a1", media: "không-phải-mảng" }],
      ["media là null", { text: "", ts: TS, senderId: "a2", media: null }],
      ["media là object", { text: "", ts: TS, senderId: "a3", media: { url: "https://acc.invalid/o.jpg" } }],
      ["mảng chứa null", { text: "", ts: TS, senderId: "a4", media: [null, img("n")] }],
      ["phần tử thiếu url/path", { text: "", ts: TS, senderId: "a5", media: [{ type: "photo" }, 7, "s"] }],
    ];
    let thrown = null;
    let r;
    try {
      r = post(g, [...cases.map((c) => c[1]), { text: "tin lành cùng lô", ts: TS, senderId: "ok" }]);
    } catch (e) {
      thrown = e;
    }
    check(thrown === null, `ingest không ném lỗi với ${cases.length} kiểu media rác${thrown ? ` (ném: ${thrown.message})` : ""}`);
    check(r?.status === 202, `lô có media rác trả 202, được ${r?.status}`);
    check(r?.body?.accepted === cases.length + 1, `cả ${cases.length + 1} tin trong lô được nhận (gồm tin lành), được ${JSON.stringify(r?.body)}`);
    const got = await items();
    check(got.length === cases.length + 1, `flush ghi đủ ${cases.length + 1} item, được ${got.length}`);
    check(got.some((i) => i.payload.text === "tin lành cùng lô"), "tin lành cùng lô có trong snapshot");
  });
  finish("MEDIA-JUNK");
}

// AC-3: payload lưu nguyên vẹn như nhận
async function modePayloadIntact() {
  await withServer(async ({ post, items }) => {
    const g = "acc-intact";
    const junk = [null, { type: "photo" }, img("p"), "s"];
    const sent = [
      { text: "  xyz  ", ts: TS, senderId: "b1", media: junk },
      { text: "", ts: TS, senderId: "b2", media: "chuỗi-rác" },
      { text: "   ", ts: TS, senderId: "b3", media: [img("q")] },
    ];
    const r = post(g, sent);
    check(r.status === 202 && r.body.accepted === 3, `3 tin được nhận, được ${r.status} ${JSON.stringify(r.body)}`);
    const got = await items();
    for (const m of sent) {
      const it = got.find((i) => i.payload.senderId === m.senderId);
      check(it?.payload.text === m.text, `text của ${m.senderId} giữ nguyên ${JSON.stringify(m.text)}, được ${JSON.stringify(it?.payload.text)}`);
      check(JSON.stringify(it?.payload.media) === JSON.stringify(m.media), `media của ${m.senderId} giữ nguyên như nhận`);
    }
  });
  finish("PAYLOAD-INTACT");
}

// AC-4, AC-5: chuẩn hoá + sort chỉ gộp đúng ảnh trùng, không gộp nhầm ảnh khác
async function modeDedupNorm() {
  await withServer(async ({ post }) => {
    const g = "acc-norm";
    const base = { text: "", ts: TS, senderId: "c1" };
    const first = post(g, [{ ...base, media: [img("a"), img("b")] }]);
    check(first.body.accepted === 1, "tin chỉ ảnh đầu tiên được nhận");
    const variants = [
      ["đảo thứ tự URL", [img("b"), img("a")]],
      ["khoảng trắng hai đầu URL", [{ url: "  https://acc.invalid/a.jpg " }, { url: "https://acc.invalid/b.jpg\t" }]],
      ["dấu ? và # thừa cuối URL", [{ url: "https://acc.invalid/a.jpg?" }, { url: "https://acc.invalid/b.jpg#" }]],
      ["thêm phần tử rác", [null, img("a"), { type: "x" }, img("b")]],
    ];
    for (const [name, media] of variants) {
      const r = post(g, [{ ...base, media }]);
      check(r.body.accepted === 0 && r.body.duplicates === 1, `${name} → trùng tin đầu (duplicates 1), được ${JSON.stringify(r.body)}`);
    }
    // should-NOT-fire: ảnh khác thật thì không được gộp
    const distinct = [
      ["khác một URL", [img("a"), img("c")]],
      ["thiếu một ảnh", [img("a")]],
      ["query thật khác nhau", [{ url: "https://acc.invalid/a.jpg?v=2" }, img("b")]],
    ];
    for (const [name, media] of distinct) {
      const r = post(g, [{ ...base, media }]);
      check(r.body.accepted === 1 && r.body.duplicates === 0, `should-NOT-fire: ${name} → tin riêng (accepted 1), được ${JSON.stringify(r.body)}`);
    }
  });
  finish("DEDUP-NORM");
}

// AC-6, AC-7: id tin chữ theo công thức cũ trên text nguyên bản; text toàn khoảng trắng = tin chỉ ảnh
async function modeLegacyId() {
  await withServer(async ({ post, items }) => {
    const g = "acc-legacy";
    const r = post(g, [
      { text: " abc ", ts: TS, senderId: "d1" },
      { text: "abc", ts: TS, senderId: "d1" },
      { text: "bán nhà Cầu Giấy\n", ts: TS, senderId: "d2", media: [img("t")] },
      { text: "   ", ts: TS, senderId: "d3", media: [img("w")] },
      { text: "\t\n", ts: TS, senderId: "d4", media: [img("w")] },
    ]);
    check(r.status === 202 && r.body.accepted === 5, `5 tin được nhận, được ${r.status} ${JSON.stringify(r.body)}`);
    const got = await items();
    const by = (text, sender) => got.find((i) => i.payload.text === text && i.payload.senderId === sender);
    check(by(" abc ", "d1")?.sourceId === legacyId(g, TS, " abc "), "' abc ' mang id cũ sha256(group|ts|' abc ')");
    check(by("abc", "d1")?.sourceId === legacyId(g, TS, "abc"), "'abc' mang id cũ sha256(group|ts|'abc')");
    check(by(" abc ", "d1")?.sourceId !== by("abc", "d1")?.sourceId, "should-NOT-fire: ' abc ' và 'abc' KHÔNG bị gộp thành một tin");
    check(by("bán nhà Cầu Giấy\n", "d2")?.sourceId === legacyId(g, TS, "bán nhà Cầu Giấy\n"), "tin chữ kèm ảnh giữ id cũ (xuống dòng cuối không bị cắt)");
    const w3 = by("   ", "d3");
    const w4 = by("\t\n", "d4");
    check(w3 && w4 && w3.sourceId !== legacyId(g, TS, "   "), "text toàn khoảng trắng + ảnh → băm như tin chỉ ảnh (không theo công thức tin chữ)");
    check(w3 && w4 && w3.sourceId !== w4.sourceId, "hai tin toàn khoảng trắng cùng ảnh khác sender → 2 id khác nhau");
    const again = post(g, [{ text: " ", ts: TS, senderId: "d3", media: [img("w")] }]);
    check(again.body.duplicates === 1, "tin toàn khoảng trắng gửi lại (khoảng trắng khác) cùng sender + ảnh → trùng");
  });
  finish("LEGACY-ID");
}

// AC-8: text không phải chuỗi bị từ chối rõ ràng, server vẫn sống
async function modeBadText() {
  await withServer(async ({ post, items }) => {
    const g = "acc-bad";
    for (const [name, text] of [["null", null], ["số", 42], ["object", { a: 1 }], ["thiếu", undefined]]) {
      let thrown = null;
      let r;
      try {
        r = post(g, [{ text, ts: TS, senderId: "e1" }]);
      } catch (e) {
        thrown = e;
      }
      check(thrown === null && r?.status === 400 && typeof r.body?.error === "string", `text ${name} → 400 có thông điệp, không ném${thrown ? ` (ném: ${thrown.message})` : ""}, được ${r?.status}`);
    }
    const ok = post(g, [{ text: "lô sau vẫn nhận", ts: TS, senderId: "e2" }]);
    check(ok.status === 202 && ok.body.accepted === 1, "sau các lô bị từ chối, lô hợp lệ kế tiếp vẫn được nhận");
    const got = await items();
    check(got.length === 1, `chỉ tin hợp lệ vào snapshot (1 item), được ${got.length}`);
  });
  finish("BAD-TEXT");
}

// AC-10 (vòng 2): url không phải chuỗi / rỗng thì băm theo path, không ném, không gộp nhầm
async function modeUrlPath() {
  await withServer(async ({ post }) => {
    const g = "acc-urlpath";
    for (const [name, ts, media] of [
      ["url là số, path là chuỗi", "t1", [{ url: 5, path: "/a.jpg" }]],
      ["url là object, path là chuỗi", "t2", [{ url: {}, path: "/a.jpg" }]],
      ["url null, path là chuỗi", "t3", [{ url: null, path: "/a.jpg" }]],
    ]) {
      let thrown = null;
      let r;
      try {
        r = post(g, [{ text: "", ts, senderId: "f1", media }]);
      } catch (e) {
        thrown = e;
      }
      check(thrown === null && r?.status === 202 && r.body.accepted === 1, `${name} → 202 accepted 1, không ném${thrown ? ` (ném: ${thrown.message})` : ""}`);
    }
    const a = post(g, [{ text: "", ts: "t4", senderId: "f2", media: [{ url: "", path: "/a.jpg" }] }]);
    const b = post(g, [{ text: "", ts: "t4", senderId: "f2", media: [{ url: "", path: "/b.jpg" }] }]);
    check(a.body.accepted === 1, "url rỗng + path A được nhận");
    check(b.body.accepted === 1 && b.body.duplicates === 0, `should-NOT-fire: url rỗng + path B (cùng nhóm, ts, sender) là tin riêng, được ${JSON.stringify(b.body)}`);
    const again = post(g, [{ text: "", ts: "t4", senderId: "f2", media: [{ url: "", path: "/a.jpg" }] }]);
    check(again.body.duplicates === 1, "url rỗng + path A gửi lại → trùng");
  });
  finish("URL-PATH");
}

const modes = {
  "url-path": modeUrlPath,
  "media-junk": modeMediaJunk,
  "payload-intact": modePayloadIntact,
  "dedup-norm": modeDedupNorm,
  "legacy-id": modeLegacyId,
  "bad-text": modeBadText,
};
const mode = process.argv[2];
if (!modes[mode]) {
  console.error(`dùng: node scripts/kev-nhan-cung-hoa/acceptance.mjs <${Object.keys(modes).join("|")}>`);
  process.exit(2);
}
await modes[mode]();
