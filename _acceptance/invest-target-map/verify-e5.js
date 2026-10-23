// E5: mở bảng quyết định, đếm hàng route / ứng viên / ảnh hỏng (cần playwright-core của collector/)
const { createRequire } = require("node:module");
const req = createRequire(require("node:path").resolve(__dirname, "../../collector/package.json"));
let pw;
try { pw = req("playwright-core"); } catch { pw = createRequire("/Users/manhphan/dev/onehub-invest/collector/package.json")("playwright-core"); }
(async () => {
  const b = await pw.chromium.launch({ headless: true, executablePath: process.env.CHROME_EXE });
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  await p.goto("file://" + process.argv[2], { waitUntil: "networkidle" });
  await p.evaluate(() => { for (const i of document.images) i.loading = "eager"; window.scrollTo(0, document.body.scrollHeight); });
  await p.waitForTimeout(4000);
  const r = await p.evaluate(() => {
    const rows = [...document.querySelectorAll("article.row")];
    return {
      imgs: document.images.length,
      broken: [...document.images].filter((i) => !i.complete || i.naturalWidth === 0).length,
      rows: rows.length,
      badRows: rows.filter((a) => a.querySelectorAll(".now img").length !== 1 || a.querySelectorAll(".cand").length !== 3 || a.querySelectorAll('.cand a[href*="reui.io/preview"]').length < 3).length,
    };
  });
  console.log(`imgs ${r.imgs} broken ${r.broken} rows ${r.rows} badRows ${r.badRows}`);
  await b.close();
  process.exit(r.broken === 0 && r.rows === 13 && r.badRows === 0 ? 0 : 1);
})();
