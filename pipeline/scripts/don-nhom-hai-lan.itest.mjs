// don-nhom-hai-lan.itest.mjs — hồ sơ _acceptance/nhom-hai-lan-s03-xu-goc E5, E6: lệnh dọn sổ trên fixture.
// Chỉ trên DB thử, BEGIN…ROLLBACK, xoá dòng S03 thật trong giao dịch để chỉ còn fixture. Khoá fixture `nhl-…`, không có khoá thật.
import pg from "pg";

import { donNhomHaiLan, hoanLaiDon } from "../don-nhom-hai-lan.mjs";

const DB_URL = process.env.DATABASE_URL ?? "";
if (!/\/oneinvest_[a-z0-9_]+$/.test(DB_URL)) throw new Error("don-nhom-hai-lan.itest: cần DATABASE_URL trỏ DB thử oneinvest_<dãy>_<việc>");

const loi = [];
const kiem = (dieu, ok, sai) => {
  console.log(dieu ? `ok ${ok}` : sai);
  if (!dieu) loi.push(sai);
};
const tt = (k) => `kx:group:${k}`;

async function trongGiaoDich(fn) {
  const c = new pg.Client({ connectionString: DB_URL });
  await c.connect();
  try {
    await c.query("BEGIN");
    await c.query("SELECT pg_advisory_xact_lock(33033)");
    await c.query("DELETE FROM collection_units WHERE source_code = 'S03'");
    return await fn(c);
  } finally {
    await c.query("ROLLBACK").catch(() => {});
    await c.end();
  }
}

async function dong(c, khoa, { status = "active", reason = null, note = null, market = [], duAn = [] } = {}) {
  const { rows: [{ unit_code }] } = await c.query(
    `INSERT INTO collection_units (source_code, group_key, name, status, reason, note, market_codes, project_node_ids)
     VALUES ('S03', $1, 'Nhóm thử NHL', $2, $3, $4, $5, $6) RETURNING unit_code`, [khoa, status, reason, note, market, duAn]);
  return unit_code;
}
const bam = async (c, bang, loaiCot = "") => (await c.query(
  `SELECT md5(coalesce(string_agg((to_jsonb(t) ${loaiCot})::text, '|' ORDER BY t.id), '')) AS h FROM ${bang} t`)).rows[0].h;
const bamSo = (c) => bam(c, "collection_units", "- 'updated_at'");
const trangThai = async (c, ma) => (await c.query("SELECT status, reason, resume_when FROM collection_units WHERE unit_code = $1", [ma])).rows[0];
const ghiChu = () => {
  const dong = [];
  return { dong, out: (s) => dong.push(s), chu: () => dong.join("\n") };
};
const nhatKy = async (c) => (await c.query("SELECT action, detail FROM ops_audit WHERE actor = 'machine:don-nhom-hai-lan' ORDER BY id")).rows;

