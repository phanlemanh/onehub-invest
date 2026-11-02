// thu-so-s06.mjs — thu SĐT người bán S06 (claudedp-3010-7, phạm vi mới 02/11:
// Mạnh bỏ trần — mọi tin thu được kèm SĐT +84 và danh tính; không đăng nhập,
// không tài khoản thu mới, tin phone_hidden không lấy, không nhắn người bán).
//
// Cách: mở trang tin trên web S06 (URL dựng từ area/region — server redirect
// về đúng trang theo list_id), bấm «hiện số», đọc SĐT từ liên kết tel:,
// chuẩn hoá +84, ghi RawItem v5 (seller) vào snapshot NGOÀI đường quét
// (state/seller-v5/... — importer trên main chưa nhận v5; chuyển vào
// collector/snapshots/ SAU khi nhánh vào main). Nạp tay bằng importer NHÁNH.
// Tên miền web đọc từ env S06_WEB_BASE (tầng A — không hardcode, không log).
//
// Dùng: node thu-so-s06.mjs --phase 1 [--threads 1] [--minutes 30] [--mau 300] [--limit N]
//   pha 1: mỗi tài khoản một tin (tài khoản nhiều tin trước) + mẫu tin thứ 2
//          của --mau tài khoản đầu để đo giả định «một tài khoản một số».
//   pha 2: toàn bộ tin không ẩn còn lại (tin mới đi cùng khi chạy hằng ngày).
// Dừng an toàn: 5 lỗi chặn liên tiếp (captcha/403/429/nút không ra số) → thoát 2.
import { readFile, writeFile, mkdir, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
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
const STATE_DIR = join(ROOT, "state", "thu-so-s06");
const SNAP_ROOT = join(ROOT, "state", "seller-v5");
const WEB_BASE = process.env.S06_WEB_BASE; // tầng A — chỉ trong env local
const DB_URL = process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";

const args = process.argv.slice(2);
const flag = (k, d) => {
  const i = args.indexOf(`--${k}`);
  return i >= 0 ? args[i + 1] : d;
};
const PHASE = Number(flag("phase", 1));
const THREADS = Number(flag("threads", 1));
const MINUTES = Number(flag("minutes", 30));
const MAU = Number(flag("mau", 300));
const LIMIT = Number(flag("limit", 0));

if (!WEB_BASE) {
  console.error("thiếu env S06_WEB_BASE (tầng A — đặt trong .env local, không lên kho)");
  process.exit(1);
}

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

const jitter = () => 8000 + Math.floor(Math.random() * 7000); // nghỉ 8–15s (Mạnh duyệt 0211-16, thay 3–8s)

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
      (array_agg(list_id ORDER BY list_time DESC))[1]   AS list_id1,
      (array_agg(list_id ORDER BY list_time DESC))[2]   AS list_id2,
      (array_agg(area_name ORDER BY list_time DESC))[1] AS area,
      (array_agg(payload->>'region_name' ORDER BY list_time DESC))[1] AS region,
      (array_agg(ad_type ORDER BY list_time DESC))[1]   AS st
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
  if (PHASE === 1) {
    // MỞ LẠI 0211-7 đC: mẫu đo «một tài khoản một số» xếp ĐẦU pha 1 (lượt 30′
    // không bao giờ tới cuối danh sách) — tin thứ 2 của N tài khoản nhiều tin nhất.
    const mau = [];
    let n = 0;
    for (const r of rows) {
      if (r.list_id2 && !daTh(r.list_id2) && n < MAU) {
        mau.push({ ...r, list_id: r.list_id2, mau: true });
        n++;
      }
    }
    const viec = [...mau];
    for (const r of rows) {
      if (r.list_id1 && !daTh(r.list_id1)) viec.push({ ...r, list_id: r.list_id1, mau: false });
    }
    return viec;
  }
  // pha 2: mọi tin không ẩn chưa có số
  const q2 = `
    SELECT list_id, area_name AS area, payload->>'region_name' AS region, ad_type AS st,
           (payload->>'account_id') AS account_id, city_code
    FROM stg_chotot_ads
    WHERE (payload->>'phone_hidden') IS DISTINCT FROM 'true'
    ORDER BY list_time DESC`;
  return (await client.query(q2)).rows.filter((r) => !daTh(r.list_id));
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
    const pathOk = page.url().includes(`/${viec.list_id}.htm`);
    if (!pathOk) {
      const body = (await page.content()).toLowerCase();
      if (body.includes("captcha")) return { status: "chan-captcha" };
      return { status: "trang-khac" };
    }
    // nút hiện số (đã kiểm 02/11: KHÔNG đòi đăng nhập)
    const nut = await page
      .waitForSelector('button:has-text("Hiện số"), button:has-text("hiển thị số")', { timeout: 10_000 })
      .catch(() => null);
    if (!nut) {
      const body = (await page.content()).toLowerCase();
      if (body.includes("captcha")) return { status: "chan-captcha" };
      if (body.includes("không còn") || body.includes("hết hạn") || body.includes("đã bán")) return { status: "het-han" };
      return { status: "khong-nut" };
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
  // MỞ LẠI 0211-7 đD: che cả tên miền trong log (tầng A — không vào nac*.log)
  console.log(`[thu-so-s06] pha ${PHASE} · luồng ${THREADS} · cửa sổ ${MINUTES}′ · web=«che»`);
  const client = new pg.Client({ connectionString: DB_URL });
  await client.connect();
  const state = await docState();
  let viec = await docViec(client, state);
  if (LIMIT > 0) viec = viec.slice(0, LIMIT);
  console.log(`việc cần thu: ${viec.length} (đã có state: ${Object.keys(state.da_thu).length})`);

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
    for (let lan = 0; ; lan++) {
      try {
        browser = await chromium.connectOverCDP(`http://127.0.0.1:${CDP_PORT}`);
        break;
      } catch (e) {
        if (lan >= 30) throw new Error(`Chrome CDP chưa lên sau 30 lần thử: ${e.message}`);
        await sleep(1000);
      }
    }
  }
  // 0211-12/hậu nấc-4: Chrome detached Ở LẠI sau lượt và có lúc chiếm trước —
  // tắt đúng PID mình spawn khi lượt kết thúc (kể cả đường lỗi).
  const tatChrome = async () => {
    if (!chromeProc) return; // instance do lượt trước mở — không đụng (0211-13)
    for (const sig of ["SIGTERM", "SIGKILL"]) {
      try { process.kill(chromeProc.pid, sig); } catch { return; }
      for (let i = 0; i < 10; i++) {
        await sleep(300);
        try { process.kill(chromeProc.pid, 0); } catch { return; } // đã chết
      }
    }
  };
  _tatChrome = tatChrome;

  const contexts = [browser.contexts()[0]]; // mọi luồng dùng chung context (cookie CF dùng chung)
  // 0211-10 (b): mỗi luồng giữ đúng MỘT tab tạo MỘT lần đầu qua
  // Target.createTarget {background: true} — không nhấc Chrome lên; tái dùng
  // bằng goto cho mọi tin (điều phối nghi newPage mỗi tin là nguyên nhân
  // cửa sổ bung). Fallback: context.newPage() nếu đường CDP không trả page.
  const ctx0 = contexts[0];
  const tabs = [];
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

  const ketQua = { co_so: 0, khac_so: 0 };
  const errors = {};
  const batch = [];
  const mau = { da_do: 0, trung: 0, khac: 0 };
  const deadline = Date.now() + MINUTES * 60_000;
  const t0 = Date.now();
  let chanLienTiep = 0;
  let thu = 0;
  let iViec = 0;

  async function motLuong(idx) {
    const tab = tabs[idx % tabs.length];
    while (iViec < viec.length && Date.now() < deadline && chanLienTiep < 5) {
      const v = viec[iViec++];
      const tBat = Date.now();
      let kq;
      try {
        kq = await laySoTrang(tab, v);
      } catch (e) {
        kq = { status: e.message?.includes("Timeout") ? "timeout" : "loi-trang" };
      }
      const ms = Date.now() - tBat;
      thu++;

      if (process.env.S06_DEBUG) console.log(`[dbg] tin ${v.list_id} → ${kq.status}${kq.phone ? " (có số)" : ""} · ${ms}ms`);
      // 0211-9 (1): loi-trang/timeout cũng là dấu hiệu đường chết — đếm chung,
      // 5 lần LIỀN dừng lượt (trước đây 125 loi-trang liền không dừng được)
      if (/^(chan|khong-ra-so|loi-trang|timeout)/.test(kq.status)) chanLienTiep++;
      else chanLienTiep = 0;
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
      if (thu % 25 === 0) {
        await ghiState(state);
        const giay = ((Date.now() - t0) / 1000 / thu).toFixed(1);
        console.log(`tiến độ ${thu}/${viec.length} · ${giay}s/tin · có số ${ketQua.co_so} · lỗi ${JSON.stringify(errors)}`);
      }
      await sleep(jitter());
    }
  }

  try {
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
  for (const d of daFlush) {
    try { await importDir(client, d); } catch (e) { console.log(`nạp ${d} lỗi: ${e.message}`); }
  }
  await client.end().catch(() => {});
  } finally {
    // 0211-14 (3a): finally — kể cả đường ném lỗi giữa lượt cũng tắt Chrome mình spawn
    await tatChrome();
  }

  const giayMoiTin = thu > 0 ? (Date.now() - t0) / 1000 / thu : 0;
  const tong = viec.length + Object.keys(state.da_thu).length;
  const conLai = Math.max(0, tong - thu);
  const duKienGio = (conLai * giayMoiTin * 1.0) / 3600; // cùng số luồng hiện tại
  const tiLeTrung = mau.da_do > 0 ? (mau.trung / (mau.trung + mau.khac || 1) * 100).toFixed(1) : null;
  const tongCoSo = Object.values(state.da_thu).filter((x) => x.phone).length;
  console.log(
    `[nấc] ${JSON.stringify({
      pha: PHASE, luong: THREADS, tin_thu: thu, giay_moi_tin: +giayMoiTin.toFixed(1),
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
  process.exit(chanLienTiep >= 5 ? 2 : 0);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((e) => {
    console.error("❌", e);
    process.exit(1);
  });
  // Ctrl-C / SIGTERM giữa lượt: đừng để Chrome ở lại chiếm màn hình
  for (const sig of ["SIGINT", "SIGTERM"]) {
    process.on(sig, () => {
      console.log(`nhận ${sig} — tắt Chrome rồi dừng`);
      // 0211-15: khi _tatChrome còn null thì ?.() nhả undefined và cả chuỗi
      // finally bỏ qua — exit không chạy. Promise.resolve luôn tạo chuỗi.
      Promise.resolve(_tatChrome?.()).finally(() => process.exit(130));
    });
  }
}
