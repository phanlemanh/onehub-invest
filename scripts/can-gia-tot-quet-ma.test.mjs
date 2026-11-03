// can-gia-tot-quet-ma.test.mjs — hồ sơ can-gia-tot-biet-can E11: chiều đỏ của mục deals-gate. Bản chép lành thì đạt; gài lại
// đường ảnh gốc vào bản chép thì đỏ đúng dòng. Không đụng cây thật.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { appendFileSync, cpSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const TEP = [
  "app/src/app/ops/deals/page.tsx",
  "app/src/app/ops/deals/[offerId]/page.tsx",
  "app/src/components/ops/deal-body.tsx",
  "app/src/components/ops/deals-grid.tsx",
  "app/src/components/ops/deal-sheet.tsx",
  "app/src/components/ops/deal-similar.tsx",
  "app/src/components/ops/deals-cells.tsx",
];
const chay = (tam) => spawnSync(process.execPath, [path.join(ROOT, "scripts/check-portal-compliance.mjs"), "--only", "deals-gate", "--root", tam], { encoding: "utf8" });

test("deals-gate đạt trên bản lành, đỏ khi gài dealMediaSrc hay ?path=", () => {
  const tam = mkdtempSync(path.join(tmpdir(), "cgt-quet-"));
  try {
    for (const p of TEP) cpSync(path.join(ROOT, p), path.join(tam, p), { recursive: true });
    assert.equal(chay(tam).status, 0, "bản chép lành phải đạt");
    for (const gai of ["dealMediaSrc(d)", 'zalo("?path=" + d)']) {
      const dich = path.join(tam, TEP[3]);
      cpSync(path.join(ROOT, TEP[3]), dich);
      appendFileSync(dich, `\nexport const gai = ${gai}\n`);
      const r = chay(tam);
      assert.equal(r.status, 1, `gài ${gai} phải đỏ`);
      assert.match(r.stdout, /FAIL ops\/deals: ảnh chỉ qua khoá/);
    }
  } finally {
    rmSync(tam, { recursive: true, force: true });
  }
});
