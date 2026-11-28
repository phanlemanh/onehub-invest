// backfill-s03-media-2511.mjs — tải bù ảnh S03 của bài cũ sau khi ZC15+ZC16 áp
// (claudedp-2511-51). Hai nhóm lỗi đã vá chỉ cho tin mới:
//   (1) r2.dev + host đích chuyển hướng (họ băm 99ee4ac919) bị chặn allowlist cũ;
//   (2) link dạng /jpg/ trả 400 — ZC16 thử lại bỏ /jpg/.
//
// Cách làm: MỖI LÔ (một ngày đăng) viết MỘT snapshot zalo-agent MỚI đúng hợp đồng
// (items payload NGUYÊN VĂN dựng từ stg + meta.mediaFiles ĐỦ cả ảnh sống lẫn ảnh
// sửa — bộ nạp thay TOÀN BỘ media_files khi giá trị khác null, thiếu entry sống
// là mất entry tốt). Ảnh sống CHÉP bytes từ snapshot gốc và giữ nguyên entry
// (bỏ snapshotId cũ để bộ nạp đóng dấu snapshot bù); ảnh lỗi TẢI LẠI qua chính
// fetchMessageMedia của dist ĐÃ TRIỂN KHAI (cùng allowlist zdn.vn + r2.dev +
// hậu tố máy thu, cùng fallback /jpg/). Entry 'http-404' = link chết, GIỮ NGUYÊN
// không tái tải. Rồi nạp bằng import-airbnb.mjs — RAW BẤT BIẾN: chỉ ghi snapshot
// mới, không sửa/xoá snapshot hay manifest cũ; importer idempotent (ON CONFLICT
// post_id DO UPDATE media_files).
//
// Bên đọc giải file ảnh theo entry.snapshotId (media-rows.mjs localFile) nên mọi
// entry trong snapshot bù trỏ file trong snapshot bù — chép bytes là bắt buộc.
//
// TÊN SNAPSHOT BÙ theo GIỜ CHẠY (không phải ngày đăng) — xếp sau chót mọi
// snapshot gốc lịch sử. NẠP LẠI từ raw PHẢI xếp qua sapXepReplay(): snapshot bù
// (coverage.loai = 'tai-bu-anh-2511', gồm 5 snapshot 21-25/11 đã ghi khi còn đặt
// tên theo ngày đăng) luôn nạp PHASE CUỐI, nếu không bản gốc mang entry lỗi nạp
// sau sẽ đè ảnh đã bù.
//
// Dùng:
//   node backfill-s03-media-2511.mjs --check                 chỉ đo, không ghi không mạng
//   node backfill-s03-media-2511.mjs --tu 2026-11-19         bù khoảng ngày đăng (giờ VN)
//        [--den <YYYY-MM-DD>] [--toc-do 30] [--den-gio <ISO>] [--bo-qua-http-400] [--kho <URL>]
//        [--root <snapshots>] [--dist <media-fetch.js>] [--suffix-file <tệp>]
// Dừng mềm --den-gio để nhường việc nặng; gặp http-403/429: dừng HẲN, thoát 3 —
// BÁO LL, không tự chạy lại.
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { gzipSync } from "node:zlib";
import { readFile, writeFile, mkdir, rename, rm } from "node:fs/promises";
import { existsSync, readFileSync, realpathSync } from "node:fs";
import { join, dirname, basename } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import pg from "pg";

const GOC = dirname(dirname(new URL(import.meta.url, "file:").pathname)); // gốc kho chứa pipeline/
const DIST_MAC_DINH = join(GOC, "collector", "dist", "core", "media-fetch.js");
const SUFFIX_MAC_DINH = join(GOC, "collector", "state", "media-host-suffixes.txt");
const KHO_MAC_DINH = process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";
const SCHEMA_VERSION = 6; // kênh S03 ghi 6 (như collector)
const MA_DUNG = 0;
const MA_BI_CHAN = 3;

const arg = (ten, macDinh) => {
  const i = process.argv.indexOf(`--${ten}`);
  return i >= 0 ? process.argv[i + 1] : macDinh;
};
const coCo = (ten) => process.argv.includes(`--${ten}`);
const urlCua = (m) => (m && typeof m === "object" && typeof m.url === "string" ? m.url : null);

