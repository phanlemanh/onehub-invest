#!/usr/bin/env node
// dong-dau-dia-chi-that.mjs — phép đo trên BẢN CHÉP DB máy thu cho hồ sơ _acceptance/dong-dau-dia-chi-luc-nap (TG2).
// Chỉ chạy trên DB tên oneinvest_p4_tg2 (dựng lại từ đầu bằng `bash db/db-thu.sh oneinvest_p4_tg2`); từ chối DB oneinvest.
//
// Vì sao phải có KỊCH BẢN DUYỆT khai trước: Cổng Phạm vi đã chốt «không đóng dấu từ thẻ nháp», mà trên máy thu lúc đo cả 26
// thẻ đều còn nháp — đo thẳng thì số đóng dấu thật là 0, và lượt chấm sẽ đỏ hay xanh vì trạng thái duyệt chứ không vì mã.
// Nên lệnh chạy HAI lượt nạp trên cùng bản chép, cùng mã:
//   lượt NỀN  — thẻ để nguyên như máy thu (N thẻ đã duyệt lúc đo, in ra) → chụp TRƯỚC;
//   kịch bản  — áp đúng kịch bản đã khai trong evidence/kich-ban-duyet.md TRƯỚC khi đo → lượt nạp → chụp SAU.
// Số của lượt NỀN là số thật trên máy thu ngay sau khi hàng gộp; số SAU là số khi buổi duyệt làm đúng kịch bản.
//
//   node pipeline/scripts/dong-dau-dia-chi-that.mjs --chay [--kich-ban K1]   hai lượt nạp, ghi .acceptance-runs/…/do-that.json
//   node pipeline/scripts/dong-dau-dia-chi-that.mjs --thuoc <phu-the|nguong-moc|khong-tut|phu-kind|chu-bai-that> [--do-neu-cu]
//     --do-neu-cu: số đo vắng hay ghim commit khác thì dựng lại bản chép và đo trước (khoá thư mục, thước song song chờ nhau)
// Mỗi thước một mã thoát riêng (0 đạt · 1 trượt · 2 chưa đo được). Bài đọc qua loadStgPosts — không đọc thẳng bảng staging.
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import pg from "pg";

import { runTransformZalo } from "../transform-zalo.mjs";
import { docNhanDuAn, docTheDaDuyet, RULE_ID } from "../lib/dia-chi-the-nhom.mjs";
import { khoaNhomThat } from "../lib/eval-labels.mjs";
import { loadStgPosts } from "../lib/test-posts.mjs";

const GOC = join(dirname(fileURLToPath(import.meta.url)), "../..");
export const DB_THU = "oneinvest_p4_tg2";
const TEP_DO = join(GOC, ".acceptance-runs/dong-dau-dia-chi-luc-nap/do-that.json");
export const NGUONG = Object.freeze({ dinhViAll: 0.9, phuThe: 1.0 }); // Cổng Phạm vi 17/11: Hỏi-1 = 90% trên cửa sổ all

/** Kịch bản duyệt — khai ở evidence/kich-ban-duyet.md TRƯỚC khi đo; thêm kịch bản là thêm một dòng ở đây và ở tệp ấy. */
export const KICH_BAN = Object.freeze({
  K1: {
    mo_ta: "nhận nguyên nháp mọi thẻ nháp còn sống (người bấm «nhận» cho cả 26 thẻ, không sửa ô nào)",
    sql: `UPDATE group_address_cards SET status = 'da_duyet', decided_by = 'kich-ban-K1', decided_at = now()
           WHERE status = 'nhap' AND retired_at IS NULL`,
  },
});

