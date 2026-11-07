#!/usr/bin/env node
// label-sample.mjs — PL7 `man-gan-nhan-mu` (AC-2): chọn tin của một lát vào eval_label_items để người gắn nhãn mù.
//   node pipeline/label-sample.mjs --lat ocp1 --n 200 --seed <s> [--nhom-khop <regex>] [--thu]
//   node pipeline/label-sample.mjs --lat s03-loai-tin --n 150 --seed <s>   (lát phân tầng loại tin, mọi nhóm — AC-10 RM1)
//   node pipeline/label-sample.mjs --lat s03-theo-nhom --seed <s> --theo-nhom --moi-nhom-lon 30 --moi-nhom-nho 5 --so-nhom-lon 10   (GC0)
// Tin S03 ở stg_zalo_posts, gạt post thử bằng ĐÚNG bộ lọc của transform (lib/test-posts.mjs, L19), lọc nhóm theo mẫu tên
// của lát, khử trùng theo nội dung, chọn tất định theo seed (lib/eval-labels.mjs). Chạy lại cùng tham số: 0 dòng thêm.
// --thu: chỉ in, không ghi. Bảng chỉ ở máy thu (054_labels.sql).
import { realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";
import pg from "pg";

import { loadStgPosts } from "./lib/test-posts.mjs";
import { docTinCua, ghepLat } from "./label-ghep.mjs";
import { chonMau, chonMauTheoNhom, donViCuaBai, donViTheoNhomThat, khoaNhomThat, khuTrung, LAT_NHOM } from "./lib/eval-labels.mjs";
import { tangLoai } from "./transform-zalo.mjs";

/** Lát phân tầng theo loại tin (s03-nhan-loai-tin-rong AC-10): ba tầng bằng nhau, mọi nhóm, không lọc tên nhóm. */
export const LAT_PHAN_TANG = Object.freeze({ "s03-loai-tin": ["chu-bai", "moi-nhan", "van-bo"] });

/**
 * Mẫu phân tầng: khử trùng nội dung trên cả lô (bản trùng chữ giữ post_id nhỏ nhất, tầng theo bài đó), chia n đều cho các
 * tầng (phần dư cho tầng đầu), chọn mỗi tầng bằng chonMau với cùng seed. Cùng đầu vào + seed → cùng kết quả.
 * @param {{ post_id: string, text: string }[]} posts
 * @param {Map<string, string>} tang post_id → tầng
 * @param {{ n: number, seed: string, tangs: string[] }} opts
 */
export function chonMauPhanTang(posts, tang, { n, seed, tangs, tinCua = new Map() }) {
  // Khử trùng trên cả lô theo khoá trùng (tin của pipeline, rồi chữ đã gạt URL); tầng theo bài đại diện.
  const { dai, bo_su_kien, bo_vi_trung } = khuTrung(posts, tinCua);
  const theoTang = new Map(tangs.map((t) => [t, []]));
  for (const p of dai) {
    theoTang.get(tang.get(p.post_id))?.push(p);
  }
  const chon = [], moiTang = {};
  tangs.forEach((t, i) => {
    const can = Math.floor(n / tangs.length) + (i < n % tangs.length ? 1 : 0);
    const r = chonMau(theoTang.get(t), { n: can, seed, tinCua });
    chon.push(...r.chon);
    moiTang[t] = { co: r.khac_nhau, chon: r.chon.length };
  });
  return { chon, khac_nhau: dai.length, moiTang, bo_su_kien, bo_vi_trung };
}

const DATABASE_URL = process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";

function docCo(argv) {
  const co = { thu: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--thu") co.thu = true;
    else if (a === "--theo-nhom") co.theoNhom = true;
    else if (["--lat", "--n", "--seed", "--nhom-khop", "--moi-nhom-lon", "--moi-nhom-nho", "--so-nhom-lon"].includes(a)) co[a.slice(2)] = argv[++i];
    else throw new Error(`label-sample: cờ lạ «${a}»`);
  }
  if (!co.lat || !/^[a-z0-9-]+$/.test(co.lat)) throw new Error("label-sample: thiếu --lat (chữ thường, số, gạch nối)");
  if (co.theoNhom) {
    const so = (k, mac) => {
      const v = co[k] === undefined ? mac : Number(co[k]);
      if (!Number.isInteger(v) || v <= 0) throw new Error(`label-sample: --${k} phải là số nguyên dương`);
      return v;
    };
    if (!co.seed) throw new Error("label-sample: thiếu --seed");
    return { lat: co.lat, seed: co.seed, thu: co.thu, nhom: co["nhom-khop"] ? new RegExp(co["nhom-khop"], "i") : null, theoNhom: { moiNhomLon: so("moi-nhom-lon", 30), moiNhomNho: so("moi-nhom-nho", 5), soNhomLon: so("so-nhom-lon", 10) } };
  }
  const n = Number(co.n);
  if (!Number.isInteger(n) || n <= 0) throw new Error("label-sample: --n phải là số nguyên dương");
  if (!co.seed) throw new Error("label-sample: thiếu --seed");
  const mau = co["nhom-khop"] ?? LAT_NHOM[co.lat];
  if (!mau && LAT_PHAN_TANG[co.lat]) return { lat: co.lat, n, seed: co.seed, nhom: null, thu: co.thu };
  if (!mau) throw new Error(`label-sample: lát «${co.lat}» chưa có mẫu tên nhóm — truyền --nhom-khop`);
  return { lat: co.lat, n, seed: co.seed, nhom: new RegExp(mau, "i"), thu: co.thu };
}

/**
 * @param {import("pg").Client} client
 * @param {{ lat: string, n: number, seed: string, nhom: RegExp|null, thu: boolean, trongGiaoDich?: boolean }} co
 *   trongGiaoDich: người gọi đã mở transaction (test, thước) — ghi bằng SAVEPOINT thay cho BEGIN…COMMIT.
 */
export async function layMau(client, { lat, n, seed, nhom, thu, trongGiaoDich = false, theoNhom = null }) {
  const { rows: cu } = await client.query(
    `SELECT count(*)::int AS so, array_agg(DISTINCT seed) AS seeds FROM eval_label_items WHERE lat = $1`, [lat]);
  if (cu[0].so > 0 && !(cu[0].seeds.length === 1 && cu[0].seeds[0] === seed)) {
    throw new Error(`label-sample: lát «${lat}» đã lấy mẫu với seed khác (${cu[0].seeds.join(", ")}) — không trộn hai mẫu`);
  }
  const { posts, rejected } = await loadStgPosts(client, "zalo");
  const tinCua = await docTinCua(client);
  if (theoNhom) return layMauTheoNhom(client, { lat, seed, thu, trongGiaoDich, theoNhom, daCo: cu[0].so, posts: nhom ? posts.filter((p) => nhom.test(p.group_name ?? "")) : posts, rejected, tinCua });
  const cuaLat = nhom ? posts.filter((p) => nhom.test(p.group_name ?? "")) : posts;
  const tangs = LAT_PHAN_TANG[lat];
  const { chon, khac_nhau, moiTang, bo_su_kien, bo_vi_trung } = tangs
    ? chonMauPhanTang(cuaLat, tangLoai(cuaLat), { n, seed, tangs, tinCua })
    : chonMau(cuaLat, { n, seed, tinCua });
  const [mo, xong, lui] = trongGiaoDich
    ? ["SAVEPOINT label_sample", "RELEASE SAVEPOINT label_sample", "ROLLBACK TO SAVEPOINT label_sample"]
    : ["BEGIN", "COMMIT", "ROLLBACK"];
  let them = 0;
  if (!thu && cu[0].so < n) {
    await client.query(mo);
    try {
      for (const r of chon) {
        const res = await client.query(
          `INSERT INTO eval_label_items (lat, source_code, ref_id, text_hash, split, double_label, seed)
           VALUES ($1, 'S03', $2, $3, $4, $5, $6) ON CONFLICT DO NOTHING`,
          [lat, r.ref_id, r.text_hash, r.split, r.double_label, seed]);
        them += res.rowCount;
      }
      await ghepLat(client, { lat });
      await client.query(xong);
    } catch (e) {
      await client.query(lui).catch(() => {});
      throw e;
    }
  }
  return {
    lat, gat_post_thu: rejected.total, gat_theo_dau: rejected.by_marker, bo_su_kien, bo_vi_trung, tin_cua_lat: cuaLat.length, khac_nhau, chon: chon.length,
    trung: chon.filter((r) => r.double_label).length, dev: chon.filter((r) => r.split === "dev").length,
    them, thieu: Math.max(0, n - chon.length), thu, ...(moiTang ? { moiTang } : {}),
  };
}

/** Mẫu theo nhóm (GC0): đơn vị của bài đọc từ sổ collection_units. Lát đã có dòng thì giữ nguyên: bài mới có thể đẩy bài cũ ra
 * khỏi tập chọn, nên khoá (lat, text_hash), (lat, ref_id) một mình không chặn được lát nở quá hạn mức. */
async function layMauTheoNhom(client, { lat, seed, thu, trongGiaoDich, theoNhom, daCo, posts, rejected, tinCua }) {
  const { rows: so } = await client.query("SELECT unit_code, group_key, note FROM collection_units WHERE source_code = 'S03'");
  const { donVi, gop } = donViTheoNhomThat(so);
  const { chon, moiNhom, bo_khong_don_vi, bo_su_kien, bo_vi_trung } = chonMauTheoNhom(
    posts.map((p) => ({ ...p, unit_code: donViCuaBai(donVi, p.conversation_id) })), { seed, ...theoNhom, tinCua });
  // Nhóm trùng mà lát không có bài thì không có gì để báo: --nhom-khop đã loại nó.
  const gop_trung = gop.flatMap(({ khoa, khoa_dai_dien, unit_code, gop_tu, the_lech }) => {
    const bai = posts.filter((p) => p.conversation_id != null && khoaNhomThat(p.conversation_id) === khoa);
    return bai.length ? [{ unit_code, gop_tu, the_lech, bai_khoa_phu: bai.filter((p) => p.conversation_id !== khoa_dai_dien).length }] : [];
  });
  const maPhu = gop.flatMap((g) => g.gop_tu);
  const tang_phu_da_co = daCo > 0 && maPhu.length
    ? (await client.query(
      "SELECT stratum, count(*)::int AS so FROM eval_label_items WHERE lat = $1 AND stratum = ANY ($2) GROUP BY 1 ORDER BY 1", [lat, maPhu])).rows
    : [];
  const [mo, xong, lui] = trongGiaoDich
    ? ["SAVEPOINT label_sample", "RELEASE SAVEPOINT label_sample", "ROLLBACK TO SAVEPOINT label_sample"]
    : ["BEGIN", "COMMIT", "ROLLBACK"];
  let them = 0;
  if (!thu && daCo === 0) {
    await client.query(mo);
    try {
      for (const r of chon) {
        const res = await client.query(
          `INSERT INTO eval_label_items (lat, source_code, ref_id, text_hash, split, double_label, seed, stratum)
           VALUES ($1, 'S03', $2, $3, $4, $5, $6, $7) ON CONFLICT DO NOTHING`,
          [lat, r.ref_id, r.text_hash, r.split, r.double_label, seed, r.stratum]);
        them += res.rowCount;
      }
      await ghepLat(client, { lat });
      await client.query(xong);
    } catch (e) {
      await client.query(lui).catch(() => {});
      throw e;
    }
  }
  return {
    lat, gat_post_thu: rejected.total, gat_theo_dau: rejected.by_marker, bo_su_kien, bo_vi_trung, tin_cua_lat: posts.length, khac_nhau: moiNhom.reduce((a, x) => a + x.khac_nhau, 0), chon: chon.length,
    trung: chon.filter((r) => r.double_label).length, dev: chon.filter((r) => r.split === "dev").length,
    them, thieu: 0, thu, moiNhom, bo_khong_don_vi, gop_trung, tang_phu_da_co,
  };
}

async function main() {
  const co = docCo(process.argv.slice(2));
  const client = new pg.Client({ connectionString: DATABASE_URL });
  await client.connect();
  try {
    const kq = await layMau(client, co);
    console.log(`label-sample: lát ${kq.lat} · tin của lát ${kq.tin_cua_lat} (${kq.khac_nhau} nội dung khác nhau, gạt ${kq.gat_post_thu} post thử)`);
    console.log(`chon ${kq.chon} · trung ${kq.trung} · dev ${kq.dev} / test ${kq.chon - kq.dev} · them ${kq.them}${kq.thu ? " (--thu: không ghi)" : ""}`);
    console.log(`bo_vi_trung ${kq.bo_vi_trung} · bo_su_kien ${kq.bo_su_kien} · gat_theo_dau ${JSON.stringify(kq.gat_theo_dau)}`);
    if (kq.moiTang) console.log(`tầng: ${JSON.stringify(kq.moiTang)}`);
    if (kq.moiNhom) {
      for (const x of kq.moiNhom) console.log(`nhóm ${x.unit_code}: chọn ${x.chon}/${x.can}, nội dung ${x.khac_nhau}, bỏ vì trùng ${x.bo_vi_trung}${x.chon < x.can ? " · thiếu" : ""}`);
      console.log(`bỏ vì không có đơn vị trong sổ: ${kq.bo_khong_don_vi}`);
      for (const g of kq.gop_trung) {
        console.log(`gộp đơn vị trùng: ${g.unit_code} ← ${g.gop_tu.join(", ")} · bài ở khoá phụ ${g.bai_khoa_phu}`);
        if (g.the_lech) console.log(`cảnh báo: ${g.unit_code} và ${g.gop_tu.join(", ")} khác thẻ nhóm — màn dùng thẻ của ${g.unit_code}`);
      }
      for (const t of kq.tang_phu_da_co) console.log(`lát đã có ${t.so} dòng ở tầng phụ ${t.stratum} — giữ nguyên, gắn tiếp được; số của nhóm này đang chia hai tầng, muốn một tầng thì lấy mẫu lát tên mới`);
    }
    if (kq.thieu > 0) console.log(`thieu ${kq.thieu} — lát chỉ có ${kq.khac_nhau} nội dung khác nhau`);
  } finally {
    await client.end();
  }
}

const isMain = process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) main().catch((e) => { console.error(e.message ?? e); process.exit(1); });
