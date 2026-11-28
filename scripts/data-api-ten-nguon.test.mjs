// node --test scripts/data-api-ten-nguon.test.mjs
// Hồ sơ data-api-don-ten-nguon (PB5): cây data-api/ (bản công khai qua subtree) không còn tên nguồn thật ngoài các tên
// bảng/cột đã biết (nợ lược đồ, DINH_DANH_BIET), và lược đồ mẫu data-api/db + seed.sql dựng ra y như trước khi dọn.
// Tên thật chỉ đọc lúc chạy từ db/migrations (tier-a-source-names) — tệp này không chứa tên nào. Tên ca mở đầu bằng mã AC.
// PB2 (data-api-hop-dong-reso-dd-2-1, GS cho 27/11): data-api/db nay chỉ còn schema.sql (gộp 19 tệp cũ, giữ nguyên câu, mỗi
// khúc mở bằng «-- ═════ <tệp cũ> ═════»). Các ca đọc tệp cũ trỏ sang khúc tương ứng của schema.sql; mỗi ca khẳng định đúng
// điều cũ — bảng đối chiếu ở _acceptance/data-api-hop-dong-reso-dd-2-1/pb5-truoc-sau.md.
const SCHEMA = "data-api/db/schema.sql";
/** Một khúc của schema.sql theo tên tệp cũ (từ dòng mở khúc tới trước khúc kế). */
function khuc(sql, tenCu) {
  const dau = sql.indexOf(`-- ═════ ${tenCu}`);
  assert.ok(dau >= 0, `schema.sql không có khúc ${tenCu} — fixture ca phá hỏng`);
  const sau = sql.indexOf("\n-- ═════ ", dau + 1);
  return sql.slice(dau, sau < 0 ? sql.length : sau + 1);
}
/** Bỏ các khúc có tên tệp cũ khớp mẫu khỏi schema.sql. */
const boKhuc = (sql, re) => sql.split(/(?=^-- ═════ )/m).filter((k) => !re.test(k.split("\n")[0])).join("");
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, renameSync, rmSync, unlinkSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { after, describe, test } from "node:test";

import { che, DINH_DANH_BIET, dungLuocDoMau, loaiKyTu, quet, tongKet } from "./data-api-ten-nguon.mjs";
import { findSourceNames, sourceRegistrySeeds } from "./lib/tier-a-source-names.mjs";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ENTRIES = sourceRegistrySeeds(REPO);
const ten = (code) => ENTRIES.find((e) => e.code === code).realName;
const TMP = realpathSync(mkdtempSync(path.join(tmpdir(), "pb5-")));
after(() => rmSync(TMP, { recursive: true, force: true }));

/** Bản sao cây data-api (không node_modules) vào thư mục tạm mới; trả gốc giả. */
function banSao(nhan) {
  const goc = path.join(TMP, nhan);
  cpSync(path.join(REPO, "data-api"), path.join(goc, "data-api"), { recursive: true, filter: (s) => !s.includes(`${path.sep}node_modules`) && !s.includes(`${path.sep}dist`) });
  return goc;
}
const viPham = (goc) => { const k = tongKet(quet(goc, { entries: ENTRIES })); return [...k.viPham.map((v) => `${v.loai} ${v.code} ${v.file}`), ...k.viPhamTenTep.map((v) => `ten-tep ${v.code} ${v.file}`)]; };

/** Dạng viết thật của một mã trong tên bảng (vd phần đầu của bảng listing S02) — đọc từ cây, không viết tay. */
function dangDinhDanh(code) {
  const sql = khuc(readFileSync(path.join(REPO, SCHEMA), "utf8"), "009_s02_ref.sql");
  const h = findSourceNames(sql, ENTRIES).find((x) => x.code === code && loaiKyTu(sql, "x.sql")[x.start] === "m");
  assert.ok(h, `không tìm thấy định danh ${code} trong khúc 009 của schema.sql — fixture ca phá hỏng`);
  return sql.slice(h.start, h.end);
}

