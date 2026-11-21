// thu-nhom-s05.mjs — bộ thu LOCAL nguồn S05 (Playwright + profile riêng) thay bước thu
// dịch vụ ngoài trả phí (nguồn paused từ ~21/10 vì hết credit).
//
// Đường dữ liệu giữ nguyên KHÔNG đổi DATA-CONTRACT (2011-4): bài bóc được chuyển thành
// khuôn message cũ rồi POST /agent-report → snapshot zalo-agent → transform-fb (lọc
// agent_id từ env S05_AGENT_ID khi bật --gui). Mặc định KHÔNG gửi — chỉ ghi file thử
// research-local/s05-thu-thu/ (điều 7: không nạp trước main + GIAO triển khai).
//
// Trình duyệt QUA LỚP DÙNG CHUNG (2011-5, src/core/trinh-duyet.ts): ngăn profile
// <gốc-ngoài-kho>/s05 (tầng A), ứng viên chọn qua env ONEHUB_TRINH_DUYET.
//
// BẢY ĐIỀU AN TOÀN (LL 2011-4 — bảng đối chiếu đầy đủ ở tin XONG + test kèm):
//   (1) chỉ bấm nút Đóng nằm TRONG hộp thoại (div[role="dialog"]) đang che trang;
//       chỉ-đọc tuyệt đối — không đăng, bình luận, nhắn, thích, xin/rời nhóm, không
//       gõ ô nhập (mã không có page.type/fill/keyboard; ca test tĩnh quét).
//   (2) nhận chặn (đăng nhập lại/checkpoint/xác minh/CAPTCHA/cảnh báo hạn chế) →
//       DỪNG lượt ngay, ghi lý do, thoát ≠0, KHÔNG thử lại trong lượt (nhanDienChan).
//   (3) test (a) nhận chặn (b) trần lượt: nhóm/bài/cuộn/phút (c) khuôn khớp DC.
//   (4) nhóm từ tệp cấu hình collector/config/s05-nhom.json (tên nhóm tầng C được
//       ghi; định danh tài khoản/phiên/profile tầng A nằm ở profile ngoài kho).
//   (5) chỉ người đăng nhập trong cửa sổ --dang-nhap; mã không giữ/gõ mật khẩu.
//   (6) không gateway, không LLM, không plist mới — daily giữ lịch cũ, nhánh chọn
//       bước qua S05_THU_LOCAL (bật thuộc bước triển khai sau gộp).
//   (7) mặc định không nạp: không --gui thì chỉ ghi research-local.
//
// Chạy:
//   node collector/scripts/thu-nhom-s05.mjs --dang-nhap
//   node collector/scripts/thu-nhom-s05.mjs                 # thu toàn bộ nhóm trong config
//   node collector/scripts/thu-nhom-s05.mjs --nhom <url-công-khai> [--tran 50]
//   node collector/scripts/thu-nhom-s05.mjs --gui           # lượt thật (chỉ sau GIAO triển khai)
//   node collector/scripts/thu-nhom-s05.mjs --tu-kho        # tự kiểm không mở trình duyệt
//
// Env (ngoài env lớp trinh-duyet):
//   S05_WEB_BASE   gốc URL nguồn (tầng A runtime) — bắt buộc để dựng URL nhóm
//   S05_CONFIG_TEP đè đường tệp cấu hình nhóm (test dùng)
//   S05_TRAN_BAI   đè trần bài mỗi nhóm (mặc định 50)
//   S05_MAX_NHOM   đè trần nhóm mỗi lượt (mặc định 2)
//   S05_AGENT_ID   giá trị agent_id khuôn cũ mà lớp lọc transform nhận (bắt buộc khi --gui)
//   COLLECTOR_URL  collector API (mặc định http://localhost:9210)
import { pathToFileURL } from "node:url";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { moTrinhDuyet } from "../src/core/trinh-duyet.ts";

