#!/usr/bin/env node
// bi-danh-viet-tat-phan-khu-soat-nguon.mjs — DA51 E10: bốn tên tắt (chuỗi ngắn) không bị bộ soát tên nguồn coi là tên nguồn
// thật khi lên cloud. Dùng đúng hàm nạp sổ (`docSourceNameEntries`, cờ match_whole của 112) và bộ khớp (`findSourceNames`) mà
// sync-cloud và bộ che dùng. Soát ba dạng: tên tắt đứng riêng, mảng tên của nút đích sau áp (JSON như lúc đồng bộ), tên tắt
// giữa câu tin. DB chỉ đọc; chỉ in mã và số đếm, không in tên nguồn.
//   Thoát 0: 0 chỗ trúng. Thoát 1: có chỗ trúng (nêu tên tắt, mã nguồn). Thoát 2: sổ nguồn rỗng (không soát được = đóng chặt).
//   --doi-chung: thêm vào sổ một mục giả S99 mang tên tắt «ori» (khớp nguyên cụm; «rb», «bs», «gh» dưới 3 ký tự nên bộ khớp không bao giờ lấy làm biến thể) — phép soát phải trúng (thoát 1).
import pg from "pg";
import { docSourceNameEntries } from "../lib/source-name-entries.mjs";
import { findSourceNames } from "../lib/mask-source-names.mjs";
import { BANG_VIET_TAT } from "../lib/phan-khu-s16-bi-danh.mjs";

const DICH = { ori: 44, rb: 48, bs: 387, gh: 43 };
const DOI_CHUNG = process.argv.includes("--doi-chung");

async function main() {
  const c = new pg.Client({
    connectionString: process.env.DATABASE_URL || "postgres://oneinvest:oneinvest@localhost:5433/oneinvest",
    options: "-c default_transaction_read_only=on",
  });
  await c.connect();
  try {
    const so = await docSourceNameEntries(c);
    if (!so.length) { console.error("sổ nguồn rỗng — không soát được"); process.exitCode = 2; return; }
    if (DOI_CHUNG) so.push({ code: "S99", realName: "ori", wholeOnly: true });
    console.log(`sổ nguồn: ${so.length} mục · khớp nguyên cụm ${so.filter((x) => x.wholeOnly).length}${DOI_CHUNG ? " · có mục giả S99" : ""}`);
    const { rows } = await c.query("SELECT id, name, aliases FROM asset_nodes WHERE id = ANY($1)", [Object.values(DICH)]);
    const trung = [];
    for (const { vt } of BANG_VIET_TAT) {
      const nut = rows.find((r) => Number(r.id) === DICH[vt]);
      const ma = (s) => findSourceNames(s, so).map((h) => h.code);
      const truoc = nut ? ma(JSON.stringify({ name: nut.name, aliases: nut.aliases ?? [] })) : [];
      const sau = nut ? ma(JSON.stringify({ name: nut.name, aliases: [...(nut.aliases ?? []).filter((a) => a !== vt), vt] })) : [];
      const dang = { "đứng riêng": ma(vt), [`nút ${DICH[vt]} sau áp (trúng thêm)`]: sau.slice(truoc.length), "giữa câu tin": ma(`ban can 2pn ${vt} gia tot`) };
      for (const [noi, m] of Object.entries(dang)) {
        console.log(`  ${vt} · ${noi}: ${m.length}`);
        if (m.length) trung.push(`${vt} (${noi}): ${[...new Set(m)].join(",")}`);
      }
    }
    console.log(trung.length ? `E10: ${trung.length} chỗ trúng — ${trung.join("; ")}` : "E10: 0 chỗ trúng");
    if (trung.length) process.exitCode = 1;
  } finally {
    await c.end();
  }
}

main().catch((e) => { console.error(e.message); process.exitCode = 1; });
