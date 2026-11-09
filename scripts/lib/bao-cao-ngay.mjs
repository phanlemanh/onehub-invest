/**
 * bao-cao-ngay.mjs (lib) — phần thuần của báo cáo số liệu ngày: chấm số theo bảng mục tiêu, so với hôm qua,
 * gợi ý hành động theo luật, dựng markdown. Không chạm DB, không đọc tệp — CLI `scripts/bao-cao-ngay.mjs` lo phần đó.
 *
 * Trạng thái một chỉ số:
 *   dat   — đã tới đích
 *   vang  — chưa tới đích, chưa vượt ngưỡng đỏ
 *   do    — vượt ngưỡng đỏ (`do` trong muc-tieu.json)
 *   theo  — không có đích (chỉ theo dõi)
 *   thieu — không đo được hôm nay (giá trị null)
 */
import { VOCAB } from "../../pipeline/lib/vocab.generated.mjs";

/** Chấm một giá trị theo khai báo mục tiêu. */
export function danhGia(giaTri, mt) {
  if (giaTri === null || giaTri === undefined || Number.isNaN(giaTri)) return "thieu";
  const tang = mt.huong !== "giam";
  const vuotDo = mt.do !== null && mt.do !== undefined && (tang ? giaTri < mt.do : giaTri > mt.do);
  if (vuotDo) return "do";
  if (mt.dich === null || mt.dich === undefined) return "theo";
  return (tang ? giaTri >= mt.dich : giaTri <= mt.dich) ? "dat" : "vang";
}

/**
 * Biến động so với hôm qua. `xau` = đi ngược hướng tốt quá `canhPct` phần trăm (hoặc từ 0 lên khi hướng giảm).
 * Trả null khi thiếu một trong hai số.
 */
export function bienDong(homNay, homQua, mt, canhPct = 5) {
  if (homNay === null || homNay === undefined || homQua === null || homQua === undefined) return null;
  const delta = homNay - homQua;
  const pct = homQua === 0 ? (delta === 0 ? 0 : null) : (100 * delta) / Math.abs(homQua);
  const tang = mt.huong !== "giam";
  const nguoc = tang ? delta < 0 : delta > 0;
  const xau = nguoc && (pct === null || Math.abs(pct) > canhPct);
  return { delta, pct, xau };
}

/** Chấm cả bảng: so = { id: số }, homQua = { id: số } | null. */
export function chamBang(so, homQua, mucTieu) {
  const canh = mucTieu.bien_dong_canh_pct ?? 5;
  return Object.entries(mucTieu.chi_so).map(([id, mt]) => {
    const v = so[id] ?? null;
    const q = homQua ? (homQua[id] ?? null) : null;
    return { id, ...mt, gia_tri: v, hom_qua: q, trang_thai: danhGia(v, mt), bien_dong: bienDong(v, q, mt, canh) };
  });
}

/**
 * Ô nghi tụt bậc giữa hai ảnh chụp `data_level_snapshot` (hàng {market_id, property_type, unit, data_level, n}).
 *
 * Ảnh chụp chỉ có số đếm, không có dòng chuyển từng đơn vị (đó là DO1), nên một ô co lại có thể vì tụt bậc, vì tin
 * rời ô (gắn vào căn, nghỉ) hay vì gộp cụm. Luật: trong cùng (thị trường × loại × đơn vị), số đơn vị ở bậc ≥ L co
 * hơn `nguongPct` phần trăm VÀ số ở dưới L tăng ít nhất bằng phần co → «nghi tụt». Co mà bậc dưới không tăng tương
 * ứng → «rời ô», chỉ để tham khảo. Chỉ xét ô có ≥ `toiThieu` đơn vị ở bậc ≥ L hôm trước và co ≥ `giamToiThieu` đơn vị
 * (dưới mức đó là nhiễu của tin vào, tin nghỉ trong ngày).
 * Hai ảnh chụp khác thang (cột `scale` của 087; vắng = `thang-2310`) không so: ngày đổi thang 08/11 là lần hạ một lần,
 * không phải tụt bậc (thang-bac-moi-b0-b5 AC-6) — trả `doiThang` và không ô nào.
 */
/** NS1, NS1b trên ảnh chụp mới nhất: căn hộ từ B5, loại khác từ B3 (NS1); mọi đơn vị từ B3 (NS1b). Thang 08/11: B3 trở lên
 * là căn của danh bạ có tin gắn — hôm nay 0 tới khi có bảng nối. */