const OUT_DIR = new URL("../../research-local/s05-thu-thu/", import.meta.url).pathname;
const CONFIG_TEP = "config/s05-nhom.json";
const TRAN_BAI_MAC_DINH = 50;
const MAX_SCROLL_MAC_DINH = 6;
const TRAN_NHOM_MAC_DINH = 2;
const TRAN_TONG_MS = 8 * 60_000;
const TRAN_LO_TIN = 500; // dưới trần lô 1000 của /agent-report (2510-2)

// ─── Hàm thuần (export để test; đột biến đỏ từng ca theo allowlist ở tệp test) ───

/** Đọc tham số dòng lệnh — trần lượt nhận từ cả flag lẫn env (điều 3b). */
export function parseArgs(argv, env = process.env) {
  const s = argv.join(" ");
  const so = (flag, macDinh, envTen) => {
    const tuFlag = s.match(new RegExp(`--${flag}\\s+(\\d+)`))?.[1];
    const n = tuFlag !== undefined ? Number(tuFlag) : Number(env[envTen]);
    return Number.isFinite(n) && n > 0 ? n : macDinh;
  };
  return {
    dangNhap: s.includes("--dang-nhap"),
    gui: s.includes("--gui"),
    chan: s.includes("--chan"),
    tuKho: s.includes("--tu-kho"),
    nhomTay: s.match(/--nhom\s+(\S+)/)?.[1] ?? null,
    tranBai: so("tran", TRAN_BAI_MAC_DINH, "S05_TRAN_BAI"),
    maxScroll: so("max-scroll", MAX_SCROLL_MAC_DINH, "S05_MAX_SCROLL"),
    tranNhom: so("max-nhom", TRAN_NHOM_MAC_DINH, "S05_MAX_NHOM"),
  };
}

/** (Điều 4) đọc tệp cấu hình nhóm; chỉ nhận nhóm công khai dạng <gốc>/groups/<id>.
 *  docTep: hàm đọc tệp (test inject fixture). Trần nhóm cắt tại đây (điều 3b). */
export async function docNhomTuCauHinh(duongTep, docTep = readFile, maxNhom = Infinity) {
  let raw;
  try {
    raw = await docTep(duongTep, "utf8");
  } catch (e) {
    throw new Error(`không đọc được tệp cấu hình nhóm ${duongTep}: ${e.message}`);
  }
  let j;
  try {
    j = JSON.parse(raw);
  } catch (e) {
    throw new Error(`tệp cấu hình nhóm không phải JSON hợp lệ: ${e.message}`);
  }
  if (!Array.isArray(j.nhom) || j.nhom.length === 0) {
    throw new Error(`tệp cấu hình nhóm ${duongTep} thiếu mảng "nhom" hoặc rỗng`);
  }
  const ketQua = [];
  for (const n of j.nhom) {
    if (!n?.id || !n?.duong) throw new Error(`nhóm trong cấu hình thiếu id hoặc duong: ${JSON.stringify(n)}`);
    if (!/^\/groups\/[\w.-]+$/.test(n.duong)) {
      throw new Error(`đường nhóm sai khuôn /groups/<id>: '${n.duong}'`);
    }
    ketQua.push({ id: n.id, ten: n.ten ?? n.id, duong: n.duong });
  }
  return ketQua.slice(0, maxNhom);
}

