#!/usr/bin/env node
// Phép đo AC-1, AC-2, AC-4, AC-5, AC-9 và phần profile của AC-10 (hồ sơ s02-phien-qua-khung-ung-dung):
// ma trận các hàm thuần của bộ thu S02 chạy trên bản dist THẬT (phải đạt hết) và trên BẢN ĐỘT BIẾN —
// bản chép cạnh dist có đúng MỘT điểm đổi — điểm đó PHẢI làm đỏ đúng ô được ghim. Cùng ma trận, cùng mốc now.
// Thoát 0 chỉ khi: bản thật đạt mọi ô VÀ mọi bản đột biến bị bắt đúng ô.
// Không ghi tệp lâu dài: bản chép nằm cạnh dist (thư mục bị bỏ qua bởi git) và xoá trong finally.
// Bộ thu S02 = tệp dist duy nhất xuất docExpAppToken (không ghi tên tệp vào phép đo).
import { readFileSync, writeFileSync, rmSync, existsSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const DIST = join(ROOT, "collector/dist/collectors");
if (!existsSync(DIST)) { console.error("ĐỎ: thiếu collector/dist — build collector trước"); process.exit(2); }
const coHam = readdirSync(DIST).filter((f) => f.endsWith(".js") && !f.startsWith("."))
  .filter((f) => readFileSync(join(DIST, f), "utf8").includes("export function docExpAppToken"));
if (coHam.length !== 1) { console.error(`ĐỎ: cần đúng một tệp dist xuất docExpAppToken, thấy ${coHam.length}`); process.exit(2); }
const SRC = join(DIST, coHam[0]);
const NOW = Date.UTC(2026, 10, 25, 3, 0, 0); // mốc cố định — hạn tính theo now truyền vào, không ghim năm thật
const giay = (ms) => Math.floor(ms / 1000);
const jwt = (p) => `eyJhbGciOiJIUzI1NiJ9.${Buffer.from(JSON.stringify(p)).toString("base64url")}.chuky`;
const CON_HAN = jwt({ uid: "1", exp: giay(NOW + 600_000) });
const CO_DANG_NHAP = /login --source /;
const VONG_CAM = /enable-automation|remote-debugging|headless|AutomationControlled/;

// ---- ma trận: [tên ô, đạt khi trả đúng]
function maTran(m) {
  return [
    ["AC-1 lề: còn 31 giây → dùng được", () => m.duDungKhong(jwt({ uid: "1", exp: giay(NOW + 31_000) }), NOW) === true],
    ["AC-1 lề: còn 29 giây → không dùng", () => m.duDungKhong(jwt({ uid: "1", exp: giay(NOW + 29_000) }), NOW) === false],
    ["AC-1 lề: hết hạn 1 giây → không dùng", () => m.duDungKhong(jwt({ uid: "1", exp: giay(NOW - 1_000) }), NOW) === false],
    ["AC-1 lề: chuỗi rác → không dùng", () => m.duDungKhong("khong-phai-jwt", NOW) === false],
    ["AC-1 lề: rỗng → không dùng", () => m.duDungKhong("", NOW) === false],

    ["AC-2 giữ: còn hạn, không ép → dùng lại", () => m.dungLaiToken(CON_HAN, false, NOW) === true],
    ["AC-2 giữ: còn hạn, ép làm mới → không dùng lại", () => m.dungLaiToken(CON_HAN, true, NOW) === false],
    ["AC-2 giữ: rỗng, không ép → không dùng lại", () => m.dungLaiToken("", false, NOW) === false],
    ["AC-2 giữ: hết hạn, không ép → không dùng lại", () => m.dungLaiToken(jwt({ uid: "1", exp: giay(NOW - 1_000) }), false, NOW) === false],

    ["AC-4 đường kế: ứng dụng không khởi động → thử đường kế", () => m.thuDuongKe({ duong: "/favicon.ico", xacThuc: [] }) === true],
    ["AC-4 đường kế: thấy mã 200 → dừng", () => m.thuDuongKe({ duong: "/x", xacThuc: [200] }) === false],
    ["AC-4 đường kế: thấy mã 401 → dừng", () => m.thuDuongKe({ duong: "/x", xacThuc: [401] }) === false],
    ["AC-4 đường kế: thấy mã 403 → dừng", () => m.thuDuongKe({ duong: "/x", xacThuc: [403] }) === false],
    ["AC-4 đường kế: thấy mã 500 → dừng", () => m.thuDuongKe({ duong: "/x", xacThuc: [500] }) === false],

    ["AC-5 chẩn đoán: 401 → phiên ĐÃ HẾT, chỉ lệnh đăng nhập", () => {
      const s = m.chanDoanKhongCoToken([{ duong: "/a", xacThuc: [401] }]);
      return /ĐÃ HẾT/.test(s) && CO_DANG_NHAP.test(s);
    }],
    ["AC-5 chẩn đoán: 403 → phiên ĐÃ HẾT", () => /ĐÃ HẾT/.test(m.chanDoanKhongCoToken([{ duong: "/a", xacThuc: [403] }]))],
    ["AC-5 chẩn đoán: 200 mà không có token → ứng dụng chạy nhưng không cấp (không đổ cho phiên)", () => {
      const s = m.chanDoanKhongCoToken([{ duong: "/favicon.ico", xacThuc: [200, 200] }]);
      return /ứng dụng chạy nhưng không cấp/.test(s) && !/ĐÃ HẾT/.test(s);
    }],
    ["AC-5 chẩn đoán: không lời gọi nào ở hai đường dẫn → KHÔNG khởi động, liệt kê đường dẫn, chỉ lệnh đăng nhập", () => {
      const s = m.chanDoanKhongCoToken([{ duong: "/favicon.ico", xacThuc: [] }, { duong: "/data/vn", xacThuc: [] }]);
      return /KHÔNG khởi động/.test(s) && /\/favicon\.ico, \/data\/vn/.test(s) && CO_DANG_NHAP.test(s);
    }],
    ["AC-5 chẩn đoán: danh sách rỗng → KHÔNG khởi động (không ném)", () => /KHÔNG khởi động/.test(m.chanDoanKhongCoToken([]))],

    ["AC-3 ứng viên: route dữ liệu đứng cuối, không lặp, đều là đường dẫn tương đối", () => {
      const d = m.DUONG_MO_UNG_DUNG;
      return Array.isArray(d) && d.at(-1) === "/data/vn" && new Set(d).size === d.length && d.every((x) => /^\/[\w./-]*$/.test(x));
    }],

    ["AC-9 đăng nhập: đúng một tham số trỏ thư mục profile", () => {
      const a = m.argsMoChromeDangNhap("/tmp/profile-thu");
      return a.filter((x) => x === "--user-data-dir=/tmp/profile-thu").length === 1;
    }],
    ["AC-9 đăng nhập: tham số cuối là https tới route dữ liệu, không cờ tự động hoá", () => {
      const a = m.argsMoChromeDangNhap("/tmp/profile-thu");
      return /^https:\/\/[\w.-]+\/data\/vn$/.test(String(a.at(-1))) && !a.some((x) => VONG_CAM.test(x));
    }],
    ["AC-9 đăng nhập: bộ thu khai hàm login", () => typeof m.airdnaResearch.login === "function"],

    ["AC-10 profile: biến môi trường thắng", () => m.thuMucProfile({ AIRDNA_PROFILE_DIR: "/ngoai-kho/profile/" }, "/mac-dinh/") === "/ngoai-kho/profile/"],
    ["AC-10 profile: thiếu biến → mặc định", () => m.thuMucProfile({}, "/mac-dinh/") === "/mac-dinh/"],
    ["AC-10 profile: biến rỗng → mặc định", () => m.thuMucProfile({ AIRDNA_PROFILE_DIR: "" }, "/mac-dinh/") === "/mac-dinh/"],
  ];
}

/** Chạy ma trận trên một mô-đun; trả về tên ô đỏ đầu tiên (null khi đạt hết). */
function chayMaTran(m) {
  for (const [ten, kiem] of maTran(m)) {
    let dat = false;
    try { dat = kiem() === true; } catch { dat = false; }
    if (!dat) return ten;
  }
  return null;
}

const TAM = [];
let loi = 0;
try {
  const that = await import(pathToFileURL(SRC).href);
  for (const [ten] of maTran(that)) console.log(`đạt: bản thật · ${ten}`);
  const doThat = chayMaTran(that);
  if (doThat) { console.log(`ĐỎ: bản thật hỏng ở ô: ${doThat}`); loi = 1; }

  // ---- bản đột biến: [tên, chuỗi gốc, chuỗi đổi, ô phải đỏ]
  const DOT_BIEN = [
    ["bỏ lề token", ".conLaiMs > LE_HAN_TOKEN_MS;", ".conLaiMs > 0;", "AC-1 lề: còn 29 giây → không dùng"],
    ["bỏ vế ép làm mới", "return !epLamMoi && duDungKhong(dangGiu, now);", "return duDungKhong(dangGiu, now);", "AC-2 giữ: còn hạn, ép làm mới → không dùng lại"],
    ["luôn thử đường kế", "return ketQua.xacThuc.length === 0;", "return true;", "AC-4 đường kế: thấy mã 200 → dừng"],
    ["bỏ nhận 401/403", "(s) => s === 401 || s === 403", "(s) => false", "AC-5 chẩn đoán: 401 → phiên ĐÃ HẾT, chỉ lệnh đăng nhập"],
    ["profile sai chỗ", "--user-data-dir=${profileDir}", "--khong-phai-profile=${profileDir}", "AC-9 đăng nhập: đúng một tham số trỏ thư mục profile"],
    ["bỏ biến môi trường profile", "return env.AIRDNA_PROFILE_DIR || macDinh;", "return macDinh;", "AC-10 profile: biến môi trường thắng"],
  ];
  const goc = readFileSync(SRC, "utf8");
  for (const [ten, tim, thay, oGhim] of DOT_BIEN) {
    if (!goc.includes(tim)) { console.log(`ĐỎ: không thấy điểm đột biến «${ten}» trong dist — phép đo lệch cây mã`); loi = 1; continue; }
    const f = join(DIST, `.dot-bien-${TAM.length + 1}.js`);
    writeFileSync(f, goc.replace(tim, thay));
    TAM.push(f);
    const m = await import(pathToFileURL(f).href + "?v=" + Date.now());
    const oDo = chayMaTran(m);
    if (oDo === oGhim) console.log(`đạt: bản đột biến (${ten}) bị bắt ở ô: ${oDo}`);
    else { console.log(`ĐỎ: ${oDo ? `bản đột biến (${ten}) đỏ sai ô: ${oDo}` : `thước mù — bản đột biến (${ten}) vẫn xanh`}`); loi = 1; }
  }
} finally {
  for (const f of TAM) rmSync(f, { force: true });
}
console.log(loi === 0 ? "XANH" : "ĐỎ");
process.exit(loi);
