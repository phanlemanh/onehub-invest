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
// token cho phienTu phải còn hạn theo ĐỒNG HỒ THẬT (phienTu dùng Date.now())
const jwtThat = (uid) => jwt({ uid, exp: giay(Date.now() + 600_000) });
const CON_HAN = jwt({ uid: "1", exp: giay(NOW + 600_000) });
const CO_DANG_NHAP = /login --source /;
const VONG_CAM = /enable-automation|remote-debugging|headless|AutomationControlled/;
const kq = (duong, xacThuc = [], khungNap = false) => ({ duong, xacThuc, khungNap });
/** Trình lấy token với bước nạp giả; trả về [trình, danh sách đường đã nạp]. */
function phienGia(m, mo) {
  const dong = [];
  return { p: m.phienTu(mo, (...a) => void dong.push(a.join(" "))), dong };
}

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

    ["AC-4 đường kế: khung không nạp được → thử đường kế", () => m.thuDuongKe(kq("/favicon.ico")) === true],
    ["AC-4 đường kế: khung nạp được, chưa thấy lời gọi xác thực → DỪNG", () => m.thuDuongKe(kq("/x", [], true)) === false],
    ["AC-4 đường kế: thấy mã 200 → dừng", () => m.thuDuongKe(kq("/x", [200], true)) === false],
    ["AC-4 đường kế: thấy mã 401 → dừng", () => m.thuDuongKe(kq("/x", [401], true)) === false],
    ["AC-4 đường kế: thấy mã 403 → dừng", () => m.thuDuongKe(kq("/x", [403], true)) === false],
    ["AC-4 đường kế: thấy mã 500 → dừng", () => m.thuDuongKe(kq("/x", [500], true)) === false],

    ["AC-5 chẩn đoán: 401 → BỊ TỪ CHỐI, chỉ lệnh đăng nhập", () => {
      const s = m.chanDoanKhongCoToken([kq("/a", [401], true)]);
      return /BỊ TỪ CHỐI/.test(s) && CO_DANG_NHAP.test(s);
    }],
    ["AC-5 chẩn đoán: 403 → BỊ TỪ CHỐI", () => /BỊ TỪ CHỐI/.test(m.chanDoanKhongCoToken([kq("/a", [403], true)]))],
    ["AC-5 chẩn đoán: 200 mà không có token → ứng dụng chạy nhưng không cấp (không đổ cho phiên)", () => {
      const s = m.chanDoanKhongCoToken([kq("/favicon.ico", [200, 200], true)]);
      return /ứng dụng chạy nhưng không cấp/.test(s) && !/BỊ TỪ CHỐI/.test(s);
    }],
    ["AC-5 chẩn đoán: khung không nạp được ở hai đường dẫn → KHÔNG nạp được khung, liệt kê đường dẫn, chỉ lệnh đăng nhập", () => {
      const s = m.chanDoanKhongCoToken([kq("/favicon.ico"), kq("/data/vn")]);
      return /KHÔNG nạp được khung/.test(s) && /\/favicon\.ico, \/data\/vn/.test(s) && CO_DANG_NHAP.test(s);
    }],
    ["AC-5 chẩn đoán: khung nạp được mà không có token → nói ứng dụng có mặt nhưng không có phiên, chỉ lệnh đăng nhập", () => {
      const s = m.chanDoanKhongCoToken([kq("/favicon.ico", [], true)]);
      return /nạp được khung nhưng không có token/.test(s) && !/KHÔNG nạp được khung/.test(s) && CO_DANG_NHAP.test(s);
    }],
    ["AC-5 chẩn đoán: danh sách rỗng → KHÔNG nạp được khung (không ném)", () => /KHÔNG nạp được khung/.test(m.chanDoanKhongCoToken([]))],
    ["AC-5 chẩn đoán: token còn hạn bị máy chủ từ chối, không nhận được token khác → nói vậy", () => {
      const s = m.chanDoanKhongCoToken([kq("/favicon.ico", [], true)], true);
      return /từ chối token còn hạn/.test(s) && CO_DANG_NHAP.test(s);
    }],

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
    ["AC-9 đăng nhập: đổi được tệp chạy Chrome bằng biến môi trường", () =>
      m.duongChrome({ AIRDNA_CHROME_BIN: "/x/chrome" }, "/mac-dinh") === "/x/chrome" && m.duongChrome({}, "/mac-dinh") === "/mac-dinh"],

    ["AC-10 profile: biến môi trường thắng", () => m.thuMucProfile({ AIRDNA_PROFILE_DIR: "/ngoai-kho/profile/" }, "/mac-dinh/") === "/ngoai-kho/profile/"],
    ["AC-10 profile: thiếu biến → mặc định", () => m.thuMucProfile({}, "/mac-dinh/") === "/mac-dinh/"],
    ["AC-10 profile: biến rỗng → mặc định", () => m.thuMucProfile({ AIRDNA_PROFILE_DIR: "" }, "/mac-dinh/") === "/mac-dinh/"],

    // ---- hành vi của trình lấy token và của phép xếp đường (bước nạp giả, không trình duyệt)
    ["AC-6 trình lấy token: không có token → ném LoiXacThuc sau đúng MỘT dòng AUTH FAIL [S02]", async () => {
      const { p, dong } = phienGia(m, async () => "");
      let nem = null;
      try { await p.token(); } catch (e) { nem = e; }
      return nem instanceof m.LoiXacThuc && dong.filter((d) => d.includes("AUTH FAIL [S02]")).length === 1;
    }],
    ["AC-6 trình lấy token: bước nạp ném lỗi THƯỜNG → vẫn dừng cả lượt bằng LoiXacThuc, một dòng AUTH FAIL", async () => {
      const { p, dong } = phienGia(m, async () => { throw new TypeError("loi thuong"); });
      let nem = null;
      try { await p.token(); } catch (e) { nem = e; }
      return nem instanceof m.LoiXacThuc && /loi thuong/.test(nem.message) && dong.filter((d) => d.includes("AUTH FAIL [S02]")).length === 1;
    }],
    ["AC-6 trình lấy token: sau 401 chỉ nạp MỘT đường dẫn, loại đúng token bị từ chối, không trả lại nó", async () => {
      const tokCu = jwtThat("a");
      const daNap = [];
      const { p } = phienGia(m, async (duong, _k, loaiBo) => { if (loaiBo) daNap.push(duong); return tokCu; });
      let nem = null;
      try { await p.token(); await p.token(true); } catch (e) { nem = e; }
      return nem instanceof m.LoiXacThuc && daNap.length === 1 && daNap[0] === "/favicon.ico";
    }],
    ["AC-6 trình lấy token: sau 401 nhận được token KHÁC → trả token mới", async () => {
      const tokCu = jwtThat("a");
      const tokMoi = jwtThat("b");
      let n = 0;
      const { p } = phienGia(m, async () => (++n === 1 ? tokCu : tokMoi));
      try { await p.token(); return (await p.token(true)) === tokMoi; } catch { return false; }
    }],
    ["AC-6 đọc token: appToken không phải chuỗi → rỗng (TypeError không lọt ra khỏi bước đọc)", () =>
      m.chuoiAppToken({ appToken: "abc" }) === "abc" && m.chuoiAppToken({ appToken: 123 }) === "" && m.chuoiAppToken(null) === ""],
    ["AC-4 xếp đường: khung không nạp được ở đường đầu → thử đường kế, gặp token thì dừng", async () => {
      const { token, ketQua } = await m.thuDuongUngVien(async (duong, k) => { if (duong === "/favicon.ico") return ""; k.khungNap = true; return "tok-moi"; });
      return token === "tok-moi" && ketQua.map((x) => x.duong).join(",") === "/favicon.ico,/robots.txt";
    }],
    ["AC-4 xếp đường: khung nạp được mà không có token → DỪNG, không nạp đường khác (kể cả route dữ liệu)", async () => {
      const daNap = [];
      const { token } = await m.thuDuongUngVien(async (duong, k) => { daNap.push(duong); k.khungNap = true; return ""; });
      return token === "" && daNap.join(",") === "/favicon.ico";
    }],
    ["AC-4 xếp đường: mọi đường bị thử thách → thử đủ ba rồi dừng", async () => {
      const { token, ketQua } = await m.thuDuongUngVien(async () => "");
      return token === "" && ketQua.length === 3;
    }],
  ];
}

