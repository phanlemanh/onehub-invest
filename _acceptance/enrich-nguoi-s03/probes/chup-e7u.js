// chup-e7u.js — enrich-nguoi-s03 E7u: chụp ô liên hệ của một tin S03 nhận số qua người đăng, trên dev server chạy DB thử.
// Dùng: node _acceptance/enrich-nguoi-s03/probes/chup-e7u.js <offer_id> <thư mục ảnh> <tệp nhật ký mạng> [base_url]
// Che số trước mỗi lần chụp (style của evals.yaml); in ra số đếm nút và nhãn, không in số điện thoại. Chrome headless của máy,
// playwright-core mượn của checkout chính (worktree không có node_modules của collector).
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const goc = path.resolve(execFileSync('git', ['rev-parse', '--git-common-dir'], { encoding: 'utf8' }).trim(), '..');
const { chromium } = require(require.resolve('playwright-core', { paths: [path.join(process.cwd(), 'collector'), path.join(goc, 'collector')] }));
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const [,, offerId, outDir, netFile, base = 'http://localhost:3463'] = process.argv;
if (!offerId || !outDir || !netFile) { console.error('dùng: chup-e7u.js <offer_id> <thư mục ảnh> <tệp mạng> [base_url]'); process.exit(2); }
const MASK = 'a[href^="tel:"] span{color:transparent!important;background:var(--muted)}';
const PHONE = /(\+84|\b0)\d{9}\b|\b0\d{3} \d{3} \d{3,4}\b/;

(async () => {
  const b = await chromium.launch({ ...(fs.existsSync(CHROME) ? { executablePath: CHROME } : {}), headless: true });
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  const net = [];
  p.on('requestfinished', async (r) => {
    const t = r.resourceType();
    if (t === 'fetch' || t === 'xhr' || t === 'document') { const res = await r.response(); net.push(`${t} ${res ? res.status() : '?'} ${new URL(r.url()).pathname}`); }
  });
  p.on('requestfailed', (r) => net.push(`FAILED ${r.resourceType()} ${new URL(r.url()).pathname} ${r.failure()?.errorText}`));
  p.on('console', (m) => { if (m.type() === 'error') net.push('console.error ' + m.text().slice(0, 200).replace(PHONE, '<số>')); });
  const mask = () => p.addStyleTag({ content: MASK });
  await p.goto(`${base}/listing/${offerId}`, { waitUntil: 'networkidle', timeout: 180000 });
  await mask();
  console.log('so-trong-trang-truoc-khi-bam:', PHONE.test(await p.innerText('body')));
  const xem = p.getByRole('button', { name: 'Xem số' });
  const nhanSo = p.getByRole('button', { name: 'Số chưa xác minh: xem giải thích' });
  const nhanTin = p.getByRole('button', { name: 'Tin chưa xác minh: xem giải thích' });
  console.log('nut-xem-so', await xem.count(), 'nhan-so', await nhanSo.count(), 'nhan-tin', await nhanTin.count());
  await xem.first().scrollIntoViewIfNeeded();
  await p.screenshot({ path: path.join(outDir, 'E7u-truoc.png') });
  await xem.first().click();
  await p.locator('a[href^="tel:"]').first().waitFor({ timeout: 30000 });
  await mask();
  console.log('link-goi', await p.locator('a[href^="tel:"]').count(), 'nhan-so-sau-khi-bam', await nhanSo.count());
  await p.screenshot({ path: path.join(outDir, 'E7u-sau.png') });
  await nhanTin.first().scrollIntoViewIfNeeded();
  await p.screenshot({ path: path.join(outDir, 'E7u-hai-nhan.png'), fullPage: true });
  await nhanSo.first().hover();
  await p.getByText('Số chưa xác minh', { exact: true }).waitFor({ timeout: 10000 });
  await p.waitForTimeout(400);
  await mask();
  console.log('popover-so-noi-tin-hoac-bai:', (await p.locator('[data-slot="popover-content"], [role="dialog"]').allInnerTexts()).join(' ').includes('tin hoặc bài khác'));
  await p.screenshot({ path: path.join(outDir, 'E7u-giai-thich.png') });
  await p.mouse.move(5, 5);
  await p.waitForTimeout(600);
  await nhanTin.first().hover();
  await p.getByText('Tin chưa xác minh', { exact: true }).waitFor({ timeout: 10000 });
  await p.waitForTimeout(400);
  console.log('popover-tin-noi-nhom-cong-dong:', (await p.locator('[data-slot="popover-content"], [role="dialog"]').allInnerTexts()).join(' ').includes('nhóm cộng đồng'));
  await p.screenshot({ path: path.join(outDir, 'E7u-giai-thich-tin.png') });
  fs.writeFileSync(netFile, net.join('\n') + '\n');
  await b.close();
})().catch((e) => { console.error('LOI', e.message); process.exit(1); });