/** bài có ảnh cần sửa: có entry lỗi ≠ http-404, hoặc thiếu entry so với payload.media */
const SQL_BAI = `
  WITH chon AS (
    SELECT DISTINCT ON (s.post_id) s.*
    FROM stg_zalo_posts s
    WHERE s.posted_at >= $1::timestamptz AND s.posted_at < $2::timestamptz
    ORDER BY s.post_id, s.captured_at DESC
  )
  SELECT post_id, snapshot_id, group_name, author_hash, posted_at, text,
         sender_name, sender_id, conversation_id, media, agent_id, media_files
  FROM chon
  WHERE CASE WHEN jsonb_typeof(media) <> 'array' THEN false
             ELSE jsonb_array_length(media) > 0 END
    AND (
      media_files IS NULL
      OR CASE WHEN jsonb_typeof(media_files) <> 'array' THEN true
              WHEN jsonb_typeof(media) <> 'array' THEN false
              ELSE jsonb_array_length(media_files) < jsonb_array_length(media) END
      OR EXISTS (
        SELECT 1 FROM jsonb_array_elements(
          CASE WHEN jsonb_typeof(media_files) = 'array' THEN media_files ELSE '[]'::jsonb END
        ) e
        WHERE e->>'error' IS NOT NULL AND e->>'error' <> 'http-404'
      )
    )
  ORDER BY posted_at DESC`;

export async function layBai(client, tuUtc, denUtc) {
  const { rows } = await client.query(SQL_BAI, [tuUtc, denUtc]);
  return rows.map((r) => ({
    postId: r.post_id,
    snapshotId: r.snapshot_id,
    payload: {
      group: r.group_name,
      author: r.author_hash,
      text: r.text ?? "",
      senderName: r.sender_name,
      senderId: r.sender_id,
      conversationId: r.conversation_id,
      media: r.media,
      agent_id: r.agent_id,
    },
    postedAt: r.posted_at,
    mediaFiles: Array.isArray(r.media_files) ? r.media_files : [],
  }));
}

/** entry cũ của một url: ưu tiên entry không lỗi; không có → null */
export function entryCua(bai, url) {
  return bai.mediaFiles.find((e) => e.url === url && !e.error) ?? bai.mediaFiles.find((e) => e.url === url) ?? null;
}

/** chép bytes ảnh sống từ snapshot gốc vào snapshot bù, xác thực sha256; hỏng → null (rơi xuống tải lại) */
export async function chepAnhSong(entry, rootSnapshots, ghiFile) {
  const snapshotCu = typeof entry.snapshotId === "string" ? entry.snapshotId : null;
  if (!snapshotCu || typeof entry.file !== "string") return null;
  const nguon = join(rootSnapshots, "hanoi", snapshotCu, entry.file);
  if (!existsSync(nguon)) return null;
  const buf = await readFile(nguon);
  if (createHash("sha256").update(buf).digest("hex") !== entry.sha256) return null;
  const kq = await ghiFile(entry.file, buf);
  return kq ? { url: entry.url, file: entry.file, sha256: entry.sha256, bytes: entry.bytes } : null;
}

/** hậu tố cho phép hiện hành: zdn.vn + r2.dev + tệp máy thu (ZC15) */
export function docSuffixes(file = SUFFIX_MAC_DINH) {
  const suffixes = ["zdn.vn", "r2.dev"];
  if (existsSync(file)) {
    for (const dong of readFileSync(file, "utf8").split("\n")) {
      const t = dong.trim();
      if (t && !t.startsWith("#")) suffixes.push(t);
    }
  }
  return [...new Set(suffixes)];
}

/**
 * sapXepReplay — thứ tự NẠP LẠI từ raw (lớp hai của lời giải claudedp-2511-52/54):
 * snapshot thường theo tên (thời gian thu), snapshot BÙ (coverage.loai =
 * 'tai-bu-anh-2511') LUÔN phase CUỐI — giữ nguyên thứ tự tên trong từng nhóm.
 * Lý do: bộ nạp ghi media_files thay trọn khi giá trị khác null; 5 snapshot bù
 * 21-25/11 mang tên NGÀY ĐĂNG (xếp giữa các snapshot gốc cùng ngày) nên replay
 * theo tên trần sẽ đè ảnh đã bù của ~695 bài — bắt buộc phase cuối. Mọi công cụ
 * nạp lại raw PHẢI đi qua hàm này (đọc manifest từng thư mục; thiếu manifest →
 * nhóm thường).
 */
