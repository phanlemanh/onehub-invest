#!/usr/bin/env node
// Phép đo AC-6, AC-7, AC-8 (hồ sơ s02-phien-qua-khung-ung-dung): hành vi `call()` của bộ thu S02 với hàm gửi giả
// (không mạng, không trình duyệt). Bản dist THẬT phải đạt hết; BẢN ĐỘT BIẾN (bản chép cạnh dist, đúng MỘT điểm đổi)
// PHẢI làm đỏ đúng ô được ghim. Thoát 0 chỉ khi cả hai điều kiện đúng. Bản chép xoá trong finally.
// Thứ tự ca có nghĩa: ô ghim của bản đột biến là ô ĐỎ ĐẦU theo thứ tự này.
// call() đọc đồng hồ THẬT (Date.now()) để xét hạn token — nên token của phép đo tính theo giờ thật.
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
const giay = (ms) => Math.floor(ms / 1000);
const jwt = (p) => `eyJhbGciOiJIUzI1NiJ9.${Buffer.from(JSON.stringify(p)).toString("base64url")}.chuky`;
const tokConHan = (uid = "1") => jwt({ uid, exp: giay(Date.now() + 600_000) });
const tokSapHet = () => jwt({ uid: "1", exp: giay(Date.now() + 5_000) });

function ctxThu(m, getToken, refreshToken) {
  const dong = [];
  return { ctx: { rateLimit: { take: async () => {} }, log: (...a) => dong.push(a.join(" ")), failed: 0, getToken, refreshToken }, dong };
}
const guiJson = (trangThai, than) => async () => new Response(JSON.stringify(than), { status: trangThai, headers: { "content-type": "application/json" } });
const soAuth = (dong) => dong.filter((d) => d.includes("AUTH FAIL [S02]")).length;

// ---- ca: [tên, hàm chạy trên mô-đun; đạt khi trả đúng]
function cacCa(m) {
  return [
    ["AC-8 sắp hết hạn: làm mới đúng một lần TRƯỚC lời gửi, API nhận token mới", async () => {
      let hienTai = tokSapHet();
      const TOK_MOI = tokConHan("b");
      let nLamMoi = 0;
      let nhan = "";
      const { ctx } = ctxThu(m, () => hienTai, async () => { nLamMoi++; hienTai = TOK_MOI; });
      const kq = await m.call("GET", "/v1/market/1", null, ctx, async (_url, init) => {
        nhan = String(init.headers.authorization);
        return guiJson(200, { payload: { id: 1 } })();
      });
      return nLamMoi === 1 && nhan === `Bearer ${TOK_MOI}` && typeof kq?.kind === "string" && kq.kind.length > 0 && ctx.failed === 0;
    }],
    ["AC-8 còn hạn: không làm mới thừa", async () => {
      const { ctx } = ctxThu(m, tokConHan, async () => { throw new Error("không được gọi làm mới khi token còn hạn"); });
      const kq = await m.call("GET", "/v1/market/1", null, ctx, guiJson(200, { payload: { id: 1 } }));
      return typeof kq?.kind === "string" && kq.kind.length > 0 && ctx.failed === 0;
    }],
    ["AC-6 401 một lần, làm mới cho token KHÁC → gửi lại bằng token mới và thành công", async () => {
      const TOK_A = tokConHan("a");
      const TOK_B = tokConHan("b");
      let hienTai = TOK_A;
      const authDaGui = [];
      const { ctx } = ctxThu(m, () => hienTai, async () => { hienTai = TOK_B; });
      const kq = await m.call("GET", "/v1/market/1", null, ctx, async (_url, init) => {
        authDaGui.push(String(init.headers.authorization));
        return authDaGui.length === 1 ? new Response(null, { status: 401 }) : guiJson(200, { payload: { id: 1 } })();
      });
      return typeof kq?.kind === "string" && authDaGui.join("|") === `Bearer ${TOK_A}|Bearer ${TOK_B}` && ctx.failed === 0;
    }],
    ["AC-6 401 mà làm mới KHÔNG đổi token → không gửi lại, ném LoiXacThuc sau đúng MỘT dòng AUTH FAIL [S02]", async () => {
      let daGui = 0;
      const { ctx, dong } = ctxThu(m, tokConHan, async () => {});
      let nem = null;
      try { await m.call("GET", "/v1/market/1", null, ctx, async () => { daGui++; return new Response(null, { status: 401 }); }); } catch (e) { nem = e; }
      return nem instanceof m.LoiXacThuc && daGui === 1 && soAuth(dong) === 1;
    }],
    ["AC-6 401 hai lần (đã đổi token) → ném LoiXacThuc sau đúng MỘT dòng AUTH FAIL [S02]", async () => {
      let hienTai = tokConHan("a");
      const TOK_B = tokConHan("b");
      let nLamMoi = 0;
      let daGui = 0;
      const { ctx, dong } = ctxThu(m, () => hienTai, async () => { nLamMoi++; hienTai = TOK_B; });
      let nem = null;
      try { await m.call("GET", "/v1/market/1", null, ctx, async () => { daGui++; return new Response(null, { status: 401 }); }); } catch (e) { nem = e; }
      return nem instanceof m.LoiXacThuc && soAuth(dong) === 1 && nLamMoi === 1 && daGui === 2;
    }],
    ["AC-6 làm mới hỏng: ném LoiXacThuc, 0 lời gửi, không tính là lời gọi lỗi", async () => {
      let daGui = 0;
      const { ctx, dong } = ctxThu(m, tokSapHet, async () => { throw new m.LoiXacThuc(new Error("phiên đăng nhập đã hết")); });
      let nem = null;
      try { await m.call("GET", "/v1/market/1", null, ctx, async () => { daGui++; return new Response(null, { status: 200 }); }); } catch (e) { nem = e; }
      return nem instanceof m.LoiXacThuc && daGui === 0 && ctx.failed === 0 && soAuth(dong) === 0;
    }],
    ["AC-7 lỗi thường: HTTP 500 → trả null, tính đúng một lời gọi lỗi, không ném", async () => {
      const { ctx } = ctxThu(m, tokConHan, async () => {});
      const kq = await m.call("GET", "/v1/market/1", null, ctx, async () => new Response(null, { status: 500 }));
      return kq === null && ctx.failed === 1;
    }],
  ];
}

