// street-raw-ten-nguon.test.mjs — hồ sơ _acceptance/street-raw-khong-mang-ten-nguon (PL39), ca «SR-AC-4». Không cần DB.
// Luật của transform S06: ô chữ lên cloud mà bộ dò tên nguồn (findSourceNames — lõi của bộ soát sync-cloud) trúng thì không ghi.
// Sổ tên giả (mã S90, S91), không dùng tên nguồn thật.
import { test } from "node:test";
import assert from "node:assert/strict";
import { kiemTranTenNguon, mangTenNguon, O_CHU_PHAT_BIEU, TRAN_TEN_NGUON } from "../transform-chotot.mjs";
import { findSourceNames } from "../lib/mask-source-names.mjs";
import { guardValues } from "../lib/tier-a-guard.mjs";

const SO = [
  { code: "S90", realName: "Nhà Thử Nghiệm", wholeOnly: false },
  { code: "S91", realName: "kenh-thu.vn", wholeOnly: true },
];

test("SR-AC-4 luật trúng đúng chỗ bộ soát sync-cloud trúng", () => {
  const trung = ["Đường Nhà Thử Nghiệm 12", "nha thu nghiem tower", "NhaThuNghiem", "Ngõ 5 kenh-thu.vn",
    "Đường Nhà Thử Nghiệm"]; // dạng NFD
  const sach = ["Nguyễn Văn Linh", "Toà S1.03", "Phố Huế", "", "Đường số 7"];
  for (const v of trung) {
    assert.equal(mangTenNguon(v, SO), true, `luật bỏ sót «${v}»`);
    assert.ok(guardValues(v, SO).length > 0, `bộ soát không trúng «${v}» — bảng ca lệch`);
  }
  for (const v of sach) {
    assert.equal(mangTenNguon(v, SO), false, `luật bắt nhầm «${v}»`);
    assert.equal(guardValues(v, SO).length, 0);
  }
});

test("SR-AC-4 sổ rỗng hay giá trị không phải chữ thì không lọc", () => {
  assert.equal(mangTenNguon("Đường Nhà Thử Nghiệm", []), false, "sổ rỗng không được làm NULL hàng loạt");
  for (const v of [null, undefined, 12, {}]) assert.equal(mangTenNguon(v, SO), false);
});

test("SR-AC-4 hai trường đi qua phát biểu là đường và toà", () => {
  assert.deepEqual(O_CHU_PHAT_BIEU, ["street_raw", "block_raw"]);
});

test("SR-AC-4 dựng sẵn biến thể theo mảng: cùng kết quả, mảng mới không dùng nhầm bản cũ", () => {
  const v = "Đường Nhà Thử Nghiệm 12";
  assert.deepEqual(findSourceNames(v, SO), findSourceNames(v, SO));
  const khac = [{ code: "S92", realName: "Kênh Khác", wholeOnly: false }];
  assert.equal(findSourceNames(v, khac).length, 0, "mảng sổ khác vẫn trả kết quả của sổ trước");
  assert.equal(findSourceNames("đường kênh khác", khac)[0].code, "S92");
});

test("SR-AC-4 mảng sổ thêm mục tại chỗ thì bộ dò thấy tên mới", () => {
  const so = [...SO];
  assert.equal(findSourceNames("đường kênh mới", so).length, 0);
  so.push({ code: "S93", realName: "Kênh Mới", wholeOnly: false });
  assert.equal(findSourceNames("đường kênh mới", so)[0]?.code, "S93", "bộ dò dùng biến thể cũ sau khi sổ thêm mục");
});

test("SR-AC-5 vượt trần một lượt thì dừng, tới trần thì đi tiếp", () => {
  assert.equal(TRAN_TEN_NGUON, 50);
  assert.doesNotThrow(() => kiemTranTenNguon(TRAN_TEN_NGUON, "giá trị chữ"));
  assert.throws(() => kiemTranTenNguon(TRAN_TEN_NGUON + 1, "giá trị chữ"), /vượt trần 50 — dừng, không rút, không ghi/);
});
