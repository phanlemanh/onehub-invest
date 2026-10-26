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
  // PL10 (BÁO 2510-12): snapshot S08 nạp QUA import-airbnb — phải trong allowlist
  assert.equal(isAllowedSource("s08-danh-muc"), true, "S08 nạp qua import-airbnb — thiếu là mất thầm lặng");
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
  assert.equal(isTestSnapshot("vn__s08-danh-muc__2026-10-24T152955810"), false, "snapshot S08 khuôn tên thật KHÔNG bị coi là test");
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
import { parseSnapshotDirName } from "../import-airbnb.mjs";

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

test("TS_RE bốn bản (2 importer + 2 daily script) phải identical (BÁO 2510-5)", async () => {
  const { readFile } = await import("node:fs/promises");
  const files = [
    ["pipeline/import-airbnb.mjs", /^const SNAPSHOT_TS_RE = \/(.*)\/;$/m],
    ["pipeline/import-chotot.mjs", /^const SNAPSHOT_TS_RE = \/(.*)\/;$/m],
    ["scripts/apify-facebook-daily.sh", /^TS_RE='(.*)'$/m],
    ["scripts/zalo-import-daily.sh", /^TS_RE='(.*)'$/m],
  ];
  const found = [];
  for (const [f, re] of files) {
    const text = await readFile(new URL(`../../${f}`, import.meta.url), "utf8");
    const m = text.match(re);
    assert.ok(m, `${f} phải khai báo regex khuôn tên`);
    found.push(m[1]);
  }
  assert.equal(new Set(found).size, 1, `bốn bản phải cùng một regex: ${found}`);
});
