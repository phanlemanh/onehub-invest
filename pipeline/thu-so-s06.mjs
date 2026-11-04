// thu-so-s06.mjs — thu SĐT người bán S06 (claudedp-3010-7, phạm vi mới 02/11:
// Mạnh bỏ trần — mọi tin thu được kèm SĐT +84 và danh tính; không đăng nhập,
// không tài khoản thu mới, tin phone_hidden không lấy, không nhắn người bán).
//
// Cách: mở trang tin trên web S06 (URL dựng từ area/region — server redirect
// về đúng trang theo list_id), bấm «hiện số», đọc SĐT từ liên kết tel:,
// chuẩn hoá +84, ghi RawItem v5 (seller) vào snapshot NGOÀI đường quét
// (state/seller-v5/...) — bu-seller-v5.mjs đối chiếu + bù sau mỗi job hằng
// ngày tới khi nhánh vào main. Nạp cuối lượt bằng importer NHÁNH.
// Tên miền web đọc từ env S06_WEB_BASE (tầng A — không hardcode, không log).
// 03/11 claudedp-0311-3: MẠNH BỎ PHA 2 — chỉ còn pha 1, mỗi tài khoản đúng
// một lần (không gọi lại tài khoản đã có số); không lấy mẫu mặc định (72/72
// đã đo «một tài khoản một số» 100%).
//
// Dùng: node thu-so-s06.mjs --phase 1 [--threads 2] [--minutes 30] [--mau N] [--limit N]
// Dừng an toàn: 5 lỗi chặn liên tiếp (captcha/403/429/nút không ra số) → thoát 2.
import { readFile, writeFile, mkdir, readdir } from "node:fs/promises";
import { existsSync, realpathSync } from "node:fs";
import { createHash, randomUUID } from "node:crypto";
import { gzipSync } from "node:zlib";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { setTimeout as sleep } from "node:timers/promises";
import pg from "pg";
import { importDir } from "./import-chotot.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
let _tatChrome = null; // 0211-14 (3a): handler tín hiệu gọi được — Chrome không ở lại khi Ctrl-C
let _flushTruocThoat = null; // 0311-3 MỞ LẠI (3): tín hiệu/lỗi cũng flush + nạp trước khi thoát
// vòng 4 e2e: cho test chạy state riêng (env) — không đụng state thật
const STATE_DIR = process.env.S06_STATE_DIR ?? join(ROOT, "state", "thu-so-s06");
const SNAP_ROOT = process.env.S06_SNAP_ROOT ?? join(ROOT, "state", "seller-v5"); // vòng 4 e2e: snapshot riêng qua env
const WEB_BASE = process.env.S06_WEB_BASE; // tầng A — chỉ trong env local
const DB_URL = process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";

const args = process.argv.slice(2);
const flag = (k, d) => {
  const i = args.indexOf(`--${k}`);
  return i >= 0 ? args[i + 1] : d;
};
const PHASE = Number(flag("phase", 1));
if (PHASE !== 1) {
  console.error("pha 2 đã bỏ theo Mạnh 03/11 (claudedp-0311-3 đ3) — chỉ còn pha 1, mỗi tài khoản một lần");
  process.exit(1);
}
const THREADS = Number(flag("threads", 1));
if (THREADS > 2) {
  // 0311-3 MỞ LẠI (5): Mạnh duyệt 2 luồng — không trần trước đây
  console.error("--threads > 2 không được duyệt (Mạnh chốt 2 luồng, 0311-3 MỞ LẠI)");
  process.exit(1);
}
const MINUTES = Number(flag("minutes", 30));
const MAU = Number(flag("mau", 0)); // 0311-3 đ2: mặc định 0 — mẫu 1tk-1số đã đo 72/72 (100%)
const LIMIT = Number(flag("limit", 0));