await trongGiaoDich(async (c) => {
  const THE = "[t1] thẻ thử";
  // Nhóm ba dòng là ca không có ở bản sao thật: cả hai dòng phụ đều dọn.
  const aGiu = await dong(c, "nhl-a", { note: THE, market: ["vn-hanoi"] });
  const aPhu = await dong(c, tt("nhl-a"), { note: THE, market: ["vn-hanoi"] });
  const bPhu = await dong(c, tt("nhl-b"), { status: "paused", reason: "không còn ở gateway" });
  const bGiu = await dong(c, "nhl-b");
  const cGiu = await dong(c, "nhl-c");
  const cPhu1 = await dong(c, tt("nhl-c"));
  const cPhu2 = await dong(c, `group:nhl-c`);
  const don1 = await dong(c, "nhl-don");

  const soTruoc = await bamSo(c);
  const nkTruoc = await bam(c, "ops_audit");
  const thu = ghiChu();
  const demThu = await donNhomHaiLan(c, { out: thu.out });
  kiem(await bamSo(c) === soTruoc && await bam(c, "ops_audit") === nkTruoc && demThu.da_ghi === 0, "AC-5 chay thu khong doi", "loi chay thu doi du lieu");
  kiem([aGiu, aPhu, bGiu, bPhu, cGiu, cPhu1, cPhu2].every((m) => thu.chu().includes(m)) && !thu.chu().includes(don1), "AC-5 in dung ma", `loi in ma: ${thu.chu()}`);
  const khongLoKhoa = (chu) => !/nhl-|kx:|group:|Nhóm thử/.test(chu);
  kiem(khongLoKhoa(thu.chu()), "AC-5 khong in khoa", "loi khoa trong dau ra");
  kiem(!khongLoKhoa(`${thu.chu()}\n${tt("nhl-a")}`), "do: loi khoa trong dau ra", "loi thuoc dau ra khong do");

  const ghi = ghiChu();
  const dem = await donNhomHaiLan(c, { ghi: true, out: ghi.out });
  const dongPhu = [aPhu, bPhu, cPhu1, cPhu2];
  const sau = [];
  for (const m of dongPhu) sau.push(await trangThai(c, m));
  kiem(sau.every((r) => r.status === "retired") && dem.dong_phu === 4 && (await trangThai(c, don1)).status === "active",
    "AC-5 ghi dung dong phu", `loi ghi dong phu: ${JSON.stringify(dem)}`);
  kiem((await trangThai(c, bPhu)).status === "retired" && (await trangThai(c, bPhu)).reason.includes(bGiu), "AC-5 dong phu paused cung duoc don", "loi dong phu paused");
  const giu = [];
  for (const k of ["nhl-a", "nhl-b", "nhl-c"]) giu.push((await c.query(
    `SELECT unit_code, group_key FROM collection_units WHERE group_key = ANY ($1) AND status NOT IN ('retired', 'completed')`, [[k, tt(k), `group:${k}`]])).rows);
  kiem(giu.every((ds, i) => ds.length === 1 && ds[0].group_key === ["nhl-a", "nhl-b", "nhl-c"][i]), "AC-5 dong giu la khoa tran", "loi dong giu");
  const nk = await nhatKy(c);
  const cuB = nk.find((r) => r.detail.unit_code === bPhu)?.detail;
  kiem(nk.length === 4 && dongPhu.every((m) => nk.filter((r) => r.detail.unit_code === m).length === 1) && cuB?.status_cu === "paused" && cuB?.reason_cu === "không còn ở gateway",
    "AC-5 mot dong nhat ky moi dong co trang thai cu", `loi nhat ky: ${nk.length}`);

  const hai = ghiChu();
  const dem2 = await donNhomHaiLan(c, { ghi: true, out: hai.out });
  kiem(dem2.dong_phu === 0 && dem2.bo_qua === 0 && (await nhatKy(c)).length === 4, "AC-5 lan hai 0 thay doi", `loi lan hai: ${JSON.stringify(dem2)}`);

  await hoanLaiDon(c, { out() {} });
  kiem((await trangThai(c, aPhu)).status === "retired", "AC-5 hoan lai chay thu khong doi", "loi hoan lai chay thu");
  await hoanLaiDon(c, { ghi: true, out() {} });
  kiem(await bamSo(c) === soTruoc, "AC-5 hoan lai dung bam", "loi hoan lai sai bam");
  const dem3 = await hoanLaiDon(c, { ghi: true, out() {} });
  kiem(dem3.dong_hoan === 0, "AC-5 hoan lai lan hai 0 thay doi", `loi hoan lai hai lan: ${JSON.stringify(dem3)}`);
  await c.query("UPDATE collection_units SET note = 'đổi' WHERE unit_code = $1", [don1]);
  kiem(await bamSo(c) !== soTruoc, "do: loi bam so", "loi thuoc bam so khong do");
});

