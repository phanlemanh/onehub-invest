// do-duong-s06.mjs — hồ sơ _acceptance/s06-duong-du-an-len-tin (DS1) AC-7: thước trên bản chép DB máy thu (db/db-thu.sh).
// Chạy thật transform S06 + resolve-properties rồi đếm trước/sau; không in tên nguồn, chỉ in mã S0x. Vi phạm → in dòng, thoát 1.
//   --chi-doc              chỉ đếm, không chạy gì (dùng được trên DB máy thu sau job đêm)
//   --nguong-duong <n>     ngưỡng % đường (mặc định 90)
//   --gai-ten-nguon        gài một giá trị đường chứa tên nguồn vào phép kiểm
//   --gai-cap-lech         gài một cặp cùng tên mà bộ so báo Lệch vào phép kiểm
// Lượt đầy đủ tự chứng ba chiều đỏ trên chính bản chép, rồi chạy `resolve-properties --hoan-tac-duong` thật làm bước cuối.
import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { stripTypeScriptTypes } from "node:module";
import { join } from "node:path";
import pg from "pg";

import { docDuong } from "../lib/dac-trung-s06.mjs";
import { chayResolve } from "../resolve-properties.mjs";
import { runTransformChotot } from "../transform-chotot.mjs";

const mot = (n) => n.toFixed(1);
const PIPE = join(import.meta.dirname, "..");
const SUT_TOI_DA = 1;
const argv = process.argv.slice(2);
const co = (ten) => argv.includes(ten);
const CHI_DOC = co("--chi-doc");
const iNguong = argv.indexOf("--nguong-duong");
const NGUONG = iNguong >= 0 ? Number(argv[iNguong + 1]) : 90;
const DB_URL = process.env.DATABASE_URL ?? "";
if (!CHI_DOC && !/\/oneinvest_[a-z0-9_]+$/.test(DB_URL)) {
  console.error("do-duong-s06: lượt ghi cần DATABASE_URL trỏ DB thử oneinvest_<dãy>_<việc> (bash db/db-thu.sh …)");
  process.exit(2);
}

/** soDuong thật, rút từ agent/src/agents/judge-entity.ts — pipeline không phụ thuộc gói agent. */
function napSoDuong() {
  const nguon = readFileSync(join(PIPE, "../agent/src/agents/judge-entity.ts"), "utf8");
  const rut = (ten) => {
    const m = nguon.match(new RegExp(`^export function ${ten}\\([\\s\\S]*?\\n}`, "m"));
    if (!m) throw new Error(`do-duong-s06: không rút được ${ten} từ judge-entity.ts`);
    return m[0].replace(/^export /, "");
  };
  return new Function(`${stripTypeScriptTypes(["boDau", "khoaDuong", "soDuong"].map(rut).join("\n"))}\nreturn soDuong;`)();
}

/** Định nghĩa độc lập với khoaDuong: bỏ hoa, tiền tố «Đường», «Phố» viết đúng chính tả, rồi mới bỏ dấu — «Dương Khuê», «Đương X» không phải tiền tố. */
const chuan = (s) => s.normalize("NFC").toLowerCase().trim().replace(/\s+/g, " ")
  .replace(/^(?:đường|phố|duong|pho)\s+/u, "")
  .normalize("NFD").replace(/\p{M}/gu, "").replace(/đ/g, "d");

const SAU_COT = [
  ["loại hình", "property_type IS NOT NULL AND property_type <> 'unknown'"],
  ["phòng ngủ", "bedrooms IS NOT NULL"],
  ["WC", "bathrooms IS NOT NULL"],
  ["số nhà", "street_number IS NOT NULL"],
  ["mã căn", "unit_number IS NOT NULL"],
  ["số tầng", "stories IS NOT NULL"],
];