const RE_CHAN =
  /(checkpoint|captcha|security check|bạn đã bị (?:chặn|khoá|khóa)|tài khoản (?:bị|đã bị) (?:khoá|khóa|chặn)|hãy xác minh|xác minh rằng bạn|verify (?:that|it'?s) you|your account (?:has been|is) (?:locked|blocked|restricted)|(?:phát hiện|unusual) activity.*(?:đăng nhập|log ?in)|đăng nhập lại|quay lại đăng nhập|log (?:back )?in to continue)/i;
const RE_URL_CHAN = /(\/checkpoint|\/login|captcha)/;

/** (Điều 2) nhận chặn từ trạng thái trang — thuần, đo được không trình duyệt.
 *  Trả { chan: mã-lý-do | null }. Chỉ coi là chặn khi ĐÃ đăng nhập (daDangNhap=true)
 *  hoặc URL/page trỏ tới checkpoint/captcha: chưa đăng nhập là trạng thái cần
 *  --dang-nhap, không phải chặn giữa lượt. */
export function nhanDienChan({ daDangNhap, textTrang = "", urlTrang = "" }) {
  if (RE_URL_CHAN.test(urlTrang)) return { chan: "trang-kiem-tra", lyDo: `URL trỏ tới trang kiểm tra/chặn: ${urlTrang.slice(0, 120)}` };
  if (!daDangNhap) return { chan: null, lyDo: null };
  const m = textTrang.match(RE_CHAN);
  if (m) return { chan: "dau-hieu-chan", lyDo: `trang có dấu chặn/xác minh: '${m[0]}'` };
  return { chan: null, lyDo: null };
}

/** Hợp nhất bài từ graphql (ưu tiên — có post_id/time_unix thật) và DOM (lấp chỗ
 *  thiếu), trần bài cắt sau khi hợp nhất (điều 3b). */
export function hopNhat(storyTuMang, tuDom, tranBai) {
  const khoaDinhDanh = (p) => `${p.author ?? "?"}|${p.time_label ?? "?"}|${(p.text ?? "").slice(0, 80)}`;
  const theoKhoa = new Map();
  for (const p of storyTuMang) {
    const k = String(p.post_id ?? p.permalink ?? "");
    if (k && !theoKhoa.has(k)) theoKhoa.set(k, { ...p, nguon: "graphql" });
  }
  for (const p of tuDom) {
    const k = String(p.post_id ?? p.permalink ?? khoaDinhDanh(p));
    if (!k || theoKhoa.has(k)) continue;
    theoKhoa.set(`dom-${k}`, { ...p, nguon: "dom" });
  }
  return [...theoKhoa.values()]
    .sort((a, b) => (b.time_unix ?? 0) - (a.time_unix ?? 0))
    .slice(0, tranBai);
}

/** (Điều 3c) bản ghi bài → khuôn message cũ của /agent-report KHÔNG đổi DC:
 *  đúng các trường server ingest giữ lại (text/ts/senderName/senderId/media),
 *  media là mảng {path,url,type}. ts từ time_unix (giây) khi có, không thì hiện tại. */
export function khuonMessage(p, tenNhom, bayGio = new Date()) {
  const ts =
    typeof p.time_unix === "number" && p.time_unix > 0
      ? new Date(p.time_unix * 1000).toISOString()
      : bayGio.toISOString();
  return {
    text: typeof p.text === "string" ? p.text : "",
    ts,
    senderName: p.author ?? "unknown",
    senderId: p.authorId ?? null,
    media: (p.images ?? []).map((url) => ({ path: null, url, type: "image/jpeg" })),
  };
}

// ─── Bóc từ graphql response (ưu tiên): story node có creation_time ───
// Đệ quy sâu, bắt mọi object trông như story — an toàn với việc nguồn đổi tên
// query ở vỏ ngoài.
function bocStory(node, acc, depth = 0) {
  if (!node || typeof node !== "object" || depth > 14) return;
  if (Array.isArray(node)) {
    for (const el of node) bocStory(el, acc, depth + 1);
    return;
  }
  const coTime = typeof node.creation_time === "number";
  const coText = node.message && typeof node.message.text === "string";
  if (coTime && (coText || node.comet_sections || node.attachments)) {
    const story = node.story ?? node; // attachment bọc story con
    acc.push({
      post_id: story.post_id ?? story.id ?? null,
      text: story.message?.text ?? null,
      author: story.actors?.[0]?.name ?? story.actor?.name ?? null,
      authorUrl: story.actors?.[0]?.url ?? story.actor?.url ?? null,
      time_unix: story.creation_time ?? null,
      permalink: story.wwwURL ?? story.url ?? null,
      images: bocAnh(story.attachments ?? [], []),
    });
  }
  for (const v of Object.values(node)) {
    if (v && typeof v === "object") bocStory(v, acc, depth + 1);
  }
}

function bocAnh(node, acc, depth = 0) {
  if (!node || typeof node !== "object" || depth > 10 || acc.length >= 5) return acc;
  if (Array.isArray(node)) {
    for (const el of node) bocAnh(el, acc, depth + 1);
    return acc;
  }
  const uri =
    node.viewer_image?.uri ?? node.image?.uri ?? node.photo_image?.uri ?? node.full_image?.uri;
  if (typeof uri === "string" && /^https:\/\/scontent/.test(uri) && !acc.includes(uri)) {
    acc.push(uri);
  }
  for (const v of Object.values(node)) {
    if (v && typeof v === "object") bocAnh(v, acc, depth + 1);
  }
  return acc;
}

// ─── Bóc DOM theo cấu trúc thật của feed 2026-11 (đo từ lượt thử): bài là
// CON TRỰC TIẾP của div[role="feed"] — KHÔNG bọc role="article"; tác giả nằm
// ở heading (h2/h3/h4) đầu bài, permalink+thời gian là nhãn có dạng thời gian
// («khoảng 1 giờ trước», «2 ngày trước», "2h", "Just now"…).
async function bocDom(page) {
  return page.evaluate(() => {
    // mốc thời gian — 3 dạng: đầy đủ («khoảng 1 giờ trước», «2 days ago»),
    // không số («an hour ago», «một giờ trước»), NGẮN không «ago/trước»
    // («2h», «45m», «3d» — feed tiếng Anh). Loại nhãn sidebar kiểu «File phương
    // tiện mới đây» (không khớp dạng nào).
    const RE_THOIGIAN =
      /(?:\d+|an?|một)(?:\s+few)?\s*(?:phút|giây|giờ|ngày|tuần|tháng|mins?|minutes?|secs?|seconds?|hrs?|hours?|days?|weeks?|months?)\s*(?:trước|ago)$|^(?:vừa xong|vừa đăng|just now|mới đăng)$|^\d+\s*(?:m|min|s|sec|h|hr|d|w|t)$/i;
    // heading mục/feed sidebar — không phải tên tác giả
    const RE_KHONG_PHAI_TACGIA =
      /^(new|new posts|today|earlier|yesterday|recent media|about|giới thiệu|mới|hôm nay|trước đó|hôm qua|file phương tiện .*|thiếu lịch sử chat|no chat history)\??$/i;
    // Đo từ DOM thật 20/11: nhãn thời gian là div/span LÁ (không phải <a>),
    // bài nhóm KHÔNG có link permalink (href chỉ là tham số rác) → định danh
    // bài bằng băm (tác giả|thời gian|đoạn văn) phía Node.
    const laThoiGian = (e) => {
      if (e.children.length > 0) return false;
      const nhan = (e.getAttribute?.("aria-label") ?? e.textContent ?? "").trim();
      return !!nhan && nhan.length < 40 && RE_THOIGIAN.test(nhan);
    };
    const timNhanThoiGian = (root) => {
      for (const e of root.querySelectorAll("a, span, div")) {
        if (laThoiGian(e)) return (e.getAttribute("aria-label") ?? e.textContent ?? "").trim();
      }
      return null;
    };
    // Neo ngược từ PHẦN TỬ THỜI GIAN (luôn tìm được nhờ RE): leo lên tổ tiên
    // chứa heading tác giả = gốc bài; hút tiếp khi cha chưa có MỐC THỜI GIAN
    // THỨ HAI (ôm 2 mốc = sang bài khác). Leo từ heading bị hụt vì nhánh thời
    // gian và nhánh heading rời nhau sâu quá 14 cấp (đo 20/11, tài khoản tiếng Anh).
    const demThoiGian = (root) => [...root.querySelectorAll("a, span, div")].filter(laThoiGian).length;
    const cacMoc = [...document.querySelectorAll("a, span, div")].filter(laThoiGian);
    const containers = [];
    const daCo = new Set();
    for (const m of cacMoc) {
      let el = m;
      let thay = false;
      for (let i = 0; i < 25 && el; i++) {
        if (el.querySelector("h2, h3")) {
          thay = true;
          break;
        }
        el = el.parentElement;
      }
      if (!thay || !el) continue; // mốc không thuộc bài nào có heading (rác/sidebar)
      while (el.parentElement && demThoiGian(el.parentElement) < 2) el = el.parentElement;
      if (!daCo.has(el)) {
        daCo.add(el);
        containers.push(el);
      }
    }
    // vứt container bọc NHIỀU bài khác (tiêu đề mục «Mới/Hôm nay/Trước đó» leo
    // tới wrapper mục) — chỉ giữ cấp bài
    const conCua = (lon, nho) => lon !== nho && lon.contains(nho);
    const posts = [];
    for (const b of containers) {
      if (containers.filter((c) => conCua(b, c)).length >= 2) continue; // b là mục, không phải bài
      const mocDau = [...b.querySelectorAll("a, span, div")].find(laThoiGian) ?? null;
      // tác giả = heading NGAY TRƯỚC mốc thời gian trong thứ tự DOM (heading
      // mục «New/Mới» có thể bị hấp vào đầu container — đứng TRƯỚC tác giả)
      let heading = null;
      for (const h of b.querySelectorAll("h2, h3")) {
        const ten = (h.textContent ?? "").trim();
        if (!ten || ten.length > 60 || ten.includes("\n")) continue;
        if (RE_KHONG_PHAI_TACGIA.test(ten)) continue;
        if (!mocDau || (h.compareDocumentPosition(mocDau) & Node.DOCUMENT_POSITION_FOLLOWING)) heading = h;
      }
      // fallback tiếng Anh: biến thể không dùng h2/h3 — tác giả là LINK HỒ SƠ trong
      // HÀNG TIÊU ĐỀ (dấu DOM công khai của nguồn, đo 20/11). Leo từ mốc thời gian
      // lên CẤP ĐẦU TIÊN có link hồ sơ — dừng ngay ở hàng tiêu đề nên không bao
      // giờ lọt link mention trong thân bài hay bình luận.
      if (!heading && mocDau) {
        let el = mocDau;
        for (let i = 0; i < 10 && el; i++) {
          const lienKet = [
            ...el.querySelectorAll('a[href*="/people/"], a[href*="profile.php?id="], a[href*="/marketplace/profile/"]'),
          ].find((a) => {
            const ten = (a.textContent ?? "").trim();
            return !!ten && ten.length <= 60 && !ten.includes("\n");
          });
          if (lienKet) {
            heading = lienKet;
            break;
          }
          el = el.parentElement;
        }
      }
      const tacGia = heading?.textContent?.trim() ?? null;
      const nhanThoiGian = timNhanThoiGian(b);
      const boQua = new Set([tacGia, nhanThoiGian].filter(Boolean));
      const khoiVanBan = [...b.querySelectorAll('div[dir="auto"]')]
        .filter((d) => !d.querySelector('div[dir="auto"]'))
        .map((d) => (d.textContent ?? "").trim())
        .filter((t) => t.length > 2 && !boQua.has(t));
      const text =
        ([...new Set(khoiVanBan)].join("\n").replace(/…\s*(See more|Xem thêm)/gi, "").trim() || "").slice(0, 5000) ||
        null;
      const anh = [
        ...new Set(
          [...b.querySelectorAll('img[src^="https://scontent"]')]
            .filter((i) => (i.alt ?? "").length > 0 || i.width > 100)
            .map((i) => i.src),
        ),
      ].slice(0, 5);
      if (!nhanThoiGian) continue; // bài thật phải có mốc thời gian
      if (!text && anh.length === 0) continue;
      posts.push({
        post_id: null,
        text,
        author: tacGia,
        authorUrl: heading?.querySelector("a")?.href ?? (heading?.href ?? null),
        time_label: nhanThoiGian,
        time_unix: null,
        permalink: null,
        images: anh,
      });
    }
    return posts;
  });
}

// ─── Main ───
const ARGS = parseArgs(process.argv.slice(2));
function out(...a) {
  console.log(...a);
}

async function daDangNhap(context) {
  // c_user + xs là cặp chứng thực chính của phiên nguồn — đọc từ profile, không in
  const cookies = await context.cookies(`${process.env.S05_WEB_BASE ?? ""}/`);
  const names = new Set(cookies.map((c) => c.name));
  return names.has("c_user") && names.has("xs");
}

async function choDangNhap(context, page) {
  if (await daDangNhap(context)) return true;
  out("⏳ chế độ --dang-nhap: người tự đăng nhập trong cửa sổ vừa mở (tối đa 10′) — mã không gõ gì");
  for (let i = 0; i < 120; i++) {
    await ngu(5_000);
    if (await daDangNhap(context)) return true;
  }
  return false;
}

async function main() {
  const webBase = process.env.S05_WEB_BASE;
  const batDau = Date.now();
  const hetTranTong = () => Date.now() - batDau > TRAN_TONG_MS;
  const ngu = (ms) => new Promise((r) => setTimeout(r, ms));

  if (ARGS.tuKho) {
    // tự kiểm không trình duyệt: đọc config + in tổng hợp JSON (test gọi qua script con)
    const nhom = await docNhomTuCauHinh(
      process.env.S05_CONFIG_TEP ?? new URL(`../${CONFIG_TEP}`, import.meta.url).pathname,
      readFile,
      ARGS.tranNhom,
    );
    const mau = khuonMessage(
      { text: "mẫu", author: "a", time_unix: 1700000000, images: ["https://scontent/x.jpg"] },
      nhom[0]?.ten ?? "n",
    );
    out(JSON.stringify({ nhom: nhom.length, tenDau: nhom[0]?.ten ?? null, mauKhuon: mau }));
    return;
  }

  if (!webBase) {
    out("❌ thiếu S05_WEB_BASE (gốc URL nguồn — tầng A runtime, không nằm trong kho)");
    process.exitCode = 1;
    return;
  }
  const configTep = process.env.S05_CONFIG_TEP ?? new URL(`../${CONFIG_TEP}`, import.meta.url).pathname;
  const nhomCauHinh = ARGS.nhomTay
    ? [{ id: ARGS.nhomTay, ten: ARGS.nhomTay, duong: null, url: ARGS.nhomTay }]
    : await docNhomTuCauHinh(configTep, readFile, ARGS.tranNhom);

  const context = await moTrinhDuyet("s05", { locale: "vi-VN" });
  try {
    const page = context.pages()[0] ?? (await context.newPage());
    if (ARGS.dangNhap && !ARGS.nhomTay) {
      await page.goto(`${webBase}/`, { waitUntil: "domcontentloaded", timeout: 60_000 });
      const ok = await choDangNhap(context, page);
      out(ok ? "✅ đã đăng nhập — profile sẵn sàng (giữ trong ngăn s05 ngoài kho)" : "❌ hết 10′ chưa thấy đăng nhập — chạy lại --dang-nhap");
      process.exitCode = ok ? 0 : 1;
      return;
    }
    if (!(await daDangNhap(context))) {
      out("❌ chưa đăng nhập — chạy --dang-nhap trước (chỉ người tự đăng nhập, mã không gõ)");
      process.exitCode = 1;
      return;
    }

    for (const nhom of nhomCauHinh) {
      if (hetTranTong()) {
        out("⏹ hết trần tổng 8′ — dừng trước nhóm kế tiếp");
        break;
      }
      const urlNhom = nhom.url ?? `${webBase}${nhom.duong}`;
      const ket = await thuMotNhom(context, page, nhom, urlNhom, hetTranTong, ngu, webBase);
      if (ket.chan) {
        // điều 2: chặn → DỪNG CẢ LƯỢT, không thử nhóm kế, không thử lại
        out(`⛔ DỪNG LƯỢT — ${ket.lyDo}`);
        await ghiTomTat(nhom, ket, "CHẶN: " + ket.lyDo);
        process.exitCode = 3;
        return;
      }
      out(ket.tomTat);
      await ghiTomTat(nhom, ket, null);
    }
  } catch (e) {
    out("❌", e.message);
    process.exitCode = 1;
  } finally {
    await context.close().catch(() => {});
  }
}

async function thuMotNhom(context, page, nhom, urlNhom, hetTranTong, ngu, webBase) {
  const storyTuMang = [];
  const mauMang = [];
  const onResp = async (res) => {
    if (hetTranTong()) return;
    if (!/\/api\/graphql/.test(res.url())) return;
    try {
      const ct = res.headers()["content-type"] ?? "";
      const jsonList = [];
      if (ct.includes("text/event-stream")) {
        const text = await res.text();
        for (const line of text.split("\n")) {
          const s = line.startsWith("data:") ? line.slice(5).trim() : "";
          if (!s || s === "[DONE]") continue;
          try {
            jsonList.push(JSON.parse(s));
          } catch {
            /* khối không trọn JSON — bỏ */
          }
        }
      } else {
        jsonList.push(await res.json());
      }
      for (const body of jsonList) {
        if (mauMang.length < 5) mauMang.push(body);
        bocStory(body, storyTuMang);
      }
    } catch {
      /* body không đọc được — bỏ */
    }
  };
  page.on("response", onResp);

  const kiemChan = async (tenBuoc) => {
    const { chan, lyDo } = nhanDienChan({
      daDangNhap: true,
      textTrang: await page.textContent("body").catch(() => "") ?? "",
      urlTrang: page.url() ?? "",
    });
    if (chan) return { chan, lyDo: `${tenBuoc}: ${lyDo}` };
    return null;
  };

  await page.goto(urlNhom, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await ngu(4_000);
  const chanDau = await kiemChan("sau-khi-mo");
  if (chanDau) {
    page.off("response", onResp);
    return chanDau;
  }

  // feed ảo hoá sau cuộn → bóc tích luỹ sau MỖI bước cuộn, hợp nhất theo khoá
  const domMap = new Map();
  const bocVaoMap = (posts) => {
    for (const p of posts) {
      const k = String(p.post_id ?? p.permalink ?? `${p.author}|${p.time_label}|${(p.text ?? "").slice(0, 80)}`);
      if (k && !domMap.has(k)) domMap.set(k, { ...p, nguon: "dom" });
    }
  };
  bocVaoMap(await bocDom(page));

  let daChan = null;
  for (let s = 0; s <= ARGS.maxScroll && !hetTranTong(); s++) {
    // điều 1: chỉ bấm nút Đóng nằm TRONG hộp thoại đang che trang — không gì khác
    await page
      .evaluate(() => {
        for (const hd of document.querySelectorAll('div[role="dialog"]')) {
          hd.querySelectorAll('[aria-label="Đóng"], [aria-label="Close"], [aria-label="đóng"]').forEach((b) => b.click());
        }
      })
      .catch(() => {});
    daChan ??= await kiemChan(`scroll-${s + 1}`);
    if (daChan) break; // dừng ngay, không cuộn tiếp, không thử lại
    await page.mouse.wheel(0, 1_600 + Math.floor(Math.random() * 500));
    await ngu(1_800 + Math.floor(Math.random() * 900));
    bocVaoMap(await bocDom(page));
    out(`   ${nhom.id} scroll ${s + 1}/${ARGS.maxScroll} · graphql ${storyTuMang.length} · dom ${domMap.size}`);
  }
  page.off("response", onResp);
  if (daChan) return daChan;

  const bai = hopNhat(storyTuMang, [...domMap.values()], ARGS.tranBai);

  if (ARGS.chan) {
    await mkdir(OUT_DIR, { recursive: true });
    await page.screenshot({ path: join(OUT_DIR, "chan-man-hinh.png"), fullPage: false });
    await writeFile(join(OUT_DIR, "chan-trang.txt"), (await page.locator("body").ariaSnapshot()).slice(0, 30_000));
  }

  const iso = new Date().toISOString().replace(/[:.]/g, "-");
  const key = nhom.id.slice(0, 40);
  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(join(OUT_DIR, `${iso}-${key}.jsonl`), bai.map((p) => JSON.stringify(p)).join("\n"));
  for (let i = 0; i < mauMang.length; i++) {
    await writeFile(join(OUT_DIR, `${iso}-${key}.graphql-${i}.json`), JSON.stringify(mauMang[i], null, 1));
  }

  const dem = (f) => bai.filter((p) => p[f] !== null && p[f] !== undefined && p[f] !== "").length;
  const tomTat = [
    `nhóm: ${key} (${nhom.ten})`,
    `bài lấy: ${bai.length} (graphql ${bai.filter((p) => p.nguon === "graphql").length} / dom ${bai.filter((p) => p.nguon === "dom").length})`,
    `phủ trường: text ${dem("text")}/${bai.length} · author ${dem("author")}/${bai.length} · time ${dem("time_unix")}/${bai.length} · permalink ${dem("permalink")}/${bai.length} · images ${dem("images")}/${bai.length}`,
    `trần: nhóm ${ARGS.tranNhom} · bài ${ARGS.tranBai} · scroll ${ARGS.maxScroll} · tổng ${Math.round((Date.now() - batDau) / 1000)}s`,
    `nạp: ${ARGS.gui ? "SẼ GỬI /agent-report" : "KHÔNG — chỉ file thử research-local (điều 7)"}`,
  ].join("\n");

  if (ARGS.gui) {
    const ket = await guiAgentReport(bai, nhom.ten);
    if (!ket.ok) {
      return { chan: null, lyDo: null, tomTat: tomTat + `\n⚠️ gửi /agent-report lỗi: ${ket.lyDo}`, bai };
    }
  }
  return { chan: null, lyDo: null, tomTat, bai };
}

async function ghiTomTat(nhom, ket, lyDoChan) {
  const iso = new Date().toISOString().replace(/[:.]/g, "-");
  const key = nhom.id.slice(0, 40);
  await mkdir(OUT_DIR, { recursive: true });
  const noiDung = [
    lyDoChan ? `⛔ ${lyDoChan}` : ket.tomTat,
    `mã thoát: ${lyDoChan ? 3 : 0}`,
  ].join("\n");
  await writeFile(join(OUT_DIR, `${iso}-${key}.tom-tat.txt`), noiDung + "\n");
}

/** POST /agent-report khuôn cũ — CHỈ khi --gui (điều 7: mặc định không nạp). */
async function guiAgentReport(bai, tenNhom) {
  const agentId = process.env.S05_AGENT_ID;
  if (!agentId) {
    return { ok: false, lyDo: "thiếu S05_AGENT_ID (giá trị khuôn cũ mà lớp lọc transform nhận)" };
  }
  const url = `${process.env.COLLECTOR_URL ?? "http://localhost:9210"}/agent-report`;
  const messages = bai.map((p) => khuonMessage(p, tenNhom));
  const max = Math.min(messages.length, TRAN_LO_TIN);
  let ok = 0;
  for (let i = 0; i < max; i += 500) {
    const lo = messages.slice(i, i + 500);
    const body = { agent_id: agentId, group: tenNhom, messages: lo };
    try {
      const r = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      if (!r.ok) return { ok: false, lyDo: `HTTP ${r.status}: ${(await r.text()).slice(0, 200)}` };
      ok += lo.length;
    } catch (e) {
      return { ok: false, lyDo: String(e?.message ?? e) };
    }
  }
  out(`→ gửi ${ok}/${messages.length} tin qua /agent-report`);
  return { ok: true, daGui: ok };
}

// chạy main CHỈ khi chạy trực tiếp — import để test không mở trình duyệt
const laTrucTiep = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (laTrucTiep) {
  await main();
}
