// s01-shards.mjs — sinh danh sách query khu vực cho lượt discovery S01 đêm nay
// (claudedp-3110-7: mở rộng vùng tìm HN/HCM từ 1 query tên thành phố → xoay
// vòng N khu vực/đêm theo bảng `areas`). Stateless: vị trí xoay tính từ chỉ số
// NGÀY (UTC) — không file state, chạy lại trong đêm ra cùng danh sách.
//
// Thứ tự khu vực: vùng ĐÃ CÓ listing trước (số căn DESC), còn lại theo tên —
// mỗi chu kỳ quét vùng hiệu quả trước, vùng trắng sau. Query = "<tên>, <tên
// thành phố>" để Airbnb định vị đúng thành phố.
//
// CLI: node s01-shards.mjs <hanoi|hcmc> [--per-run N] [--ngay <ISO>]
//   in MỘT dòng: các query nối bằng " | " (env AIRBNB_DISCOVERY_QUERIES)
// Pure: chonShards(areas, {ngay, perRun}) export cho test.
import pg from "pg";

const DB_URL = process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";
export const CITY_AREA = { hanoi: "vn-hanoi", hcmc: "vn-hcmc" };
export const CITY_TEN = { hanoi: "Hà Nội", hcmc: "Hồ Chí Minh" };

/**
 * Chọn khu vực xoay vòng cho một đêm.
 * @param {{name: string, listings: number}[]} areas danh sách đã xếp (listings DESC, name ASC)
 * @param {{ngay?: Date|string, perRun?: number}} o
 * @returns {{queries: string[], viTri: number, tong: number}}
 */
export function chonShards(areas, { ngay = new Date(), perRun = 6 } = {}) {
  const chiSoNgay = Math.floor(new Date(ngay).getTime() / 86_400_000);
  const tong = areas.length;
  const viTri = tong === 0 ? 0 : ((chiSoNgay * perRun) % tong + tong) % tong;
  const queries = [];
  for (let i = 0; i < Math.min(perRun, tong); i++) {
    queries.push(areas[(viTri + i) % tong].name);
  }
  return { queries, viTri, tong };
}

export async function docAreas(client, cityId) {
  const { rows } = await client.query(
    `SELECT a.name, count(l.id) FILTER (WHERE l.retired_at IS NULL) AS listings
     FROM areas a
     LEFT JOIN listings l ON l.area_id = a.id
     WHERE a.parent_id = $1 AND a.region_type = 'submarket'
     GROUP BY a.name
     ORDER BY listings DESC, a.name ASC`,
    [cityId],
  );
  return rows.map((r) => ({ name: r.name, listings: Number(r.listings) }));
}

async function main(argv) {
  const [city, ...rest] = argv;
  if (!CITY_AREA[city]) {
    console.error("cách dùng: node s01-shards.mjs <hanoi|hcmc> [--per-run N] [--ngay ISO]");
    return 2;
  }
  const perRun = rest.includes("--per-run") ? Number(rest[rest.indexOf("--per-run") + 1]) : 6;
  const ngayArg = rest.includes("--ngay") ? rest[rest.indexOf("--ngay") + 1] : new Date();
  const c = new pg.Client({ connectionString: DB_URL });
  await c.connect();
  try {
    const areas = await docAreas(c, CITY_AREA[city]);
    const { queries, viTri, tong } = chonShards(areas, { ngay: ngayArg, perRun });
    // query kèm tên thành phố cho Airbnb định vị; base query (tên thành phố)
    // collector tự chạy đầu tiên — danh sách này chỉ phần khu vực.
    console.log(queries.map((q) => `${q}, ${CITY_TEN[city]}`).join(" | "));
    console.error(`s01-shards ${city}: ${tong} khu vực, vị trí ${viTri}, ${queries.length} query/đêm`);
  } finally {
    await c.end();
  }
  return 0;
}

if (process.argv[1] && process.argv[1].endsWith("s01-shards.mjs")) {
  process.exitCode = await main(process.argv.slice(2));
}
