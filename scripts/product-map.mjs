#!/usr/bin/env node
// product-map.mjs — bản đồ sản phẩm SINH từ hồ sơ xưởng (_acceptance/*/ +
// .out-of-scope/). View, không phải kho: regenerate = hết trôi.
//
// Bucket cố ý THÔ — approved/implemented/verified gộp MỘT nhãn — để bản đồ
// đứng yên giữa hai lần đóng cổng người. Nếu bucket bám sát từng status thì
// mỗi bước máy chạy xong lại làm `--check` đỏ giữa vòng, và cái đỏ-oan đó dạy
// người ta bỏ qua màu đỏ. Bản đồ đổi ở đúng chỗ người ký.
//
// Reader duy nhất là frontmatterField của lib/evidence-core.cjs: không parser
// fence thứ hai (tiền lệ start-command S4-r1 — parser riêng chặt hơn reader
// chuẩn thì báo hỏng oan những hồ sơ mọi cổng khác đọc được).
import { readFileSync, readdirSync, existsSync, writeFileSync, realpathSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const { frontmatterField } = require(path.join(__dirname, '..', 'lib', 'evidence-core.cjs'));
// Luật "hồ sơ này có hỏng không" sống một chỗ và được CẢ bộ quét vào phiên
// dùng chung — xem lib/workspace-record.cjs để biết vì sao (S4-r1: hai bên đọc
// cùng hồ sơ cho hai kết luận trái nhau).
const { recordProblem, navValues, consumedTexts, usesUat, usesOpportunity, usesEvidence,
        missingArtifact, readRecord, ioReason, configList, NAV_RULES, mapState, MAP_LABELS,
        mapTracked, DA_THONG_CONG_2, conflictProblem, hoSoNghi, DA_DONG_THUC_TE } =
  require(path.join(__dirname, '..', 'lib', 'workspace-record.cjs'));

export { NAV_RULES };
// Ô của bản đồ suy qua PHÉP CHIẾU nhiều-về-một của bảng chữ chung — cùng nguồn
// với máy quét và thẻ cổng. Bản đồ vẫn KHÔNG mang vị từ: chiếu chỉ đổi ĐƯỜNG ĐI
// TỚI ô, không đổi TÊN ô (hồ sơ start-bang-dieu-khien, AC-7).
const { BUCKET_OF, chu } = require(path.join(__dirname, 'trang-thai-ho-so.cjs'));
const NGUONG = require(path.join(__dirname, '..', 'lib', 'nguong-o-co-hoi.cjs'));
const { khoaTuConfig: khoaLoTrinh } = require(path.join(__dirname, 'lo-trinh-khoa.cjs'));
// Cửa tín hiệu (hồ sơ cua-tin-hieu-gom-nhom): bộ đọc khoá nạp KHOAN DUNG — kho không khai `tin_hieu`
// không phải chép thêm tệp nào (luật 26/09); kho khai mà thiếu tệp thì bước bản đồ đỏ to ở dưới.
let khoaTinHieu = null;
try { ({ khoaTinHieu } = require(path.join(__dirname, 'tin-hieu-khoa.cjs'))); } catch (e) { if (e.code !== 'MODULE_NOT_FOUND') throw e; }
import { khongCanNguoi } from './khong-can-nguoi.mjs';
const OPP_TPL_MAP = path.join(__dirname, '..', 'skills', 'acceptance', 'references', 'opportunity-template.md');
let _oppTpl = null;
// FAIL-CLOSED có TÊN, như hai bộ đọc anh em (start-scan `bail(...)`, gate-card cờ đỏ kèm
// đường sửa): khuôn vắng/không đọc được thì CHẾT TO kèm tên khuôn + đường sửa, KHÔNG phải
// stack trace Node. Repo tiêu thụ chép `scripts/` + `lib/` mà chưa mang `skills/.../
// opportunity-template.md` sẽ gặp đúng cửa này — thông điệp phải nói được phải làm gì,
// vì trước bản này bản đồ không đọc khuôn lần nào (S4-r8 [0]).
const oppTplText = () => {
  if (_oppTpl != null) return _oppTpl;
  try { return (_oppTpl = readFileSync(OPP_TPL_MAP, 'utf8')); }
  catch (e) {
    process.stderr.write(`product-map: khuôn opportunity-template không đọc được: ${OPP_TPL_MAP} (${e.code || e.message})\n`
      + '  Bản đồ cần khuôn này để phân loại ô ngưỡng của hồ sơ đã thông Cổng Bằng chứng.\n'
      + '  Sửa: mang skills/acceptance/references/opportunity-template.md sang cạnh scripts/ và lib/, rồi chạy lại.\n');
    process.exit(2);
  }
};

// `thresholdState` NÉM khi khuôn mất khối marker hoặc mất section Ngưỡng — và thông điệp
// của nó KHÔNG mang tên khuôn. Ném trần ở đây cho stack trace Node và EXIT 1, mà exit 1
// đúng là mã `--check` dùng cho «bản đồ lệch với hồ sơ xưởng»: một khuôn hỏng ở repo tiêu
// thụ sẽ hiện ra ở CI như bản đồ lệch. ADR 0007 lấy `--check` làm cổng độc lập DUY NHẤT
// biện minh cho miễn trừ t1 của bản đồ, nên cổng đó KHÔNG được lẫn lỗi hạ tầng với lỗi vật
// (S4-r11 [0]). Cùng khuôn với oppTplText() ngay trên: chết to, có tên, exit 2.
const thresholdStateOrDie = oTxt => {
  try { return NGUONG.thresholdState(oTxt, oppTplText()); }
  catch (e) {
    process.stderr.write(`product-map: ${e.message}: ${OPP_TPL_MAP}\n`
      + '  Bản đồ cần khuôn này để phân loại ô ngưỡng của hồ sơ đã thông Cổng Bằng chứng.\n'
      + '  Sửa: khôi phục khối marker / section Ngưỡng trong khuôn, rồi chạy lại.\n');
    process.exit(2);
  }
};

// Tên ô nói VIỆC ĐANG Ở ĐÂU, không gọi tên cơ chế máy (N1). Thứ tự cố định —
// nó cũng là thứ tự các chặng trong hình.
export const SECTIONS = [
  ['can-nhac', 'Đang cân nhắc cơ hội'],
  ['sap-mo', 'Sắp mở vòng'],
  ['cho-duyet', 'Chờ duyệt phạm vi'],
  ['dang-dung', 'Đang làm'],
  ['cho-nghiem-thu', 'Đã giao — chờ phiên nghiệm thu'],
  ['da-ship', 'Đã giao'],
  ['da-nghiem-thu', 'Đã nghiệm thu giá trị'],
  ['xep-lai', 'Xếp lại sau'],
  ['da-bac', 'Đã bác từ khám phá'],
  ['ngoai-pham-vi', 'Ngoài phạm vi đã ký'],
  ['hong', 'Hồ sơ hỏng'],
];

// HÌNH dẫn đầu, chữ là chú thích (N5). Bản đồ là điểm quyết định — người ta
// đọc nó lúc chọn việc tiếp theo — và nó có 3+ chặng nối tiếp cùng 2 nhánh rẽ,
// tức vượt ngưỡng bắt buộc kèm sơ đồ. Mặt phẳng ở đây là tài liệu trong kho,
// nên cách vẽ đúng theo bảng tra DECISION-DIAGRAM-SURFACES là khối mermaid.
const dem = n => (n === 0 ? 'chưa có' : `${n} việc`);
function mermaidBlock(count) {
  const n = key => dem(count[key] || 0);
  const lines = [
    '```mermaid',
    'flowchart TD',
    `  A["Đang cân nhắc cơ hội<br/>${n('can-nhac')}"] --> GD{"Cổng Đáng"}`,
    `  GD --> B["Sắp mở vòng<br/>${n('sap-mo')}"]`,
    `  GD --> XL["Xếp lại sau<br/>${n('xep-lai')}"]`,
    `  GD --> DB["Đã bác từ khám phá<br/>${n('da-bac')}"]`,
    `  B --> CD["Chờ duyệt phạm vi<br/>${n('cho-duyet')}"] --> GP{"Cổng Phạm vi"}`,
    `  GP --> DL["Đang làm<br/>${n('dang-dung')}"] --> GB{"Cổng Bằng chứng"}`,
    `  GB --> DG["Đã giao<br/>${n('da-ship')}"]`,
    `  GB --> CN["Chờ phiên nghiệm thu<br/>${n('cho-nghiem-thu')}"] --> GG{"Cổng Giá trị"}`,
    `  GG --> NT["Đã nghiệm thu giá trị<br/>${n('da-nghiem-thu')}"]`,
  ];
  // Ô hỏng KHÔNG nằm trong mạch — nó là cờ. Chỉ hiện khi có, và hiện thì phải
  // đập vào mắt chứ không nấp cuối danh sách.
  if (count.hong) lines.push(`  HS["Hồ sơ hỏng<br/>${dem(count.hong)}"]`);
  lines.push('```');
  // Nhãn cổng đứng MỘT MÌNH trong hình là chữ người đọc lần đầu không suy ra
  // được — "Đáng" nghĩa là gì? Mỗi cổng nói CÂU HỎI nó hỏi, ngay dưới hình
  // (luật N6 + bảng tên cổng trong CONTEXT.md). Thẻ /start đã giải nghĩa bốn mã
  // này ngay lần đầu hiện; bản đồ là mặt người thứ hai nên cũng phải tự đủ.
  lines.push('',
    '> **Bốn cổng người** — mỗi cổng là một câu hỏi chỉ người trả lời được:',
    '> **Cổng Đáng** việc này có đáng làm không · **Cổng Phạm vi** bộ tiêu chí',
    '> đã đủ và đúng chưa · **Cổng Bằng chứng** đã làm đúng thứ đã hứa chưa ·',
    '> **Cổng Giá trị** thứ đã giao có ăn thua không.');
  return lines;
}
const UAT_KET_CUC = {
  release: 'giao rộng (release)',
  iterate: 'lặp thêm (iterate)',
  kill: 'dừng (kill)',
};

// Doc file KHONG phai ho so workspace (chinh PRODUCT-MAP.md khi so noi dung,
// va cac de xuat trong .out-of-scope/). Ho so workspace di qua readRecord cua
// luat chung — phan biet ENOENT voi loi khac, khong nuot chung mot ro.
const readPlain = p => { try { return readFileSync(p, 'utf8'); } catch { return null; } };
const fm = (txt, key) => (txt == null ? null : frontmatterField(txt, key));
const low = v => (v == null ? null : v.toLowerCase());

// Cạnh chỉ hiện khi hồ sơ THẬT có khai — vắng thì im, không placeholder.
// (Write-side `epic:` thuộc vòng khám phá; đây chỉ là bên đọc.)
function edges(cTxt, oTxt) {
  const pick = k => fm(cTxt, k) || fm(oTxt, k) || '';
  const out = [];
  const epic = pick('epic'); if (epic) out.push(`epic: ${epic}`);
  const sup = pick('supersedes'); if (sup) out.push(`thay thế: ${sup}`);
  const rel = pick('relates'); if (rel) out.push(`liên quan: ${rel}`);
  return out.length ? ' · ' + out.join(' · ') : '';
}

// Nhãn «đỏ sẵn trên nền» (hồ sơ ho-so-da-ky-giu-tuoi): hỏi lib/do-san-tren-nen.cjs#nhanHoSo — cùng hàm thẻ hỏi,
// nó gọi CHÍNH checkRepinEvals của lưới trước-gộp và kiểm lại. Chỉ khi nhãn đạt (khoá bật, mọi vế khớp) dòng
// bản đồ mới kèm chữ nhãn, rút từ bảng chung NHAN. Hồ sơ không có dòng ghim mang `do_san` → dòng như cũ.
// Nạp KHOAN DUNG: kho chép scripts/ + lib/ đời trước chưa có tệp luật thì bản đồ vẽ như cũ, không vỡ.
let _ds;
const dsLib = () => {
  if (_ds !== undefined) return _ds;
  try { _ds = require(path.join(__dirname, '..', 'lib', 'do-san-tren-nen.cjs')); }
  catch (e) { if (e.code !== 'MODULE_NOT_FOUND') throw e; _ds = null; }
  return _ds;
};
export function classify(dir, slug) {
  const it = classifyO(dir, slug);
  if (it.key === 'hong' || !dsLib() || typeof dsLib().nhanHoSo !== 'function') return it;
  const n = dsLib().nhanHoSo(dir);
  if (!n) return it;
  const ds = `${require(path.join(__dirname, '..', 'lib', 'nhan-canh-gay.cjs')).NHAN.DO_SAN}: ${n.ids.join(', ')}`;
  return { ...it, note: it.note ? `${it.note} · ${ds}` : ds };
}

function classifyO(dir, slug) {
  // Đọc LƯỜI và phân biệt lỗi, đúng thứ tự bộ quét đi: mở file nào là câu hỏi
  // của luật chung. Đọc cả ba vô điều kiện thì (a) lỗi quyền ở một hồ sơ trạng
  // thái hiện tại không dùng lại quyết định ô của slug, và (b) `read` cũ nuốt
  // mọi lỗi thành "vắng" nên một contract.md mất quyền đọc bị xếp xuống đường
  // opportunity — bản đồ nói "Sắp mở vòng" trong khi bộ quét nói hỏng (S4-r14).
  const cR = readRecord(path.join(dir, 'contract.md'));
  if (cR.err) return { key: 'hong', slug, file: 'contract.md', reason: ioReason(cR.err) };
  const cTxt = cR.t;
  const uR = readRecord(path.join(dir, 'uat-session.md'));
  const oR = readRecord(path.join(dir, 'opportunity.md'));
  // Sổ quyết định — chỉ để hỏi vị từ NGHỈ; lỗi đọc KHÔNG quyết định ô của slug
  // (sổ không phải hồ sơ điều hướng), nên nuốt về null như mọi bộ đọc sổ.
  const ledgerTxt = readRecord(path.join(dir, 'decisions.jsonl')).t;
  // Báo cáo đọc KHÔNG điều kiện CHỈ để hỏi vị từ nghỉ: `usesEvidence` loại
  // `signed-off` khỏi tập tiêu thụ, mà hồ sơ đã ký lại đúng là hồ sơ duy nhất
  // được quyền nghỉ sau khi thu phạm vi — dùng `eR.t` ở đây là mù với ca chính.
  const nghiReport = readRecord(path.join(dir, 'evidence-report.md')).t;

  // HAI câu hỏi khác nhau, đừng trộn:
  //   PHÂN Ô — hồ sơ nào được quyền quyết định ô của slug, và lỗi của hồ sơ nào
  //     làm slug thành hỏng. Câu này do luật chung trả lời (consumedTexts), và
  //     lỗi ở hồ sơ KHÔNG được tiêu thụ thì không quyết định gì.
  //   HIỂN THỊ — tên việc và các cạnh (epic/thay thế/liên quan) lấy ở đâu. Câu
  //     này đọc CẢ BA, luôn luôn: `epic:` được khai lúc khám phá, tức nằm trong
  //     opportunity.md — mà opportunity chỉ được TIÊU THỤ khi chưa có hợp đồng
  //     hoặc đã ký. S4-r14 tôi gộp hai câu này làm một, nên suốt cả pha dựng
  //     (draft→verified) bản đồ mất tên việc lẫn mọi cạnh của hồ sơ khám phá
  //     (S4-r15 dựng lại được: `- Ban do gia tri (\`x\`) · epic: EP-1` thành
  //     `- \`x\``). Lỗi đọc ở hồ sơ không tiêu thụ chỉ làm mất phần hiển thị
  //     của nó, không làm hỏng slug.
  if (usesUat(cTxt) && uR.err)
    return { key: 'hong', slug, file: 'uat-session.md', reason: ioReason(uR.err) };
  if (usesOpportunity(cTxt, usesUat(cTxt) ? uR.t : null) && oR.err)
    return { key: 'hong', slug, file: 'opportunity.md', reason: ioReason(oR.err) };
  // evidence-report.md tiêu thụ theo LUẬT CHUNG (implemented/verified) — trước
  // đây bản đồ không đọc file này lần nào, nên mọi luật về nó sống riêng ở bộ
  // quét và hai bên trôi nhau đúng trục đó (AC-1 workspace-reader-unification).
  const eR = usesEvidence(cTxt) ? readRecord(path.join(dir, 'evidence-report.md')) : { t: null, err: null };
  if (usesEvidence(cTxt) && eR.err)
    return { key: 'hong', slug, file: 'evidence-report.md', reason: ioReason(eR.err) };
  const uTxt = uR.t, oTxt = oR.t;
  // `feature:` hay mở đầu bằng chính slug ("<slug> — mô tả"); dòng bản đồ đã
  // in slug rồi nên để nguyên là đọc thành tiếng máy vọng lại hai lần.
  const rawName = fm(cTxt, 'feature') || fm(oTxt, 'feature') || fm(uTxt, 'feature') || slug;
  const name = rawName.startsWith(slug + ' — ') ? rawName.slice(slug.length + 3) : rawName;
  const edge = edges(cTxt, oTxt);
  // uat-session.md CHỈ được TIÊU THỤ khi hợp đồng đã ký — một phiên nghiệm thu
  // nằm cạnh hợp đồng còn draft là hồ sơ chưa tới lượt, lỗi của nó không được
  // quyết định ô của slug. Doctrine này của start-scan-hardening (học qua 4
  // round), và bộ quét vào phiên áp cùng luật — hai bên đọc phải tiêu thụ CÙNG
  // tập hồ sơ thì mới có nghĩa khi so kết luận (case P123).
  // ĐIỀU KIỆN TIÊU THỤ do LUẬT CHUNG trả lời — chép lại điều kiện ở đây là
  // đúng cách hai reader trôi khỏi nhau suốt r12/r13 dù bảng enum đã gom.
  const texts = consumedTexts({ contract: cTxt, opportunity: oTxt, uat: uTxt, evidence: eR.t });

  // Lượt 1 — luật chung: hồ sơ đọc được không? (file có mà frontmatter hỏng,
  // field bắt buộc rỗng, giá trị ngoài enum — tất cả là hỏng, không cái nào
  // được rơi vào khoảng trống rồi hiện ở một ô bình thường.) Kèm luật
  // khai-xong-mà-thiếu-file: verified mà vắng evidence-report là hỏng.
  const problem = recordProblem(texts) || missingArtifact(texts) || conflictProblem(texts);
  if (problem) return { key: 'hong', slug, file: problem.file, reason: problem.reason };

  // Lượt 2 — xếp ô, tra từ artifact muộn nhất về sớm nhất.
  const { status, stage, decision, verdict } = navValues(texts);
  if (verdict) return { key: 'da-nghiem-thu', slug, name, edge, note: UAT_KET_CUC[verdict] };

  // Khoá trạng thái trước, ô bản đồ suy từ nó qua BUCKET_OF — thay vì tự map
  // status sang ô. Bucket vẫn THÔ như cũ (approved/implemented/verified gộp một
  // nhãn) vì phép chiếu gom chúng lại, nên bản đồ vẫn đứng yên giữa hai lần
  // đóng cổng người và `--check` không đỏ oan giữa vòng.
  const o = k => ({ key: BUCKET_OF[k], slug, name, edge });
  // Hồ sơ NGHỈ — HỎI cùng vị từ với bộ quét (lib/workspace-record.cjs). Bản đồ
  // tự suy ô từ status là bộ đọc thứ hai của cùng một sự thật, và nó đã trôi:
  // hợp đồng chưa thông Cổng 2 mang dòng nghỉ thì bộ quét xếp «đã đóng có hồ sơ»
  // còn bản đồ xếp «đang làm» — hai NHÓM khác nhau cho cùng một hồ sơ (S4-r1 t3).
  // So ĐÚNG LOẠI như ba bộ đọc kia. Bản trước dùng giá trị trả về như đúng/sai,
  // mà vị từ còn trả `dong-so-thieu` và `chua-ky` — hai hình dạng KHÔNG phải
  // nghỉ — nên một dòng viết thiếu vẫn được bản đồ xếp vào ô nghỉ (lượt chấm 2).
  if (status && hoSoNghi({ ledgerText: ledgerTxt, reportText: nghiReport,
                           contractAtRoot: true, suLieuContract: false })?.kieu === 'dong-so') {
    const kNghi = DA_THONG_CONG_2.includes(status) ? 'da-nghi' : 'da-dong-ho-so';
    return { ...o(kNghi), note: chu(kNghi).nhan };
  }
  // Trạng thái thứ bảy (ADR 0020 Đ8): reality đã chấm — ô cuối, cùng khoá với bộ quét.
  if (status && DA_DONG_THUC_TE && DA_DONG_THUC_TE.includes(status)) return { ...o('da-cham-thuc-te'), note: chu('da-cham-thuc-te').nhan };
  if (status) {
    if (DA_THONG_CONG_2.includes(status)) {
      // LỜI KHAI PHẢI CÓ VẬT — hỏi TRƯỚC mọi nhánh rẽ, đúng vị trí start-scan đặt nó
      // (scripts/start-scan.mjs, ngay sau khối DA_THONG_CONG_2). Đặt chốt này BÊN TRONG
      // nhánh `status === 'machine-cleared'` ở cuối là vô dụng: hồ sơ đường A thoát ra ở
      // `if (duongA) return …` TRƯỚC đó, nên bản đồ lại tin thẳng frontmatter trong khi bộ
      // quét gọi HỎNG — đúng lớp lỗi vừa định giết, chỉ đổi chỗ (S4-r12 [0][1]).
      if (status === 'machine-cleared' && !khongCanNguoi(cTxt, texts['evidence-report.md'] || '',
          { findings: readRecord(path.join(dir, 'review-findings.md')).t ?? null, ledger: ledgerTxt ?? null, runLog: readRecord(path.join(dir, 'run-log.jsonl')).t ?? null })) {
        return { key: 'hong', slug, file: 'evidence-report.md', reason: 'status machine-cleared nhưng bằng chứng KHÔNG đạt sáu điều kiện xanh-sạch — hồ sơ tự khai «máy đã thông» mà không có vật' };
      }
      // Đường A (cơ hội quyết build/iterate) còn một cổng người nữa: phiên
      // nghiệm thu. Đường B/C/E ship thẳng — không dựng phiên giả cho chúng.
      const duongA = decision === 'build' || decision === 'iterate';
      // Ô ngưỡng khai «không đo được» thì vòng ĐÓNG ngay tại đây: không có phiên nghiệm
      // thu để chờ. Nhánh này phải có Ở CẢ HAI bộ đọc — bộ quét có mà bản đồ không là hai
      // bên nói hai chuyện về cùng hồ sơ, đúng lớp lib/workspace-record.cjs dựng ra để giết
      // (finding S4-r2, đo trên chính hồ sơ duong-do). Luật hỏi LIB, không chép.
      // FAIL-CLOSED như hai bộ đọc anh em (start-scan bail, gate-card exit 2): khuôn hỏng
      // thì CHẾT TO kèm tên khuôn. Nuốt lỗi ở đây là bản đồ im lặng xếp sai ô trong khi
      // ba bộ đọc kia đỏ — hai bên nói hai chuyện, và `--check` mất luôn căn cứ miễn trừ
      // t1 của chính bản đồ (finding S4-r4).
      if (duongA && oTxt) {
        const ngBD = thresholdStateOrDie(oTxt);
        if (ngBD === 'khong-do-duoc') return { ...o('da-giao-khong-do'), note: chu('da-giao-khong-do').nhan };
      }
      if (duongA) return o('cho-cong-gia-tri');
      // Ô kết của làn V có TÊN RIÊNG — bản đồ vẫn gom theo giai đoạn (cùng ô «Đã
      // giao»), nhưng chữ đi kèm phải phân biệt máy-thông với hồ sơ người ký.
      if (status === 'machine-cleared') {
        const vMo = (frontmatterField(cTxt, 'veto_state') || '').trim().toLowerCase() === 'mo';
        const k = vMo ? 'da-giao-may-thong-veto-mo' : 'da-giao-may-thong-xanh-sach';
        return { ...o(k), note: chu(k).nhan };
      }
      return o('da-giao');
    }
    if (status === 'draft') return o('cho-cong-pham-vi');
    return o('dang-viet-code');
  }

  if (stage === 'archived') return { ...o('da-dong-ho-so'), note: chu('da-dong-ho-so').nhan };
  if (stage !== 'decided' || !decision) return o('y-can-nhac');
  if (decision === 'build' || decision === 'iterate') return o('sap-mo-vong');
  if (decision === 'park') return o('xep-lai');
  return o('da-bac');
}

export function renderProductMap(root) {
  const acc = path.join(root, '_acceptance');
  const buckets = Object.fromEntries(SECTIONS.map(([k]) => [k, []]));

  if (existsSync(acc)) {
    for (const entry of readdirSync(acc, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const item = classify(path.join(acc, entry.name), entry.name);
      buckets[item.key].push(item);
    }
  }

  const oos = path.join(root, '.out-of-scope');
  if (existsSync(oos)) {
    for (const f of readdirSync(oos)) {
      if (!f.endsWith('.md')) continue;
      const txt = readPlain(path.join(oos, f)) || '';
      const title = (txt.split('\n').find(l => l.startsWith('# ')) || '# ' + f).slice(2).trim();
      buckets['ngoai-pham-vi'].push({ slug: f.replace(/\.md$/, ''), name: title, file: f });
    }
  }

  // Không timestamp, sort theo slug: hai lần chạy phải cho hai bản giống hệt,
  // nếu không thì `--check` không so được bằng đẳng thức.
  const lines = [
    '# Bản đồ sản phẩm',
    '',
    '> Bản đồ vẽ lại từ hồ sơ của xưởng mỗi lần một người ký một cổng — đừng sửa tay.',
    '> (đọc từ thư mục `_acceptance/` và `.out-of-scope/`)',
  ];
  // Kho khai lộ trình: bản đồ trỏ sang trang lộ trình (hồ sơ lo-trinh-tren-du-lieu-that, khảo sát
  // mục 1). Kho không khai: không dòng nào — bản đồ giữ từng byte.
  const coLoTrinh = khoaLoTrinh(readPlain(path.join(root, '_acceptance', 'config.yaml')) || '') != null;
  if (coLoTrinh) lines.push('> Lộ trình: [LO-TRINH.html](LO-TRINH.html)');
  lines.push('', ...mermaidBlock(Object.fromEntries(SECTIONS.map(([k]) => [k, buckets[k].length]))), '');
  for (const [key, title] of SECTIONS) {
    const items = buckets[key].sort((a, b) => a.slug.localeCompare(b.slug));
    if (!items.length) continue;
    lines.push(`## ${title}`, '');
    for (const it of items) {
      // Tên việc đứng trước, slug xuống cuối dòng trong ngoặc: mã là thứ để
      // TRA CỨU, không phải nội dung (N3). Không in đậm — tên việc thừa hưởng
      // từ hồ sơ có thể dài cả câu, bôi đậm cả câu thì dòng nặng và hết quét
      // được. Hình ở đầu file mới là thứ dẫn mắt.
      if (key === 'hong') lines.push(`- \`${it.slug}\` — không đọc được hồ sơ (\`${it.file}\`): ${it.reason}`);
      else if (key === 'ngoai-pham-vi') lines.push(`- ${it.name} (\`.out-of-scope/${it.file}\`)`);
      else if (it.name === it.slug) lines.push(`- \`${it.slug}\`${it.note ? ` — ${it.note}` : ''}${it.edge}`);
      else lines.push(`- ${it.name} (\`${it.slug}\`)${it.note ? ` — ${it.note}` : ''}${it.edge}`);
    }
    lines.push('');
  }
  return lines.join('\n');
}

// ─── CLI ───
// So bằng realpath, KHÔNG bằng path.resolve: loader ESM đã giải symlink cho
// import.meta.url trong khi argv[1] giữ nguyên đường người gõ. Repo nằm dưới
// một symlink (/tmp, /var/folders trên macOS, home mount…) thì hai chuỗi khác
// nhau, khối CLI im lặng không chạy, và `--check` exit 0 mà chẳng kiểm gì —
// đúng dạng false-green. Case P119 chạy trong bản sao dưới /var/folders bắt
// được điều này.
// Trang lộ trình (hồ sơ viec-ke-theo-plan) — MỘT hàm vẽ cho bản đồ và cho bước khởi tạo lộ trình (hồ sơ
// kho-moi-cai-goi-road-map): kho không khai khoá → `{ trang: null }` và mô-đun lộ trình không được nạp (AC-1 của
// viec-ke-theo-plan: kho chép thiếu tệp vẫn vẽ được bản đồ). Lỗi của TỆP Ý ĐỊNH không làm hàm hỏng: trang tự nói lý do.
// `loi` = kho khai tin_hieu mà thiếu bộ đọc khoá — người gọi in câu và thoát 1.
// Một đường trong kho có được `risk_tiers.t1_skip_globs` phủ không — khớp bằng ĐÚNG hai hàm glob của lưới trước-merge, gọi
// qua bash: kit giữ MỘT bộ khớp glob. `{ biet:false, ly }` khi không gọi được (không đỏ — người gọi nói ra một dòng).
// Dùng chung cho `--check` và bước khởi tạo lộ trình (hồ sơ kho-moi-cai-goi-road-map).
export function mienTru(root, duong) {
  const pm = path.join(__dirname, 'pre-merge-check.sh');
  if (!existsSync(pm)) return { biet: false, ly: 'không thấy scripts/pre-merge-check.sh' };
  const globs = configList(readPlain(path.join(root, '_acceptance', 'config.yaml')) || '', 't1_skip_globs').join('\n');
  const lenh = `eval "$(sed -n '/^glob_variants() {/,/^}/p;/^match_globs() {/,/^}/p' "$1")"; match_globs "$3" "$2"`;
  try {
    execFileSync('bash', ['-c', lenh, 'mien-tru', pm, globs, duong], { stdio: ['ignore', 'ignore', 'ignore'] });
    return { biet: true, phu: true };
  } catch (e) {
    if (e.status === 1) return { biet: true, phu: false };
    return { biet: false, ly: `bash không chạy được (${e.code || e.status})` };
  }
}

export async function veTrangLoTrinh(root) {
  const cfg = readPlain(path.join(root, '_acceptance', 'config.yaml')) || '';
  const tepLoTrinh = khoaLoTrinh(cfg);
  let trang = null; let LT = null;
  if (tepLoTrinh != null) {
    LT = await import('./lo-trinh.mjs');
    // Cửa tín hiệu (hồ sơ cua-tin-hieu-gom-nhom): mô-đun chỉ được nạp khi kho khai `tin_hieu` — kho không
    // khai thì trang giữ nguyên từng byte và mã cửa không chạy. Lỗi của mô-đun KHÔNG bị nuốt.
    let tinHieu = null;
    if (khoaTinHieu == null && /^tin_hieu:/m.test(cfg))
      return { loi: 'Kho khai tin_hieu nhưng thiếu scripts/tin-hieu-khoa.cjs — chép theo danh sách chép CI (GUIDE §5.3) hoặc gỡ khối tin_hieu.' };
    if (khoaTinHieu != null && khoaTinHieu(cfg) != null) {
      const TH = await import('./tin-hieu.mjs');
      // Trang là vật COMMIT: chỉ ý đã theo dõi trong cây đang vẽ (hồ sơ ve-lo-trinh-doc-tin-hieu-cua-cay) — bộ đọc
      // tương tác của cửa vẫn đọc hộp ý chung ở thư mục chính.
      tinHieu = TH.duongDi({ root, classify, sections: SECTIONS, chiTheoDoi: true });
    }
    trang = LT.veTrang({ root, classify, sections: SECTIONS, tinHieu });
  }
  return { trang, LT };
}

const isMain = (() => {
  if (!process.argv[1]) return false;
  const same = (a, b) => { try { return realpathSync(a) === realpathSync(b); } catch { return false; } };
  return same(process.argv[1], __filename) ||
    path.resolve(process.argv[1]) === path.resolve(__filename);
})();
if (isMain) {
  const args = process.argv.slice(2);
  // Chốt mode + thứ tự tham số, theo đúng khuôn kit đã dựng cho chính lớp lỗi
  // này (pre-merge-check v1.22.1): một lỗi gõ (`--chek`) không được biến lệnh
  // KIỂM thành lệnh GHI rồi báo thành công — nó xoá luôn cái drift vừa tiêm.
  // Và `--root` không có giá trị thì `--check` bị nuốt làm đường dẫn, script
  // soi một thư mục không tồn tại rồi exit 0 mà chẳng kiểm gì. ADR 0007 lấy
  // `--check` làm cổng độc lập DUY NHẤT biện minh cho miễn trừ t1 của bản đồ,
  // nên `--check` fail-open là cả miễn trừ mất căn cứ.
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--check') continue;
    if (args[i] === '--root') {
      const v = args[i + 1];
      if (!v || v.startsWith('--')) {
        console.error('product-map: `--root` cần một đường dẫn ngay sau nó — nhận được ' +
          (v ? `\`${v}\`` : '(trống)'));
        process.exit(2);
      }
      i++;
      continue;
    }
    console.error(`product-map: tham số lạ ${args[i]} — chỉ nhận \`--root <thư-mục>\` và \`--check\``);
    process.exit(2);
  }
  const rootIx = args.indexOf('--root');
  const root = path.resolve(rootIx >= 0 && args[rootIx + 1] ? args[rootIx + 1] : '.');
  const mapPath = path.join(root, 'PRODUCT-MAP.md');
  const check = args.includes('--check');
  // Gợi ý lệnh phải chạy được ở CHÍNH repo đang đỏ, nên suy từ vị trí script
  // thật: tự host → `scripts/product-map.mjs`; repo tiêu thụ → đường dẫn
  // plugin. Ghim một đường dẫn self-host vào đây là đưa consumer một lệnh
  // exit 127 ngay lúc họ cần nó nhất.
  const rel = path.relative(root, __filename);
  const hint = rel && !rel.startsWith('..') ? rel : __filename;

  // AC-5: đường dẫn sai phải CHẾT TO (exit 2), không rơi xuống "chưa dựng
  // cổng" rồi exit 0 — mode kiểm phân biệt "chưa init" với "gõ nhầm đường".
  if (!existsSync(root)) {
    console.error(`product-map: --root trỏ đường dẫn không tồn tại: ${root}`);
    process.exit(2);
  }
  if (!statSync(root).isDirectory()) {
    console.error(`product-map: --root trỏ vào thứ không phải thư mục: ${root}`);
    process.exit(2);
  }
  if (!existsSync(path.join(root, '_acceptance', 'config.yaml'))) {
    console.log('Repo chưa dựng cổng nghiệm thu — chưa có gì để vẽ bản đồ.');
    process.exit(0);
  }
  const rendered = renderProductMap(root);
  // Trang lộ trình (hồ sơ viec-ke-theo-plan): cùng lượt, cùng `--check` với bản đồ. Khoá đọc bằng
  // hàm chung TRƯỚC, mô-đun lộ trình chỉ được nạp khi kho khai ổ cắm — kho không khai thì mã lộ
  // trình không chạy (AC-1) và kho chép thiếu tệp vẫn vẽ được bản đồ. Lỗi của TỆP Ý ĐỊNH không làm
  // lệnh này thoát khác 0: trang tự nói lý do; chỉ trang vắng hoặc lệch mới làm `--check` đỏ.
  const pagePath = path.join(root, 'LO-TRINH.html');
  const vt = await veTrangLoTrinh(root);
  if (vt.loi) { console.error(vt.loi); process.exit(1); }
  const trang = vt.trang; const LT_ = vt.LT;
  if (!check) {
    writeFileSync(mapPath, rendered);
    console.log(mapPath);
    if (trang != null) { writeFileSync(pagePath, trang); console.log(pagePath); }
    process.exit(0);
  }
  // Kho khai lộ trình thì LO-TRINH.html phải được t1_skip_globs phủ — thiếu thì chính commit đóng cổng
  // làm bằng chứng cũ đi (cùng lý do ADR 0007). Khớp bằng ĐÚNG hai hàm glob của lưới trước-merge, gọi
  // qua bash: kit giữ MỘT bộ khớp glob. Không gọi được thì nói ra một dòng, không đỏ.
  const mienTruLoTrinh = () => mienTru(root, 'LO-TRINH.html');
  const ketThuc = code => {
    if (trang != null) {
      const mt = mienTruLoTrinh();
      if (!mt.biet) console.log(`Không kiểm được miễn trừ của LO-TRINH.html (${mt.ly}).`);
      else if (!mt.phu) {
        console.error('Kho khai lo_trinh.tep nhưng không glob nào trong risk_tiers.t1_skip_globs phủ LO-TRINH.html — thêm `- "LO-TRINH.html"` vào risk_tiers.t1_skip_globs của _acceptance/config.yaml (thiếu miễn trừ thì commit đóng cổng làm bằng chứng cũ đi).');
        code = Math.max(code, 1);
      }
      // Phép so do mô-đun lộ trình giữ (`trangKhop`, hàng X2: dải tóm tắt hồ sơ không làm trang «lệch»);
      // mô-đun đời trước không có hàm → so từng byte như cũ.
      const khop = (LT_ && typeof LT_.trangKhop === 'function') ? LT_.trangKhop : ((a, b) => a === b);
      if (existsSync(pagePath) && khop(readPlain(pagePath), trang)) console.log('LO-TRINH.html khớp tệp ý định và hồ sơ.');
      else {
        console.error(`LO-TRINH.html ${existsSync(pagePath) ? 'lệch với' : 'chưa có, trong khi kho khai'} tệp ý định và hồ sơ — chạy: node ${hint} --root .`);
        code = Math.max(code, 1);
      }
    }
    process.exit(code);
  };
  if (!existsSync(mapPath)) {
    // Phân biệt "repo CHƯA TỪNG dựng bản đồ" (đường đọc-cũ, hợp lệ) với "đã có
    // rồi MẤT". File được git theo dõi mà biến khỏi cây làm việc là một lần
    // XOÁ — và vì bản đồ nằm trong t1_skip_globs, một PR chỉ xoá nó vừa bỏ qua
    // cổng nghiệm thu vừa xanh ở CI nếu đây cũng exit 0. Một vật máy sinh biến
    // mất phải làm cổng ĐỎ, không phải làm cổng im.
    // Hỏi INDEX thôi là fail-OPEN ở đúng hình dạng CI gặp: một PR đã COMMIT
    // việc xoá thì `actions/checkout` ra cây không còn file trong index,
    // `ls-files` thất bại, và cổng in "repo chưa dựng bản đồ" rồi exit 0 —
    // tức PR xoá bản đồ vừa bỏ qua cổng nghiệm thu vừa xanh CI (S4-r14, dựng
    // lại được). Nên hỏi thêm LỊCH SỬ: file từng bị xoá trong quá khứ cũng là
    // "đã có rồi mất". Chỉ repo chưa từng có bản đồ mới đi đường đọc-cũ.
    // Ba tín hiệu (config daBat · git index · git history) nay sống MỘT chỗ
    // trong lib.mapTracked — bộ quét vào phiên hỏi cùng hàm đó, hết cảnh hai
    // bên suy tracked từ hai tín hiệu khác nhau (S4-r1 vòng này). Toàn bộ
    // rationale từng dòng tín hiệu ghi tại lib/workspace-record.cjs.
    const cfgTxt = (() => { try { return readFileSync(path.join(root, '_acceptance', 'config.yaml'), 'utf8'); } catch { return ''; } })();
    const daTheoDoi = mapTracked(root, cfgTxt);
    // Nhãn rút từ BẢNG NHÃN CHUNG (lib) — cùng chữ với thẻ /start (AC-3/AC-7).
    const state = mapState({ exists: false, tracked: daTheoDoi });
    if (state === 'da-xoa') {
      console.error(`${MAP_LABELS[state]} — khôi phục, hoặc vẽ lại: node ${hint} --root .`);
      ketThuc(1);
    }
    console.log(`${MAP_LABELS[state]} — PRODUCT-MAP.md chưa có; bật thì nó tự sinh ở lần đóng cổng người kế.`);
    ketThuc(0);
  }
  if (readPlain(mapPath) === rendered) {
    console.log('PRODUCT-MAP.md khớp hồ sơ xưởng.');
    ketThuc(0);
  }
  console.error(`PRODUCT-MAP.md lệch với hồ sơ xưởng — chạy: node ${hint} --root .`);
  ketThuc(1);
}
