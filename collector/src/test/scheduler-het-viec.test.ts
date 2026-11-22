// scheduler-het-viec.test.ts — 2211-19: hàng đợi rỗng → KHÔNG ghi snapshot,
// in dòng HET-VIEC cho script ngoài dừng vòng theo dòng in.
//
// LỆNH PHÁ (bản chép hỏng): trong src/core/scheduler.ts xoá khối
//   if (items.length === 0 && coverage.captured === 0 && coverage.notes?.some(...))
//   ... return;
// → ca "không-tạo-snapshot ĐỎ" (thư mục snapshot được tạo dù hàng đợi rỗng).
import { strict as assert } from "node:assert";
import { mkdirSync } from "node:fs";
import { test } from "node:test";
import { mkdtempSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { readFileSync } from "node:fs";
import type { CityRef } from "../core/types.js";
import { pathToFileURL } from "node:url";

const TEP_SCHED = join(import.meta.dirname, "../../src/core/scheduler.ts");

import { runCollector } from "../core/scheduler.js";

const collectorGia = {
  id: "test-het-viec",
  requestsPerSecond: 10,
  async collect() {
    return {
      items: [],
      coverage: {
        discovered: 18,
        captured: 0,
        failed: 0,
        methods: {},
        notes: ["đã fetch hết — không còn việc"],
      },
    };
  },
};

test("hàng-đợi-rỗng: KHÔNG tạo thư mục snapshot nào, in HET-VIEC", async () => {
  const goc = mkdtempSync(join(tmpdir(), "s01-rong-"));
  const stateDir = join(goc, "state");
  const snapshotRoot = join(goc, "snapshots") + "/";
  // kho đã có cấu trúc cha (thư mục thành phố) như thật
  mkdirSync(join(snapshotRoot, "hanoi"), { recursive: true });
  await runCollector({
    city: { id: "hanoi", name: "Hà Nội", country: "vn", center: [105.8, 21.0] },
    collector: { ...collectorGia, collect: collectorGia.collect } as unknown as Parameters<typeof runCollector>[0]["collector"],
    snapshotRoot,
    stateDir,
  });
  // trong thư mục thành phố: KHÔNG có .partial sót, KHÔNG có snapshot tên thật
  const trong = readdirSync(join(snapshotRoot, "hanoi"));
  assert.deepEqual(trong, [], "hàng đợi rỗng không được để lại .partial hay snapshot nào");
});

test("ca-neo: scheduler còn khối hết-việc (P xoá khối → ca này và ca trên đỏ)", () => {
  const ma = readFileSync(TEP_SCHED, "utf8");
  assert.match(ma, /không còn việc/, "scheduler phải còn kiểm notes hết-việc");
  assert.match(ma, /HET-VIEC/, "scheduler phải in dòng HET-VIEC");
});

test("HET-VIEC trong weekly-collect.sh: dừng theo dòng in (không soi manifest)", () => {
  const tep = join(import.meta.dirname, "../../../pipeline/scripts/weekly-collect.sh");
  const ma = readFileSync(tep, "utf8");
  assert.match(ma, /grep -q "HET-VIEC"/, "weekly-collect dừng theo dòng in HET-VIEC");
  assert.ok(!/grep -q "không còn việc"/.test(ma), "không còn soi chuỗi manifest cũ");
});