export function demNs1(sau) {
  const capB = (lv) => Number(String(lv).slice(1));
  return {
    NS1: sau.filter((r) => capB(r.data_level) >= (r.property_type === "apartment" ? 5 : 3)).reduce((s, r) => s + Number(r.n), 0),
    NS1b: sau.filter((r) => capB(r.data_level) >= 3).reduce((s, r) => s + Number(r.n), 0),
  };
}

export function oBacGiam(truoc, sau, { nguongPct = 2, toiThieu = 50, giamToiThieu = 20 } = {}) {
  const thangCua = (rows) => [...new Set(rows.map((r) => r.scale ?? "thang-2310"))].sort().join(",");
  if (truoc.length && sau.length && thangCua(truoc) !== thangCua(sau)) {
    return { nghi: [], roi: [], doiThang: { truoc: thangCua(truoc), sau: thangCua(sau) } };
  }
  const BAC = VOCAB.data_level;
  const gom = (rows) => {
    const m = new Map();
    for (const r of rows) {
      const k = `${r.market_id}|${r.property_type}|${r.unit}`;
      if (!m.has(k)) m.set(k, new Array(6).fill(0));
      m.get(k)[BAC.indexOf(r.data_level)] += Number(r.n);
    }
    return m;
  };
  const m0 = gom(truoc);
  const m1 = gom(sau);
  const nghi = [];
  const roi = [];
  for (const [k, a0] of m0) {
    const a1 = m1.get(k) ?? new Array(6).fill(0);
    for (let L = 1; L < 6; L++) {
      const tren0 = a0.slice(L).reduce((s, x) => s + x, 0);
      if (tren0 < toiThieu) continue;
      const tren1 = a1.slice(L).reduce((s, x) => s + x, 0);
      const pct = (100 * (tren1 - tren0)) / tren0;
      if (pct >= -nguongPct || tren0 - tren1 < giamToiThieu) continue;
      const duoiTang = a1.slice(0, L).reduce((s, x) => s + x, 0) - a0.slice(0, L).reduce((s, x) => s + x, 0);
      const o = { o: `${k}|≥${BAC[L]}`, truoc: tren0, sau: tren1, pct: Math.round(pct * 10) / 10, duoiTang };
      (duoiTang >= tren0 - tren1 ? nghi : roi).push(o);
    }
  }
  const xep = (x) => x.sort((a, b) => a.pct - b.pct);
  return { nghi: xep(nghi), roi: xep(roi) };
}

/**
 * Tách ô «đã biết» khỏi số tính đỏ: liên lạc hay giám sát đã nhận và đang xử lý thì báo cáo không đánh đỏ lại mỗi
 * sáng. `daBietCfg` = [{ id, o, ly_do, den }] trong muc-tieu.json; `o` khớp nguyên văn trường `nhan` của mục; hết hạn
 * (`den` < ngày báo cáo) thì tính lại.
 */
export function tachDaBiet(items, id, daBietCfg, ngay) {
  const tinh = [];
  const daBiet = [];
  for (const it of items) {
    const k = daBietCfg.find((d) => d.id === id && d.o === it.nhan && (!d.den || d.den >= ngay));
    if (k) daBiet.push({ ...it, ly_do: k.ly_do, den: k.den ?? "—" });
    else tinh.push(it);
  }
  return { tinh, daBiet };
}

/**
 * Gợi ý hành động theo luật — ứng viên cho phần «Kiến nghị»; phiên chạy lịch chọn lọc, viết lại thành câu tự đủ
 * nghĩa. Không tự làm hành động nào. `cho`: "manh" (chỉ cổng, tiền, quyết định chưa chốt) | "dieu-phoi".
 */
