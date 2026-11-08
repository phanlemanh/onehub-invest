// link-nguoi-ban-s03.test.mjs — phần thuần của bộ ghi liên lạc hồ sơ (AC-7) và bộ chọn mã (AC-8). Không DB: phép đo trên DB thử ở
// scripts/link-nguoi-ban-s03/{lien-lac,chon}.mjs.
import assert from "node:assert/strict";
import { test } from "node:test";
import { LY_DO_BO, LY_DO_DOI, quyetLienLacHoSo } from "../lib/lien-lac-ho-so.mjs";
import { chonMa, duongYeuCauHopLe } from "../lib/chon-ma-ho-so.mjs";
import { RULE_HO_SO } from "../lib/nap-080.mjs";

const h = (ma, loai, username = "", luc = "2026-11-06T02:00:00Z") => ({ source_id: `${ma}__${luc}`, ma_tai_khoan: ma, username, loai, captured_at: luc });
const nguoi = new Map([["1", "P1"], ["2", "P2"], ["3", "P3"]]);

test("LNB-AC-7 co-username khớp Người → một chat_profile username trần, luật hồ sơ, bằng chứng có mã và thời điểm", () => {
  const { them, rut, dem } = quyetLienLacHoSo([h("1", "co-username", "u.mot")], nguoi, []);
  assert.deepEqual(rut, []);
  assert.equal(them.length, 1);
  assert.deepEqual({ ...them[0], evidence: undefined }, { party_key: "P1", kind: "chat_profile", value: "u.mot", rule_id: RULE_HO_SO, evidence: undefined });
  assert.equal(them[0].evidence.ma_tai_khoan, "1");
  assert.equal(them[0].evidence.captured_at, "2026-11-06T02:00:00Z");
  assert.equal(dem.them, 1);
});

test("LNB-AC-7 không ghi: mã lệch (hậu tố), không khớp Người, khong-ro, username dạng link hay rỗng", () => {
  const { them, dem } = quyetLienLacHoSo([
    h("1_0", "co-username", "x"), h("9", "co-username", "x"), h("2", "khong-ro"), h("3", "co-username", "https://a/b"), h("1", "co-username", " "),
  ], nguoi, []);
  assert.deepEqual(them, []);
  assert.equal(dem.ma_sai_khuon, 1);
  assert.equal(dem.khong_nguoi, 1);
  assert.equal(dem.khong_ro, 1);
  assert.equal(dem.username_sai_khuon, 2);
});

test("LNB-AC-7 chạy lại giữ nguyên; đổi username rút doi-username rồi thêm; khong-tim-thay và khong-username rút bo-username", () => {
  const song = [{ id: 10, party_key: "P1", value: "u.mot", evidence: { ma_tai_khoan: "1" } },
    { id: 11, party_key: "P2", value: "u.hai", evidence: { ma_tai_khoan: "2" } },
    { id: 12, party_key: "P3", value: "u.ba", evidence: { ma_tai_khoan: "3" } }];
  const lai = quyetLienLacHoSo([h("1", "co-username", "u.mot"), h("2", "co-username", "u.hai"), h("3", "co-username", "u.ba")], nguoi, song);
  assert.deepEqual([lai.them, lai.rut, lai.dem.giu], [[], [], 3]);
  const doi = quyetLienLacHoSo([h("1", "co-username", "u.moi"), h("2", "khong-tim-thay"), h("3", "khong-username")], nguoi, song);
  assert.deepEqual(doi.rut, [{ id: 10, ly_do: LY_DO_DOI }, { id: 11, ly_do: LY_DO_BO }, { id: 12, ly_do: LY_DO_BO }]);
  assert.deepEqual(doi.them.map((t) => t.value), ["u.moi"]);
  assert.deepEqual([doi.dem.khong_tim_thay, doi.dem.khong_username, doi.dem.rut_bo], [1, 1, 2]);
  // khong-ro không rút gì.
  assert.deepEqual(quyetLienLacHoSo([h("1", "khong-ro")], nguoi, song).rut, []);
});

test("LNB-AC-7 hai mã cùng Người cùng username → một liên lạc", () => {
  const { them } = quyetLienLacHoSo([h("1", "co-username", "u"), h("4", "co-username", "u")], new Map([["1", "P1"], ["4", "P1"]]), []);
  assert.equal(them.length, 1);
});

test("LNB-AC-8 chọn: toàn chữ số, mọi tin không số, Người không số, chưa tra, đủ tin; sắp theo số tin; đối chứng khác mã chọn", () => {
  const tk = [
    { ma: "10", n_tin: 3, co_so: false }, { ma: "11", n_tin: 7, co_so: false }, { ma: "12", n_tin: 9, co_so: true },
    { ma: "13", n_tin: 9, co_so: false }, { ma: "14", n_tin: 9, co_so: false }, { ma: "15", n_tin: 2, co_so: false },
    { ma: "16_0", n_tin: 9, co_so: false }, { ma: "17", n_tin: 9, co_so: false },
  ];
  const ng = new Map([["10", "A"], ["11", "B"], ["12", "C"], ["13", "D"], ["14", "E"], ["15", "F"], ["16_0", "G"]]);
  const r = chonMa(tk, ng, new Set(["D"]), new Set(["14"]), ["11", "20", "21", "22"]);
  assert.deepEqual(r.mas, ["11", "10"]);
  assert.deepEqual(r.doi_chung, ["20", "21"]);
  assert.deepEqual([r.dem.co_so_tren_tin, r.dem.nguoi_co_so, r.dem.da_tra, r.dem.it_tin, r.dem.ma_sai_khuon, r.dem.khong_nguoi], [1, 1, 1, 1, 1, 1]);
  assert.equal(chonMa(tk, ng, new Set(), new Set(), [], { soMa: 1 }).mas.length, 1);
});

test("LNB-AC-8 tệp yêu cầu nằm ngoài ~/.openclaw và ngoài snapshots/", () => {
  assert.equal(duongYeuCauHopLe("/h/.openclaw/x/yeu-cau.json", "/h"), false);
  assert.equal(duongYeuCauHopLe("/h/.openclaw", "/h"), false);
  assert.equal(duongYeuCauHopLe("/repo/collector/snapshots/hanoi/yeu-cau.json", "/h"), false);
  assert.equal(duongYeuCauHopLe("/h/.oneinvest/s03-tra/yeu-cau.json", "/h"), true);
});