const slug = (s) =>
  String(s ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/** Chuẩn hoá SĐT VN về +84 + 9 chữ số; null nếu không phải số di động. */
export function chuanHoa84(raw) {
  const m = String(raw ?? "").replace(/[\s.\-()]/g, "").match(/(?:\+84|84|0)(3\d|5\d|7\d|8\d|9\d)(\d{7})$/);
  return m ? `+84${m[1]}${m[2]}` : null;
}

const jitter = () => 15000 + Math.floor(Math.random() * 10000); // nghỉ 15–25s (claudedp-0311-18, thay 8–15s)

/** 0311-3 MỞ LẠI (1): 403/429 dừng CẢ LƯỢT NGAY từ lần đầu (Mạnh chốt) —
 * captcha/khong-ra-so/timeout giữ luật 5 lần liền. Export cho test. */
export const canDungNgay = (status) => /^chan-4(03|29)/.test(String(status));

/** 0311-20: nhãn trang KHÔNG NÚT theo thứ tự đúng — khung thử thách thật →
 * hết hạn → chữ captcha trong innerText → còn lại khong-nut. Export cho test. */
export function xetKhongNut(khung, txt) {
  const t = String(txt ?? "").toLowerCase();
  if (khung || t.includes("just a moment") || t.includes("captcha")) return "chan-captcha";
  if (t.includes("không còn") || t.includes("hết hạn") || t.includes("đã bán")) return "het-han";
  return "khong-nut";
}

/** 0311-3 MỞ LẠI vòng 3 (d): dòng lệnh tiến trình có chứa đúng đường profileDir
 * của bộ thu thì mới được tắt — PID tái dùng/tệp cũ không giết nhầm Chrome khác.
 * Export cho test. */
export const laChromeBoThuCuaLenh = (cmdline, profileDir) =>
  Boolean(profileDir) && String(cmdline ?? "").includes(profileDir);
let dungNgay403429 = false;

async function docState() {
  try {
    return JSON.parse(await readFile(join(STATE_DIR, "state.json"), "utf8"));
  } catch {
    return { da_thu: {} }; // { [list_id]: { phone | null, status, at } }
  }
}
async function ghiState(state) {
  await mkdir(STATE_DIR, { recursive: true });
  const tmp = join(STATE_DIR, `state-${randomUUID()}.tmp`);
  await writeFile(tmp, JSON.stringify(state));
  const { rename } = await import("node:fs/promises");
  await rename(tmp, join(STATE_DIR, "state.json"));
}

/** Việc cần làm — pha 1: mỗi tài khoản một tin (nhiều tin trước) + mẫu; pha 2: còn lại. */
async function docViec(client, state) {
  const q = `
    SELECT (payload->>'account_id') AS account_id, count(*)::int AS so_tin,
      -- 0411-9: chọn tin theo captured_at (lần THẤY) giảm dần — tin thấy gần
      -- nhất có nhiều khả năng còn số hơn tin list_time mới (đo 04/11: nhóm >4
      -- ngày tỉ lệ HẾT HẠN 28,9% — không phải «có số»)
      (array_agg(list_id ORDER BY captured_at DESC))[1]   AS list_id1,
      (array_agg(list_id ORDER BY captured_at DESC))[2]   AS list_id2,
      (array_agg(area_name ORDER BY captured_at DESC))[1] AS area,
      (array_agg(payload->>'region_name' ORDER BY captured_at DESC))[1] AS region,
      (array_agg(ad_type ORDER BY captured_at DESC))[1]   AS st,
      max(captured_at) AS thay_gan_nhat
    FROM stg_chotot_ads
    WHERE (payload->>'phone_hidden') IS DISTINCT FROM 'true'
    GROUP BY 1 ORDER BY so_tin DESC`;
  const rows = (await client.query(q)).rows;
  // 0211-9 (2): chỉ tin CÓ SỐ hoặc trạng thái CHỐT (het-han) tính là đã xử lý —
  // loi-trang/chan/timeout/khong-nut/khong-ra-so/so-khong-hop-le/trang-khac được
  // thử lại ở lượt sau (trước đây phone null cũng coi là xong → 175+19 tin lỗi
  // bị bỏ vĩnh viễn).
  const daTh = (id) => {
    const x = state.da_thu[id];
    return !!x && (x.phone !== null || x.status === "het-han");
  };
  // 0311-3 đ1: mỗi tài khoản ĐÚNG MỘT LẦN — tài khoản ĐÃ CÓ SỐ ở BẤT KỲ tin nào
  // (state hoặc stg) rời khỏi hàng việc (đo 03/11: 590 tk có số nhưng 542 tin
  // mới nhất chưa có → 542 lời gọi thừa nếu chỉ theo dõi list_id1/2).
  const tkDaSo = new Set(
    (await client.query(
      "SELECT DISTINCT payload->>'account_id' AS aid FROM stg_chotot_ads WHERE seller->>'phone' LIKE '+84%' AND (payload->>'phone_hidden') IS DISTINCT FROM 'true'",
    )).rows.map((r) => r.aid),
  );
  // state: tài khoản có số ở list_id1/list_id2 bất kỳ (map qua chính rows)
  for (const r of rows) {
    const co = (id) => id && state.da_thu[id] && state.da_thu[id].phone;
    if (co(r.list_id1) || co(r.list_id2)) tkDaSo.add(r.account_id);
  }
  // 0311-3 đ2: mẫu mặc định 0 (đã đo 72/72) — chỉ khi --mau N tường minh
  const mau = [];
  let n = 0;
  for (const r of rows) {
    if (MAU > 0 && r.list_id2 && !daTh(r.list_id2) && n < MAU) {
      mau.push({ ...r, list_id: r.list_id2, mau: true });
      n++;
    }
  }
  const viec = [...mau];
  for (const r of rows) {
    if (tkDaSo.has(r.account_id)) continue; // đã có số ở tin bất kỳ — không gọi lại
    // 0311-3 MỞ LẠI (4): tin mới nhất het-han làm tài khoản rơi khỏi việc —
    // chọn tin mới nhất KHÔNG het-han của tài khoản (list_id1 → list_id2).
    const lid = chonTinChuaHetHan(r, state);
    if (lid && !daTh(lid)) viec.push({ ...r, list_id: lid, mau: false });
  }
  // 0411-9: tài khoản có tin thấy gần nhất QUÁ 4 NGÀY xếp sau cùng (vẫn nằm
  // trong hàng việc — không bỏ) — giữ so_tin giảm dần trong từng nhóm.
  const moc4ngay = Date.now() - 4 * 24 * 3600 * 1000;
  const cuHon = (r) => new Date(r.thay_gan_nhat).getTime() < moc4ngay;
  viec.sort((a, b) => (cuHon(a) ? 1 : 0) - (cuHon(b) ? 1 : 0)); // nhóm mới đứng trước

  // 0311-19 (b) + 0311-20 (Hỏi): khoá lỗi xuống CUỐI hàng — demLoiLien đếm bản
  // thân + lan_truoc (state chỉ giữ MỘT cấp lan_truoc) nên tối đa 2, nghĩa là
  // khoá sai lần THỨ HAI trở xuống mới xuống cuối, lần đầu vẫn giữ chỗ.
  const laLoi = (st) => typeof st === "string" && !["co-so", "het-han"].includes(st);
  const demLoiLien = (id) => {
    let n = 0, x = state.da_thu[String(id)];
    while (x && laLoi(x.status)) { n++; x = x.lan_truoc ? { status: x.lan_truoc.status } : null; }
    return n;
  };
  viec.sort((a, b) => demLoiLien(a.list_id) - demLoiLien(b.list_id));
  return viec;
}

/** 0311-3 MỞ LẠI (4): tin mới nhất chưa het-han của tài khoản (state theo list_id).
 * Export cho test. */
/** 0411-7(1): chọn tab mới từ pages — loại tab luồng khác đang giữ (dangGiu)
 * và các tab có trước createTarget (daCo). Hai luồng thay gần nhau không trúng
 * cùng page (lỗi 0211-11). Export cho test. */
export function chonTabMoiPages(pages, dangGiu, daCo) {
  for (const p of pages) {
    if (!dangGiu.has(p) && !daCo.has(p)) return p;
  }
  return undefined;
}

export function chonTinChuaHetHan(row, state) {
  for (const lid of [row.list_id1, row.list_id2]) {
    if (!lid) continue;
    const x = state?.da_thu?.[String(lid)];
    if (!x || x.status !== "het-han") return lid;
  }
  return row.list_id1 ?? null;
}

/** Ghi batch items v5 ra snapshot ngoài đường quét. */
const daFlush = []; // dir bản v5 đã ghi trong lượt — nạp hết cuối lượt (0211-16)
async function ghiSnapshot(batch, cityCode) {
  const city = cityCode || "vn";
  const ts = new Date().toISOString().replace(/[:.]/g, "").slice(0, 17);
  const snapshotId = `${city}__chotot-ads__${ts}`;
  const dir = join(SNAP_ROOT, city, snapshotId);
  await mkdir(join(dir, "media"), { recursive: true }).catch(() => {});
  await mkdir(dir, { recursive: true });
  const files = [];
  for (let i = 0; i < batch.length; i += 1000) {
    const name = `items-${String(files.length + 1).padStart(4, "0")}.json.gz`;
    const gz = gzipSync(JSON.stringify(batch.slice(i, i + 1000)));
    await writeFile(join(dir, name), gz);
    files.push({ name, sha256: createHash("sha256").update(gz).digest("hex"), bytes: gz.length });
  }
  const manifest = {
    schemaVersion: 5,
    snapshotId,
    city,
    source: "chotot-ads",
    startedAt: batch[0]?.fetchedAt ?? new Date().toISOString(),
    finishedAt: new Date().toISOString(),
    counts: { items: batch.length, failed: 0 },
    coverage: { discovered: batch.length, captured: batch.length, failed: 0, methods: { hienSo: batch.length }, notes: ["seller-phone pha " + PHASE] },
    files,
  };
  await writeFile(join(dir, "manifest.json"), JSON.stringify(manifest, null, 2));
  daFlush.push(dir);
  return snapshotId;
}

/** Mở trang tin trên tab TÁI DÙNG, bấm hiện số, trả { status, phone }. */
async function laySoTrang(page, viec) {
  const loai = viec.st === "s" ? "mua-ban-nha-dat" : "cho-thue-nha-dat";
  const url = `${WEB_BASE}/${loai}-${slug(viec.area)}-${slug(viec.region)}/${viec.list_id}.htm`;
  try {
    const res = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30_000 });
    if (process.env.S06_DEBUG) console.log(`[dbg] HTTP ${res?.status()} → ${page.url().replace(WEB_BASE, "«che»")}`);
    // 0211-11: chan gắn nhãn nguồn chặn — chỉ nhãn, không URL/tên miền
    if (res && (res.status() === 403 || res.status() === 429)) {
      // 0211-13 (2): tôn trọng Retry-After — chỉ ghi nhãn số giây, không tự đổi nhịp
      const ra = res.headers()["retry-after"];
      return { status: `chan-${res.status()}${ra ? `-ra-${ra}s` : ""}` };
    }
    await page.waitForTimeout(1200);
    // 0311-20 Lỗi 2: thứ tự đúng = khung thử thách THẬT → hết hạn → chữ captcha
    // trong innerText (hết hạn trước khung làm trang thử thách có chữ «đã bán»
    // thành het-han — chốt vĩnh viễn, mất tài khoản).
    const docTrang = () => page.evaluate(() => ({
      txt: (document.body?.innerText ?? "").toLowerCase(),
      khung: !!document.querySelector("iframe[src*=challenge], #challenge-running, #challenge-error-text, .cf-turnstile, [class*=challenge]"),
    }));
    const pathOk = page.url().includes(`/${viec.list_id}.htm`);
    if (!pathOk) {
      // 0311-20 Lỗi 1 (AC-9): nhánh chuyển hướng CŨNG xét thử thách — nguồn
      // redirect sang trang thử thách phải vào chuỗi chặn, không gọi mãi.
      const t = await docTrang();
      // 0311-24 (nhỏ): khớp xetKhongNut — trang redirect ghi chữ captcha
      // mà không có khung vẫn là chan-captcha (vào chuỗi chặn)
      if (t.khung || t.txt.includes("just a moment") || t.txt.includes("captcha")) return { status: "chan-captcha" };
      return { status: "trang-khac" };
    }
    // nút hiện số (đã kiểm 02/11: KHÔNG đòi đăng nhập)
    const nut = await page
      .waitForSelector('button:has-text("Hiện số"), button:has-text("hiển thị số")', { timeout: 10_000 })
      .catch(() => null);
    if (!nut) {
      // 0311-19 (b): captcha chỉ nhận khi khung thử thách thật hoặc chữ trong
      // innerText — soi page.content() toàn HTML bắt chữ trong script động
      // gây nhãn sai (đo 03/11 khoá 135270933: hết hạn thật, 0 chữ captcha).
      const t = await docTrang();
      const nhan = xetKhongNut(t.khung, t.txt);
      return { status: nhan };
    }
    await nut.scrollIntoViewIfNeeded();
    await nut.click();
    await page.waitForTimeout(1800); // số people-bán hiện sau click; hotline 1900 nền tảng có sẵn từ trước
    // Gom số theo NGUỒN để ưu tiên đúng: tel: (bỏ đầu 19xx = hotline nền tảng,
    // có sẵn footer trước khi bấm), nút «Gọi…» sau khi đổi, thân trang.
    const soNguon = await page.evaluate(() => {
      const digit = (s) => String(s ?? "").replace(/\D/g, "");
      const tel = [...document.querySelectorAll('a[href^="tel:"]')]
        .map((a) => digit(a.getAttribute("href"))).filter(Boolean);
      const nutGoi = [...document.querySelectorAll("button, a")]
        .filter((e) => /^(gọi|call)/i.test((e.textContent || "").trim()))
        .flatMap((e) => [...((e.textContent || "").match(/(?:\+84|84|0)\d{9,10}/g) ?? [])]).map(digit);
      const body = [...(document.body.innerText.match(/(?:\+84|0)(?:3\d|5\d|7\d|8\d|9\d)\d{7}/g) ?? [])].map(digit);
      return { tel, nutGoi, body };
    });
    const khacHotline = (ds) => ds.filter((s) => !s.startsWith("19"));
    const phone =
      [khacHotline(soNguon.tel), soNguon.nutGoi, khacHotline(soNguon.body), soNguon.tel, soNguon.body]
        .flat()
        .map(chuanHoa84)
        .find(Boolean) ?? null;
    if (!phone) return { status: "khong-ra-so" }; // dấu hiệu bị chặn nếu lặp lại
    return { status: "co-so", phone };
  } finally {
    // tab giữ nguyên cho tin kế — KHÔNG close (0211-10 b)
  }
}