export function goiY(bang, ngu) {
  const by = Object.fromEntries(bang.map((r) => [r.id, r]));
  const ra = [];
  const add = (cho, id, cau) => ra.push({ cho, id, cau });
  if (ngu.mucTieuTrangThai !== "da-duyet") {
    add("manh", "MT", "Bảng mục tiêu số liệu còn ở trạng thái đề xuất — báo cáo so đích chưa được duyệt.");
  }
  if (by.C1 && by.C1.dich === null) {
    add("manh", "C1", "Chưa có trần tiền ngày cho đọc tin; khi bật đọc gộp chạy hằng ngày cần đặt trần cùng lúc.");
  }
  if (by.C1 && by.C1.trang_thai === "do") add("manh", "C1", `Chi phí đọc tin ngày qua ${by.C1.gia_tri} USD vượt trần.`);
  if (by.P1 && by.P1.gia_tri > 0) {
    add("dieu-phoi", "P1", `Độ tươi: ${by.P1.gia_tri} ô quá SLO (${(ngu.freshnessBad ?? []).join(", ")}) — việc của liên lạc/ZCode.`);
  }
  if (by.P3 && ["do", "vang"].includes(by.P3.trang_thai)) {
    add("dieu-phoi", "P3", `S06 nhận ngày gần nhất chỉ ${by.P3.gia_tri}% trung bình 7 ngày — hỏi liên lạc trước khi coi là thị trường.`);
  }
  if (by.F1 && by.F1.trang_thai === "do") add("dieu-phoi", "F1", `S03 bài nhận ${by.F1.gia_tri} — dưới ngưỡng đỏ, kiểm hook/nhóm.`);
  if (by.NS3 && by.NS3.gia_tri > 0) add("dieu-phoi", "NS3", `${by.NS3.gia_tri} ô nghi tụt bậc (bậc ≥L co > 2%, bậc dưới tăng tương ứng) — cần lý do (đổi luật đọc, nạp lại, từ vựng).`);
  if (by.D3a && by.D3a.trang_thai === "do") add("dieu-phoi", "D3a", `Đọc tin JSON hỏng ${by.D3a.gia_tri}% — soi model/prompt đổi gần đây.`);
  if (by.D3b && by.D3b.trang_thai === "do") add("dieu-phoi", "D3b", `Đọc tin trích sai ${by.D3b.gia_tri}% — soi model/prompt đổi gần đây.`);
  if (by.H1 && by.H1b && by.H1.gia_tri > (by.H1.dich ?? Infinity) && (by.H1b.gia_tri ?? 0) === 0) {
    add("dieu-phoi", "H1", `${by.H1.gia_tri} thẻ chờ, 0 thẻ được quyết trong 24 giờ — xếp lượt duyệt hoặc gom thẻ cùng loại.`);
  }
  if (by.C4 && by.C4.gia_tri > 0) add("dieu-phoi", "C4", `${by.C4.gia_tri} model trong ai_calls thiếu giá — chi phí theo ai_calls đang tính 0 (PL31).`);
  if (by.Q1 && by.Q1.gia_tri > 0) add("dieu-phoi", "Q1", `${by.Q1.gia_tri} dòng kiểm DQ đỏ: ${(ngu.dqDo ?? []).slice(0, 6).join(", ")}.`);
  if (by.H3 && by.H3.bien_dong && by.H3.bien_dong.delta === 0) {
    add("dieu-phoi", "H3", `Mốc GCM1 không thêm hàng ký từ hôm qua (${by.H3.gia_tri}/${by.H3.dich}) — soi dãy kẹt trên đường tới hạn.`);
  }
  return ra;
}

const NHAN = { dat: "đạt", vang: "vàng", do: "ĐỎ", theo: "theo dõi", thieu: "thiếu số" };

/** Định dạng số kiểu Việt Nam (dấu chấm nghìn, phẩy thập phân). */
export function fmt(v) {
  if (v === null || v === undefined) return "—";
  if (typeof v !== "number") return String(v);
  if (v !== 0 && Math.abs(v) < 0.01) return v.toLocaleString("vi-VN", { maximumSignificantDigits: 2 });
  const r = Math.abs(v) >= 100 ? Math.round(v) : Math.round(v * 100) / 100;
  return r.toLocaleString("vi-VN", { maximumFractionDigits: 2 });
}

/** «2026-11-30» → «30/11». */
export function fmtNgay(iso) {
  if (!iso) return "—";
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  return m ? `${m[3]}/${m[2]}` : iso;
}

function fmtDelta(b) {
  if (!b) return "—";
  const s = b.delta > 0 ? "+" : "";
  const p = b.pct === null ? "" : ` (${b.pct > 0 ? "+" : ""}${fmt(Math.round(b.pct * 10) / 10)}%)`;
  return `${s}${fmt(b.delta)}${p}${b.xau ? " ↘" : ""}`;
}