await trongGiaoDich(async (c) => {
  await dong(c, tt("nhl-kt1"));
  await dong(c, "kx2:group:nhl-kt1");
  await dong(c, "nhl-the", { note: "[t1] một" });
  await dong(c, tt("nhl-the"), { note: "[t2] hai" });
  await dong(c, "nhl-tt", { market: ["vn-hanoi"] });
  await dong(c, tt("nhl-tt"), { market: ["vn-hcmc"] });
  const { rows: [nut] } = await c.query("SELECT id FROM asset_nodes WHERE node_type = 'project' LIMIT 1");
  if (!nut) throw new Error("DB thử không có nút dự án");
  await dong(c, "nhl-da");
  await dong(c, tt("nhl-da"), { duAn: [nut.id] });
  await dong(c, "nhl-go", { status: "retired" });
  await dong(c, tt("nhl-go"));
  const lanh = await dong(c, "nhl-lanh");
  const lanhPhu = await dong(c, tt("nhl-lanh"));

  const ghi = ghiChu();
  const soBo = await c.query("SELECT unit_code, group_key FROM collection_units WHERE group_key NOT LIKE '%nhl-lanh'");
  const bamNhom = async () => (await c.query(
    `SELECT md5(string_agg((to_jsonb(t) - 'updated_at')::text, '|' ORDER BY t.id)) AS h FROM collection_units t WHERE group_key NOT LIKE '%nhl-lanh'`)).rows[0].h;
  const truoc = await bamNhom();
  const dem = await donNhomHaiLan(c, { ghi: true, out: ghi.out });
  const chu = ghi.chu();
  const ma = (khoa) => soBo.rows.find((r) => r.group_key === khoa)?.unit_code;
  const coLyDo = (khoa, ly) => chu.split("\n").some((d) => d.includes(ma(khoa)) && d.endsWith(`: ${ly}`));
  kiem(coLyDo(tt("nhl-kt1"), "khong co dong khoa tran"), "AC-6 khong co dong tran thi bo qua", "loi khong co dong tran");
  kiem(coLyDo("nhl-the", "lech the"), "AC-6 lech the thi bo qua", "loi lech the");
  kiem(coLyDo("nhl-tt", "lech thi truong"), "AC-6 lech thi truong thi bo qua", "loi lech thi truong");
  kiem(coLyDo("nhl-da", "lech du an"), "AC-6 lech du an thi bo qua", "loi lech du an");
  kiem(coLyDo("nhl-go", "dai dien da go"), "AC-6 dai dien da go thi bo qua", "loi dai dien da go");
  kiem(await bamNhom() === truoc && dem.bo_qua === 5, "AC-6 cap bo qua khong doi", `loi cap bo qua doi: ${JSON.stringify(dem)}`);
  kiem((await trangThai(c, lanhPhu)).status === "retired" && (await trangThai(c, lanh)).status === "active", "AC-6 cap con lai van don", "loi cap con lai");
});

await trongGiaoDich(async (c) => {
  await dong(c, "nhl-a"); await dong(c, tt("nhl-a"));
  await dong(c, "nhl-b"); await dong(c, tt("nhl-b"));
  await dong(c, "nhl-c"); await dong(c, tt("nhl-c"));
  // Lỗi tiêm bằng trigger, không có móc thử trong mã: dòng nhật ký thứ hai của lượt nổ.
  await c.query("CREATE TEMP SEQUENCE nhl_dem");
  await c.query(`CREATE FUNCTION pg_temp.nhl_no() RETURNS trigger LANGUAGE plpgsql AS $$
    BEGIN
      IF NEW.actor = 'machine:don-nhom-hai-lan' AND nextval('nhl_dem') = 2 THEN RAISE EXCEPTION 'loi tiem nhl'; END IF;
      RETURN NEW;
    END $$`);
  await c.query("CREATE TRIGGER nhl_no BEFORE INSERT ON ops_audit FOR EACH ROW EXECUTE FUNCTION pg_temp.nhl_no()");
  const truoc = await bamSo(c);
  let no = null;
  try { await donNhomHaiLan(c, { ghi: true, out() {} }); } catch (e) { no = e.message; }
  kiem(no === "loi tiem nhl", "do: loi tiem da no", `loi tiem khong no: ${no}`);
  kiem(await bamSo(c) === truoc && (await nhatKy(c)).length === 0, "AC-6 loi giua chung khong doi gi", "loi giua chung van doi");
});

console.log(loi.length ? `DON NHOM HAI LAN FAIL (${loi.length})` : "DON NHOM HAI LAN OK");
process.exit(loi.length ? 1 : 0);
