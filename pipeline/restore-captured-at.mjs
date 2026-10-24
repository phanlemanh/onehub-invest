// restore-captured-at.mjs — 2410-1 v2 (luật claudedp MỞ LẠI): khôi phục captured_at
// của stg bị lượt nạp-lại-toàn-bộ đặt thành now() (đo 24/10: 4.092 stg_zalo_posts +
// 15.515 stg_chotot_ads dòng sai mốc). Luật chung đã chốt: captured_at = GIỜ THU của
// snapshot đang nạp (airbnb_snapshots.collected_at = manifest.finishedAt), không bao
// giờ now() — importer đã sửa theo; script này chỉ vá số liệu tồn đọng:
//   - stg_zalo_posts (snapshot_id giữ snapshot ĐẦU): mốc = collected_at của snapshot
//     đầu chứa post = LEAST-traceable từ stg.
//   - stg_chotot_ads (snapshot_id đi theo snapshot MỚI): mốc = collected_at của
//     snapshot HIỆN TẠI (giới hạn: mốc sớm nhất không truy được từ stg).
// An toàn:
//   - Mặc định --dry: chỉ đếm theo bảng + 5 ví dụ, không đổi gì.
//   - --apply: PHẢI sao lưu (khoá chính + captured_at cũ) ra CSV NGOÀI kho tại
//     ~/dev/onehub-invest/state/restore-captured-at-<UTC>.csv (state/ gitignored)
//     TRƯỚC khi UPDATE; in đường dẫn sao lưu.
//   - --undo <tệp>: hoàn tác từ sao lưu (đảo ngược từng dòng theo khoá chính).
//   - --apply thật trên :5433 vẫn chờ claudedp xác nhận SAU KHI bản sửa merge.
// Dùng:
//   node restore-captured-at.mjs [--dry] [--apply] [--undo <tệp>] [--table zalo|chotot|all]
import pg from "pg";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";

const DB_URL =
  process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";
const argv = process.argv.slice(2);
const APPLY = argv.includes("--apply");
const UNDO = argv.includes("--undo") ? argv[argv.indexOf("--undo") + 1] : null;
const only = argv.includes("--table") ? argv[argv.indexOf("--table") + 1] : "all";

// Bảng → cấu trúc (khoá chính + cột khớp snapshot). Thứ tự cố định để CSV ổn định.
const BANG = {
  zalo: {
    table: "stg_zalo_posts", pk: "post_id", kieuPk: "text",
    // mốc = collected_at của snapshot ĐẦU (snapshot_id không bị upsert đổi)
    doi: `UPDATE stg_zalo_posts p SET captured_at = s.collected_at
          FROM airbnb_snapshots s WHERE s.snapshot_id = p.snapshot_id
            AND p.captured_at <> s.collected_at`,
    lay: `SELECT p.post_id AS pk, p.captured_at AS cu FROM stg_zalo_posts p
          JOIN airbnb_snapshots s ON s.snapshot_id = p.snapshot_id
          WHERE p.captured_at <> s.collected_at ORDER BY p.post_id`,
    ghi_chu: "mốc = snapshot ĐẦU chứa post (snapshot_id không đổi)",
  },
  chotot: {
    table: "stg_chotot_ads", pk: "list_id", kieuPk: "bigint",
    // mốc = collected_at của snapshot HIỆN TẠI (giới hạn đã ghi ở dry-run)
    doi: `UPDATE stg_chotot_ads c SET captured_at = s.collected_at
          FROM airbnb_snapshots s WHERE s.snapshot_id = c.snapshot_id
            AND c.captured_at <> s.collected_at`,
    lay: `SELECT c.list_id AS pk, c.captured_at AS cu FROM stg_chotot_ads c
          JOIN airbnb_snapshots s ON s.snapshot_id = c.snapshot_id
          WHERE c.captured_at <> s.collected_at ORDER BY c.list_id`,
    ghi_chu: "mốc = snapshot HIỆN TẠI (snapshot_id bị upsert đè — mốc sớm nhất không truy được từ stg)",
  },
};

const utcFileStamp = (d = new Date()) =>
  d.toISOString().replaceAll(":", "-").replaceAll(".", "-"); // 2026-10-25T06-30-00-000Z
const duongDanState = () => join(homedir(), "dev", "onehub-invest", "state");