describe("PB5 data-api-don-ten-nguon", () => {
  test("PB5-AC-1 cây thật: ngoài định danh lược đồ đã biết 0 cụm, tên tệp 0; thước thấy các định danh biết", () => {
    const k = tongKet(quet(REPO, { entries: ENTRIES }));
    assert.deepEqual(viPham(REPO), [], "data-api còn tên nguồn ngoài định danh lược đồ đã biết");
    assert.deepEqual(Object.keys(k.theoLoai), ["dinh-danh"]);
    // đối chứng dương: thước không mù — các tên bảng/cột nợ vẫn được thấy (89 lúc dọn 25/11)
    assert.ok(k.dinhDanhBiet > 0, "thước không thấy cụm nào — danh sách tên hay bộ quét hỏng");
    assert.equal(k.dinhDanhBiet, k.tong);
    for (const d of DINH_DANH_BIET) assert.doesNotMatch(d, /[^«»A-Za-z0-9_]/, `dạng biết ${d} phải là dạng che`);
  });

  test("PB5-AC-2 danh sách tên rỗng thì thước dừng, không chạy mù", () => {
    const sql = readFileSync(path.join(REPO, SCHEMA), "utf8");
    const rong = path.join(TMP, "rong");
    mkdirSync(path.join(rong, "db", "migrations"), { recursive: true });
    writeFileSync(path.join(rong, "db", "migrations", "schema.sql"), boKhuc(sql, /012_|013_|014_/));
    assert.throws(() => sourceRegistrySeeds(rong), /không rút được tên nào/);
    // đối chứng: cùng tệp giữ ba khúc nguồn thì rút được tên — ca trên đỏ vì đúng ba khúc đó, không vì tệp hỏng
    const du = path.join(TMP, "rong-doi-chung");
    mkdirSync(path.join(du, "db", "migrations"), { recursive: true });
    writeFileSync(path.join(du, "db", "migrations", "schema.sql"), sql);
    assert.ok(sourceRegistrySeeds(du).length > 0, "schema.sql đủ khúc mà không rút được tên — fixture hỏng");
  });

  test("PB5-AC-2 CLI: migration không có tên nguồn → thoát khác 0, «không rút được tên nào»; đủ migration → thoát 0", () => {
    const dung = (nhan, coMigration) => {
      const g = banSao(nhan);
      for (const f of ["scripts/data-api-ten-nguon.mjs", "scripts/lib/tier-a-source-names.mjs", "pipeline/lib/mask-source-names.mjs"]) {
        mkdirSync(path.dirname(path.join(g, f)), { recursive: true });
        cpSync(path.join(REPO, f), path.join(g, f));
      }
      mkdirSync(path.join(g, "db/migrations"), { recursive: true });
      if (coMigration) cpSync(path.join(REPO, "db/migrations"), path.join(g, "db/migrations"), { recursive: true });
      return spawnSync(process.execPath, [path.join(g, "scripts/data-api-ten-nguon.mjs")], { encoding: "utf8" });
    };
    const rong = dung("cli-rong", false);
    assert.notEqual(rong.status, 0, "thước báo sạch mù khi không có danh sách tên");
    assert.match(rong.stderr, /không rút được tên nào/);
    const du = dung("cli-du", true);
    assert.equal(du.status, 0, du.stdout + du.stderr);
    assert.match(du.stdout, /SẠCH — ngoài định danh lược đồ đã biết, 0 cụm/);
  });

  describe("PB5-AC-3 ca phá trên bản sao: mỗi kiểu rò đỏ đúng loại, mã, tệp", () => {
    test("bản sao chưa phá: 0 vi phạm (đối chứng của các ca dưới)", () => {
      assert.deepEqual(viPham(banSao("lanh")), []);
    });
    const ca = [
      ["chú thích SQL", "S02", (g) => writeFileSync(path.join(g, SCHEMA), `${readFileSync(path.join(g, SCHEMA), "utf8")}\n-- ghi chú ${ten("S02")}\n`), `chu-thich S02 ${SCHEMA}`],
      ["chuỗi dữ liệu SQL", "S03", (g) => writeFileSync(path.join(g, SCHEMA), `${readFileSync(path.join(g, SCHEMA), "utf8")}\nSELECT '${ten("S03")}';\n`), `chuoi S03 ${SCHEMA}`],
      ["chú thích TS", "S03", (g) => writeFileSync(path.join(g, "data-api/src/routes/deals.ts"), `${readFileSync(path.join(g, "data-api/src/routes/deals.ts"), "utf8")}\n// ${ten("S03")}\n`), "chu-thich S03 data-api/src/routes/deals.ts"],
      ["chuỗi TS", "S01", (g) => writeFileSync(path.join(g, "data-api/src/routes/deals.ts"), `${readFileSync(path.join(g, "data-api/src/routes/deals.ts"), "utf8")}\nexport const __pb5 = "${ten("S01")}";\n`), "chuoi S01 data-api/src/routes/deals.ts"],
      ["định danh mới ngoài danh sách", "S02", (g) => writeFileSync(path.join(g, SCHEMA), `${readFileSync(path.join(g, SCHEMA), "utf8")}\nCREATE TABLE ${dangDinhDanh("S02")}_pb5_moi (id int);\n`), `dinh-danh S02 ${SCHEMA}`],
      ["README (md)", "S02", (g) => writeFileSync(path.join(g, "data-api/README.md"), `${readFileSync(path.join(g, "data-api/README.md"), "utf8")}\nNguồn: ${ten("S02")}\n`), "chu-thich S02 data-api/README.md"],
      ["Dockerfile (tệp không đuôi)", "S01", (g) => writeFileSync(path.join(g, "data-api/Dockerfile"), `${readFileSync(path.join(g, "data-api/Dockerfile"), "utf8")}\n# ${ten("S01")}\n`), "chu-thich S01 data-api/Dockerfile"],
      ["tên tệp", "S04", (g) => writeFileSync(path.join(g, `data-api/db/stg_${ten("S04")}.sql`), "SELECT 1;\n"), "ten-tep S04 data-api/db/stg_«S04».sql"],
    ];
    ca.forEach(([nhan, , pha, mong], i) => {
      test(`phá ${nhan} → đúng một vi phạm «${mong}»`, () => {
        const g = banSao(`pha-${i}`);
        pha(g);
        assert.deepEqual(viPham(g), [mong]);
      });
    });
  });

  // Lược đồ mẫu: trước PB2 dựng từ 19 tệp data-api/db (origin/main 78ea448dd, có ba lỗi sẵn — 012 cập nhật area_sources chưa
  // có, seed lỗi theo). Sau PB2 dựng từ schema.sql: danh sách bảng/view mong RÚT TỪ TỆP (mọi CREATE TABLE/VIEW của schema.sql
  // cộng ba đối tượng của PostGIS), không lỗi nào; mặc định cột giữ nguyên 29 dòng ghim trước khi dọn, dòng mới chỉ được thuộc
  // bảng do khúc PB2 của schema.sql tạo; source_registry giữ đúng ánh xạ trước → sau.
  const POSTGIS = ["BASE TABLE spatial_ref_sys", "VIEW geography_columns", "VIEW geometry_columns"];
  function mongTuTep(sql) {
    const bang = [...sql.matchAll(/^CREATE TABLE IF NOT EXISTS ([a-z0-9_]+)/gim)].map((m) => `BASE TABLE ${m[1]}`);
    const view = [...sql.matchAll(/^CREATE (?:OR REPLACE )?VIEW ([a-z0-9_]+)/gim)].map((m) => `VIEW ${m[1]}`);
    const pb2 = sql.slice(sql.indexOf("-- ═════ PB2"));
    const bangPb2 = new Set([...pb2.matchAll(/^CREATE TABLE IF NOT EXISTS ([a-z0-9_]+)/gim)].map((m) => m[1]));
    return { doiTuong: [...new Set([...bang, ...view, ...POSTGIS])].map((d) => che(d, ENTRIES)).sort(), bangPb2 };
  }
  const MONG = {
    loi: [],
    // giá trị mặc định của mọi cột (29) — đổi chuỗi mẫu không được chạm DEFAULT nào
    macDinh: [
      "«S02»_listings.first_seen = now()",
      "«S02»_listings.metrics = '{}'::jsonb",
      "«S02»_markets.meta = '{}'::jsonb",
      "«S02»_submarket_metrics.meta = '{}'::jsonb",
      "areas.meta = '{}'::jsonb",
      "dq_check_results.checked_at = now()",
      "dq_check_results.id = nextval('dq_check_results_id_seq'::regclass)",
      "listing_stats.booked90 = 0",
      "listing_stats.computed_at = now()",
      "listing_stats.nights90 = 0",
      "market_asset_stats.updated_at = now()",
      "market_metrics.source = 'S01'::text",
      "ops_audit.at = now()",
      "ops_audit.detail = '{}'::jsonb",
      "ops_audit.env = 'local'::text",
      "ops_audit.id = nextval('ops_audit_id_seq'::regclass)",
      "sale_offers.confidence = 'low'::text",
      "sale_offers.n_reposts = 1",
      "sale_offers.post_ids = '{}'::text[]",
      "sale_offers.source = 'S03'::text",
      "saved_markets.created_at = now()",
      "sessions.created_at = now()",
      "source_registry.since = CURRENT_DATE",
      "source_registry.source_ids = '{}'::text[]",
      "source_registry.status = 'active'::text",
      "stg_«S03»_posts.captured_at = now()",
      "users.created_at = now()",
      "users.plan = 'free'::text",
      "users.role = 'user'::text",
    ],
  };
  // source_registry TRƯỚC khi dọn (đã che). Sau dọn phải đúng bằng ánh xạ: real_name «S0x» → «Nguồn mẫu S0x», mỗi source_id
  // «S0x»-<vai> → s0x-<vai> — quan hệ 012 (INSERT) · 013 (UPDATE) · 014 (array_append) giữ nguyên, không lệch vai nào.
  const NGUON_TRUOC = ["S01 | «S01» | «S01»-discovery,«S01»-listing","S02 | «S02» | «S02»-research","S03 | «S03» | «S03»-mock,«S03»-groups,«S03»-agent","S04 | «S04» | «S04»-boundaries"];
  const anhXa = (d) => d.replace(/^(S0\d) \| «S0\d» \|/, "$1 | Nguồn mẫu $1 |").replace(/«S0(\d)»-/g, "s0$1-");

  describe("PB5-AC-4 lược đồ mẫu data-api/db + seed.sql dựng ra như trước khi dọn", () => {
    // Máy chủ PostGIS: DATABASE_URL; trên CI (CI=true) là service của job như mọi test scripts/. Thiếu cả hai → bỏ qua có
    // tên, không tự đoán DB. Ca tạo DB riêng tên pb5_<pid>_<n> rồi xoá, không đụng DB có sẵn.
    const URL = process.env.DATABASE_URL ?? (process.env.CI ? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest" : null);
    const pg = createRequire(path.join(REPO, "app/package.json"))("pg");
    let n = 0;
    async function dung(dir) {
      const db = `pb5_${process.pid}_${n++}`;
      const quan = new pg.Client({ connectionString: URL });
      await quan.connect();
      await quan.query(`DROP DATABASE IF EXISTS ${db}`);
      await quan.query(`CREATE DATABASE ${db}`);
      const u = new globalThis.URL(URL);
      u.pathname = `/${db}`;
      const c = new pg.Client({ connectionString: u.toString() });
      c.on("error", () => {});
      await c.connect();
      try {
        const r = await dungLuocDoMau(dir, c);
        return { loi: r.loi, doiTuong: r.doiTuong.map((d) => che(d, ENTRIES)), nguon: r.nguon.map((d) => che(d, ENTRIES)), macDinh: r.macDinh.map((d) => che(d, ENTRIES)) };
      } finally {
        await c.end().catch(() => {});
        await quan.query(`DROP DATABASE IF EXISTS ${db}`);
        await quan.end();
      }
    }
    /** Mặc định cột: đủ 29 dòng trước khi dọn, mọi dòng mới thuộc bảng của khúc PB2. */
    const lechMacDinh = (macDinh, bangPb2) => [
      ...MONG.macDinh.filter((d) => !macDinh.includes(d)).map((d) => `mất ${d}`),
      ...macDinh.filter((d) => !MONG.macDinh.includes(d) && !bangPb2.has(d.split(".")[0])).map((d) => `thêm ngoài khúc PB2 ${d}`),
    ];
    test("cây thật: cùng danh sách bảng/view, cùng lỗi có sẵn, cùng mặc định cột, source_registry đúng ánh xạ", { skip: URL ? false : "thiếu DATABASE_URL (ngoài CI)" }, async () => {
      const mong = mongTuTep(readFileSync(path.join(REPO, SCHEMA), "utf8"));
      assert.ok(mong.doiTuong.length > POSTGIS.length && mong.bangPb2.size > 0, "rút từ schema.sql ra rỗng — bộ rút hỏng");
      const r = await dung(path.join(REPO, "data-api"));
      assert.deepEqual({ loi: r.loi, doiTuong: [...r.doiTuong].sort() }, { loi: MONG.loi, doiTuong: mong.doiTuong });
      assert.deepEqual(lechMacDinh(r.macDinh, mong.bangPb2), [], "giá trị mặc định của cột đổi so với trước khi dọn");
      assert.deepEqual(r.nguon, NGUON_TRUOC.map(anhXa), "source_registry lệch ánh xạ trước → sau");
    });
    test("đối chứng đỏ: bản sao cấy tên nguồn thật vào source_registry ở schema.sql → dòng S03 lệch ánh xạ", { skip: URL ? false : "thiếu DATABASE_URL (ngoài CI)" }, async () => {
      const g = banSao("db-pha-ten");
      const f = path.join(g, SCHEMA);
      writeFileSync(f, `${readFileSync(f, "utf8")}\nUPDATE source_registry SET real_name = '${ten("S03")}' WHERE code = 'S03';\n`);
      const r = await dung(path.join(g, "data-api"));
      const mong = NGUON_TRUOC.map(anhXa);
      assert.deepEqual(r.nguon.filter((d) => !mong.includes(d)), ["S03 | «S03» | s03-mock,s03-groups,s03-agent"]);
    });
    test("đối chứng đỏ: bản sao bỏ khúc 018 → thiếu đúng ops_audit", { skip: URL ? false : "thiếu DATABASE_URL (ngoài CI)" }, async () => {
      const g = banSao("db-pha");
      const f = path.join(g, SCHEMA);
      writeFileSync(f, boKhuc(readFileSync(f, "utf8"), /018_/));
      const r = await dung(path.join(g, "data-api"));
      const mong = mongTuTep(readFileSync(path.join(REPO, SCHEMA), "utf8"));
      assert.deepEqual(mong.doiTuong.filter((d) => !r.doiTuong.includes(d)), ["BASE TABLE ops_audit"]);
    });
    test("đối chứng đỏ: bản sao đổi s03-groups thành s03-group ở khúc 013 → dòng S03 lệch ánh xạ", { skip: URL ? false : "thiếu DATABASE_URL (ngoài CI)" }, async () => {
      const g = banSao("db-pha-nguon");
      const f = path.join(g, SCHEMA);
      const sql = readFileSync(f, "utf8");
      const k = khuc(sql, "013_sale_offers_default_s03.sql");
      writeFileSync(f, sql.replace(k, k.replace("s03-groups", "s03-group")));
      const r = await dung(path.join(g, "data-api"));
      const mong = NGUON_TRUOC.map(anhXa);
      assert.deepEqual(r.nguon.filter((d) => !mong.includes(d)), ["S03 | Nguồn mẫu S03 | s03-mock,s03-group,s03-agent"]);
    });
  });
});
