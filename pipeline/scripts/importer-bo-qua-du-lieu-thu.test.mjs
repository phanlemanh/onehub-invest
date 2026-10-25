import test from "node:test"; import assert from "node:assert/strict";
import { isAllowedSource, isTestSnapshot } from "../import-airbnb.mjs";

// PL1 mở lại lần 2 (claudedp-2310-4): ALLOWLIST nguồn thật thay denylist —
// nguồn LẠ bất kỳ (example, zalo-mock, e2e, TEST…) đều bị chặn; nguồn thật qua.
test("allowlist: nguồn thật đi qua, mọi nguồn khác bị chặn (kể cả lạ)", () => {
  assert.equal(isAllowedSource("zalo-agent"), true);
  assert.equal(isAllowedSource("airbnb-listing"), true);
  assert.equal(isAllowedSource("airbnb-discovery"), true);
  assert.equal(isAllowedSource("airdna-research"), true);
  assert.equal(isAllowedSource("osm-boundaries"), true);
  // bị chặn: thử + lạ
  assert.equal(isAllowedSource("zalo-mock"), false);
  assert.equal(isAllowedSource("e2e"), false);
  assert.equal(isAllowedSource("example"), false, "example có thật trên đĩa — denylist cũ không bắt");
  assert.equal(isAllowedSource("TEST"), false);
  assert.equal(isAllowedSource("chotot-ads"), false, "chotot thuộc importer khác — vào nhầm bảng cũng chặn");
  assert.equal(isAllowedSource(""), false);
});

test("isTestSnapshot (nghĩa mới = ngoài allowlist): theo segment nguồn của tên dir", () => {
  assert.equal(isTestSnapshot("hanoi__zalo-mock__2026-10-18T034152"), true);
  assert.equal(isTestSnapshot("hanoi__example__2026-10-17T153258"), true);
  assert.equal(isTestSnapshot("hanoi__e2e__x"), true);
  assert.equal(isTestSnapshot("hanoi__TEST__1"), true);
  assert.equal(isTestSnapshot("hanoi__zalo-agent__2026-10-23T012853"), false);
  assert.equal(isTestSnapshot("hanoi__airbnb-listing__2026-10-19T232601"), false);
});

// Mở lại 2310-4 vòng 4 (hồi quy AC-6): '…__zalo-agent__TEST' có nguồn nằm
// trong allowlist nên lọt lớp nguồn rồi vào DB. Luật khuôn tên dùng chung
// cho cả hai importer: '<city>__<nguồn>__<mốc thời gian>' với mốc khớp
// TS_RE (giây 6 số / mili-giây 9 số / hậu tố -n khi trùng ms — BÁO 2510-5).
import { TS_RE, parseSnapshotDirName } from "../lib/snapshot-name.mjs";

test("khuôn tên: thư mục segment thử (TEST/e2e) bị bỏ dù nguồn hợp lệ", () => {
  assert.equal(parseSnapshotDirName("hanoi__zalo-agent__TEST"), null);
  assert.equal(parseSnapshotDirName("hanoi__zalo-agent__e2e"), null);
  assert.equal(parseSnapshotDirName("hanoi__chotot-ads__TEST"), null);
});

test("khuôn tên: tên thật có mốc thời gian vẫn nạp (cả 3 dạng storage)", () => {
  assert.deepEqual(parseSnapshotDirName("hanoi__zalo-agent__2026-10-23T012853"), {
    city: "hanoi", source: "zalo-agent", ts: "2026-10-23T012853",
  });
  assert.deepEqual(parseSnapshotDirName("hanoi__zalo-agent__2026-10-25T021827756"), {
    city: "hanoi", source: "zalo-agent", ts: "2026-10-25T021827756",
  });
  assert.deepEqual(parseSnapshotDirName("hanoi__zalo-agent__2026-10-25T021827756-1"), {
    city: "hanoi", source: "zalo-agent", ts: "2026-10-25T021827756-1",
  });
  assert.deepEqual(parseSnapshotDirName("hanoi__chotot-ads__2026-10-23T070000Z"), {
    city: "hanoi", source: "chotot-ads", ts: "2026-10-23T070000Z",
  });
});

test("khuôn tên: thiếu/thừa segment hoặc mốc rác → bỏ", () => {
  assert.equal(parseSnapshotDirName("hanoi__zalo-agent"), null); // 2 phần
  assert.equal(parseSnapshotDirName("hanoi__zalo-agent__"), null); // mốc rỗng
  assert.equal(parseSnapshotDirName("a__b__c__d"), null); // 4 phần
  assert.equal(parseSnapshotDirName("hanoi__zalo-agent__20261023T070000"), null); // khuôn không gạch
  assert.equal(parseSnapshotDirName(""), null);
});

test("TS_RE importer phải identical chuỗi TS_RE trong 2 daily script (BÁO 2510-5)", async () => {
  const { readFile } = await import("node:fs/promises");
  for (const f of ["apify-facebook-daily.sh", "zalo-import-daily.sh"]) {
    const src = await readFile(new URL(`../../scripts/${f}`, import.meta.url), "utf8");
    const m = src.match(/^TS_RE='(.*)'$/m);
    assert.ok(m, `${f} phải có TS_RE=`);
    // innerText của bash literal == nguồn regex của module (cùng chuỗi ký tự)
    assert.equal(m[1], TS_RE.source, `${f} và importer phải dùng cùng một TS_RE`);
  }
});
