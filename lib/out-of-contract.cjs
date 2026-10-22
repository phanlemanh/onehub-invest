'use strict';
// Đọc kết quả scope-triage từ `review-findings.md` cho thẻ Cổng 2.
//
// Vì sao ở đây chứ không phải một key trong card-plain.json: thẻ chỉ render
// những gì SCRIPT đọc được từ artifact — cùng luật với gap-probe. Một key overlay
// do model tự điền là thứ có thể quên, điền sai, hoặc (như round 1 của chính
// feature này) được khai trong chỉ dẫn mà không renderer nào đọc, nên khối biến
// mất im lặng trong khi manifest vẫn quảng cáo là có.
//
// Nguồn: `_acceptance/<slug>/review-findings.md` do S4 sinh. Thiếu file, hoặc
// file thế hệ cũ không có heading nào → mọi trường rỗng: thẻ render như trước,
// không cờ, không lỗi.

const HEAD_OUT = /^##\s+Ngoài hợp đồng/;
const HEAD_UNCLASSIFIED = /^##\s+Chưa phân loại/;
const HEAD_ANY = /^##\s+/;
// Dòng cờ cụm do S4 ghi nguyên văn; ⚠ ở đầu là dấu phân biệt với dòng "n-a".
const CLUSTER_RE = /^⚠\s*Cụm ngoài vùng phủ:\s*(.+)$/;

