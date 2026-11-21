// thu-nhom-s05.test.mjs — test 7 điều an toàn của bộ thu local S05 (GIAO 2011-4).
// KHÔNG mở trình duyệt: hàm thuần + ca tĩnh quét mã + ca script con --tu-kho.
//
// LỆNH PHÁ theo danh sách cho phép (đột biến thủ công — mỗi lệnh làm CA TƯƠNG ỨNG ĐỎ):
//   P1 (điều 2 nhận chặn): trong thu-nhom-s05.mjs vô hiệu RE_CHAN thành /(?!x)/ và
//      RE_URL_CHAN thành /(?!x)/ → ca "a/… ĐỎ (dấu chặn vô hiệu)".
//   P2 (điều 2 bỏ gọi kiểm chặn): xoá dòng `daChan ??= await kiemChan(...)` trong
//      vòng scroll (hoặc dòng kiemChan "sau-khi-mo") → ca "t/2-chỗ-kiểm-chặn ĐỎ".
//   P3 (điều 3b trần bài): trong hopNhat bỏ .slice(0, tranBai) → ca "b/trần-bài ĐỎ".
//   P4 (điều 3b trần nhóm): trong docNhomTuCauHinh bỏ slice(0, maxNhom) → ca "b/trần-nhóm ĐỎ".
//   P5 (điều 1 chỉ bấm nút đóng trong hộp thoại): thêm một .click() NGOÀI khối
//      div[role="dialog"] → ca "e/1-chỉ-đọc ĐỎ".
//   P6 (điều 3c khuôn): trong khuonMessage trả ts cố định "" → ca "c/khuôn-ts ĐỎ".
//   P7 (chỉ-đọc): thêm page.keyboard./page.type./page.fill. vào script → ca "e/1-chỉ-đọc ĐỎ".
//
// Quy ước làn thu (GS 2011-18): test gọi script con TỰ ĐẶT biến *_NODE_BIN =
// process.execPath — không phụ thuộc node/đường riêng của máy thu.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile, writeFile, mkdtemp, rm } from "node:fs/promises";
import { readFileSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

const DUONG_SCRIPT = fileURLToPath(new URL("./thu-nhom-s05.mjs", import.meta.url));
const { parseArgs, docNhomTuCauHinh, nhanDienChan, hopNhat, khuonMessage } = await import(
  `file://${DUONG_SCRIPT}`
);

const docTepGia = (noiDung) => async () => noiDung;
const docLoi = async () => {
  const e = new Error("ENOENT");
  e.code = "ENOENT";
  throw e;
};

// bản chép hỏng cạnh bản thật (đột biến) — tim là cặp hoặc mảng các cặp [tim, thay]
async function banChep(tim, thay, chay) {
  const goc = readFileSync(DUONG_SCRIPT, "utf8");
  const doi = Array.isArray(tim) ? tim : [[tim, thay]];
  let moi = goc;
  for (const [t, th] of doi) moi = moi.replace(t, th);
  assert.notEqual(moi, goc, "bản chép không đổi được — mẫu thay đã lệch mã");
  const ban = join(dirname(DUONG_SCRIPT), `.ban-${process.pid}-${Math.random().toString(36).slice(2)}-thu-nhom-s05.mjs`);
  writeFileSync(ban, moi);
  try {
    return await chay(await import(pathToFileURL(ban).href));
  } finally {
    rmSync(ban, { force: true });
  }
}

// ─── (a) nhận chặn (điều 2) ───
test("a/nhận-chặn: checkpoint URL → dừng", () => {
  const r = nhanDienChan({ daDangNhap: true, urlTrang: "https://x/checkpoint/123", textTrang: "" });
  assert.equal(r.chan, "trang-kiem-tra");
  assert.match(r.lyDo, /checkpoint/);
});
test("a/nhận-chặn: captcha URL kể cả chưa đăng nhập → chặn (đang bị xác minh)", () => {
  const r = nhanDienChan({ daDangNhap: false, urlTrang: "https://x/captcha", textTrang: "" });
  assert.equal(r.chan, "trang-kiem-tra");
});
test("a/nhận-chặn: xác minh VI/EN trong trang → chặn", () => {
  for (const t of ["Hãy xác minh rằng bạn là người thật", "Security check required", "Verify it's you"]) {
    const r = nhanDienChan({ daDangNhap: true, textTrang: t });
    assert.equal(r.chan, "dau-hieu-chan", t);
  }
});
test("a/nhận-chặn: cảnh báo khoá tài khoản → chặn", () => {
  for (const t of ["Tài khoản của bạn đã bị khoá tạm thời", "Your account has been locked", "bạn đã bị chặn"]) {
    const r = nhanDienChan({ daDangNhap: true, textTrang: t });
    assert.equal(r.chan, "dau-hieu-chan", t);
  }
});
test("a/nhận-chặn: trang đăng nhập lại giữa lượt (đã đăng nhập) → chặn; chưa đăng nhập là trạng thái thường", () => {
  assert.equal(nhanDienChan({ daDangNhap: true, textTrang: "Vui lòng quay lại đăng nhập để tiếp tục" }).chan, "dau-hieu-chan");
  assert.equal(nhanDienChan({ daDangNhap: false, textTrang: "Đăng nhập vào tài khoản" }).chan, null);
});
test("a/nhận-chặn: trang lành → không chặn", () => {
  const r = nhanDienChan({
    daDangNhap: true,
    textTrang: "Bán căn hộ 2PN Quận 9 giá 2 tỷ — 09xx. Bài đăng 1 giờ trước",
  });
  assert.equal(r.chan, null);
});

// ─── (b) trần lượt: nhóm/bài/cuộn/phút (điều 3b) ───
test("b/parseArgs: flag đè env, env đè mặc định", () => {
  assert.equal(parseArgs(["--tran", "7", "--max-scroll", "2"]).tranBai, 7);
  assert.equal(parseArgs([], { S05_TRAN_BAI: "13" }).tranBai, 13);
  assert.equal(parseArgs([], {}).tranBai, 50);
  assert.equal(parseArgs([], {}).maxScroll, 6);
  assert.equal(parseArgs(["--max-nhom", "1"], {}).tranNhom, 1);
  assert.equal(parseArgs([], { S05_MAX_NHOM: "5" }).tranNhom, 5);
  assert.equal(parseArgs(["--gui", "--dang-nhap"]).gui, true);
});
test("b/trần-nhóm: cấu hình vượt trần → cắt đúng số", async () => {
  const tep = JSON.stringify({
    nhom: [
      { id: "a", duong: "/groups/a" },
      { id: "b", duong: "/groups/b" },
      { id: "c", duong: "/groups/c" },
    ],
  });
  assert.equal((await docNhomTuCauHinh("t", docTepGia(tep), 2)).length, 2);
  assert.equal((await docNhomTuCauHinh("t", docTepGia(tep))).length, 3);
});
test("b/trần-bài: hợp nhất graphql ưu tiên + cắt trần", () => {
  const g = Array.from({ length: 9 }, (_, i) => ({ post_id: `p${i}`, time_unix: 100 + i, text: `t${i}` }));
  const d = [{ post_id: null, author: "x", time_label: "2h", text: "dom", images: [] }];
  const r = hopNhat(g, d, 5);
  assert.equal(r.length, 5);
  assert.equal(r[0].post_id, "p8"); // xếp mới trước rồi cắt
  assert.equal(r[4].post_id, "p4");
});
test("b/đọc-cấu-hình: sai khuôn đường/rỗng/thiếu tệp → lỗi rõ", async () => {
  await assert.rejects(docNhomTuCauHinh("t", docLoi), /không đọc được/);
  await assert.rejects(docNhomTuCauHinh("t", docTepGia("không phải json")), /JSON/);
  await assert.rejects(docNhomTuCauHinh("t", docTepGia(JSON.stringify({ nhom: [] }))), /thiếu mảng/);
  await assert.rejects(
    docNhomTuCauHinh("t", docTepGia(JSON.stringify({ nhom: [{ id: "x", duong: "https://le/oo" }] }))),
    /\/groups\/<id>/,
  );
});

// ─── (c) khuôn khớp DATA-CONTRACT (điều 3c — khuôn cũ /agent-report không đổi DC) ───
test("c/khuôn: graphql có time_unix → ts ISO từ giây; media đúng shape {path,url,type}", () => {
  const m = khuonMessage(
    { text: "bán nhà", author: "Chị Lan", time_unix: 1700000000, images: ["https://scontent/a.jpg"] },
    "Nhóm A",
  );
  assert.deepEqual(Object.keys(m).sort(), ["media", "senderId", "senderName", "text", "ts"]);
  assert.equal(m.ts, "2023-11-14T22:13:20.000Z");
  assert.equal(m.senderName, "Chị Lan");
  assert.equal(m.senderId, null);
  assert.deepEqual(m.media, [{ path: null, url: "https://scontent/a.jpg", type: "image/jpeg" }]);
});
test("c/khuôn: DOM không time_unix → ts hiện tại; text không có → rỗng (không null)", () => {
  const bayGio = new Date("2026-11-21T00:00:00Z");
  const m = khuonMessage({ author: "x", time_label: "2h", images: [] }, "Nhóm B", bayGio);
  assert.equal(m.ts, "2026-11-21T00:00:00.000Z");
  assert.equal(m.text, "");
});
test("c/khuôn-lô: guiAgentReport chỉ gửi khi có S05_AGENT_ID (khuôn cũ qua env)", async () => {
  // đo qua mã nguồn: guiAgentReport đọc env, không hằng literal khuôn cũ trong tệp
  const ma = await readFile(DUONG_SCRIPT, "utf8");
  assert.match(ma, /S05_AGENT_ID/);
  assert.doesNotMatch(ma, /agent_id:\s*"/); // không literal giá trị agent_id trong mã
});

// ─── (e) ca tĩnh quét mã — chỉ-đọc + 2 chỗ kiểm chặn (điều 1, 2) ───
test("e/1-chỉ-đọc: không gõ/fill/keyboard; .click() chỉ trong khối hộp thoại", async () => {
  const ma = await readFile(DUONG_SCRIPT, "utf8");
  for (const CAM of ["page.type(", "page.fill(", "keyboard.", ".press(", "mouse.click(", "request.post("]) {
    assert.ok(!ma.includes(CAM), `mã không được chứa hành động viết: ${CAM}`);
  }
  // mọi .click( phải nằm trong evaluate khối div[role="dialog"] (P5 thêm click
  // ngoài khối → dòng đó không có ngữ cảnh dialog trong 5 dòng trước → đỏ)
  const dong = ma.split("\n");
  dong.forEach((d, i) => {
    if (d.includes(".click(")) {
      const nguCanh = dong.slice(Math.max(0, i - 5), i + 1).join("\n");
      assert.match(nguCanh, /role="dialog"/, `.click() ở dòng ${i + 1} phải nằm trong khối hộp thoại`);
    }
  });
});
test("t/2-chỗ-kiểm-chặn: sau-khi-mo + trong-vòng-scroll (P2 xoá chỗ nào ca này đỏ chỗ đó)", async () => {
  const ma = await readFile(DUONG_SCRIPT, "utf8");
  assert.match(ma, /kiemChan\("sau-khi-mo"\)/);
  assert.match(ma, /daChan \?\?= await kiemChan\(/);
});
test("t/điều-7: không --gui thì không gửi — hằng 'gui' chỉ từ flag; ghi chú điều 7 trong tom-tat", async () => {
  const ma = await readFile(DUONG_SCRIPT, "utf8");
  assert.match(ma, /ARGS\.gui/);
  assert.match(ma, /điều 7/);
});
test("t/điều-4-5: nhóm từ tệp cấu hình; --dang-nhap không gõ hộp thoại", async () => {
  const ma = await readFile(DUONG_SCRIPT, "utf8");
  assert.match(ma, /docNhomTuCauHinh\(/);
  assert.match(ma, /--dang-nhap/);
});

// ─── (f) MỞ LẠI 2011-4: ca HÀNH VI «chặn → DỪNG lượt, thoát ≠0» bằng page GIẢ ───
const { chayCacNhom } = await import(`file://${DUONG_SCRIPT}`);

function taoPageGia({ checkpointTuCuon = Infinity } = {}) {
  const truyen = { soGoto: 0, soWheel: 0, soText: 0 };
  const page = {
    goto: async () => { truyen.soGoto++; },
    url: () => "https://nguon/groups/g1",
    textContent: async () => {
      truyen.soText++;
      return truyen.soWheel >= checkpointTuCuon
        ? "Hãy xác minh rằng bạn là người thật"
        : "Bán căn nhà 2 tỷ — liên hệ 09xx";
    },
    evaluate: async () => [],
    mouse: { wheel: async () => { truyen.soWheel++; } },
    on: () => {}, off: () => {},
    locator: () => ({ ariaSnapshot: async () => "" }),
  };
  return { page, truyen };
}
const NHOM_GIA = [
  { id: "g1", ten: "n1", url: "https://nguon/groups/g1" },
  { id: "g2", ten: "n2", url: "https://nguon/groups/g2" },
];
const GIA_DEPS = (page) => ({
  nhomCauHinh: NHOM_GIA,
  page,
  hetTranTong: () => false,
  ngu: async () => {},
  ghiTomTat: async () => {},
  out: () => {},
  thamSo: { maxScroll: 6, tranBai: 50 },
});

test("f/hành-vi-chặn: checkpoint ở lần cuộn thứ 2 → dừng ngay (wheel đúng 1), không sang nhóm 2, thoát 3, ghi lý do", async () => {
  const { page, truyen } = taoPageGia({ checkpointTuCuon: 1 });
  const tomTatDaGhi = [];
  const ket = await chayCacNhom({ ...GIA_DEPS(page), ghiTomTat: async (_n, _k, chan) => tomTatDaGhi.push(chan) });
  assert.equal(ket.exitCode, 3, "thoát ≠0 khi chặn");
  assert.equal(truyen.soWheel, 1, "cuộn đúng 1 lần rồi dừng — không cuộn tiếp");
  assert.equal(truyen.soGoto, 1, "KHÔNG sang nhóm kế");
  assert.ok(ket.chan?.chan, "trả lý do chặn");
  assert.match(String(tomTatDaGhi[0]), /CHẶN/);
});
test("f/hành-vi-không-chặn: trang lành → chạy đủ nhóm, thoát 0", async () => {
  const { page, truyen } = taoPageGia();
  const ket = await chayCacNhom(GIA_DEPS(page));
  assert.equal(ket.exitCode, 0);
  assert.equal(truyen.soGoto, 2);
  assert.equal(truyen.soWheel, 7 * 2); // s=0..6 mỗi nhóm → 7 lần
});
test("f/A-đỏ: bỏ break/return daChan → không dừng sớm (cuộn hết trần, sang nhóm 2)", async () => {
  const { page, truyen } = taoPageGia({ checkpointTuCuon: 1 });
  await banChep(
    [
      ["    if (daChan) break; // dừng ngay, không cuộn tiếp, không thử lại\n", ""],
      ["  if (daChan) return daChan;\n", ""],
    ],
    null,
    async (mo) => {
      const ket = await mo.chayCacNhom(GIA_DEPS(page));
      // bản hỏng KHÔNG dừng ngay khi phát hiện chặn: cuộn tiếp trần 7 lần nhóm 1
      // và sang nhóm 2 — khác chặt với bản chuẩn (wheel 1, goto 1)
      assert.equal(truyen.soWheel, 7, "cuộn trần bất chấp chặn (bản chuẩn chỉ 1)");
      assert.equal(truyen.soGoto, 2, "sang nhóm 2 bất chấp chặn (bản chuẩn chỉ 1)");
    },
  );
});
test("f/B-đỏ: exitCode 3 đổi thành 0 → ca thoát ≠0 đỏ", async () => {
  const { page } = taoPageGia({ checkpointTuCuon: 1 });
  await banChep(
    `      return { exitCode: 3, chan: ket };`,
    `      return { exitCode: 0, chan: ket };`,
    async (mo) => {
      const ket = await mo.chayCacNhom(GIA_DEPS(page));
      assert.equal(ket.exitCode, 0, "bản hỏng trả 0 dù chặn — ca xanh (thoát ≠0) phía trên phải đỏ khi áp");
    },
  );
});

// ─── script con --tu-kho (không trình duyệt) — quy ước *_NODE_BIN (GS 2011-18) ───
test("script-con/--tu-kho: đọc config fixture + khuôn mẫu, thoát 0", async () => {
  const tam = await mkdtemp(join(tmpdir(), "s05-tu-kho-"));
  const tep = join(tam, "nhom.json");
  await writeFile(
    tep,
    JSON.stringify({ nhom: [{ id: "id1", ten: "Nhóm Một", duong: "/groups/id1" }] }),
  );
  try {
    const r = await new Promise((resolve) => {
      const p = spawn(process.execPath, [DUONG_SCRIPT, "--tu-kho", "--max-nhom", "2"], {
        env: {
          ...process.env,
          S05_NODE_BIN: process.execPath, // quy ước GS: script con tự đặt biến *_NODE_BIN
          S05_CONFIG_TEP: tep,
        },
        stdio: ["ignore", "pipe", "pipe"],
      });
      let h = "";
      p.stdout.on("data", (d) => (h += d));
      p.on("close", (code) => resolve({ code, h }));
    });
    assert.equal(r.code, 0);
    const j = JSON.parse(r.h);
    assert.equal(j.nhom, 1);
    assert.equal(j.tenDau, "Nhóm Một");
    assert.equal(j.mauKhuon.ts, "2023-11-14T22:13:20.000Z");
  } finally {
    await rm(tam, { recursive: true, force: true });
  }
});