function moDb() {
  const url = process.env.DATABASE_URL ?? `postgres://oneinvest:oneinvest@localhost:5433/${DB_THU}`;
  const ten = url.split("?")[0].split("/").pop();
  if (ten !== DB_THU) {
    console.error(`dong-dau-dia-chi-that: chỉ chạy trên bản chép ${DB_THU} (đang trỏ ${ten}) — dựng bằng: bash db/db-thu.sh ${DB_THU}`);
    process.exit(2);
  }
  return new pg.Client({ connectionString: url });
}
const sha = () => execFileSync("git", ["-C", GOC, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
const pc = (a, b) => (b ? `${((a / b) * 100).toFixed(2)}%` : "—");

/** Ô «Định vị» của S03 theo ba cửa sổ, đúng cách pipeline/sql/600_data_flow.sql gộp (first_seen theo ngày giờ VN). */
async function dinhVi(c) {
  const { rows } = await c.query(`
    WITH homnay AS (SELECT (now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date AS d),
         o AS (SELECT s.offer_id, (s.first_seen AT TIME ZONE 'Asia/Ho_Chi_Minh')::date AS d,
                      EXISTS (SELECT 1 FROM offer_project p WHERE p.offer_id = s.offer_id AND p.status = 'mot_du_an') AS located
                 FROM sale_offers s WHERE s.source = 'S03')
    SELECT w.k, count(o.*)::int AS offers, count(o.*) FILTER (WHERE o.located)::int AS located
      FROM (VALUES ('7d', 7), ('30d', 30), ('all', NULL::int)) w(k, n)
      LEFT JOIN o ON w.n IS NULL OR o.d >= (SELECT d FROM homnay) - (w.n - 1)
     GROUP BY w.k`);
  return Object.fromEntries(rows.map((r) => [r.k, { offers: r.offers, located: r.located }]));
}

/** Chụp trạng thái theo BÀI (kind nằm trong khoá gom tin nên đổi kind là đổi offer_id — so theo bài mới ổn định). */
async function chup(c) {
  const nThe = (await c.query(`SELECT count(*) FILTER (WHERE status = 'da_duyet' AND retired_at IS NULL)::int AS n FROM group_address_cards`)).rows[0].n;
  const { rows } = await c.query(`
    SELECT p.post_id, s.offer_id, s.kind, coalesce(op.status, 'khong') AS st, s.post_ids[1] = p.post_id AS dau
      FROM sale_offers s CROSS JOIN LATERAL unnest(s.post_ids) AS p(post_id)
      LEFT JOIN offer_project op ON op.offer_id = s.offer_id
     WHERE s.source = 'S03'`);
  const bai = {};
  for (const r of rows) bai[r.post_id] = [r.offer_id, r.kind, r.st, r.dau ? 1 : 0];
  const xd = (await c.query(`SELECT count(*)::int AS n FROM offer_project WHERE source = 'S03' AND status = 'xung_dot'`)).rows[0].n;
  return { nThe, dinhVi: await dinhVi(c), xungDotTin: xd, bai };
}

async function napIm(c) {
  const log = console.log;
  console.log = () => {};
  try {
    await c.query("BEGIN");
    const kq = await runTransformZalo(c);
    await c.query("COMMIT");
    return kq;
  } catch (e) { await c.query("ROLLBACK").catch(() => {}); throw e; } finally { console.log = log; }
}

async function chay(kichBan) {
  const kb = KICH_BAN[kichBan];
  if (!kb) { console.error(`kịch bản không có: ${kichBan} (có: ${Object.keys(KICH_BAN).join(", ")})`); process.exit(2); }
  const c = moDb();
  await c.connect();
  try {
    const t0 = performance.now();
    const nen = await napIm(c);
    const truoc = await chup(c);
    await c.query(kb.sql);
    const sau = await napIm(c);
    const sauChup = await chup(c);
    const ra = {
      sha: sha(), luc: new Date().toISOString(), db: DB_THU, kich_ban: kichBan, mo_ta: kb.mo_ta,
      giay: +((performance.now() - t0) / 1000).toFixed(1),
      truoc: { ...truoc, nguonLoai: nen.nguonLoai, the_nhom: nen.the_nhom },
      sau: { ...sauChup, nguonLoai: sau.nguonLoai, the_nhom: sau.the_nhom },
    };
    mkdirSync(dirname(TEP_DO), { recursive: true });
    writeFileSync(TEP_DO, JSON.stringify(ra));
    console.log(`đo xong trên ${DB_THU} ở ${ra.sha.slice(0, 9)}, ${ra.giay} giây — kịch bản ${kichBan}: ${kb.mo_ta}`);
    console.log(`thẻ đã duyệt: lượt nền ${truoc.nThe} · sau kịch bản ${sauChup.nThe}`);
  } finally {
    await c.end();
  }
}

/** Số đo còn dùng được: có tệp và ghim đúng commit đang chạy. */
const conMoi = () => existsSync(TEP_DO) && JSON.parse(readFileSync(TEP_DO, "utf8")).sha === sha();

/**
 * Đo lại CHỈ khi số cũ đã cũ — để mỗi thước tự đủ mà lượt chấm chạy nhiều thước vẫn chỉ trả một lần dựng bản chép + hai lượt
 * nạp. Khoá bằng mkdir (nguyên tử): thước chạy song song chờ nhau, không hai lượt cùng ghi lên một bản chép.
 */
async function chayNeuCu(kichBan) {
  if (conMoi()) return;
  const khoa = `${TEP_DO}.khoa`;
  mkdirSync(dirname(TEP_DO), { recursive: true });
  for (;;) {
    try { mkdirSync(khoa); break; } catch { await new Promise((r) => setTimeout(r, 5000)); }
  }
  try {
    if (conMoi()) return;
    execFileSync("bash", [join(GOC, "db/db-thu.sh"), DB_THU], { stdio: "inherit" });
    await chay(kichBan);
  } finally { rmSync(khoa, { recursive: true, force: true }); }
}

function docDo() {
  if (!existsSync(TEP_DO)) { console.error(`chưa có số đo: chạy --chay trước (${TEP_DO})`); process.exit(2); }
  const d = JSON.parse(readFileSync(TEP_DO, "utf8"));
  if (d.sha !== sha()) {
    console.error(`số đo ở ${d.sha.slice(0, 9)} mà mã đang ở ${sha().slice(0, 9)} — chạy lại --chay`);
    process.exit(2);
  }
  console.log(`số đo: ${d.db} · ${d.luc} · kịch bản ${d.kich_ban} (${d.mo_ta}) · thẻ đã duyệt: nền ${d.truoc.nThe}, sau ${d.sau.nThe}`);
  return d;
}

/** Bản đồ bài → khoá nhóm, qua loadStgPosts (gạt bài thử). */
async function nhomCuaBai(c) {
  const { posts } = await loadStgPosts(c, "zalo");
  return new Map(posts.map((p) => [p.post_id, p.conversation_id == null ? null : khoaNhomThat(p.conversation_id)]));
}

const THUOC = {
  // AC-8: 0 bài rơi từ mot_du_an sang xung_dot hay sang không-có-dự-án.
  "khong-tut": async () => {
    const d = docDo();
    const roi = Object.entries(d.truoc.bai).filter(([p, v]) => v[2] === "mot_du_an" && d.sau.bai[p]?.[2] !== "mot_du_an");
    const sang = {};
    for (const [p] of roi) { const s = d.sau.bai[p]?.[2] ?? "khoi-tin"; sang[s] = (sang[s] ?? 0) + 1; }
    const motTruoc = Object.values(d.truoc.bai).filter((v) => v[2] === "mot_du_an").length;
    console.log(`bài mot_du_an: trước ${motTruoc} · rơi khỏi mot_du_an: ${roi.length} ${JSON.stringify(sang)}`);
    console.log(`tin xung_dot: trước ${d.truoc.xungDotTin} · sau ${d.sau.xungDotTin}`);
    for (const [p] of roi.slice(0, 20)) console.log(`  rơi: bài ${p} · tin ${d.sau.bai[p]?.[0] ?? "(không còn tin)"}`);
    return roi.length === 0;
  },
  // AC-11: 0 bài mất kind; in nguồn của kind và số bài LẬT sale ↔ rent_lt (khác 0 thì khai Known limits).
  "phu-kind": async () => {
    const d = docDo();
    let mat = 0; const lat = { "sale→rent_lt": 0, "rent_lt→sale": 0 };
    for (const [p, v] of Object.entries(d.truoc.bai)) {
      const s = d.sau.bai[p];
      if (v[1] && !s?.[1]) mat++;
      else if (v[1] && s[1] && v[1] !== s[1]) lat[`${v[1]}→${s[1]}`] = (lat[`${v[1]}→${s[1]}`] ?? 0) + 1;
    }
    console.log(`bài có kind: trước ${Object.keys(d.truoc.bai).length} · sau ${Object.keys(d.sau.bai).length} · mất kind ${mat}`);
    console.log(`bài lật chiều: ${JSON.stringify(lat)}`);
    console.log(`nguồn kind (bài, lượt sau): chữ bài ${(d.sau.nguonLoai["chu-bai"] ?? 0) + (d.sau.nguonLoai["tin-hieu-chu"] ?? 0) + (d.sau.nguonLoai["don-vi-gia"] ?? 0)}` +
      ` · thẻ ${d.sau.nguonLoai["the-nhom"] ?? 0} · bối cảnh nhóm ${d.sau.nguonLoai["boi-canh-nhom"] ?? 0}`);
    return mat === 0;
  },
  // AC-1(b): ô Định vị S03, ngưỡng 90% trên cửa sổ all; in ba cửa sổ, cả lượt nền (= máy thu lúc này) lẫn sau kịch bản.
  "nguong-moc": async () => {
    const d = docDo();
    for (const [ten, x] of [["lượt nền (máy thu ngay sau khi gộp)", d.truoc], ["sau kịch bản", d.sau]]) {
      const w = x.dinhVi;
      console.log(`${ten} — ${x.nThe} thẻ đã duyệt: all ${w.all.located}/${w.all.offers} = ${pc(w.all.located, w.all.offers)} · ` +
        `30d ${pc(w["30d"].located, w["30d"].offers)} · 7d ${pc(w["7d"].located, w["7d"].offers)}  ` +
        `(theo bài đầu: ${Object.values(x.bai).filter((v) => v[3] && v[2] === "mot_du_an").length}/${Object.values(x.bai).filter((v) => v[3]).length})`);
    }
    console.log(`ngưỡng ${NGUONG.dinhViAll * 100}% áp cho cửa sổ all; /ops/data-flow mặc định hiện 7d`);
    return d.sau.dinhVi.all.located / d.sau.dinhVi.all.offers >= NGUONG.dinhViAll;
  },
  // AC-1(a): 100% tin mà bài đầu thuộc nhóm có thẻ đã duyệt CÓ dự án để ghi được ghi dự án.
  "phu-the": async () => {
    const d = docDo();
    const c = moDb(); await c.connect();
    try {
      const { the } = await docTheDaDuyet(c);
      const nhan = await docNhanDuAn(c);
      const nhom = await nhomCuaBai(c);
      const dau = Object.entries(d.sau.bai).filter(([, v]) => v[3]).map(([p, v]) => [p, v[0]]);
      const can = dau.filter(([p]) => { const t = the.get(nhom.get(p)); return t && (t.duAn != null || nhan.has(p)); });
      const { rows } = await c.query(`SELECT DISTINCT split_part(subject_key, ':', 2) AS p FROM field_assertions
        WHERE rule_id = $1 AND field = 'project_node_id' AND retracted_at IS NULL AND subject_key = ANY ($2::text[])`,
        [RULE_ID, can.map(([p]) => `S03:${p}`)]);
      const co = new Set(rows.map((r) => r.p));
      const thieu = can.filter(([p]) => !co.has(p));
      console.log(`tin có bài đầu thuộc nhóm có thẻ đã duyệt, có dự án để ghi: ${can.length} · đã đóng dấu dự án: ${can.length - thieu.length} (${pc(can.length - thieu.length, can.length)})`);
      for (const [p, o] of thieu.slice(0, 20)) console.log(`  thiếu dấu: tin ${o} · bài đầu ${p}`);
      return can.length > 0 && thieu.length === 0;
    } finally { await c.end(); }
  },
  // E3b: trên tập THẬT, mọi bài có dự án do chữ bài nêu (thuộc nhóm có thẻ đã duyệt) nhận đúng dự án của chữ bài.
  "chu-bai-that": async () => {
    const d = docDo();
    const c = moDb(); await c.connect();
    try {
      const { the } = await docTheDaDuyet(c);
      const nhan = await docNhanDuAn(c);
      const nhom = await nhomCuaBai(c);
      const tap = [...nhan].filter(([p]) => the.has(nhom.get(p)));
      const khac = tap.filter(([p, id]) => the.get(nhom.get(p)).duAn != null && the.get(nhom.get(p)).duAn !== id);
      const { rows } = await c.query(`SELECT split_part(subject_key, ':', 2) AS p, value FROM field_assertions
        WHERE rule_id = $1 AND field = 'project_node_id' AND retracted_at IS NULL AND subject_key = ANY ($2::text[])`,
        [RULE_ID, tap.map(([p]) => `S03:${p}`)]);
      const ghi = new Map(rows.map((r) => [r.p, r.value]));
      // Bài không thành tin (Yêu cầu, bài chỉ ảnh) không được đóng dấu — chỉ chấm bài nằm trong một tin.
      const trongTin = new Set(Object.keys(d.sau.bai));
      const cham = tap.filter(([p]) => trongTin.has(p));
      const lech = cham.filter(([p, id]) => ghi.get(p) !== id);
      console.log(`bài chữ bài nêu dự án, thuộc nhóm có thẻ đã duyệt: ${tap.length} (nằm trong tin: ${cham.length}) · trong đó nêu dự án KHÁC thẻ: ${khac.length}`);
      console.log(`nhận đúng dự án của chữ bài: ${cham.length - lech.length}/${cham.length}`);
      for (const [p, id] of lech.slice(0, 20)) console.log(`  lệch: bài ${p} · chữ bài ${id} · đã ghi ${ghi.get(p) ?? "(không)"}`);
      return lech.length === 0;
    } finally { await c.end(); }
  },
};

if (process.argv[1] && process.argv[1].endsWith("dong-dau-dia-chi-that.mjs")) {
  const a = process.argv.slice(2);
  const lay = (k) => { const i = a.indexOf(k); return i < 0 ? undefined : a[i + 1]; };
  if (a.includes("--chay")) await chay(lay("--kich-ban") ?? "K1");
  else if (THUOC[lay("--thuoc")]) {
    if (a.includes("--do-neu-cu")) await chayNeuCu(lay("--kich-ban") ?? "K1");
    process.exit((await THUOC[lay("--thuoc")]()) ? 0 : 1);
  }
  else { console.error(`dùng: --chay [--kich-ban K1] | --thuoc <${Object.keys(THUOC).join("|")}>`); process.exit(2); }
}