// <<<OOC-PROPOSALS — MỘT nguồn của ba token đề xuất VÀ chữ người tương ứng.
// Thẻ in CHỮ NGƯỜI (thân lệnh signoff dạy đúng những chữ này, nên người dán
// lại dòng lệnh là chạy được); token máy chỉ sống trong artifact. Chuỗi ngoài
// danh sách KHÔNG bị ép về một token và KHÔNG bị nuốt — nó ở lại proposal_raw
// để thẻ kêu to (AC-6).
const PROPOSALS = ['known-limits', 'new-contract', 'wont-fix'];
const OOC_GLOSS_NGUOI = {
  'known-limits': 'ghi Known limits',
  'new-contract': 'mở hợp đồng mới',
  'wont-fix': 'chấp nhận, không sửa',
};
// OOC-PROPOSALS>>>
// Token so khớp theo TIỀN TỐ: S4 được phép viết «known-limits — vì …», đuôi
// chú thích giữ nguyên ở proposal_raw. Không so cả chuỗi (8/14 mục thật trong
// xưởng có đuôi — đo 02/09), cũng không so lỏng bằng includes (chuỗi «ghi
// Known limits» của người sẽ lọt).
const tokenOf = v => { const head = String(v).split(/\s*[—(:]/)[0].trim(); return PROPOSALS.includes(head) ? head : ''; };
// Mục có chữ mà 0 finding = NGỜ sai khuôn. KHÔNG tính: câu mở đầu chuẩn của S4,
// và lời khai rỗng hợp lệ («không có», «n-a», mở ngoặc) — hai dạng này có thật
// trong xưởng, coi chúng là ngờ thì cờ vàng thành nhiễu nền và tự vô hiệu.
// ĐẢO CHIỀU (S4-r1): bản đầu dùng ALLOWLIST các câu «lời khai rỗng» («không
// có» · «n-a») rồi đo độ dài — đó là danh sách trắng trên KHÔNG GIAN MỞ và nó
// thủng ngay: xưởng có ít nhất ba cách viết rỗng («(rỗng)», «(rỗng — …)»,
// «(none)»), hai cách thoát chỉ nhờ sàn ký tự chứ không nhờ luật, còn
// «(rỗng — mọi phát hiện đã đóng…)» thì bị gọi oan là sai khuôn.
// Nay đo TÍN HIỆU DƯƠNG của một mục ĐỊNH viết theo khuôn: khuôn
// OOC-ITEM-TEMPLATE bắt buộc tiêu đề in đậm, nên `**` trong thân mục là dấu
// «đã thử viết mục» — có `**` mà parse ra 0 finding = sai khuôn thật. Lời
// khai rỗng là văn xuôi thuần, không có `**`, nên không bao giờ bị gọi oan.
// ĐỔI KHUÔN (owner quyết 02/09, sau khi dừng-vá nổ ở S4-r2): bản trước LIỆT KÊ
// bốn tên trường của khuôn mục. Danh sách ấy là bản chép thứ hai của khuôn bên
// VIẾT nên nó trôi được — và chú giải còn khai một ca đối chiếu chưa từng tồn
// tại (S4-r2 bắt đúng chỗ đó).
//
// Nay hỏi HÌNH DẠNG, không hỏi tên: một mục viết theo khuôn OOC-ITEM-TEMPLATE
// luôn mang hoặc tiêu đề in đậm, hoặc ít nhất một dòng thân dạng «<thụt
// lề><khoá>: <giá trị>». Cả hai là thuộc tính của KHUÔN chứ không phải một
// danh sách từ vựng — đổi tên trường ở bên viết cũng không làm bên đọc mù, và
// không còn gì để hai bên trôi khỏi nhau. Lời khai rỗng («(rỗng — …)»,
// «(none)», «không có») viết PHẲNG thì không trúng cờ.
// GIỚI HẠN ĐÃ KHAI (S4-r3 bác lời khai «không bao giờ oan»): lời khai rỗng kèm
// một dòng THỤT LỀ mang dấu hai chấm («  Ghi chú: …», «  - Lý do: …», URL thụt
// lề) SẼ bị cờ oan. Đo 02/09 trên 63 review-findings thật: 0 ca. Khai để nó
// không im; đừng đổi vế này thành danh sách câu-rỗng — đó là allowlist trên
// không gian mở, chính lớp đã cháy ở bản đầu (sweep-baseline.txt).
const OOC_TRIED_ITEM_RE = /\*\*|^\s+\S[^:]*:\s*\S/;

// Dòng tiêu đề một mục: `- **<title>**`, hoặc mục MANG SANG từ lượt trước với nhãn `(rN…)`. Máy chèn
// nhãn TRONG hai dấu sao (`- **<title> (r1)**`); tác tử tổng hợp viết nó NGOÀI (`- **<title>** (r1)`) —
// crm 07–08/10 (kit 2.24.0): thẻ Cổng 2 giấu 14/15 mục vì bộ đọc chỉ nhận dạng thứ nhất. Hai dạng chuẩn
// hoá về MỘT tiêu đề `<title> (rN…)`. Chỉ nhận đúng nhãn lượt `(rN` / `(r?` (R hoa cũng được), đuôi tuỳ ý sau
// `·` `,` `—` `–` `-` — chữ tự do sau dấu sao vẫn KHÔNG là mục. GIỚI HẠN ĐÃ KHAI: nhãn mở bằng chữ khác (`(từ
// r1)`), hay có ngoặc lồng, vẫn rơi khỏi thẻ; cờ vàng chỉ bật khi KHÔNG mục nào đọc được. Ngưỡng mở lại: ≥1 thẻ
// Cổng 2 ở kho tiêu thụ thiếu mục vì một hình dạng nhãn ngoài bảng DG1.
// Cùng một khối với bộ chống trùng mục mang sang trong feature-loop/workflows/acceptance-verify.js — ca DG2
// (tests/workflows/doc-ghi-troi.test.mjs) đòi hai khối giống nhau từng ký tự.
// <<<OOC-TITLE-RE
const OOC_TITLE_RE = /^-\s+\*\*(.+?)\*\*(?:\s+(\([rR](?:\d+|\?)(?:\s*[·,—–-][^()]*)?\)))?\s*$/
// OOC-TITLE-RE>>>
const tieuDeMuc = m => m[1] + (m[2] ? ' ' + m[2] : '')

// Mỗi finding mở đầu bằng `- **<title>**`; các dòng `key: value` thụt vào sau đó
// thuộc về nó. Chỉ rút những trường thẻ cần — detail dài thuộc về gói text, không
// thuộc về thẻ quyết định.
function parseFindings(lines) {
  const out = [];
  let cur = null;
  for (const raw of lines) {
    const title = OOC_TITLE_RE.exec(raw);
    if (title) {
      if (cur) out.push(cur);
      cur = { title: tieuDeMuc(title), file: '', severity: '', proposal: '', proposal_raw: '', plain: '', can_cu: '' };
      continue;
    }
    if (!cur) continue;
    const kv = /^\s+(file|severity|Đề xuất|proposal|Người dùng thấy gì|Căn cứ)\s*:\s*(.+?)\s*$/.exec(raw);
    if (!kv) continue;
    const k = kv[1];
    // trim: dòng khuôn để trống sau dấu hai chấm («  Căn cứ: ») khớp biểu thức với giá trị là chính dấu cách —
    // không trim thì ô căn cứ thành « » chứ không phải rỗng (BN-2-rong).
    const v = kv[2].replace(/^`|`$/g, '').trim();
    if (k === 'file') cur.file = v;
    else if (k === 'severity') cur.severity = v;
    else if (k === 'Người dùng thấy gì') cur.plain = v;
    // Căn cứ (hồ sơ bang-ngoai-n-co-can-cu): MỘT câu vì sao đề xuất ấy, tác tử phân loại viết; thẻ in nó ở cột
    // «Căn cứ». Hồ sơ đời trước không có dòng này → chuỗi rỗng, thẻ in «chưa có căn cứ» + cờ vàng.
    else if (k === 'Căn cứ') cur.can_cu = v;
    else { cur.proposal_raw = v; cur.proposal = tokenOf(v); }
  }
  if (cur) out.push(cur);
  return out;
}

function sectionLines(lines, headRe) {
  const start = lines.findIndex(l => headRe.test(l));
  if (start < 0) return null;
  const rest = lines.slice(start + 1);
  const end = rest.findIndex(l => HEAD_ANY.test(l));
  return end < 0 ? rest : rest.slice(0, end);
}

// text = nội dung review-findings.md (chuỗi rỗng khi thiếu file).
// → { present, findings: [{title,file,severity,proposal,plain,can_cu}], unclassified, cluster }
//
// `plain` là câu ngôn ngữ sản phẩm do bước scope-triage viết — thẻ in CÁI ĐÓ.
// Title do reviewer viết là văn kỹ thuật ("globToRe leaves `?` unescaped…") và
// không bao giờ được đưa thẳng vào chỗ người quyết đọc.
function parse(text) {
  if (typeof text !== 'string' || !text.trim()) {
    return { present: false, findings: [], unclassified: false, cluster: null };
  }
  const lines = text.split(/\r?\n/);
  const outLines = sectionLines(lines, HEAD_OUT);
  const unclassified = lines.some(l => HEAD_UNCLASSIFIED.test(l));
  const clusterLine = lines.map(l => CLUSTER_RE.exec(l.trim())).find(Boolean);
  const findings = outLines ? parseFindings(outLines) : [];
  const triedItem = outLines ? outLines.some(l => OOC_TRIED_ITEM_RE.test(l)) : false;
  return {
    // present = file có mặt VÀ có ít nhất một heading của scope-triage. File thế
    // hệ cũ (chỉ liệt kê findings phẳng) cho false → nhánh backward.
    present: outLines !== null || unclassified,
    findings,
    unclassified,
    cluster: clusterLine ? clusterLine[1].trim() : null,
    // AC-5: mục có chữ mà bộ đọc ra 0 finding → NGỜ sai khuôn, thẻ phải kêu.
    // Trước bản này khối biến mất im lặng khỏi thẻ (vết thật: vòng 2.6.0, người
    // suýt ký mà không thấy khuyết tật nào dù nó nằm trong file).
    suspect_empty: outLines !== null && findings.length === 0 && triedItem,
  };
}


// ── Mục ngoài hợp đồng CHƯA NGƯỜI ĐỊNH TUYẾN (hồ sơ ho-so-khep-thoi-hoi AC-4; dinh-tuyen-theo-ma-muc) ───
// Làn V (máy đi trước, không chữ ký) chỉ sạch khi không còn mục ngoài hợp đồng nào CHƯA ai
// quyết. Nguồn căn cứ là sổ quyết định: một dòng `stage: gate2` gọi tên «Ngoài-N» (có dấu hay
// không, đơn lẻ hoặc khoảng «Ngoài-a đến/den Ngoài-b»). MỘT bộ phân giải (`ganDinhTuyen`), mọi bên
// đọc cùng gọi: luật xanh-sạch hai bản dựng (khong-can-nguoi.mjs, xanh_sach_check của
// pre-merge-check.sh), máy định tuyến (dinh-tuyen-may.cjs) và thẻ (gate-card.js).
//
// Khoá định tuyến là MÃ MỤC — tiêu đề gỡ nhãn lượt `(rN…)` + tệp — không phải vị trí: một lượt
// chấm sau chữ ký chèn mục mới lên đầu thì mọi mục cũ lùi một số, và dòng theo số trỏ nhầm mục
// (crm-onehub#375, hồ sơ them-buoc-bao-dung). Bên viết người ghi mã từ khối NGOAI-N-GATE2-LINE
// của commands/signoff.md; dòng máy (dinh-tuyen-may.cjs) đã mang `tieu_de` từ A3.
//   · Dòng có mã ghi SAU lượt chấm cuối: số phải trỏ một mục cùng mã, lệch thì dòng mồ côi.
//   · Dòng có mã ghi TRƯỚC một lượt chấm: chỉ khớp mục MANG NHÃN LƯỢT (mục được mang sang) cùng
//     mã — mục tươi cùng tiêu đề ở lượt sau không thừa kế quyết định cũ.
//   · Dòng chỉ số (đời trước) — đọc-cũ khoan dung: ghi sau lượt chấm cuối thì tin như trước; ghi
//     trước một lượt chấm thì không định tuyến gì, số của nó vào `soCu` (cờ vàng ở bên gọi).
// Mốc của dòng = giờ SỚM NHẤT đọc được giữa `at` và giờ máy trong mã `d-<UTC>-<n>` (DEC-ID-RECIPE):
// lệch nguy hiểm là mốc muộn hơn thật. «Lượt chấm» = dòng `kind: round-tally` của run-log.
// GIỚI HẠN ĐÃ KHAI (design dinh-tuyen-theo-ma-muc §5): run-log vắng hoặc không có round-tally →
// dòng chỉ số được tin theo số như trước.
const NHAN_RE = /Ngo[aà]i-(\d+)(?:\s*(?:đến|den|to|–|—|-)\s*Ngo[aà]i-(\d+))?/gi;
// Nhãn lượt mà bước mang-sang của S4 chèn vào tiêu đề mục («X (r1)», «X (r1 · tệp đã đổi)») — cùng
// hình dạng nhóm nhãn của OOC_TITLE_RE. Gỡ nhãn trước khi so: cùng mục ở lượt sau không phải mục đã đổi.
const NHAN_LUOT_RE = /\s+\([rR](?:\d+|\?)(?:\s*[·,—–-][^()]*)?\)\s*$/;
const tieuDeGoc = s => String(s == null ? '' : s).replace(NHAN_LUOT_RE, '').trim();
const coNhanLuot = s => NHAN_LUOT_RE.test(String(s == null ? '' : s));
const cungMuc = (a, b) => a != null && b != null && tieuDeGoc(a) === tieuDeGoc(b);
// Tệp so theo phần trước số dòng: lượt sửa đẩy «src/a.js:12» thành «src/a.js:14» mà mục vẫn là mục ấy.
const tepGoc = s => String(s == null ? '' : s).replace(/^`|`$/g, '').replace(/:\d+(?::\d+)?$/, '').trim();
const ID_GIO_RE = /^d-(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z-/;
function mocDong(e) {
  const t = [Date.parse(String(e.at || ''))];
  const m = ID_GIO_RE.exec(String(e.id || ''));
  if (m) t.push(Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]));
  const ok = t.filter(x => !Number.isNaN(x));
  return ok.length ? Math.min(...ok) : NaN;
}
function luotCham(runLogText) {
  const out = [];
  for (const l of String(runLogText || '').split('\n')) {
    let e; try { e = JSON.parse(l); } catch { continue; }
    if (e && e.kind === 'round-tally') { const t = Date.parse(String(e.ts || '')); if (!Number.isNaN(t)) out.push(t); }
  }
  return out;
}
const soCuaDong = d => {
  const out = [];
  for (const m of String(d || '').matchAll(NHAN_RE)) {
    const a = Number(m[1]), b = m[2] ? Number(m[2]) : a;
    for (let i = Math.min(a, b); i <= Math.max(a, b); i++) out.push(i);
  }
  return out;
};
// → { findings (kết quả parse), gan: (null | { dong, cach: 'ma'|'so' })[] theo vị trí mục,
//     soCu: số gọi trong dòng chỉ số đã cũ, moCoi: dòng có mã không khớp mục nào, luotCuoi: ISO|null }.
// Dòng sổ duyệt theo thứ tự; dòng sau thắng khi cùng định tuyến một mục, dòng cũ không gỡ định tuyến.
function ganDinhTuyen(findingsText, ledgerText, runLogText) {
  const f = findingsText && typeof findingsText === 'object' ? findingsText : parse(findingsText == null ? '' : findingsText);
  const L = f.findings, gan = L.map(() => null), soCu = new Set(), moCoi = [];
  const luot = luotCham(runLogText), cuoi = luot.length ? Math.max(...luot) : null;
  const cu = e => { if (cuoi == null) return false; const m = mocDong(e); return Number.isNaN(m) || m < cuoi; };
  for (const l of String(ledgerText || '').split('\n')) {
    if (!l.trim()) continue;
    let e; try { e = JSON.parse(l); } catch { continue; }
    if (!e || typeof e !== 'object' || String(e.stage || '').trim().toLowerCase() !== 'gate2') continue;
    const so = soCuaDong(e.decision), laCu = cu(e);
    const td = typeof e.tieu_de === 'string' && e.tieu_de.trim() ? e.tieu_de : null;
    if (td) {
      const ung = L.map((x, i) => i).filter(i => cungMuc(L[i].title, td) && (!e.tep || tepGoc(e.tep) === tepGoc(L[i].file)));
      let i = -1, ly = '';
      if (laCu) { const nhan = ung.filter(k => coNhanLuot(L[k].title)); if (nhan.length === 1) i = nhan[0]; else ly = nhan.length ? 'trung-ma' : 'khong-con-muc-mang-sang'; }
      else if (so.length) { const k = so.find(n => ung.includes(n - 1)); if (k) i = k - 1; else ly = 'so-lech-tieu-de'; }
      else if (ung.length === 1) i = ung[0];
      else ly = ung.length ? 'trung-ma' : 'khong-con-muc';
      if (i >= 0) gan[i] = { dong: e, cach: 'ma' }; else moCoi.push({ id: e.id || '', tieu_de: td, n: so[0] || null, ly_do: ly, may: e.may || null });
      continue;
    }
    if (!so.length) continue;
    if (laCu) { for (const n of so) soCu.add(n); continue; }
    for (const n of so) if (n >= 1 && n <= L.length) gan[n - 1] = { dong: e, cach: 'so' };
  }
  return { findings: f, gan, soCu: [...soCu].sort((a, b) => a - b), moCoi, luotCuoi: cuoi == null ? null : new Date(cuoi).toISOString().replace(/\.\d+Z$/, 'Z') };
}
// → { chua: ['Ngoài-1', …], tong, suspect }. findingsText null/rỗng → không mục nào. runLogText vắng
// (bên gọi đời trước) → không có lượt chấm nào để so: hành vi như trước vòng dinh-tuyen-theo-ma-muc.
function mucChuaDinhTuyen(findingsText, ledgerText, runLogText) {
  const f = parse(findingsText == null ? '' : findingsText);
  const g = ganDinhTuyen(f, ledgerText, runLogText);
  const chua = f.findings.map((_, i) => i + 1).filter(i => !g.gan[i - 1]).map(i => `Ngoài-${i}`);
  return { chua, tong: f.findings.length, suspect: !!f.suspect_empty };
}
// Cụm lý do nối sau danh sách mục chưa định tuyến — '' khi không có dòng cũ hoặc mọi mục đã định tuyến.
function cumCu(findingsText, ledgerText, runLogText) {
  const g = ganDinhTuyen(findingsText, ledgerText, runLogText);
  if (!g.soCu.length || g.gan.every(Boolean)) return '';
  return ` — dòng sổ theo số ghi trước lượt chấm ${g.luotCuoi}: ${g.soCu.map(n => 'Ngoài-' + n).join(', ')}`;
}

module.exports = { parse, PROPOSALS, OOC_GLOSS_NGUOI, mucChuaDinhTuyen, ganDinhTuyen, cumCu, NHAN_LUOT_RE, tieuDeGoc, coNhanLuot, cungMuc, mocDong, luotCham };
