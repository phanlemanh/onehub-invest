// 0711-29(4b): docKhungTuLich — đọc map id → khung 2 đêm trống liền đầu tiên
// từ snapshot lịch ĐÃ THU. Không Chrome: chỉ dựng thư mục snapshot giả (items
// gz đúng khuôn manifest) rồi đọc lại. Đối chứng: căn kín lịch không có khung;
// căn có 2 đêm trống ≥ hôm-nay+7 → khung đúng ngày; snapshot sau đè snapshot trước.
import { strict as assert } from "node:assert";
import { gzipSync } from "node:zlib";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createHash } from "node:crypto";
import { test } from "node:test";
import { docKhungTuLich } from "../collectors/airbnb-listing.js";

function demNam(offset: number): string {
  return new Date(Date.now() + offset * 864e5).toISOString().slice(0, 10);
}

/** Dựng một snapshot giả 1 tệp items gz theo khuôn manifest của SnapshotWriter. */
function snapshotGia(root: string, snap: string, items: unknown[]) {
  const dir = join(root, "hcmc", snap);
  mkdirSync(dir, { recursive: true });
  const gz = gzipSync(JSON.stringify(items));
  writeFileSync(join(dir, "items-0001.json.gz"), gz);
  writeFileSync(
    join(dir, "manifest.json"),
    JSON.stringify({
      snapshotId: snap,
      files: [{ name: "items-0001.json.gz", sha256: createHash("sha256").update(gz).digest("hex"), bytes: gz.length }],
    }),
  );
}

const calCua = (dates: { d: string; trong: boolean }[]) => ({
  data: { node: { pdpAvailabilityCalendar: { calendarMonths: [{ days: dates.map((x) => ({ calendarDate: x.d, available: x.trong })) }] } } },
});

test("4b: căn có 2 đêm trống liền ≥ +7 → khung đúng; kín lịch → không có; snapshot sau đè trước", async () => {
  const tam = mkdtempSync(join(tmpdir(), "ktl-"));
  try {
    const t10 = demNam(10);
    const t11 = demNam(11);
    const t20 = demNam(20);
    const t21 = demNam(21);
    // snapshot CŨ: căn A khung t10→t11; căn B kín (không có khung)
    snapshotGia(tam, "hcmc__airbnb-listing__cu", [
      { source: "airbnb-listing", sourceId: "A", kind: "listing", fetchedAt: "2026-11-07T00:00:00Z", payload: { calendar: calCua([{ d: t10, trong: true }, { d: t11, trong: true }, { d: t20, trong: false }, { d: t21, trong: false }]) } },
      { source: "airbnb-listing", sourceId: "B", kind: "listing", fetchedAt: "2026-11-07T00:00:00Z", payload: { calendar: calCua([{ d: t10, trong: false }, { d: t11, trong: false }]) } },
    ]);
    // snapshot MỚI (sort sau): căn A khung dời sang t20→t21
    snapshotGia(tam, "hcmc__airbnb-listing__moi", [
      { source: "airbnb-listing", sourceId: "A", kind: "listing", fetchedAt: "2026-11-08T00:00:00Z", payload: { calendar: calCua([{ d: t10, trong: false }, { d: t11, trong: false }, { d: t20, trong: true }, { d: t21, trong: true }]) } },
    ]);
    const m = await docKhungTuLich(tam);
    assert.equal(m.size, 1, "chỉ căn A có khung");
    assert.deepEqual(m.get("A"), { ci: t20, co: t21 }, "snapshot sau đè: khung mới nhất t20→t21");
    assert.equal(m.has("B"), false, "căn kín lịch không có khung");
  } finally {
    rmSync(tam, { recursive: true, force: true });
  }
});

test("4b: dir không tồn tại → map rỗng (không ném)", async () => {
  const m = await docKhungTuLich(join(tmpdir(), "khong-ton-tai-xyz-ktl"));
  assert.equal(m.size, 0);
});
