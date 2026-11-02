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

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
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

const jitter = () => 3000 + Math.floor(Math.random() * 5000); // nghỉ 3–8s giữa lời gọi

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
  const daTh = (id) => state.da_thu[id] && state.da_thu[id].phone !== undefined;
  if (PHASE === 1) {
    const viec = [];
    for (const r of rows) {
      if (r.list_id1 && !daTh(r.list_id1)) viec.push({ ...r, list_id: r.list_id1, mau: false });
    }
    // mẫu đo «một tài khoản một số»: tin thứ 2 của N tài khoản nhiều tin nhất
    let n = 0;
    for (const r of rows) {
      if (r.list_id2 && !daTh(r.list_id2) && n < MAU) {
        viec.push({ ...r, list_id: r.list_id2, mau: true });
        n++;
      }
    }
    return viec;
  }
  // pha 2: mọi tin không ẩn chưa có số
  const q2 = `
    SELECT list_id, area_name AS area, payload->>'region_name' AS region, ad_type AS st,
           (payload->>'account_id') AS account_id
    FROM stg_chotot_ads
    WHERE (payload->>'phone_hidden') IS DISTINCT FROM 'true'
    ORDER BY list_time DESC`;
  return (await client.query(q2)).rows.filter((r) => !daTh(r.list_id));
}

/** Ghi batch items v5 ra snapshot ngoài đường quét. */
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
  return snapshotId;
}

/** Mở trang tin, bấm hiện số, trả { status, phone }. */
async function laySoTrang(context, viec) {
  const loai = viec.st === "s" ? "mua-ban-nha-dat" : "cho-thue-nha-dat";
  const url = `${WEB_BASE}/${loai}-${slug(viec.area)}-${slug(viec.region)}/${viec.list_id}.htm`;
  const page = await context.newPage();
  try {
    const res = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30_000 });
    if (process.env.S06_DEBUG) console.log(`[dbg] HTTP ${res?.status()} → ${page.url().replace(WEB_BASE, "«che»")}`);
    if (res && (res.status() === 403 || res.status() === 429)) return { status: "chan" };
    await page.waitForTimeout(1200);
    const pathOk = page.url().includes(`/${viec.list_id}.htm`);
    if (!pathOk) {
      const body = (await page.content()).toLowerCase();
      if (body.includes("captcha")) return { status: "chan" };
      return { status: "trang-khac" };
    }
    // nút hiện số (đã kiểm 02/11: KHÔNG đòi đăng nhập)
    const nut = await page
      .waitForSelector('button:has-text("Hiện số"), button:has-text("hiển thị số")', { timeout: 10_000 })
      .catch(() => null);
    if (!nut) {
      const body = (await page.content()).toLowerCase();
      if (body.includes("captcha")) return { status: "chan" };
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
    await page.close().catch(() => {});
  }
}

async function main() {
  console.log(`[thu-so-s06] pha ${PHASE} · luồng ${THREADS} · cửa sổ ${MINUTES}′ · web=${WEB_BASE.replace(/https?:\/\//, "«che»")}`);
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
  spawn("open", ["-na", "Google Chrome", "--args", `--remote-debugging-port=${CDP_PORT}`, `--user-data-dir=${profileDir}`, "--no-first-run", "--no-default-browser-check"], { stdio: "ignore", detached: false });
  const requireCollector = createRequire(join(ROOT, "collector", "package.json"));
  const { chromium } = requireCollector("playwright-core");
  let browser;
  for (let lan = 0; ; lan++) {
    try {
      browser = await chromium.connectOverCDP(`http://127.0.0.1:${CDP_PORT}`);
      break;
    } catch (e) {
      if (lan >= 30) throw new Error(`Chrome CDP chưa lên sau 30 lần thử: ${e.message}`);
      await sleep(1000);
    }
  }
  const contexts = [browser.contexts()[0]]; // mọi luồng dùng chung context (cookie CF dùng chung)

  const ketQua = { co_so: 0, khac_so: 0 };
  const errors = {};
  const batch = [];
  const mau = { da_do: 0, trung: 0, khac: 0 };
  const deadline = Date.now() + MINUTES * 60_000;
  const t0 = Date.now();
  let chanLienTiep = 0;
  let thu = 0;
  let iViec = 0;
  const cityCua = {};

  async function motLuong(idx) {
    const context = contexts[idx % contexts.length];
    while (iViec < viec.length && Date.now() < deadline && chanLienTiep < 5) {
      const v = viec[iViec++];
      const tBat = Date.now();
      let kq;
      try {
        kq = await laySoTrang(context, v);
      } catch (e) {
        kq = { status: e.message?.includes("Timeout") ? "timeout" : "loi-trang" };
      }
      const ms = Date.now() - tBat;
      thu++;

      if (process.env.S06_DEBUG) console.log(`[dbg] tin ${v.list_id} → ${kq.status}${kq.phone ? " (có số)" : ""} · ${ms}ms`);
      if (kq.status === "chan" || kq.status === "khong-ra-so") chanLienTiep++;
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
      state.da_thu[v.list_id] = { phone: kq.phone ?? null, status: kq.status, at: new Date().toISOString(), ms };

      // item v5 — payload ĐỦ từ stg (UPSERT ghi đè nhiều cột; payload mỏng sẽ NULL hoá)
      if (kq.phone || kq.status === "het-han" || kq.status === "khong-nut") {
        const p = await client
          .query("SELECT payload, city_code FROM stg_chotot_ads WHERE list_id = $1", [v.list_id])
          .then((r) => r.rows[0])
          .catch(() => null);
        if (p) {
          cityCua[v.list_id] = p.city_code;
          batch.push({
            source: "chotot-ads",
            sourceId: `ct-${v.list_id}`,
            kind: "ad",
            fetchedAt: new Date().toISOString(),
            payload: p.payload,
            seller: {
              accountRef: v.account_id ? `S06:${v.account_id}` : null,
              displayName: p.payload?.account_name ?? p.payload?.full_name ?? null,
              phone: kq.phone ?? null,
              phoneStatus: kq.phone ? "available" : kq.status === "het-han" ? "hidden_by_source" : "not_tried",
              seenAt: new Date().toISOString(),
            },
          });
        }
      }
      if (batch.length >= 500) {
        const sid = await ghiSnapshot(batch.splice(0, 500), Object.values(cityCua)[0]);
        console.log(`flush 500 → ${sid}`);
      }
      if (thu % 25 === 0) {
        await ghiState(state);
        const giay = ((Date.now() - t0) / 1000 / thu).toFixed(1);
        console.log(`tiến độ ${thu}/${viec.length} · ${giay}s/tin · có số ${ketQua.co_so} · lỗi ${JSON.stringify(errors)}`);
      }
      await sleep(jitter());
    }
  }

  await Promise.all(Array.from({ length: THREADS }, (_, i) => motLuong(i)));
  await ghiState(state);
  if (batch.length > 0) {
    const sid = await ghiSnapshot(batch, Object.values(cityCua)[0]);
    console.log(`flush cuối ${batch.length} → ${sid}`);
  }
  await browser.close().catch(() => {});
  await client.end().catch(() => {});

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
  process.exit(chanLienTiep >= 5 ? 2 : 0);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((e) => {
    console.error("❌", e);
    process.exit(1);
  });
}
