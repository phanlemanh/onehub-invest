// tri-thuc-nguon.cjs — bên ghi và bên đọc dòng «Nguồn:» của ô cơ hội (hồ sơ o-mo-viec-mang-nguon, TT3, đợt
// tri-thuc-2410; thiết kế docs/superpowers/specs/2026-10-24-o-mo-viec-mang-nguon-design.md). CJS để thẻ của TT4 nạp được.
//
// Một nguồn: tiền tố dòng là khối OPP-NGUON-PREFIX của khuôn ô cơ hội, biểu thức đường trỏ là khối TRI-THUC-CON-TRO của
// khuôn tri thức; cả hai rút LÚC CHẠY, suy từ vị trí tệp. Bên ghi (`lo-trinh.mjs --mo-o`) và bên đọc cùng dùng mô-đun này.
const { readFileSync } = require('node:fs');
const path = require('node:path');

const REF = path.join(__dirname, '..', 'skills', 'acceptance', 'references');
const KHUON_OPP = path.join(REF, 'opportunity-template.md');
const KHUON_TT = path.join(REF, 'tri-thuc-template.md');
const MARKER = 'OPP-NGUON-PREFIX';

// FAIL-CLOSED như prefixFromTemplate của lib/nguong-o-co-hoi.cjs: khuôn mất khối thì NÉM, không trả null.
function tienTo(khuonOpp) {
  const m = String(khuonOpp).match(new RegExp(`<<<${MARKER} -->\\n([\\s\\S]*?)<!-- ${MARKER}>>>`));
  if (!m || !m[1].trim()) throw new Error(`khuôn ô cơ hội thiếu khối ${MARKER}`);
  return m[1].trim();
}
// Khối rào của khuôn tri thức — cùng dạng bộ rút `khoi` của scripts/tri-thuc.mjs.
function bieuThucConTro(khuonTt) {
  const ten = 'TRI-THUC-CON-TRO';
  const m = String(khuonTt).match(new RegExp(`<!-- <<<${ten} -->\\n\`\`\`\\n([\\s\\S]*?)\\n\`\`\`\\n<!-- ${ten}>>> -->`));
  if (!m) throw new Error(`khuôn tri thức thiếu khối ${ten}`);
  return new RegExp(m[1].trim());
}
function napKhuonNguon({ khuonOpp = readFileSync(KHUON_OPP, 'utf8'), khuonTt = readFileSync(KHUON_TT, 'utf8') } = {}) {
  return { tienTo: tienTo(khuonOpp), conTro: bieuThucConTro(khuonTt) };
}

// Dựng dòng từ kết quả chọn trang (`chonTrang` của scripts/tri-thuc.mjs): đường trỏ trong backtick nối « · », phần
// thiếu sau « — chưa có trang: »; kho riêng không có ở máy → nhãn «không đọc được ở đây»; khối khai lỗi → câu lỗi.
function dungDongNguon({ tienTo: t, conTro = [], thieu = [], khongDoc = null, loiKhai = null }) {
  if (khongDoc) return `${t} ${khongDoc}`;
  if (loiKhai && loiKhai.length) return `${t} khối tri_thuc lỗi — ${loiKhai.join('; ')}`;
  const tro = conTro.map(c => `\`${c}\``).join(' · ');
  const thieuChu = thieu.length ? `chưa có trang: ${thieu.join(', ')}` : '';
  if (tro && thieuChu) return `${t} ${tro} — ${thieuChu}`;
  return `${t} ${tro || thieuChu}`;
}

// Dòng đầu tiên mở bằng tiền tố; đường trỏ = mọi đoạn trong backtick khớp khuôn đường trỏ.
function docDongNguon(txt, { tienTo: t, conTro: re }) {
  const dong = String(txt ?? '').replace(/\r\n?/g, '\n').split('\n').find(l => l === t || l.startsWith(`${t} `));
  if (dong === undefined) return { coDong: false, conTro: [] };
  return { coDong: true, conTro: [...dong.matchAll(/`([^`]+)`/g)].map(m => m[1]).filter(s => re.test(s)) };
}

module.exports = { MARKER, tienTo, napKhuonNguon, dungDongNguon, docDongNguon };