/** Dựng markdown báo cáo. `ctx`: { ngay, doLuc, mucTieuTrangThai, homQuaNgay, bang, goiY, lat, oGiam, dqDo, freshnessBad, audit } */
export function dungMarkdown(ctx) {
  const L = [];
  const tt = ctx.mucTieuTrangThai === "da-duyet" ? "đã duyệt" : "ĐỀ XUẤT, chưa duyệt";
  L.push(`# Báo cáo số liệu ngày ${ctx.ngay}`, "");
  L.push(`Đo lúc ${ctx.doLuc} trên DB máy thu, chỉ đọc. Mục tiêu: ${tt}. So với: ${ctx.homQuaNgay ?? "chưa có ngày trước"}.`, "");
  const lech = ctx.bang.filter((r) => r.trang_thai === "do" || r.trang_thai === "vang" || r.bien_dong?.xau);
  L.push("## Lệch đích và tụt", "");
  if (lech.length === 0) L.push("Không có.", "");
  for (const r of lech.sort((a, b) => (a.trang_thai === "do" ? -1 : 0) - (b.trang_thai === "do" ? -1 : 0))) {
    const dich = r.dich === null ? "" : ` · đích ${fmt(r.dich)}${r.han ? ` trước ${fmtNgay(r.han)}` : ""}`;
    L.push(`- **${r.id} ${r.ten}**: ${fmt(r.gia_tri)} — ${NHAN[r.trang_thai]}${dich}${r.bien_dong?.xau ? ` · so hôm qua ${fmtDelta(r.bien_dong)}` : ""}`);
  }
  L.push("", "## Bảng số", "", "| # | Nhóm | Chỉ số | Hôm nay | So hôm qua | Đích | Hạn | Trạng thái |", "|---|---|---|---|---|---|---|---|");
  for (const r of ctx.bang) {
    const dich = r.dich === null ? (r.ghi_chu_dich ? `(${r.ghi_chu_dich})` : "—") : fmt(r.dich);
    L.push(`| ${r.id} | ${r.nhom} | ${r.ten} | ${fmt(r.gia_tri)} | ${fmtDelta(r.bien_dong)} | ${dich} | ${fmtNgay(r.han)} | ${NHAN[r.trang_thai]} |`);
  }
  if (ctx.oGiam?.doiThang) {
    L.push(`- ô bậc: đổi thang (${ctx.oGiam.doiThang.truoc} → ${ctx.oGiam.doiThang.sau}), không so — lần hạ một lần, không phải tụt bậc`);
  }
  if (ctx.oGiam?.nghi?.length || ctx.oGiam?.roi?.length) {
    L.push("", "### Ô bậc co lại > 2% (thị trường | loại | đơn vị | bậc)", "");
    for (const o of ctx.oGiam.nghi.slice(0, 10)) L.push(`- nghi tụt ${o.o}: ${fmt(o.truoc)} → ${fmt(o.sau)} (${fmt(o.pct)}%), bậc dưới +${fmt(o.duoiTang)}`);
    if (ctx.oGiam.roi.length) {
      L.push(`- rời ô (gắn căn, nghỉ hay gộp cụm — bậc dưới không tăng tương ứng): ${ctx.oGiam.roi.length} ô, ` +
        ctx.oGiam.roi.slice(0, 4).map((o) => `${o.o} ${fmt(o.truoc)}→${fmt(o.sau)}`).join("; "));
    }
    L.push("- Ảnh chụp bậc chỉ có số đếm; dòng chuyển từng đơn vị (lên, tụt, vì sao) chờ DO1.");
  }
  if (ctx.lat) {
    L.push("", "## Lát theo phường, dự án, toà", "");
    L.push(`S03 tin sống theo phường (top), «chưa tới phường» = tin chỉ có khu vực cấp thị trường hoặc không có:`, "");
    L.push("| Phường | Tin | Đạt B1 |", "|---|---|---|");
    for (const w of ctx.lat.s03Phuong) L.push(`| ${w.ten} | ${fmt(w.n)} | ${fmt(w.b1)} |`);
    L.push("", `Dự án: ${fmt(ctx.lat.canCoDuAn)} căn gắn dự án / ${fmt(ctx.lat.tongCan)} — còn lại «chưa gắn». ` +
      `Toà: danh mục có ${fmt(ctx.lat.toaDanhMuc)} toà; ${fmt(ctx.lat.s03CoChuToa)} tin S03 có chữ toà thô, chưa nối (chờ DB1/PL20).`);
  }
  if (ctx.daBiet?.length) L.push("", "## Đã biết, đang xử lý (không tính đỏ)", "", ...ctx.daBiet.map((x) => `- ${x}`));
  if (ctx.audit) L.push("", `## audit-all`, "", ctx.audit);
  L.push("", "## Gợi ý của máy (ứng viên cho kiến nghị — không tự làm)", "");
  const m = ctx.goiY.filter((g) => g.cho === "manh");
  const d = ctx.goiY.filter((g) => g.cho === "dieu-phoi");
  L.push("Cho Mạnh:", ...(m.length ? m.map((g) => `- [${g.id}] ${g.cau}`) : ["- (không có)"]), "");
  L.push("Cho phiên điều phối:", ...(d.length ? d.map((g) => `- [${g.id}] ${g.cau}`) : ["- (không có)"]), "");
  return L.join("\n");
}
