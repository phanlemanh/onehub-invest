// handler.test.mjs — K1 (claudedp-2111-9): hook S03 KHÔNG gọi cổng chấm nhãn nữa.
// Tin giả qua hook phải tới CỔNG THU đúng 1 lần với đủ trường cũ (kev p=null
// giữ khuôn), KHÔNG có lời gọi nào tới cổng chấm. KHÔNG mở gateway thật:
// fetch bị giả trang, spool trỏ thư mục tạm, key đọc từ máy (không đi đâu).
//
// LỆNH PHÁ (bản chép hỏng — mỗi lệnh làm ca ĐỎ):
//   P1 (khuôn kev): bỏ dòng `kev: { p: null, ... }` trong handler → ca
//      "khuôn-kev ĐỎ" (tin giả thiếu trường kev).
//   P2 (gọi cổng chấm trở lại): chèn lại lời fetch cổng chấm (một hàm điểm
//      giả trả số) trước phần đẩy → ca "không-gọi-cổng-chấm ĐỎ" (fetch giả
//      thấy URL cổng chấm).
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { existsSync, rmSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

// KEV1 (tích hợp): hook tính đường LOG, KEY_FILE, SPOOL_DIR từ homedir() LÚC IMPORT. Không cô lập thì test ghi dòng
// «post 202 … kev=off» giả vào log hook THẬT, đọc khoá thật, và drainSpool chạy trên spool THẬT với fetch giả (tin chờ
// thật bị «gửi» vào collector giả rồi xoá). Đặt HOME tạm + spool tạm TRƯỚC khi import (luật an toàn Zalo: phép đo không
// chạm ~/.openclaw).
const HOME_THAT = homedir();
const HOME_TAM = await mkdtemp(join(tmpdir(), "k1-home-"));
process.env.HOME = HOME_TAM;
process.env.ONEINVEST_HOOK_SPOOL = join(HOME_TAM, "spool");
if (resolve(homedir()) === resolve(HOME_THAT)) throw new Error("HOME tạm không có hiệu lực — bỏ chạy, không chạm ~/.openclaw thật");
await mkdir(join(HOME_TAM, ".openclaw/credentials"), { recursive: true });
await mkdir(join(HOME_TAM, ".openclaw/logs"), { recursive: true });
await writeFile(join(HOME_TAM, ".openclaw/credentials/oneinvest-agent.key"), "khoa-gia\n");
process.on("exit", () => rmSync(HOME_TAM, { recursive: true, force: true }));

const TEP = fileURLToPath(new URL("./handler.js", import.meta.url));
const { default: handler } = await import(`file://${TEP}`);

async function banChep(tim, thay, chay) {
  const goc = await readFile(TEP, "utf8");
  const moi = goc.replace(tim, thay);
  assert.notEqual(moi, goc, "bản chép không đổi được — mẫu thay đã lệch mã");
  const ban = join(dirname(TEP), `.ban-${process.pid}-${Math.random().toString(36).slice(2)}-handler.mjs`);
  await writeFile(ban, moi);
  try {
    return await chay((await import(pathToFileURL(ban).href)).default);
  } finally {
    await rm(ban, { force: true });
  }
}

const GOC_CONG_THU = "http://127.0.0.1:9210";

/** Chạy handler với fetch giả — trả { cacGoi, phanHoiCuoi } */
async function chayVoiFetchGia(hamChay = handler, { khongCham = true } = {}) {
  const spool = await mkdtemp(join(tmpdir(), "k1-spool-"));
  const cacGoi = [];
  const fetchGoc = globalThis.fetch;
  globalThis.fetch = async (url, tuyChon) => {
    const u = String(url);
    cacGoi.push(u);
    if (khongCham && u.includes("8009")) {
      // cổng chấm KHÔNG được gọi — nếu gọi thì trả lỗi để test thấy rõ qua log
      return { ok: false, status: 599, text: async () => "cổng chấm không được gọi" };
    }
    if (u.includes("9210")) {
      return { ok: true, status: 202, text: async () => JSON.stringify({ accepted: 1 }) };
    }
    return { ok: false, status: 404, text: async () => "" };
  };
  try {
    await hamChay({
      event: {
        channelId: "zalouser",
        accountId: "tai-khoan-thu",
        conversationId: "conv-1",
        content: "Bán căn hộ 2PN Quận 9 giá 2 tỷ — 09xx",
        timestamp: 1700000000000,
        metadata: { senderName: "Chị Lan", senderId: "u1", threadId: "t1" },
        media: [],
      },
    });
  } finally {
    globalThis.fetch = fetchGoc;
    await rm(spool, { recursive: true, force: true });
  }
  return { cacGoi };
}

test("tin-giả: đúng 1 lần đẩy tới cổng thu, KHÔNG gọi cổng chấm nào", async () => {
  const { cacGoi } = await chayVoiFetchGia();
  assert.equal(cacGoi.filter((u) => u.includes("9210")).length, 1, "đúng một lần đẩy");
  assert.equal(cacGoi.filter((u) => u.includes("8009")).length, 0, "KHÔNG gọi cổng chấm");
  assert.equal(cacGoi.length, 1, "không lời gọi mạng nào khác");
});
test("khuôn-tin: agent_id openclaw-hook + messages[0] đủ trường cũ, kev p=null giữ khuôn", async () => {
  let than = null;
  const fetchGoc = globalThis.fetch;
  globalThis.fetch = async (url, tuyChon) => {
    if (String(url).includes("9210")) {
      than = JSON.parse(tuyChon.body);
      return { ok: true, status: 202, text: async () => JSON.stringify({ accepted: 1 }) };
    }
    return { ok: false, status: 404, text: async () => "" };
  };
  try {
    await handler({
      event: {
        channelId: "zalouser",
        accountId: "tk",
        conversationId: "conv-2",
        content: "cho thuê nhà 3 tầng",
        timestamp: "2026-11-21T00:00:00.000Z",
        metadata: { senderName: "Anh Minh", senderId: "u2" },
        media: [{ mediaPath: "/x.jpg", mediaUrl: "https://a.b/x.jpg", mediaType: "image" }],
      },
    });
  } finally { globalThis.fetch = fetchGoc; }
  assert.ok(than, "đã đẩy");
  assert.equal(than.agent_id, "openclaw-hook");
  assert.equal(than.group, "conv-2", "group0 = threadId || conversationId");
  const m = than.messages[0];
  assert.deepEqual(Object.keys(m).sort(), ["conversationId", "kev", "media", "senderId", "senderName", "text", "ts"]);
  assert.equal(m.text, "cho thuê nhà 3 tầng");
  assert.equal(m.ts, "2026-11-21T00:00:00.000Z");
  assert.equal(m.senderName, "Anh Minh");
  assert.equal(m.senderId, "u2");
  assert.equal(m.conversationId, "conv-2");
  assert.equal(m.media[0].path, "/x.jpg");
  assert.equal(m.kev.p, null, "kev p=null giữ khuôn (K1)");
  assert.equal(m.kev.model, "kev-off");
});
test("khuôn-kev ĐỎ khi P1: bỏ trường kev → tin giả thiếu kev", async () => {
  await banChep(
    '    kev: { p: null, model: "kev-off", threshold: THRESHOLD, at: new Date().toISOString() },\n',
    "",
    async (handlerHong) => {
      let than = null;
      const fetchGoc = globalThis.fetch;
      globalThis.fetch = async (url, tuyChon) => {
        if (String(url).includes("9210")) {
          than = JSON.parse(tuyChon.body);
          return { ok: true, status: 202, text: async () => JSON.stringify({ accepted: 1 }) };
        }
        return { ok: false, status: 404, text: async () => "" };
      };
      try {
        await handlerHong({
          event: {
            channelId: "zalouser", accountId: "tk", conversationId: "c",
            content: "tin", timestamp: 1700000000000, metadata: {},
          },
        });
      } finally { globalThis.fetch = fetchGoc; }
      assert.ok(!("kev" in than.messages[0]), "bản hỏng mất trường kev — ca xanh phía trên phải đỏ khi áp P1");
    },
  );
});
test("không-gọi-cổng-chấm ĐỎ khi P2: chèn lại lời gọi cổng chấm → fetch giả thấy URL", async () => {
  await banChep(
    "  // K1: không gọi cổng chấm nhãn — nhãn kev gửi p=null (gate down khuôn cũ).\n",
    "  // K1: không gọi cổng chấm nhãn — nhãn kev gửi p=null (gate down khuôn cũ).\n  await fetch(`http://127.0.0.1:8009/v1/systemone`, { method: \"POST\" }).catch(() => {});\n",
    async (handlerHong) => {
      const { cacGoi } = await chayVoiFetchGia(handlerHong);
      assert.ok(cacGoi.some((u) => u.includes("8009")), "bản hỏng gọi lại cổng chấm — ca xanh phía trên phải đỏ khi áp P2");
    },
  );
});
test("khoá-đọc: handler chỉ đọc key từ máy, không in key ra log", async () => {
  const ma = await readFile(TEP, "utf8");
  assert.ok(!ma.includes("console.log"), "handler không in ra stdout");
  assert.ok(ma.includes("authorization: `Bearer ${key}`"), "key đi header như cũ");
});
test("cô-lập: log và spool của hook nằm dưới HOME tạm, không dưới HOME thật", async () => {
  await chayVoiFetchGia();
  await new Promise((r) => setTimeout(r, 50)); // log() ghi không chờ (fire-and-forget)
  const logTam = join(HOME_TAM, ".openclaw/logs/oneinvest-zalo-pipe.log");
  assert.ok(existsSync(logTam), "hook ghi log vào HOME tạm");
  assert.match(await readFile(logTam, "utf8"), / post 202 .* kev=off /, "dòng post kev=off nằm trong log tạm");
  assert.notEqual(resolve(homedir()), resolve(HOME_THAT), "homedir() của tiến trình test không phải HOME thật");
});
