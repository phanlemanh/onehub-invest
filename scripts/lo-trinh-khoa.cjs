// lo-trinh-khoa.cjs — MỘT hàm đọc khoá ổ cắm lộ trình (`lo_trinh.tep`) cho mọi bên đọc: bộ vẽ
// bản đồ, bộ quét thẻ start, và chính scripts/lo-trinh.mjs. Tách riêng để bộ vẽ và bộ quét biết «ổ
// cắm vắng» mà KHÔNG nạp mô-đun lộ trình (hồ sơ viec-ke-theo-plan AC-1: kho không khai thì mã lộ
// trình không chạy, và kho tiêu thụ chép thiếu tệp vẫn sống).
//
// Từ lo-trinh-tren-du-lieu-that: `tep` nhận một chuỗi HOẶC một danh sách (khối `- a` hay dòng
// `[a, b]`) — crm có năm tài liệu lộ trình. Bộ đọc config chung trả null cho danh sách, và bộ đọc
// danh sách chung khớp mọi khoá thụt hai dấu cách ở bất cứ khối nào (đo 03/10), nên ở đây cắt
// đúng khối `lo_trinh:` ở cột 0 rồi mới đọc `tep` trong khối.
const KHOA = 'lo_trinh.tep';
const NULLISH = new Set(['~', 'null', 'Null', 'NULL']);
const boNhay = s => String(s).trim().replace(/^["']|["']$/g, '').trim();
const boChuThich = s => String(s).replace(/\s+#.*$/, '').trim();

function khoiLoTrinh(cfgText) {
  const dong = String(cfgText || '').replace(/\r\n?/g, '\n').split('\n');
  const i = dong.findIndex(l => /^lo_trinh:\s*(#.*)?$/.test(l));
  if (i < 0) return null;
  const ra = [];
  for (const l of dong.slice(i + 1)) {
    if (/^\s*(#.*)?$/.test(l)) continue; // chú thích và dòng trống không cắt khối
    if (/^\S/.test(l)) break;
    ra.push(l);
  }
  return ra;
}

// → { tep: string[], co: string[] } | null. null = ổ cắm vắng (không khối, không tep, rỗng).
function cacTepTuConfig(cfgText) {
  const khoi = khoiLoTrinh(cfgText);
  if (!khoi) return null;
  const i = khoi.findIndex(l => /^ {2}tep:/.test(l));
  if (i < 0) return null;
  const tho = [];
  const giaTri = boChuThich(khoi[i].replace(/^ {2}tep:/, ''));
  if (giaTri.startsWith('[')) {
    const trong = giaTri.replace(/^\[/, '').replace(/\]$/, '');
    for (const x of trong.split(',')) tho.push(boNhay(x));
  } else if (giaTri) tho.push(boNhay(giaTri));
  else {
    for (const l of khoi.slice(i + 1)) {
      const m = l.match(/^ {4,}-\s*(.*)$/);
      if (m) { tho.push(boNhay(boChuThich(m[1]))); continue; }
      if (/^\s*(#.*)?$/.test(l)) continue;
      break;
    }
  }
  const tep = []; const co = [];
  for (const t of tho) {
    if (!t || NULLISH.has(t)) continue;
    if (tep.includes(t)) { const c = `tệp lộ trình khai hai lần: ${t}`; if (!co.includes(c)) co.push(c); continue; }
    tep.push(t);
  }
  return tep.length ? { tep, co } : null;
}

// Giữ chữ ký của lát 1: tệp ĐẦU, hoặc null khi ổ cắm vắng.
function khoaTuConfig(cfgText) {
  const v = cacTepTuConfig(cfgText);
  return v ? v.tep[0] : null;
}
module.exports = { KHOA, khoaTuConfig, cacTepTuConfig };