async function dem(c) {
  const cot = SAU_COT.map(([, dk], i) => `count(*) FILTER (WHERE ${dk})::int AS t${i}`).join(", ");
  const t = (await c.query(`SELECT count(*)::int n, count(*) FILTER (WHERE NULLIF(btrim(street_raw), '') IS NOT NULL)::int duong, ${cot}
    FROM sale_offers WHERE source = 'S06'`)).rows[0];
  const can = (await c.query(`SELECT count(DISTINCT p.id)::int n, count(DISTINCT p.id) FILTER (WHERE NULLIF(btrim(p.street), '') IS NOT NULL)::int duong
    FROM properties p JOIN property_offers po ON po.property_id = p.id JOIN sale_offers o ON o.offer_id = po.offer_id WHERE o.source = 'S06'`)).rows[0];
  return { tin: t.n, duong: t.duong, truong: SAU_COT.map((_, i) => t[`t${i}`]), can: can.n, canDuong: can.duong };
}
const pct = (a, b) => (b ? (a / b) * 100 : 0);

async function chay() {
  const c = new pg.Client({ connectionString: DB_URL || undefined });
  await c.connect();
  const vipham = [];
  try {
    const truoc = await dem(c);
    let giay = 0;
    if (!CHI_DOC) {
      const t0 = Date.now();
      await runTransformChotot(c);
      await chayResolve(c);
      giay = (Date.now() - t0) / 1000;
    }
    const sau = await dem(c);

    const pTin = pct(sau.duong, sau.tin);
    const pCan = pct(sau.canDuong, sau.can);
    console.log(`đường ở tin: ${truoc.duong}/${truoc.tin} → ${sau.duong}/${sau.tin} (${mot(pTin)}%)`);
    console.log(`đường ở căn: ${truoc.canDuong}/${truoc.can} → ${sau.canDuong}/${sau.can} (${mot(pCan)}%)`);
    if (pTin < NGUONG) vipham.push(`đường ở tin dưới ngưỡng: ${mot(pTin)}% < ${NGUONG}%`);
    if (pCan < NGUONG) vipham.push(`đường ở căn dưới ngưỡng: ${mot(pCan)}% < ${NGUONG}%`);

    SAU_COT.forEach(([ten], i) => {
      const [a, b] = [pct(truoc.truong[i], truoc.tin), pct(sau.truong[i], sau.tin)];
      console.log(`${ten}: ${mot(a)}% → ${mot(b)}%`);
      if (!CHI_DOC && a - b > SUT_TOI_DA) vipham.push(`${ten} giảm quá ${SUT_TOI_DA} điểm %: ${mot(a)}% → ${mot(b)}%`);
    });

    // Tên nguồn: real_name + source_ids của source_registry; khớp nguyên từ, không in tên.
    const { rows: dk } = await c.query("SELECT code, real_name, source_ids FROM source_registry");
    const ten = dk.flatMap((r) => [r.real_name, ...(r.source_ids ?? [])].filter((s) => s && s.length >= 3).map((s) => [r.code, s.toLowerCase()]));
    console.log(`danh sách tên nguồn: ${ten.length} phần tử`);
    if (!ten.length) vipham.push("danh sách tên nguồn rỗng — phép kiểm vô nghĩa");
    const { rows: gtr } = await c.query(`SELECT street_raw v FROM sale_offers WHERE source = 'S06' AND street_raw IS NOT NULL
      UNION ALL SELECT p.street FROM properties p WHERE p.street IS NOT NULL`);
    const giaTri = gtr.map((r) => r.v);
    if (co("--gai-ten-nguon") && ten.length) giaTri.push(`Đường ${ten[0][1]} 1`);
    const trung = new Map();
    for (const v of giaTri) {
      const t = v.toLowerCase();
      for (const [ma, s] of ten) {
        const i = t.indexOf(s);
        if (i < 0) continue;
        const bien = (ch) => ch === undefined || !/[\p{L}\p{N}]/u.test(ch);
        if (bien(t[i - 1]) && bien(t[i + s.length])) trung.set(ma, (trung.get(ma) ?? 0) + 1);
      }
    }
    const nTrung = [...trung.values()].reduce((a, b) => a + b, 0);
    console.log(`giá trị đường chứa tên nguồn: ${nTrung}${nTrung ? ` (${[...trung].map(([m, n]) => `${m}=${n}`).join(" ")})` : ""}`);
    if (nTrung) vipham.push(`đường chứa tên nguồn: ${nTrung} giá trị`);

    // Cặp tin cùng căn.
    const soDuong = napSoDuong();
    const { rows: nhom } = await c.query(`SELECT array_agg(DISTINCT o.street_raw) d FROM property_offers po JOIN sale_offers o ON o.offer_id = po.offer_id
      WHERE NULLIF(btrim(o.street_raw), '') IS NOT NULL GROUP BY po.property_id HAVING count(DISTINCT o.street_raw) > 1`);
    let nLech = 0, nOan = 0;
    for (const { d } of nhom) {
      for (let i = 0; i < d.length; i++) for (let j = i + 1; j < d.length; j++) {
        if (soDuong(d[i], d[j]) !== "lech") continue;
        nLech++;
        if (chuan(d[i]) === chuan(d[j])) nOan++;
      }
    }
    if (co("--gai-cap-lech")) { nLech++; nOan++; }
    console.log(`cặp tin cùng căn ra Lệch: ${nLech}; trong đó cùng tên sau chuẩn hoá: ${nOan}`);
    if (nOan) vipham.push(`cặp cùng tên ra Lệch: ${nOan}`);

    // Số tin bị bỏ theo từng tiền tố hành chính.
    const { rows: thuc } = await c.query(`SELECT payload->>'street_name' v FROM stg_chotot_ads
      WHERE price > 0 AND size_m2 > 0 AND NULLIF(btrim(payload->>'street_name'), '') IS NOT NULL`);
    const bo = new Map();
    for (const { v } of thuc) {
      if (docDuong(v) !== null) continue;
      const dau = v.trim().split(/\s+/)[0].toLowerCase();
      const k = dau.length >= 32 ? "mã-hoá" : dau;
      bo.set(k, (bo.get(k) ?? 0) + 1);
    }
    console.log(`tin bị bỏ theo tiền tố: ${[...bo].sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k}=${n}`).join(" ") || "0"}`);
    console.log(`thời gian transform + resolve: ${giay.toFixed(0)} giây`);
    return { vipham, c };
  } catch (e) {
    await c.end();
    throw e;
  }
}

/** Chiều đỏ trên chính bản chép: cùng lệnh, chỉ đọc, phải thoát 1 và ghim đúng thông điệp. */
function chungDo(vipham) {
  const toi = join(PIPE, "scripts/do-duong-s06.mjs");
  for (const [cac, ghim] of [[["--nguong-duong", "100.1"], "đường ở tin dưới ngưỡng"], [["--gai-ten-nguon"], "đường chứa tên nguồn"], [["--gai-cap-lech"], "cặp cùng tên ra Lệch"]]) {
    const r = spawnSync(process.execPath, [toi, "--chi-doc", ...cac], { encoding: "utf8", env: process.env });
    const dat = r.status === 1 && r.stdout.includes(ghim);
    console.log(`chiều đỏ ${cac[0]}: thoát ${r.status}, ${dat ? "đúng thông điệp" : "SAI"}`);
    if (!dat) vipham.push(`chiều đỏ ${cac[0]} không ra «${ghim}»`);
  }
}

const { vipham, c } = await chay();
try {
  if (!CHI_DOC) {
    chungDo(vipham);
    // Hoàn tác thật, chỉ trên bản chép: số ô trả về bằng số mục log.
    const n = (await c.query(`SELECT count(*)::int n FROM properties p, jsonb_array_elements(p.enrichment_log) e
      WHERE e->>'src' = 'resolve-properties' AND e->>'field' = 'street'`)).rows[0].n;
    const ra = execFileSync(process.execPath, [join(PIPE, "resolve-properties.mjs"), "--hoan-tac-duong"], { encoding: "utf8", env: process.env });
    const m = /trả về trống (\d+) ô/.exec(ra);
    console.log(`lệnh hoàn tác: ${m?.[1] ?? "?"} ô, ${n} mục log`);
    if (Number(m?.[1]) !== n) vipham.push(`lệnh hoàn tác trả ${m?.[1]} ô, khác ${n} mục log`);
  }
} finally {
  await c.end();
}
for (const v of vipham) console.log(`VI PHẠM: ${v}`);
process.exit(vipham.length ? 1 : 0);
