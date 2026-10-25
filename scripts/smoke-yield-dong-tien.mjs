#!/usr/bin/env node
// smoke-yield-dong-tien.mjs — _acceptance/yield-dong-tien-von-vay (UI3): /yield với mục «Dòng tiền vốn vay» qua HTTP.
// Đo HTML server trả về: link cũ /<country>/<market>/dau-tu chuyển 301 về /yield?area=<thị trường>#financing, /yield chọn đúng
// thị trường theo `area`, server dùng và kẹp eq/rate/term, số lưới khớp ô KPI cùng trang; và POST /api/v1/user-events ghi
// đúng một dòng dau_tu_input. Người dùng thử + session ghi thẳng DB local (tiền tố riêng mỗi lượt), xoá ở finally.
// Cần app chạy TỪ worktree đang kiểm (BASE_URL, mặc định :3460 — cổng riêng của dãy U1) + DB local :5433.
// Dùng: BASE_URL=http://localhost:3460 node scripts/smoke-yield-dong-tien.mjs  (exit 0 = đạt)
import { randomBytes } from "node:crypto";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { assertLocalDatabaseUrl, DEFAULT_DATABASE_URL } from "./dev-ops-account.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pg = createRequire(path.join(root, "app/package.json"))("pg");
const BASE = process.env.BASE_URL ?? "http://localhost:3460";
const db = new pg.Client({ connectionString: String(assertLocalDatabaseUrl(process.env.DATABASE_URL ?? DEFAULT_DATABASE_URL)) });

const nonce = `ydtsmoke${randomBytes(4).toString("hex")}`;
const fails = [];
const check = (ok, msg) => {
  console.log(`${ok ? "ok  " : "FAIL"} ${msg}`);
  if (!ok) fails.push(msg);
};

async function get(pathname) {
  const res = await fetch(`${BASE}${pathname}`, { redirect: "manual" });
  return { status: res.status, location: res.headers.get("location"), html: await res.text() };
}

/** Phần đánh dấu HTML, bỏ <script> (gói RSC lặp lại chuỗi). */
const markup = (html) => html.replace(/<script[\s\S]*?<\/script>/g, " ");
/** Chữ người đọc: bỏ thẻ, chú thích React, giải mã thực thể, gộp khoảng trắng. */
const text = (html) =>
  markup(html)
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;|&#160;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ");
const rel = (loc) => (loc ? decodeURIComponent(loc.replace(/^https?:\/\/[^/]+/, "")) : String(loc));
const region = (html, open, tag) => {
  const i = html.search(open);
  if (i < 0) return "";
  const j = html.indexOf(`</${tag}>`, i);
  return j < 0 ? "" : html.slice(i, j);
};
// Lưới ghi số 0 kiểu sổ sách: «0», không đơn vị (financing-cells.tsx `money`).
const MONEY = String.raw`-?−?[\d.,]+(?: tỷ| tr|k)? ₫|0`;
/** Tiền gọn «2,7 tỷ ₫» → số (để so tỉ lệ; sai số làm tròn 1 chữ số thập phân). */
const parseMoney = (s) => {
  if (s === "0") return 0;
  const m = s?.match(/(-|−)?([\d.,]+)(?: (tỷ|tr)|(k))? ₫/);
  if (!m) return NaN;
  const n = Number(m[2].replace(/\./g, "").replace(",", "."));
  const unit = m[3] === "tỷ" ? 1e9 : m[3] === "tr" ? 1e6 : m[4] ? 1e3 : 1;
  return (m[1] ? -1 : 1) * n * unit;
};

/** Số trong đầu mục vốn vay: Khoản vay, Trả nợ/tháng (chuỗi tiền gọn nguyên văn). */
function financingHeader(html) {
  const t = text(region(markup(html), /id="financing"/, "section"));
  return {
    present: t.includes("Dòng tiền vốn vay"),
    loan: t.match(new RegExp(`Khoản vay (${MONEY})`))?.[1] ?? null,
    payment: t.match(new RegExp(`Trả nợ (${MONEY})/tháng`))?.[1] ?? null,
  };
}
/** Ô năm 1 của một hàng mục trong lưới (cột: mở · tên · Hằng tháng · Năm 1 …). */
function gridYear1(html, label) {
  const sec = region(markup(html), /id="financing"/, "section");
  const rows = sec.split(/<tr[\s>]/).slice(1);
  const row = rows.find((r) => text(r.split("</tr>")[0]).includes(label));
  if (!row) return null;
  const cells = row.split("</tr>")[0].split(/<td[\s>]/).slice(1).map((c) => text(`<td ${c}`).trim());
  return cells[3] ?? null;
}
const tileValue = (html, title) => text(html).match(new RegExp(`${title} (${MONEY})`))?.[1] ?? null;
const noiOfTile = (html) => text(html).match(new RegExp(`thu nhập ròng (${MONEY})/năm`))?.[1] ?? null;