async function main() {
  if (!WEB_BASE) {
    // tầng A — chỉ thoát khi CHẠY chính, không khi test import module
    console.error("thiếu env S06_WEB_BASE (tầng A — đặt trong .env local, không lên kho)");
    process.exit(1);
  }

  // MỞ LẠI 0211-7 đD: che cả tên miền trong log (tầng A — không vào nac*.log)
  console.log(`[thu-so-s06] pha ${PHASE} · luồng ${THREADS} · cửa sổ ${MINUTES}′ · web=«che»`);
  const client = new pg.Client({ connectionString: DB_URL });
  await client.connect();
  const state = await docState();
  let viec = await docViec(client, state);
  if (LIMIT > 0) viec = viec.slice(0, LIMIT);
  console.log(`việc cần thu: ${viec.length} (đã có state: ${Object.keys(state.da_thu).length})`);
  // 0411-9: số việc theo nhóm tuổi (≤2 ngày · 2-4 ngày · >4 ngày)
  {
    const moc4ngay = Date.now() - 4 * 24 * 3600 * 1000; // 0411-10: khai trong main — docViec có const riêng scope hàm
    const moc2 = Date.now() - 2 * 24 * 3600 * 1000;
    const n2 = viec.filter((v) => new Date(v.thay_gan_nhat).getTime() >= moc2).length;
    const n4 = viec.filter((v) => new Date(v.thay_gan_nhat).getTime() >= moc4ngay).length - n2;
    console.log(`[nhóm tuổi] ≤2 ngày: ${n2} · 2-4 ngày: ${n4} · >4 ngày: ${viec.length - n2 - n4}`);
  }
  if (MINUTES <= 0) {
    // 0311-3: đo số việc pha 1 KHÔNG mở trình duyệt, KHÔNG gọi nguồn
    console.log(`[đo] việc pha 1 còn lại: ${viec.length}`);
    await client.end();
    process.exit(0);
  }

  // Chrome THẬT attach qua CDP (profile riêng tạm) — context launcher sạch bị
  // Cloudflare chặn 403 (đo 02/11); attach CDP như DevTools: trình duyệt thật,
  // cùng đường mạng, không đổi IP/proxy, không giả fingerprint (luật 0211-6).
  const CDP_PORT = Number(process.env.S06_CDP_PORT ?? 9230);
  const { spawn } = await import("node:child_process");
  const profileDir = join(STATE_DIR, "chrome-profile");
  await mkdir(profileDir, { recursive: true });
  // open -hna (-h = ẩn): cửa sổ không nhảy đè màn hình Mạnh (phàn nàn 2/11);
  // window-position ngoài màn hình + thu về Dock sau khi connect (tab CDP vẫn
  // chạy khi minimize — đã kiểm với lượt đang chạy).
  // 0211-13 (1): THỬ NỐI TRƯỚC — cổng đã trả lời thì dùng instance đang sống,
  // KHÔNG spawn (spawn khi instance cũ còn sống làm Chrome mới nhường chỗ và
  // KÍCH HOẠT cửa sổ cũ — bộ thu chiếm trước màn hình từ 17:26 tới 17:4x VN).
  // Chỉ khi cổng chết mới spawn binary (không qua open — đỡ giật tiêu điểm).
  const CHROME_BIN = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
  let chromeProc = null;
  const requireCollector = createRequire(join(ROOT, "collector", "package.json"));
  const { chromium } = requireCollector("playwright-core");
  // 0311-3 MỞ LẠI vòng 3 (a)(d): tatChrome + PID định nghĩa TRƯỚC vòng chờ CDP
  // và TRƯỚC khi dùng — tín hiệu lúc đang chờ CDP hay throw 'chưa lên sau 30 lần'
  // đều đã có lối tắt. Kill chỉ khi dòng lệnh tiến trình CHỨA profileDir bộ thu
  // (tệp PID cũ + PID bị tái dùng không giết nhầm tiến trình khác của Mạnh).
  const PID_F = join(STATE_DIR, "chrome-pid");
  await mkdir(STATE_DIR, { recursive: true });
  const { execFile } = await import("node:child_process");
  /** (d) đọc dòng lệnh tiến trình (ps) rồi kiểm chứa profileDir — chỉ qua ps,
   * không giết gì ở đây. Trả false khi tiến trình không còn/ps lỗi. */
  const laChromeBoThu = (pid, dir) => new Promise((res) => {
    execFile("ps", ["-o", "command=", "-p", String(pid)], (e, out) =>
      res(!e && laChromeBoThuCuaLenh(String(out), dir)));
  });
  const pidCuaMinh = async () => {
    let pid = chromeProc?.pid;
    if (!pid) { try { pid = Number((await readFile(PID_F, "utf8")).trim()); } catch {} }
    return pid || null;
  };
  const tatChrome = async () => {
    let pid = await pidCuaMinh();
    if (!pid) return;
    if (!(await laChromeBoThu(pid, profileDir))) {
      console.log(`PID ${pid} không phải Chrome bộ thu (thiếu profileDir) — không đụng, xoá tệp PID`);
      try { await writeFile(PID_F, ""); } catch {}
      return;
    }
    for (const sig of ["SIGTERM", "SIGKILL"]) {
      try { process.kill(pid, sig); } catch { break; }
      for (let i = 0; i < 10; i++) {
        await sleep(300);
        try { process.kill(pid, 0); } catch { break; } // đã chết
      }
    }
    try { await writeFile(PID_F, ""); } catch {} // đã tắt — xoá để lượt sau không giết nhầm
  };
  _tatChrome = tatChrome;
  let browser;
  try {
    browser = await chromium.connectOverCDP(`http://127.0.0.1:${CDP_PORT}`);
    console.log("nối Chrome CDP đang sống — không spawn");
  } catch {
    chromeProc = spawn(CHROME_BIN, [
      `--remote-debugging-port=${CDP_PORT}`, `--user-data-dir=${profileDir}`,
      "--no-first-run", "--no-default-browser-check", "--window-position=-2400,100",
      "--disable-backgrounding-occluded-windows", "--disable-renderer-backgrounding",
      "--disable-background-timer-throttling", "about:blank",
    ], { stdio: "ignore", detached: true });
    chromeProc.unref();
    await writeFile(PID_F, String(chromeProc.pid)); // (a) ghi NGAY sau spawn
    try {
      for (let lan = 0; ; lan++) {
        try {
          browser = await chromium.connectOverCDP(`http://127.0.0.1:${CDP_PORT}`);
          break;
        } catch (e) {
          if (lan >= 30) throw new Error(`Chrome CDP chưa lên sau 30 lần thử: ${e.message}`);
          await sleep(1000);
        }
      }
    } catch (e) {
      await tatChrome(); // (a) đường throw phải tắt Chrome mình vừa spawn
      throw e;
    }
  }
  if (!chromeProc) {
    // (d) nối instance sống: PID phải HỢP LỆ (dòng lệnh chứa profileDir);
    // tệp trống/lỗi → tìm PID nghe cổng CDP rồi kiểm cùng điều kiện — không
    // khớp thì DỪNG LƯỢT (không chạy trên Chrome lạ), thoát 1.
    let pid = await pidCuaMinh();
    let hopLe = pid && (await laChromeBoThu(pid, profileDir));
    if (!hopLe) {
      const { execFile } = await import("node:child_process");
      const cdpPid = await new Promise((res) =>
        // vòng 4: -sTCP:LISTEN — chỉ tiến trình NGHE cổng, không bắt tiến trình đang nối
        execFile("lsof", ["-nP", `-iTCP:${CDP_PORT}`, "-sTCP:LISTEN", "-t"], (e, out) => res(e ? null : Number(String(out).trim().split(/\s+/)[0]) || null)));
      if (cdpPid && (await laChromeBoThu(cdpPid, profileDir))) {
        await writeFile(PID_F, String(cdpPid));
        console.log(`nối theo PID cổng CDP ${cdpPid} (đã xác minh profileDir)`);
      } else {
        console.error("Chrome đang sống trên cổng CDP KHÔNG phải của bộ thu (thiếu profileDir) — dừng lượt, không chạy trên Chrome lạ");
        process.exit(1);
      }
    }
  }

  const contexts = [browser.contexts()[0]]; // mọi luồng dùng chung context (cookie CF dùng chung)
  // 0211-10 (b): mỗi luồng giữ đúng MỘT tab tạo MỘT lần đầu qua
  // Target.createTarget {background: true} — không nhấc Chrome lên; tái dùng
  // bằng goto cho mọi tin (điều phối nghi newPage mỗi tin là nguyên nhân
  // cửa sổ bung). Fallback: context.newPage() nếu đường CDP không trả page.
  const ctx0 = contexts[0];
  const tabs = [];
  // 0311-3 MỞ LẠI vòng 4: các khai báo này phải NGOÀI try — vòng 3 để trong khối
  // try khiến finally gọi flushTruocThoat ném ReferenceError (bị catch rỗng nuốt)
  // và giayMoiTin dùng thu cũng ném → mọi lượt thoát 1, mất [nấc]/[đối chiếu].
  const ketQua = { co_so: 0, khac_so: 0 };
  const errors = {};
  const batch = [];
  const flushTruocThoat = async () => {
    if (batch.length > 0) {
      const sid = await ghiSnapshot(batch.splice(0, batch.length), "vn");
      console.log(`flush ${sid}`);
    }
    for (const d of daFlush.slice()) {
      try { await importDir(client, d); } catch (e) { console.log(`nạp ${d} lỗi: ${e.message}`); }
    }
    daFlush.length = 0;
  };
  _flushTruocThoat = flushTruocThoat;
  const mau = { da_do: 0, trung: 0, khac: 0 };
  const deadline = Date.now() + MINUTES * 60_000;
  const t0 = Date.now();
  let chanLienTiep = 0;
  let thu = 0;
  let iViec = 0;
  let khongNutLien = 0;      // 0311-20 Việc 3: ngưỡng riêng 20 lần liền
  let dungNguongKhongNut = false;
  let loiNhanhTong = 0;      // tổng loi-nhanh mọi luồng — [nấc] tính lời gọi thật
  let dungNguongLoiNhanh = false;
  let lanThayTab = 0;        // 0411-6: số lần thay tab liên tiếp (Chrome chết thật?)
  try { // 0311-3 vòng 3 (b) + vòng 4: try bọc tạo tab + vòng lặp, finally dùng biến ngoài
  for (let i = 0; i < THREADS; i++) {
    let tab = null;
    try {
      // 0211-11: cấp theo DÒNG THỜI GIAN — chụp pages trước, tạo target, đợi
      // page MỚI xuất hiện (không thuộc tập trước). Tìm theo url about:blank
      // khiến luồng 2+ lấy lại tab chưa điều hướng của luồng 1 → goto đè nhau.
      const truoc = new Set(ctx0.pages());
      const cdpSs = await browser.newBrowserCDPSession();
      await cdpSs.send("Target.createTarget", { url: "about:blank", background: true });
      await cdpSs.detach();
      for (let lan = 0; lan < 40 && !tab; lan++) {
        await sleep(250);
        tab = ctx0.pages().find((pg) => !truoc.has(pg));
      }
    } catch { /* rơi xuống fallback */ }
    tabs.push(tab ?? (await ctx0.newPage()));
  }
  if (new Set(tabs).size !== THREADS) {
    throw new Error(`tab trùng nhau: ${new Set(tabs).size}/${THREADS} — không chạy`);
  }

  const chonTabMoi = chonTabMoiPages; // 0411-7(1): hàm thuần module-scope, export cho test
  // 0411-6(2): đếm theo TỪNG LUỒNG — mỗi luồng theo dõi tab riêng, tự mở tab mới
  // khi tab/CDP hỏng (không đợi cả lượt chết); biến tổng (loiNhanhTong/chanLienTiep)
  // chỉ tổng hợp cho [nấc].
  const tabDangGiu = new Map(); // idx → page (luồng nào giữ tab nào)
  async function tabMoi(idx) {
    const ctx0s = contexts[0];
    const truoc = new Set(ctx0s.pages());
    try {
      const ss = await browser.newBrowserCDPSession();
      await ss.send("Target.createTarget", { url: "about:blank", background: true });
      await ss.detach();
      for (let lan = 0; lan < 40; lan++) {
        await sleep(250);
        // 0411-10 phụ: tính MỖI vòng poll — luồng khác set tab mới giữa chừng vẫn bị loại
        const dangGiu = new Set([...tabDangGiu.values()]);
        const t = chonTabMoi(ctx0s.pages(), dangGiu, truoc);
        if (t) { tabDangGiu.set(idx, t); return t; }
      }
    } catch (e) {
      // 0411-7(2): mất CDP — tabMoi ném ra ngoài sẽ làm lượt thoát 1 im lặng;
      // chuyển thành ngưỡng loi-nhanh: thoát 3 đúng thiết kế, [nấc] vẫn in.
      console.log(`[loi-nhanh] tabMoi lỗi: ${String(e.message).slice(0, 100)} — dừng lượt`);
      dungNguongLoiNhanh = true;
      return null;
    }
    const np = await ctx0s.newPage();
    tabDangGiu.set(idx, np);
    return np;
  }
  async function motLuong(idx) {
    let tab = tabs[idx % tabs.length];
    tabDangGiu.set(idx, tab); // 0411-7(1): đăng ký tab luồng này đang giữ
    let loiNhanhLienToi = 0; // chuỗi loi-nhanh THEO LUỒNG này
    while (iViec < viec.length && Date.now() < deadline && chanLienTiep < 5 && !dungNgay403429 && !dungNguongKhongNut && !dungNguongLoiNhanh) {
      const v = viec[iViec++];
      const tBat = Date.now();
      let kq;
      try {
        kq = await laySoTrang(tab, v);
      } catch (e) {
        // 0411-2(1): in e.message khi loi-trang (che URL) — phân biệt tab chết /
        // Chrome chết / lỗi gì khác; ms 0-1 = ném ngay, không có lời gọi tới nguồn
        if (!e.message?.includes("Timeout")) {
          console.log(`[loi-trang] ${String(e.message).slice(0, 160).replace(/https?:\/\/[^\s]+/g, "«che»")}`);
        }
        kq = { status: e.message?.includes("Timeout") ? "timeout" : "loi-trang" };
      }
      const ms = Date.now() - tBat;
      thu++; // 0411-3: tin_thu tính CẢ loi-trang nhanh — không rơi HẾT VIỆC khi
             // Chrome chết ngay từ đầu lượt (lời gọi thật = thu - loiNhanhTong)

      if (process.env.S06_DEBUG) console.log(`[dbg] tin ${v.list_id} → ${kq.status}${kq.phone ? " (có số)" : ""} · ${ms}ms`);
      // 0211-9 (1): loi-trang/timeout cũng là dấu hiệu đường chết — đếm chung,
      // 5 lần LIỀN dừng lượt (trước đây 125 loi-trang liền không dừng được)
      // 0411-2(2)(3): loi-trang < 100ms là lỗi ném NGAY (tab/Chrome chết, 0 lời
      // gọi tới nguồn) — không tính lời gọi, không vào chuỗi chặn; ≥100ms là lỗi
      // nguồn thật: vào chuỗi chặn và đặt lại đếm 300.
      const loiTrangNhanh = kq.status === "loi-trang" && ms < 100;
      if (loiTrangNhanh) {
        // 0411-6(1): phân loại CHÍNH XÁC cái gì hỏng: tab đóng / CDP mất / Chrome chết
        const trangThai = await (() => {
          try {
            const tabHong = tab?.isClosed();
            const ketNoi = browser?.isConnected();
            // 0411-7: tab chưa đóng mà browser vẫn kết nối → khong-ro (đừng gọi cdp-mat)
            return tabHong && !ketNoi ? "chrome-chet" : tabHong ? "tab-dong" : "khong-ro";
          } catch { return "khong-ro"; }
        })();
        console.log(`[loi-nhanh] ${trangThai} (luồng ${idx}, lần ${loiNhanhLienToi + 1})`);
        loiNhanhTong++;
        loiNhanhLienToi++;
        if (loiNhanhLienToi >= 3) {
          // 0411-6(2): 3 lần liền THEO LUỒNG → tab này vô dụng, mở TAB MỚI thay
          // thế (không đợi cả lượt chết); nếu tab mới cũng hỏng ngay → sau 2 lần
          // thay tab liên tiếp thì Chrome chết thật → dừng lượt thoát 3.
          lanThayTab++;
          if (lanThayTab > 2) {
            console.log(`[loi-nhanh] thay tab 2 lần vẫn hỏng — Chrome chết thật, dừng lượt`);
            dungNguongLoiNhanh = true;
          } else {
            console.log(`[loi-nhanh] mở tab mới cho luồng ${idx}`);
            const tabM = await tabMoi(idx);
            if (!tabM || tabM.isClosed()) return; // 0411-7(2): CDP chết — lượt thoát 3 ở luồng chính
            tab = tabM;
            tabs[idx % tabs.length] = tab; // 0411-7(1): cập nhật sau khi thay
            loiNhanhLienToi = 0;
          }
        }
      } else {
        loiNhanhLienToi = 0;
        lanThayTab = 0;
        if (/^(chan|khong-ra-so|loi-trang|timeout)/.test(kq.status)) {
          chanLienTiep++;
        } else {
          chanLienTiep = 0;
        }
      }
      // 0311-20 Việc 3: khong-nut không vào chuỗi chặn nhưng có ngưỡng riêng —
      // 20 lần LIỀN (nguồn đổi giao diện/giấu nút) thì dừng lượt + BÁO.
      if (kq.status === "khong-nut") {
        khongNutLien++;
        if (khongNutLien >= 20) {
          console.log(`[ngưỡng] 20 khong-nut liền — nguồn đổi giao diện? DỪNG lượt`);
          dungNguongKhongNut = true;
        }
      } else {
        khongNutLien = 0;
      }
      // 0311-3 MỞ LẠI (1): 403/429 → dừng CẢ LƯỢT NGAY từ lần đầu (Mạnh chốt)
      if (canDungNgay(kq.status)) {
        dungNgay403429 = true;
        const ra = kq.status.match(/-ra-(\d+)s/);
        console.log(`DỪNG NGAY — ${kq.status}${ra ? ` (Retry-After ${ra[1]} giây)` : ""}`);
      }
      if (kq.status === "co-so") ketQua.co_so++;
      else if (kq.status === "so-khong-hop-le") ketQua.khac_so++;
      else errors[kq.status] = (errors[kq.status] ?? 0) + 1;


      // state + mẫu đo
      const soTin1 = state.da_thu[v.list_id1 ?? v.list_id]?.phone;
      if (v.mau) {
        mau.da_do++;
        if (kq.phone && soTin1) kq.phone === soTin1 ? mau.trung++ : mau.khac++;
      }
      const cu = state.da_thu[v.list_id];
      state.da_thu[v.list_id] = {
        phone: kq.phone ?? null, status: kq.status, at: new Date().toISOString(), ms,
        ...(cu ? { lan_truoc: { status: cu.status, phone: cu.phone ?? null, at: cu.at } } : {}),
      };

      // item v5 MỎNG (MỞ LẠI 0211-7 đB): lượt lấy số chỉ mang list_id + seller —
      // importer đường seller-only KHÔNG đụng captured_at/payload/cột khác.
      // Lỗi trang (het-han/khong-nut) là `error` theo hợp đồng, không phải hidden_by_source.
      if (kq.phone || kq.status === "het-han" || kq.status === "khong-nut" || kq.status === "trang-khac") {
        batch.push({
          source: "chotot-ads",
          sourceId: `ct-${v.list_id}`,
          kind: "ad",
          fetchedAt: new Date().toISOString(),
          payload: { list_id: v.list_id },
          seller: {
            accountRef: v.account_id ? `S06:${v.account_id}` : null,
            displayName: null,
            phone: kq.phone ?? null,
            phoneStatus: kq.phone ? "available" : "error",
            seenAt: new Date().toISOString(),
          },
        });
        if (batch.length >= 500) {
          const sid = await ghiSnapshot(batch.splice(0, 500), v.city_code ?? "vn");
          console.log(`flush 500 → ${sid}`);
        }
      }
      // 0311-3 MỞ LẠI (3): ghi state sau MỖI tin có kết quả — dừng giữa lượt
      // không còn mất kết quả đã thu (trước đây tới 24 tin)
      await ghiState(state);
      if (thu % 25 === 0) {
        const giay = ((Date.now() - t0) / 1000 / thu).toFixed(1);
        console.log(`tiến độ ${thu}/${viec.length} · ${giay}s/tin · có số ${ketQua.co_so} · lỗi ${JSON.stringify(errors)}`);
      }
      await sleep(jitter());
    }
  }

  // 0311-3 vòng 3 (b): nằm trong try đã mở trước tabs — không mở try kép
  await Promise.all(Array.from({ length: THREADS }, (_, i) => motLuong(i)));
  // 0211-12 (3): đóng tab đã cấp — browser.close qua CDP chỉ NGẮT KẾT NỐI,
  // tab tích lại sau mỗi lượt (10 tab cho 2 luồng sau vài lượt).
  for (const t of tabs) await t.close().catch(() => {});
  await ghiState(state);
  if (batch.length > 0) {
    const sid = await ghiSnapshot(batch, "vn");
    console.log(`flush cuối ${batch.length} → ${sid}`);
  }
  await browser.close().catch(() => {});
  // 0211-16: nạp NGAY mọi bản v5 của lượt vào stg — số không nằm chờ trong snapshot
  await flushTruocThoat();
  await client.end().catch(() => {});
  } finally {
    // 0211-14 (3a) + 0311-3 MỞ LẠI (3): mọi đường ra (lỗi giữa lượt) đều
    // flush + nạp trước, rồi tắt Chrome — không mất số đã thu, không sót Chrome
    try { await flushTruocThoat(); await client.end().catch(() => {}); } catch {}
    await tatChrome();
  }

  const giayMoiTin = thu > 0 ? (Date.now() - t0) / 1000 / thu : 0; // tb trên tin (gồm nhanh); [nấc] đổi ra lời-gọi-thật
  const tong = viec.length + Object.keys(state.da_thu).length;
  const conLai = Math.max(0, tong - thu);
  const duKienGio = (conLai * giayMoiTin * 1.0) / 3600; // cùng số luồng hiện tại
  const tiLeTrung = mau.da_do > 0 ? (mau.trung / (mau.trung + mau.khac || 1) * 100).toFixed(1) : null;
  const tongCoSo = Object.values(state.da_thu).filter((x) => x.phone).length;
  console.log(
    `[nấc] ${JSON.stringify({
      pha: PHASE, luong: THREADS, tin_thu: thu, loi_nhanh: loiNhanhTong,
      loi_goi_that: thu - loiNhanhTong,
      giay_moi_tin: +(thu - loiNhanhTong > 0 ? giayMoiTin * thu / (thu - loiNhanhTong) : 0).toFixed(1),
      co_so_luot: ketQua.co_so, tong_co_so_state: tongCoSo, errors,
      mau_1tk_1so: mau.da_do ? { da_do: mau.da_do, trung_so: mau.trung, khac_so: mau.khac, ti_le_trung_phan_tram: tiLeTrung } : null,
      con_lai: conLai, gio_du_kien_xong: +duKienGio.toFixed(1), chan_lien_tiep: chanLienTiep,
    })}`,
  );
  // 0211-15: đối chiếu state↔stg cuối lượt — lệch khác 0 nghĩa là có số bị
  // mất ở bước flush/nạp (đã mất 71 số một lần) → chạy node bu-seller-v5.mjs
  try {
    const c2 = new pg.Client({ connectionString: DB_URL });
    await c2.connect();
    const stg = Number((await c2.query("SELECT count(*) n FROM stg_chotot_ads WHERE seller->>'phone' LIKE '+84%'")).rows[0].n);
    await c2.end();
    const st = Object.values(state.da_thu).filter((x) => x.phone).length;
    console.log(`[đối chiếu] state ${st} số · stg ${stg} số · lệch ${st - stg}${st !== stg ? " — CHẠY: node bu-seller-v5.mjs" : ""}`);
  } catch (e) { console.log('[đối chiếu] lỗi:', e.message); }
  process.exit(dungNguongLoiNhanh ? 3 : chanLienTiep >= 5 || dungNgay403429 || dungNguongKhongNut ? 2 : 0); // 3 = Chrome chết, vòng ngoài mở lượt mới
}

if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((e) => {
    console.error("❌", e);
    process.exit(1);
  });
  // Ctrl-C / SIGTERM giữa lượt: đừng để Chrome ở lại chiếm màn hình
  // 0311-3 MỞ LẠI vòng 3 (c): tín hiệu → flush + nạp TRƯỚC (có hạn thời gian
  // để không treo Ctrl-C), chạy đúng MỘT LẦN nếu nhận tín hiệu hai lần.
  let daNhanTinHieu = false;
  for (const sig of ["SIGINT", "SIGTERM"]) {
    process.on(sig, () => {
      if (daNhanTinHieu) return; // tín hiệu lần 2 — đang thoát
      daNhanTinHieu = true;
      console.log(`nhận ${sig} — flush + nạp rồi tắt Chrome`);
      const voiHan = (p, ms) => Promise.race([Promise.resolve(p).catch(() => {}), new Promise((r) => setTimeout(r, ms))]);
      voiHan(_flushTruocThoat?.(), 20000)
        .then(() => voiHan(_tatChrome?.(), 10000))
        .finally(() => process.exit(130));
    });
  }
}