const client = new pg.Client({ connectionString: DB_URL });
await client.connect();

try {
  if (UNDO) {
    // ===== --undo <tệp>: hoàn tác captured_at từ sao lưu CSV =====
    const noiDung = (await readFile(UNDO, "utf8")).trim().split("\n");
    const header = noiDung.shift();
    if (header !== "table,pk,captured_at") throw new Error(`sao lưu không nhận dạng được: ${UNDO}`);
    const theoBang = new Map();
    for (const dong of noiDung) {
      // captured_at ISO không chứa phảy — tách 2 phấy đầu, phần còn lại là thời gian
      const [bang, pk, ...rest] = dong.split(",");
      if (!bang || !pk || rest.length !== 1) throw new Error(`dòng CSV lạ: ${dong}`);
      if (!theoBang.has(bang)) theoBang.set(bang, []);
      theoBang.get(bang).push([pk, rest[0]]);
    }
    for (const [bang, ds] of theoBang) {
      const cfg = Object.values(BANG).find((b) => b.table === bang);
      if (!cfg) { console.log(`[${bang}] không thuộc script — bỏ qua`); continue; }
      const r = await client.query(
        `UPDATE ${bang} t SET captured_at = v.ca
         FROM (SELECT * FROM unnest($1::text[], $2::timestamptz[]) AS u(pk, ca)) v
         WHERE t.${cfg.pk} = v.pk::${cfg.kieuPk}`,
        [ds.map((x) => x[0]), ds.map((x) => x[1])],
      );
      console.log(`[${bang}] hoàn tác ${r.rowCount}/${ds.length} dòng từ ${UNDO}`);
    }
    console.log("\n--undo xong. Kiểm tra lại bằng: node restore-captured-at.mjs --dry");
  } else {
    // ===== --dry (mặc định) / --apply =====
    const seDoi = {}; // bang → [{pk, cu}]
    for (const [ten, cfg] of Object.entries(BANG)) {
      if (only !== "all" && only !== ten) continue;
      let rows; try {
        ({ rows } = await client.query(cfg.lay));
      } catch (e) {
        if (e.code === "42P01") { console.log(`[${cfg.table}] bảng không có trong DB — bỏ qua`); seDoi[ten] = []; continue; }
        throw e;
      }
      seDoi[ten] = rows;
      console.log(`[${cfg.table}] ${rows.length} dòng sẽ đặt lại captured_at (${cfg.ghi_chu})`);
      for (const r of rows.slice(0, 5)) console.log(`  vd ${r.pk}: ${r.cu?.toISOString?.() ?? r.cu} → mốc snapshot`);
    }

    if (!APPLY) {
      console.log("\n--dry: chưa đổi gì. Chạy thật: node restore-captured-at.mjs --apply "
        + "(tự sao lưu CSV trước; :5433 thật vẫn chờ claudedp xác nhận SAU KHI bản sửa merge).");
    } else {
      // 1) SAO LƯU mọi dòng sẽ đổi ra CSV NGOÀI kho — làm TRƯỚC khi UPDATE
      const duongDan = duongDanState();
      await mkdir(duongDan, { recursive: true });
      const tep = join(duongDan, `restore-captured-at-${utcFileStamp()}.csv`);
      const dong = ["table,pk,captured_at"];
      for (const [ten, rows] of Object.entries(seDoi)) {
        for (const r of rows) dong.push(`${BANG[ten].table},${r.pk},${r.cu?.toISOString?.() ?? r.cu}`);
      }
      await writeFile(tep, dong.join("\n") + "\n", "utf8");
      console.log(`\nsao lưu ${dong.length - 1} dòng → ${tep}`);
      console.log(`hoàn tác: node restore-captured-at.mjs --undo ${tep}`);

      // 2) UPDATE — mỗi bảng một giao dịch (sao lưu đã an toàn trên đĩa)
      for (const [ten, rows] of Object.entries(seDoi)) {
        if (rows.length === 0) continue;
        await client.query("BEGIN");
        try {
          const r = await client.query(BANG[ten].doi);
          await client.query("COMMIT");
          console.log(`[${BANG[ten].table}] ĐÃ đổi ${r.rowCount} dòng`);
        } catch (e) {
          await client.query("ROLLBACK");
          throw e;
        }
      }
    }
  }
} finally {
  await client.end();
}