try {
  await db.connect();

  // AC-1 — link cũ /dau-tu chuyển 301 (Location đúng bằng chuỗi); /vn/hanoi không chuyển hướng.
  for (const [from, to] of [
    ["/vn/hanoi/dau-tu", "/yield?area=vn-hanoi#financing"],
    ["/vn/hcmc/dau-tu", "/yield?area=vn-hcmc#financing"],
  ]) {
    const r = await get(from);
    check(r.status === 301 && rel(r.location) === to, `${from} → 301 ${to} (nhận ${r.status} ${rel(r.location)})`);
  }
  const insight = await get("/vn/hanoi");
  check(insight.status === 200 && !insight.location, `/vn/hanoi 200, không chuyển hướng (nhận ${insight.status} ${rel(insight.location)})`);

  // AC-3 — /yield chọn thị trường theo `area`: mọi thị trường của getYieldMarkets (cùng câu truy vấn), mã phường, mã lạ.
  const { rows: markets } = await db.query(
    `SELECT DISTINCT m.id, m.name FROM market_asset_stats s JOIN areas a ON a.id = s.area_id
     JOIN areas m ON m.id = a.parent_id ORDER BY m.name`,
  );
  check(markets.length > 0, `DB local có ${markets.length} thị trường cho /yield`);
  const crumbOf = (html) => text(region(markup(html), /aria-label="Đường dẫn trang"/, "nav").replace(/^[^>]*>/, ""));
  for (const m of markets) {
    const r = await get(`/yield?area=${m.id}`);
    check(
      r.status === 200 && crumbOf(r.html).includes(m.name) && financingHeader(r.html).present,
      `/yield?area=${m.id} 200, breadcrumb mang «${m.name}», có id="financing" (nhận ${r.status}, breadcrumb «${crumbOf(r.html).trim()}»)`,
    );
  }
  if (markets.length > 1) {
    const second = markets[1];
    const { rows } = await db.query(
      `SELECT id FROM areas WHERE parent_id = $1 AND region_type = 'submarket' ORDER BY id LIMIT 1`,
      [second.id],
    );
    const r = await get(`/yield?area=${rows[0].id}`);
    check(crumbOf(r.html).includes(second.name), `/yield?area=${rows[0].id} → breadcrumb mang «${second.name}» (nhận «${crumbOf(r.html).trim()}»)`);
  }
  const stray = await get("/yield?area=khong-co-ma");
  check(
    stray.status === 200 && crumbOf(stray.html).includes(markets[0].name),
    `/yield?area=khong-co-ma → thị trường mặc định «${markets[0].name}», không 500 (nhận ${stray.status})`,
  );

  // AC-6 — server dùng và kẹp eq/rate/term. Giá mua cố định trên URL, đọc lại từ câu tóm tắt của trang.
  const PRICE = 3_000_000_000;
  const base = `/yield?area=vn-hanoi&price=${PRICE}`;
  const page = async (q = "") => (await get(`${base}${q}`)).html;
  const plain = await page();
  const priceShown = parseMoney(text(plain).match(new RegExp(`, giá (${MONEY}):`))?.[1]);
  check(priceShown === PRICE, `giá mua đọc từ HTML = ${PRICE} (nhận ${priceShown})`);
  const h0 = financingHeader(plain);
  check(Math.abs(parseMoney(h0.loan) - 0.7 * PRICE) <= 0.05e9, `không tham số → Khoản vay 70% giá mua (nhận ${h0.loan})`);

  const h1 = financingHeader(await page("&eq=1"));
  check(h1.loan === "0" && h1.payment === "0", `eq=1 → Khoản vay 0 và Trả nợ 0/tháng (nhận ${h1.loan} · ${h1.payment})`);
  const h5 = financingHeader(await page("&eq=5"));
  check(h5.loan === "0", `eq=5 → kẹp về 100%: Khoản vay 0 (nhận ${h5.loan})`);
  const hLow = financingHeader(await page("&eq=0.01"));
  check(Math.abs(parseMoney(hLow.loan) - 0.9 * PRICE) <= 0.05e9, `eq=0.01 → kẹp về 10%: Khoản vay 90% giá mua (nhận ${hLow.loan})`);

  const pay = async (q) => parseMoney(financingHeader(await page(q)).payment);
  const p0 = parseMoney(h0.payment);
  const p12 = await pay("&rate=0.12");
  check(p12 > p0, `rate=0.12 → trả nợ/tháng lớn hơn ca không tham số (${p12} > ${p0})`);
  const [r50, r30] = [await pay("&rate=0.5"), await pay("&rate=0.3")];
  check(r50 === r30 && r30 > 0, `rate=0.5 → trả nợ bằng ca rate=0.3 (kẹp 30%) (${r50} = ${r30})`);
  const [t100, t35] = [await pay("&term=100"), await pay("&term=35")];
  check(t100 === t35 && t35 > 0, `term=100 → trả nợ bằng ca term=35 (${t100} = ${t35})`);
  const [t1, t5] = [await pay("&term=1"), await pay("&term=5")];
  check(t1 === t5 && t5 > 0, `term=1 → trả nợ bằng ca term=5 (${t1} = ${t5})`);

  // AC-4 — số lưới khớp ô KPI cùng trang, với hai bộ tham số.
  for (const [name, q] of [["mặc định", ""], ["mgmt=0.1&fixed=2000000", "&mgmt=0.1&fixed=2000000"]]) {
    const html = await page(q);
    const rev = gridYear1(html, "Doanh thu ngắn hạn");
    const revTile = tileValue(html, "Doanh thu ngắn hạn / năm");
    check(rev !== null && rev === revTile, `[${name}] doanh thu năm 1 của lưới = ô Doanh thu ngắn hạn / năm (${rev} vs ${revTile})`);
    const noi = gridYear1(html, "Thu nhập ròng");
    const noiTile = noiOfTile(html);
    check(noi !== null && noi === noiTile, `[${name}] thu nhập ròng năm 1 của lưới = ô Yield ròng ngắn hạn (${noi} vs ${noiTile})`);
  }

  // AC-7 — POST /api/v1/user-events ghi đúng một dòng dau_tu_input của người thử.
  const token = randomBytes(32).toString("hex");
  const uid = `${nonce}-user`;
  const event = { kind: "dau_tu_input", payload: { area: "vn-hanoi", price: PRICE, equityPct: 0.3, ratePct: 0.09, termYears: 20 } };
  const post = (body, withCookie) =>
    fetch(`${BASE}/api/v1/user-events`, {
      method: "POST",
      headers: { "content-type": "application/json", ...(withCookie ? { cookie: `oi_session=${token}` } : {}) },
      body: JSON.stringify(body),
    });
  const countAll = async () => Number((await db.query(`SELECT count(*) FROM user_events WHERE kind = 'dau_tu_input'`)).rows[0].count);
  try {
    await db.query(`INSERT INTO users (id, email, password_hash, role) VALUES ($1, $2, 'x', 'user')`, [uid, `${uid}@local.test`]);
    await db.query(`INSERT INTO sessions (token, user_id, expires_at) VALUES ($1, $2, now() + interval '10 minutes')`, [token, uid]);

    const ok = await post(event, true);
    const okBody = await ok.json().catch(() => null);
    check(ok.status === 200 && okBody?.ok === true, `POST có phiên → 200 {ok:true} (nhận ${ok.status} ${JSON.stringify(okBody)})`);
    const { rows } = await db.query(`SELECT payload FROM user_events WHERE user_id = $1 AND kind = 'dau_tu_input'`, [uid]);
    const keys = rows[0] ? Object.keys(rows[0].payload).sort().join(",") : "";
    check(
      rows.length === 1 && keys === "area,equityPct,price,ratePct,termYears",
      `user_events có đúng 1 dòng dau_tu_input của người thử, payload đủ 5 khoá (nhận ${rows.length} dòng, khoá «${keys}»)`,
    );

    const before = await countAll();
    const anon = await post(event, false);
    const after = await countAll();
    check(anon.status === 204 && after === before, `POST không phiên → 204 và 0 dòng mới (nhận ${anon.status}, ${after - before} dòng)`);
    const bad = await post({ kind: "khong-co-loai-nay", payload: {} }, true);
    check(bad.status === 400, `POST kind lạ → 400 (nhận ${bad.status})`);
  } finally {
    await db.query(`DELETE FROM user_events WHERE user_id = $1`, [uid]);
    await db.query(`DELETE FROM sessions WHERE user_id = $1`, [uid]);
    await db.query(`DELETE FROM users WHERE id = $1`, [uid]);
  }
} catch (err) {
  check(false, `smoke dừng giữa chừng: ${err.message}`);
} finally {
  await db.end().catch(() => {});
}

console.log(fails.length ? `\nsmoke-yield-dong-tien: ${fails.length} FAIL` : "\nsmoke-yield-dong-tien: ĐẠT");
process.exit(fails.length ? 1 : 0);
