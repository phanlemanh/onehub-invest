// node --test pipeline/scripts/refresh-bait-gap-goi.test.mjs
// Hồ sơ bait-gap-mot-giao-dich AC-8: phần bait gap chỉ có giao dịch + khoá chung khi đi qua buocDem. Quét mã nguồn ngoài
// thư mục test: mọi lời gọi refreshBaitGap( là trong buocDem của pipeline/refresh-bait-gap.mjs hoặc đứng sau một
// query("BEGIN") của cùng tệp (thước chạy trong giao dịch của mình, vd scripts/deals-phi-ly-do.mjs), và không lời gọi
// buocDem( nào ngoài test truyền savepoint (savepoint chỉ dành cho người gọi đã mở giao dịch — test, thước). Đối chứng
// dương: cây tạm có thêm một tệp gọi thẳng refreshBaitGap ngoài giao dịch → quét gọi tên tệp ấy.
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, realpathSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const GOC = ["pipeline", "scripts", "agent/src", "agent/scripts"];
const BO_THU_MUC = new Set(["node_modules", "logs", "tests", "test", "__tests__", ".git"]);
const DUOI = /\.(mjs|js|cjs|ts|tsx)$/;
const LA_TEST = /\.(test|itest|spec)\.[a-z]+$/;

function duyet(root, rel, ra) {
  const day = path.join(root, rel);
  let ten;
  try { ten = readdirSync(day); } catch { return; }
  for (const t of ten) {
    if (BO_THU_MUC.has(t) || t.startsWith(".")) continue;
    const r = path.join(rel, t);
    // pipeline/scripts/ là thư mục thước và test của pipeline.
    if (r === path.join("pipeline", "scripts")) continue;
    const st = statSync(path.join(root, r));
    if (st.isDirectory()) duyet(root, r, ra);
    else if (DUOI.test(t) && !LA_TEST.test(t)) ra.push(r);
  }
}

/** Trả danh sách vi phạm (chuỗi gọi tên tệp:dòng); rỗng = đạt. */
export function quet(root) {
  const tep = [];
  for (const g of GOC) duyet(root, g, tep);
  const loi = [];
  let trongBuocDem = 0;
  for (const r of tep) {
    const dong = readFileSync(path.join(root, r), "utf8").split("\n");
    let hamHienTai = "";
    let daBegin = false;
    dong.forEach((l, i) => {
      if (/query\(\s*["'`]BEGIN/.test(l)) daBegin = true;
      const dn = l.match(/^(?:export\s+)?(?:async\s+)?function\s+(\w+)/);
      if (dn) hamHienTai = dn[1];
      if (/\brefreshBaitGap\(/.test(l) && !/function\s+refreshBaitGap\(/.test(l) && !/^\s*(\/\/|\*)/.test(l)) {
        if (r === path.join("pipeline", "refresh-bait-gap.mjs") && hamHienTai === "buocDem") trongBuocDem += 1;
        else if (!daBegin) loi.push(`${r}:${i + 1} gọi thẳng refreshBaitGap ngoài buocDem`);
      }
      if (/\bbuocDem\(/.test(l) && !/function\s+buocDem\(/.test(l) && !/^\s*(\/\/|\*)/.test(l) && /savepoint/.test(l)) {
        loi.push(`${r}:${i + 1} gọi buocDem với savepoint ngoài test`);
      }
    });
  }
  return { loi, trongBuocDem };
}

test("RB-AC-8 cây thật: refreshBaitGap chỉ gọi trong buocDem hay sau BEGIN, buocDem ngoài test không truyền savepoint", () => {
  const { loi, trongBuocDem } = quet(REPO);
  assert.deepEqual(loi, []);
  assert.equal(trongBuocDem, 1, "RB-AC-8 buocDem không còn gọi refreshBaitGap đúng một lần");
});

test("RB-AC-8 đối chứng dương: tệp gọi thẳng refreshBaitGap ngoài giao dịch bị gọi tên, tệp gọi sau BEGIN thì không", () => {
  const tam = mkdtempSync(path.join(realpathSync(tmpdir()), "rb-goi-"));
  try {
    mkdirSync(path.join(tam, "pipeline"), { recursive: true });
    writeFileSync(path.join(tam, "pipeline", "refresh-bait-gap.mjs"),
      readFileSync(path.join(REPO, "pipeline", "refresh-bait-gap.mjs"), "utf8"));
    writeFileSync(path.join(tam, "pipeline", "goi-sai.mjs"),
      'import { refreshBaitGap } from "./refresh-bait-gap.mjs";\nexport async function chay(c) {\n  await refreshBaitGap(c);\n}\n');
    writeFileSync(path.join(tam, "pipeline", "goi-dung.mjs"),
      'import { refreshBaitGap } from "./refresh-bait-gap.mjs";\nexport async function do(c) {\n  await c.query("BEGIN");\n  await refreshBaitGap(c);\n  await c.query("ROLLBACK");\n}\n');
    mkdirSync(path.join(tam, "scripts"));
    writeFileSync(path.join(tam, "scripts", "goi-sai-2.mjs"), "await buocDem(c, { savepoint: true });\n");
    const { loi } = quet(tam);
    assert.deepEqual(loi, [
      `${path.join("pipeline", "goi-sai.mjs")}:3 gọi thẳng refreshBaitGap ngoài buocDem`,
      `${path.join("scripts", "goi-sai-2.mjs")}:1 gọi buocDem với savepoint ngoài test`,
    ], "RB-AC-8 lời gọi ngoài giao dịch");
  } finally { rmSync(tam, { recursive: true, force: true }); }
});