/** Chạy lần lượt; in «đạt: bản thật · ô» khi đạt và được yêu cầu in. Trả về tên ô đỏ đầu tiên (null khi đạt hết). */
async function chayCacCa(m, inKetQuaThat) {
  for (const [ten, kiem] of cacCa(m)) {
    let dat = false;
    try { dat = (await kiem()) === true; } catch { dat = false; }
    if (!dat) return ten;
    if (inKetQuaThat) console.log(`đạt: bản thật · ${ten}`);
  }
  return null;
}

const TAM = [];
let loi = 0;
try {
  const that = await import(pathToFileURL(SRC).href);
  const doThat = await chayCacCa(that, true);
  if (doThat) { console.log(`ĐỎ: bản thật hỏng ở ô: ${doThat}`); loi = 1; }

  // ---- bản đột biến: [tên, tìm (chuỗi hoặc biểu thức), đổi, ô phải đỏ]
  const DOT_BIEN = [
    ["bỏ bắt LoiXacThuc", "if (err instanceof LoiXacThuc || msg.startsWith(", "if (msg.startsWith(", "AC-6 làm mới hỏng: ném LoiXacThuc, 0 lời gửi, không tính là lời gọi lỗi"],
    ["bỏ làm mới trước khi gửi", /if \(!duDungKhong\(ctx\.getToken\(\)\)\)\s*await ctx\.refreshToken\(\);/, "", "AC-8 sắp hết hạn: làm mới đúng một lần TRƯỚC lời gửi, API nhận token mới"],
    ["gửi lại dù token không đổi", "if (ctx.getToken() !== biTuChoi)", "if (true)", "AC-6 401 mà làm mới KHÔNG đổi token → không gửi lại, ném LoiXacThuc sau đúng MỘT dòng AUTH FAIL [S02]"],
  ];
  const goc = readFileSync(SRC, "utf8");
  for (const [ten, tim, thay, oGhim] of DOT_BIEN) {
    const moi = goc.replace(tim, thay);
    if (moi === goc) { console.log(`ĐỎ: không thấy điểm đột biến «${ten}» trong dist — phép đo lệch cây mã`); loi = 1; continue; }
    const f = join(DIST, `.dot-bien-call-${TAM.length + 1}.js`);
    writeFileSync(f, moi);
    TAM.push(f);
    const m = await import(pathToFileURL(f).href + "?v=" + Date.now());
    const oDo = await chayCacCa(m, false);
    if (oDo === oGhim) console.log(`đạt: bản đột biến (${ten}) bị bắt ở ô: ${oDo}`);
    else { console.log(`ĐỎ: ${oDo ? `bản đột biến (${ten}) đỏ sai ô: ${oDo}` : `thước mù — bản đột biến (${ten}) vẫn xanh`}`); loi = 1; }
  }
} finally {
  for (const f of TAM) rmSync(f, { force: true });
}
console.log(loi === 0 ? "XANH" : "ĐỎ");
process.exit(loi);
