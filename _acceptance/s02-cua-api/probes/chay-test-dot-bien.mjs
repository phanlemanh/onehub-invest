#!/usr/bin/env node
// Phép đo (hồ sơ s02-cua-api): chạy một tệp test của hàng trên bản dist THẬT — phải đạt hết — rồi trên các
// BẢN ĐỘT BIẾN (bản chép của collector/dist, đúng MỘT điểm đổi) — mỗi bản phải làm đỏ ít nhất một ca NGOÀI số
// ca đỏ sẵn của BẢN ĐỐI CHỨNG (bản chép không đổi; đỏ ở đó là do môi trường chép, không tính). Thoát 0 chỉ khi
// cả hai điều kiện đúng. Bản chép nằm TRONG collector/ (dist/cli.js nạp mọi bộ thu, cần resolve node_modules của
// collector) ở thư mục tạm dạng collector/.s02-dot-bien-*; xoá trong finally, kể cả thư mục sót của lượt bị giết.
// Không mạng, không trình duyệt thật: ca lệnh login tự dùng Chrome giả /usr/bin/true và profile thư mục tạm.
// Tệp dist gọi bằng VAI, tìm theo chữ ký xuất (không ghi tên tệp vào phép đo):
//   boThu = tệp xuất docExpAppToken · phien = tệp xuất docPhienTuProfile · cli = dist/cli.js.
//   node _acceptance/s02-cua-api/probes/chay-test-dot-bien.mjs <doc-phien|tra-doi-token|bo-thu>
import { cpSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const DIST = join(ROOT, "collector", "dist");
const [nhom = ""] = process.argv.slice(2);

const NHOM = {
  "doc-phien": {
    ac: "AC-2",
    tepTest: "s02-doc-phien.test.js",
    mong: 35,
    dotBien: [
      ["chọn bản CŨ nhất thay vì mới nhất", "phien", /r\.thuTu > moiNhat\.thuTu/g, "r.thuTu < moiNhat.thuTu"],
      ["bỏ giải nén tiền tố khoá của bảng", "phien", /doi\.subarray\(0, chung\.giaTri\)/g, "new Uint8Array()"],
      ["bỏ giải nén khối snappy", "phien", /if \(loaiNen === 0\)/g, "if (loaiNen !== 9)"],
      ["bỏ giữ mảnh FIRST của bản ghi cắt mảnh", "phien", /manhDangGi = \[manh\];/g, "manhDangGi = [];"],
      ["bản XOÁ trong bảng coi là còn", "phien", /xoa: dongGoi % 256 === 0/g, "xoa: false"],
    ],
  },
  "tra-doi-token": {
    ac: "AC-3",
    tepTest: "s02-cua-api.test.js",
    mong: 18,
    dotBien: [
      ["429 không coi là bị chặn", "phien", /r\.trangThai === 429 \|\| /g, ""],
      ["trang thử thách không coi là bị chặn", "phien", /r\.cfMitigated === "challenge" \|\| /g, ""],
      ["401/403 không thành lỗi xác thực", "phien", /if \(r\.trangThai === 401 \|\| r\.trangThai === 403\)\s*return "xac-thuc";/g, ""],
      ["thiếu id_token vẫn gửi lời hai", "phien", /if \(!idToken\)\s*throw new LoiXacThuc\(/g, "if (false) throw new LoiXacThuc("],
      ["refresh token rỗng vẫn gọi mạng", "phien", /if \(!refreshToken\)\s*throw new LoiXacThuc\(/g, "if (false) throw new LoiXacThuc("],
      ["bỏ thời gian chờ của mỗi lời", "phien", /signal: AbortSignal\.timeout\(TRAN_CHO_MS\),/g, ""],
    ],
  },
  "bo-thu": {
    ac: "AC-4 · AC-5 · AC-6 · AC-8 · AC-9",
    tepTest: "s02-bo-thu-cua-api.test.js",
    mong: 35,
    dotBien: [
      ["tra đổi bị từ chối mà không in AUTH FAIL", "boThu", /if \(e instanceof LoiXacThuc\)\s*nemAuthFail\(log, e\);/g, ""],
      ["bị chặn lại in AUTH FAIL thay vì BỊ CHẶN", "boThu", /if \(e instanceof LoiBiChan\)\s*nemBiChan\(log, e\.message\);/g, "if (e instanceof LoiBiChan) nemAuthFail(log, e);"],
      ["không cập nhật refresh token khi nguồn xoay phiên", "boThu", /refresh = kq\.refreshToken;/g, ""],
      ["profile thiếu refresh token vẫn tra đổi", "boThu", /if \(typeof rt !== "string" \|\| !rt\)\s*nemAuthFail\(/g, "if (false) nemAuthFail("],
      ["bị chặn ở API dữ liệu vẫn đi tiếp", "boThu", /if \(loai === "bi-chan" \|\| res\.status === 403\)\s*nemBiChan\(/g, "if (false) nemBiChan("],
      ["nuốt lỗi bước làm mới thành một lời lỗi lẻ", "boThu", /if \(err === loiBuocLamMoi \|\| err instanceof LoiXacThuc/g, "if (err instanceof LoiXacThuc"],
      ["gửi lại dù token không đổi", "boThu", /if \(ctx\.getToken\(\) !== biTuChoi\)\s*res = await doFetch\(\);/g, "if (true) res = await doFetch();"],
      ["bỏ làm mới token trước khi gửi", "boThu", /if \(!duDungKhong\(ctx\.getToken\(\)\)\)\s*await lamMoi\(\);/g, ""],
      ["bỏ dòng AUTH FAIL sau 401", "boThu", /ctx\.log\(`AUTH FAIL \[S02\] \$\{new Date\(\)\.toISOString\(\)\}`\);/g, ""],
      ["nhịp 0,3 lời/giây thay vì 0,2", "boThu", /requestsPerSecond: 0\.2,/g, "requestsPerSecond: 0.3,"],
      ["nguồn không có lệnh login vẫn chạy", "cli", /if \(!login\)\s*usage\(\);/g, ""],
      ["lỗi mở Chrome vẫn thoát 0", "cli", /process\.exitCode = 1;/g, ""],
    ],
  },
};

const TEP_THEO_VAI = () => {
  const thuMuc = join(DIST, "collectors");
  const tim = (chuKy) => readdirSync(thuMuc).filter((f) => f.endsWith(".js") && readFileSync(join(thuMuc, f), "utf8").includes(chuKy));
  const boThu = tim("export function docExpAppToken");
  const phien = tim("export function docPhienTuProfile");
  if (boThu.length !== 1 || phien.length !== 1) throw new Error(`cần đúng một tệp cho mỗi vai; thấy bộ thu ${boThu.length}, phiên ${phien.length}`);
  return { boThu: join("collectors", boThu[0]), phien: join("collectors", phien[0]), cli: "cli.js" };
};

/** Chạy đúng MỘT tệp test trong một gốc dist; trả { dat, do: Set<tên ca đỏ> } đọc từ báo cáo TAP (chỉ ca tầng ngoài). */
const chayTest = (gocDist, tepTest) => {
  const r = spawnSync(process.execPath, ["--test", "--test-reporter=tap", join(gocDist, "test", tepTest)], {
    cwd: join(gocDist, ".."),
    encoding: "utf8",
    timeout: 180_000,
    env: { ...process.env, NO_COLOR: "1" },
  });
  const dong = `${r.stdout}\n${r.stderr}`.split("\n");
  let dat = 0;
  const do_ = new Set();
  for (const d of dong) {
    const m = /^(not ok|ok) \d+ - (.*)$/.exec(d);
    if (!m) continue;
    if (m[1] === "ok") dat++;
    else do_.add(m[2].replace(/ #.*$/, "").trim());
  }
  return { dat, do: do_, roi: r.status };
};

// Dọn thư mục tạm SÓT của lượt trước (quá 3 giờ). KHÔNG xoá thư mục mới: ba nhóm (doc-phien, tra-doi-token, bo-thu) chạy
// song song trong lượt chấm, xoá hết lúc khởi là xoá bản chép của nhóm đang chạy (vòng 1 M5 27/11: bản đối chứng bo-thu thêm 1 ca đỏ).
const SOT_MS = 3 * 3600_000;
for (const f of readdirSync(join(ROOT, "collector")).filter((x) => x.startsWith(".s02-dot-bien-"))) {
  const p = join(ROOT, "collector", f);
  if (Date.now() - statSync(p).mtimeMs > SOT_MS) rmSync(p, { recursive: true, force: true });
}
let loi = 0;
const tam = mkdtempSync(join(ROOT, "collector", ".s02-dot-bien-"));
try {
  if (!nhom || !NHOM[nhom]) {
    console.log(`ĐỎ: thiếu tên nhóm (một trong: ${Object.keys(NHOM).join(", ")})`);
    loi = 2;
  } else {
    const bo = NHOM[nhom];
    const vai = TEP_THEO_VAI();
    const that = chayTest(DIST, bo.tepTest);
    console.log(`đạt: bản thật · ${nhom}: ${that.dat} ca đạt, ${that.do.size} ca đỏ (${bo.tepTest}, cần ≥ ${bo.mong} ca đạt và 0 ca đỏ)`);
    if (!(that.dat >= bo.mong && that.do.size === 0 && that.roi === 0)) {
      loi = 1;
      if (that.do.size) console.log(`ĐỎ: bản thật đỏ ở ca đầu: ${[...that.do][0]}`);
    }
    // ---- bản đối chứng: bản chép KHÔNG đổi — ca đỏ ở đây là do môi trường chép, không được tính là «bắt được»
    const chep = join(tam, "doi-chung");
    cpSync(DIST, chep, { recursive: true });
    const chung = chayTest(chep, bo.tepTest);
    console.log(`đạt: bản đối chứng (chép, không đổi) · ${chung.dat} ca đạt, ${chung.do.size} ca đỏ sẵn do chép${chung.do.size ? ` (${[...chung.do].join(" | ")})` : ""}`);
    // ---- các bản đột biến
    for (const [ten, vaiTen, tim, thayThe] of bo.dotBien) {
      const goc = readFileSync(join(DIST, vai[vaiTen]), "utf8");
      const so = (goc.match(tim) ?? []).length;
      if (so !== 1) {
        console.log(`ĐỎ: không thấy đúng một điểm đột biến «${ten}» trong dist (thấy ${so}) — phép đo lệch cây mã`);
        loi = 1;
        continue;
      }
      const dich = join(tam, `dot-bien-${ten.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").slice(0, 40)}`);
      cpSync(DIST, dich, { recursive: true });
      writeFileSync(join(dich, vai[vaiTen]), goc.replace(tim, thayThe));
      const kq = chayTest(dich, bo.tepTest);
      const moi = [...kq.do].filter((x) => !chung.do.has(x));
      if (moi.length >= 1) console.log(`đạt: bản đột biến (${ten}) bị bắt: ${moi.length} ca đỏ ngoài ${chung.do.size} ca đỏ sẵn · ca đầu: ${moi[0]}`);
      else {
        console.log(`ĐỎ: thước mù — bản đột biến (${ten}) không làm đỏ ca nào ngoài ca đỏ sẵn của bản đối chứng`);
        loi = 1;
      }
    }
  }
} catch (e) {
  console.log(`ĐỎ: phép đo không chạy được — ${e instanceof Error ? e.message : String(e)}`);
  loi = 2;
} finally {
  rmSync(tam, { recursive: true, force: true });
}
console.log(loi === 0 ? "XANH" : "ĐỎ");
process.exit(loi);