export async function sapXepReplay(dirs) {
  const thuong = [];
  const buu = [];
  for (const d of dirs) {
    let laBuu = false;
    try {
      const m = JSON.parse(await readFile(join(d, "manifest.json"), "utf8"));
      laBuu = m?.coverage?.loai === "tai-bu-anh-2511";
    } catch {
      // thiếu/hỏng manifest — xếp nhóm thường, bộ nạp tự xử (chờ 30′ hay mồ côi)
    }
    (laBuu ? buu : thuong).push(d);
  }
  const theoTen = (a, b) => a.localeCompare(b);
  return [...thuong.sort(theoTen), ...buu.sort(theoTen)];
}

/**
 * Ghi một snapshot bù cho MỘT ngày đăng. Trả {snapshotId, soBai, soUrlThu,
 * taiDuoc, loi404, loiKhac, maChan}. Gặp http-403/429: maChan khác rỗng, KHÔNG
 * ghi snapshot — người gọi thoát 3.
 */
export async function ghiSnapshotBuu({ baiHomNgay, rootSnapshots, dirMoi, fetchModule, suffixes, tocDo = 30, denGio = null, boQuaHttp400 = false, cuaSoMs = 60_000, ghiLog = console.log }) {
  const daBatDau = new Date().toISOString();
  const dirTam = join(dirname(dirMoi), `.${basename(dirMoi)}.partial`);
  await mkdir(join(dirTam, "media"), { recursive: true });
  const files = [];
  const daGhi = new Set();
  const ghiFile = async (name, bytes) => {
    if (daGhi.has(name)) return null; // trùng tên trong một snapshot — module tái dùng entry
    await writeFile(join(dirTam, name), bytes);
    const sha256 = createHash("sha256").update(bytes).digest("hex");
    files.push({ name, sha256, bytes: bytes.length });
    daGhi.add(name);
    return { sha256, bytes: bytes.length };
  };

  // trần lời gọi: CỬA SỔ TRƯỢT theo timestamp lúc phát (mỗi url fetch riêng) —
  // miễn nhiễm độ trễ fetch (cửa sổ cứng theo Date.now() bị reset khi fetch chậm)
  const lucGoi = [];
  const choLuot = async () => {
    for (;;) {
      const bay = Date.now();
      while (lucGoi.length > 0 && bay - lucGoi[0] >= cuaSoMs) lucGoi.shift();
      if (lucGoi.length < tocDo) break;
      const cho = lucGoi[0] + cuaSoMs - bay + 20;
      ghiLog(`nghỉ ${Math.round(cho / 1000)}s giữ trần ${tocDo} lời/${Math.round(cuaSoMs / 1000)}s`);
      await new Promise((r) => setTimeout(r, cho > 0 ? cho : 20));
    }
    lucGoi.push(Date.now());
  };

  const items = [];
  let soUrlThu = 0;
  let taiDuoc = 0;
  let soChep = 0; // AC-4 findings round 1: đếm ảnh chép từ snapshot gốc — đối chứng dương cho ca raw bất biến
  let loi404 = 0;
  const loiKhac = new Map();
  let maChan = null;

  for (const bai of baiHomNgay) {
    if (maChan) break;
    if (denGio && Date.now() >= Date.parse(denGio)) break;
    const media = Array.isArray(bai.payload.media) ? bai.payload.media : [];
    const urls = media.map(urlCua).filter(Boolean);
    const entriesMoi = [];
    const urlCanTai = [];
    for (const url of urls) {
      const cu = entryCua(bai, url);
      if (cu && !cu.error) {
        const daChep = await chepAnhSong(cu, rootSnapshots, ghiFile);
        if (daChep) {
          entriesMoi.push(daChep);
          soChep += 1;
          continue;
        }
      } else if (cu && (cu.error === "http-404" || (boQuaHttp400 && cu.error === "http-400"))) {
        entriesMoi.push(cu); // link chết (404) hoặc http-400 ngày cũ bỏ qua — giữ nguyên, không đốt lượt
        continue;
      }
      urlCanTai.push(url);
      entriesMoi.push(null); // chỗ trống — điền sau khi tải
    }
    for (let i = 0; i < urls.length; i += 1) {
      const url = urls[i];
      if (entriesMoi[i] !== null) continue;
      if (maChan) break; // AC-5 findings round 1: chặn thì dừng HẲN — không gọi tiếp host vừa chặn trong cùng bài
      soUrlThu += 1;
      await choLuot(); // trần chặn TRƯỚC khi phát lời gọi
      if (denGio && Date.now() >= Date.parse(denGio)) break;
      const itemTai = {
        source: "zalo-agent",
        sourceId: bai.postId,
        fetchedAt: bai.postedAt,
        payload: { ...bai.payload, media: [{ url }] }, // MỘT url/lượt — trần kiểm soát được
      };
      await fetchModule.fetchMessageMedia({
        items: [itemTai],
        putFile: ghiFile,
        options: { allowedHostSuffixes: suffixes, maxBytes: 10 * 1024 * 1024, timeoutMs: 15_000, maxPerFlush: 500, concurrency: 1 },
      });
      const e = itemTai.meta?.mediaFiles?.[0];
      {
        if (e?.file) {
          entriesMoi[i] = e;
          taiDuoc += 1;
        } else {
          const loi = e?.error ?? "mat-entry";
          entriesMoi[i] = e ?? { url, error: loi };
          if (loi === "http-404") loi404 += 1;
          else loiKhac.set(loi, (loiKhac.get(loi) ?? 0) + 1);
          if (/http-(403|429)/.test(loi)) maChan = `bị chặn ${loi} tại ${url}`;
        }
      }
    }
    // dừng mềm giữa bài: ô null là url chưa tải — BỎ CẢ BÀI (stg giữ media_files
    // cũ nguyên vẹn, nhịp sau bù lại), không bao giờ ghi entry null
    const dutGiua = entriesMoi.some((e) => e === null);
    if (dutGiua) {
      ghiLog(`dừng mềm giữa bài ${bai.postId} — bỏ bài, nhịp sau bù lại`);
      continue;
    }
    if (entriesMoi.length > 0 && urlCanTai.length > 0) {
      // chỉ đưa bài CÓ url phải tải — bài toàn 404/400-bỏ-qua giữ nguyên trong stg, không viết lại
      items.push({
        source: "zalo-agent",
        sourceId: bai.postId,
        fetchedAt: bai.postedAt,
        payload: bai.payload,
        meta: { mediaFiles: entriesMoi },
      });
    }
  }

  if (maChan) {
    ghiLog(`DỪNG: ${maChan} — không ghi snapshot, không nạp`);
    await rm(dirTam, { recursive: true, force: true }); // dọn nháp — không để thư mục .partial thừa
    return { maChan, soBai: 0, soUrlThu, taiDuoc, soChep, loi404, loiKhac };
  }
  if (items.length === 0) {
    ghiLog("không có bài nào cần snapshot");
    await rm(dirTam, { recursive: true, force: true }); // dọn nháp
    return { snapshotId: null, soBai: 0, soUrlThu, taiDuoc, soChep, loi404, loiKhac };
  }

  const itemsGz = gzipSync(Buffer.from(JSON.stringify(items), "utf8"));
  const tenItems = "items-0001.json.gz";
  await writeFile(join(dirTam, tenItems), itemsGz);
  files.push({ name: tenItems, sha256: createHash("sha256").update(itemsGz).digest("hex"), bytes: itemsGz.length });

  const snapshotId = basename(dirMoi);
  const manifest = {
    schemaVersion: SCHEMA_VERSION,
    snapshotId,
    city: "hanoi",
    source: "zalo-agent",
    startedAt: daBatDau,
    finishedAt: new Date().toISOString(),
    counts: { items: items.length, failed: loi404 + [...loiKhac.values()].reduce((a, b) => a + b, 0) },
    coverage: { loai: "tai-bu-anh-2511", soBai: items.length, soUrlThu, taiDuoc, loi404, loiKhac: Object.fromEntries(loiKhac) },
    files,
  };
  await writeFile(join(dirTam, "manifest.json"), JSON.stringify(manifest, null, 2));
  await rename(dirTam, dirMoi); // manifest là file cuối — rename sau cùng như collector (2510-8)
  ghiLog(`snapshot ${snapshotId}: ${items.length} bài · thử ${soUrlThu} url · tải được ${taiDuoc} · 404 ${loi404}`);
  return { snapshotId, soBai: items.length, soUrlThu, taiDuoc, soChep, loi404, loiKhac };
}