/** Chạy ma trận trên một mô-đun; trả về tên ô đỏ đầu tiên (null khi đạt hết). */
async function chayMaTran(m) {
  for (const [ten, kiem] of maTran(m)) {
    let dat = false;
    try { dat = (await kiem()) === true; } catch { dat = false; }
    if (!dat) return ten;
  }
  return null;
}

const TAM = [];
let loi = 0;
try {
  const that = await import(pathToFileURL(SRC).href);
  for (const [ten, kiem] of maTran(that)) {
    let dat = false;
    try { dat = (await kiem()) === true; } catch { dat = false; }
    console.log(dat ? `đạt: bản thật · ${ten}` : `ĐỎ: bản thật hỏng ở ô: ${ten}`);
    if (!dat) loi = 1;
  }

  // ---- bản đột biến: [tên, chuỗi gốc, chuỗi đổi, ô phải đỏ]
  const DOT_BIEN = [
    ["bỏ lề token", ".conLaiMs > LE_HAN_TOKEN_MS;", ".conLaiMs > 0;", "AC-1 lề: còn 29 giây → không dùng"],
    ["bỏ vế ép làm mới", "return !epLamMoi && duDungKhong(dangGiu, now);", "return duDungKhong(dangGiu, now);", "AC-2 giữ: còn hạn, ép làm mới → không dùng lại"],
    ["khung nạp được vẫn thử đường kế", "return !ketQua.khungNap && ketQua.xacThuc.length === 0;", "return ketQua.xacThuc.length === 0;", "AC-4 đường kế: khung nạp được, chưa thấy lời gọi xác thực → DỪNG"],
    ["luôn thử đường kế", "return !ketQua.khungNap && ketQua.xacThuc.length === 0;", "return true;", "AC-4 đường kế: khung nạp được, chưa thấy lời gọi xác thực → DỪNG"],
    ["bỏ nhận 401/403", "(s) => s === 401 || s === 403", "(s) => false", "AC-5 chẩn đoán: 401 → BỊ TỪ CHỐI, chỉ lệnh đăng nhập"],
    ["đổ khung nạp được cho «không nạp được»", "if (ketQua.some((k) => k.khungNap)) {", "if (false) {", "AC-5 chẩn đoán: khung nạp được mà không có token → nói ứng dụng có mặt nhưng không có phiên, chỉ lệnh đăng nhập"],
    ["profile sai chỗ", "--user-data-dir=${profileDir}", "--khong-phai-profile=${profileDir}", "AC-9 đăng nhập: đúng một tham số trỏ thư mục profile"],
    ["bỏ biến môi trường Chrome", "return env.AIRDNA_CHROME_BIN || macDinh;", "return macDinh;", "AC-9 đăng nhập: đổi được tệp chạy Chrome bằng biến môi trường"],
    ["bỏ biến môi trường profile", "return env.AIRDNA_PROFILE_DIR || macDinh;", "return macDinh;", "AC-10 profile: biến môi trường thắng"],
    ["quên đổi lỗi thường thành lỗi dừng cả lượt", "throw e instanceof LoiXacThuc ? e : nemAuthFail(log, new LoiXacThuc(e));", "throw e;", "AC-6 trình lấy token: bước nạp ném lỗi THƯỜNG → vẫn dừng cả lượt bằng LoiXacThuc, một dòng AUTH FAIL"],
    ["trả lại token bị từ chối", "if (token && token !== loaiBo)", "if (token)", "AC-6 trình lấy token: sau 401 chỉ nạp MỘT đường dẫn, loại đúng token bị từ chối, không trả lại nó"],
    ["sau 401 vẫn thử mọi đường", "biTuChoi ? 1 : DUONG_MO_UNG_DUNG.length", "DUONG_MO_UNG_DUNG.length", "AC-6 trình lấy token: sau 401 chỉ nạp MỘT đường dẫn, loại đúng token bị từ chối, không trả lại nó"],
    ["đọc token không kiểm kiểu", "return typeof t === \"string\" ? t : \"\";", "return t;", "AC-6 đọc token: appToken không phải chuỗi → rỗng (TypeError không lọt ra khỏi bước đọc)"],
    ["xếp đường không dừng khi khung đã nạp", "if (!thuDuongKe(k))", "if (false)", "AC-4 xếp đường: khung nạp được mà không có token → DỪNG, không nạp đường khác (kể cả route dữ liệu)"],
  ];
  const goc = readFileSync(SRC, "utf8");
  for (const [ten, tim, thay, oGhim] of DOT_BIEN) {
    if (!goc.includes(tim)) { console.log(`ĐỎ: không thấy điểm đột biến «${ten}» trong dist — phép đo lệch cây mã`); loi = 1; continue; }
    const f = join(DIST, `.dot-bien-${TAM.length + 1}.js`);
    writeFileSync(f, goc.replace(tim, thay));
    TAM.push(f);
    const m = await import(pathToFileURL(f).href + "?v=" + Date.now());
    const oDo = await chayMaTran(m);
    if (oDo === oGhim) console.log(`đạt: bản đột biến (${ten}) bị bắt ở ô: ${oDo}`);
    else { console.log(`ĐỎ: ${oDo ? `bản đột biến (${ten}) đỏ sai ô: ${oDo}` : `thước mù — bản đột biến (${ten}) vẫn xanh`}`); loi = 1; }
  }
} finally {
  for (const f of TAM) rmSync(f, { force: true });
}
console.log(loi === 0 ? "XANH" : "ĐỎ");
process.exit(loi);