// ─── CLI ───
if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const check = coCo("check");
  const tu = arg("tu");
  const den = arg("den", new Date(Date.now() + 86_400_000).toISOString().slice(0, 10)); // mặc định trọn hôm nay (giờ VN)
  const tocDo = Number.parseInt(arg("toc-do", "30"), 10);
  const denGio = arg("den-gio", new Date(Date.now() + 4 * 3600_000).toISOString());
  const root = arg("root", join(GOC, "collector", "snapshots"));
  const distPath = arg("dist", DIST_MAC_DINH);
  const suffixFile = arg("suffix-file", SUFFIX_MAC_DINH);
  const kho = arg("kho", KHO_MAC_DINH);
  if (!tu) {
    console.error("thiếu --tu <YYYY-MM-DD> (ngày đăng đầu, giờ VN)");
    process.exit(2);
  }
  const tuUtc = `${tu}T00:00:00+07:00`;
  const denUtc = `${den}T00:00:00+07:00`;

  const client = new pg.Client({ connectionString: kho });
  await client.connect();
  const baiTheoNgay = new Map();
  for (const b of await layBai(client, tuUtc, denUtc)) {
    const ngay = new Date(b.postedAt).toLocaleDateString("en-CA", { timeZone: "Asia/Ho_Chi_Minh" });
    if (!baiTheoNgay.has(ngay)) baiTheoNgay.set(ngay, []);
    baiTheoNgay.get(ngay).push(b);
  }
  await client.end();
  const ngayList = [...baiTheoNgay.keys()].sort().reverse(); // mới nhất trước — link còn sống nhiều nhất
  console.log(`check=${check} · ${ngayList.length} ngày đăng có bài cần bù (mới nhất trước):`);
  for (const ngay of ngayList) console.log(`  ${ngay}: ${baiTheoNgay.get(ngay).length} bài`);
  if (check) process.exit(MA_DUNG);

  if (!existsSync(distPath)) {
    console.error(`không thấy module media đã build: ${distPath}`);
    process.exit(2);
  }
  const fetchModule = await import(pathToFileURL(distPath).href);
  const suffixes = docSuffixes(suffixFile);
  console.log(`hậu tố cho phép: ${suffixes.length} (zdn.vn, r2.dev +${suffixes.length - 2} từ máy)`);
  const importer = join(GOC, "pipeline", "import-airbnb.mjs");
  const tong = { snapshot: 0, bai: 0, url: 0, tai: 0, loi404: 0 };
  for (const ngay of ngayList) {
    if (Date.now() >= Date.parse(denGio)) {
      console.log(`dừng mềm tới giờ ${denGio} — các ngày còn lại để nhịp sau`);
      break;
    }
    const tuNgayUtc = `${ngay}T00:00:00+07:00`;
    const denNgayUtc = new Date(Date.parse(tuNgayUtc) + 86_400_000).toISOString();
    const c = new pg.Client({ connectionString: kho });
    await c.connect();
    const baiHomNgay = await layBai(c, tuNgayUtc, denNgayUtc);
    await c.end();
    if (baiHomNgay.length === 0) continue;
    // tên theo GIỜ CHẠY (không phải ngày đăng): xếp SAU mọi snapshot gốc lịch sử
    // → nạp lại raw theo thứ tự tên luôn nạp bản bù sau chót, ảnh bù không bị đè
    const bay = new Date();
    const msc = `${bay.toISOString().slice(0, 10)}T${String(bay.getUTCHours()).padStart(2, "0")}${String(bay.getUTCMinutes()).padStart(2, "0")}${String(bay.getUTCSeconds()).padStart(2, "0")}${String(bay.getUTCMilliseconds()).padStart(3, "0")}`;
    const dirMoi = join(root, "hanoi", `hanoi__zalo-agent__${msc}`);
    const kq = await ghiSnapshotBuu({ baiHomNgay, rootSnapshots: root, dirMoi, fetchModule, suffixes, tocDo, denGio, boQuaHttp400: coCo("bo-qua-http-400") });
    if (kq.maChan) {
      console.error(kq.maChan);
      process.exit(MA_BI_CHAN);
    }
    if (!kq.snapshotId) continue;
    console.log(`nạp snapshot ${kq.snapshotId}…`);
    try {
      const out = execFileSync(process.execPath, [importer, join(root, "hanoi", kq.snapshotId)], {
        encoding: "utf8",
        cwd: join(GOC, "pipeline"),
      });
      console.log(out.trim().split("\n").slice(-2).join("\n"));
    } catch (e) {
      // lỗi nạp — snapshot đã nằm trong hàng đợi của lượt nạp thường, lượt sau tự nạp lại (idempotent)
      console.error(`⚠️ nạp lỗi (hàng đợi sẽ nạp lại): ${String(e.message).split("\n")[0]}`);
    }
    tong.snapshot += 1;
    tong.bai += kq.soBai;
    tong.url += kq.soUrlThu;
    tong.tai += kq.taiDuoc;
    tong.loi404 += kq.loi404;
  }
  console.log(`tổng: ${tong.snapshot} snapshot · ${tong.bai} bài · thử ${tong.url} url · tải được ${tong.tai} · 404 ${tong.loi404}`);
}
