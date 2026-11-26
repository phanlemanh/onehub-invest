// s09-can-cao-tang.mjs — DA43 nap-s09-can-cao-tang-vao-danh-ba: luật tách mã căn cao tầng S09 (kind can-cao-tang, DATA-CONTRACT v16).
// Hàm thuần, không DB. Thiết kế §0.3 (Hỏi-4, Mạnh duyệt 26/11): toà là toà của item (cấu trúc bản thu, không đọc từ mã); số căn là
// đoạn sau dấu tách cuối («.» hoặc «_»); tầng là đoạn liền trước số căn nếu đúng khuôn tầng, không thì tầng của item.
// Không chứa tên nguồn hay tên miền thật.

/** Khuôn tầng của units.floor: số, có thể một chữ cái sau (12A). */
export const TANG = /^\d+[A-Z]?$/;

const bo0 = (s) => String(s).trim().toUpperCase().replace(/^0+(?=[0-9A-Z])/, "");

/**
 * Tách mã căn S09. `tangItem` là tên tầng của item (meta.tangTen). `code` khác `name` thì vẫn theo `code` (bên gọi đếm riêng).
 * @returns {{ok:true,tang:string,so:string,tangTuMa:boolean,lechItem:boolean,ngoaiKhuon:boolean}|{ok:false,lyDo:"khong-dau-tach"|"so-rong"}}
 */
export function tachMaCanS09(code, { tangItem }) {
  const s = String(code ?? "").trim();
  const i = /* DOT-BIEN:dau-tach */ Math.max(s.lastIndexOf("."), s.lastIndexOf("_"));
  if (i < 0) return { ok: false, lyDo: "khong-dau-tach" };
  const so = bo0(s.slice(i + 1));
  if (!so) return { ok: false, lyDo: "so-rong" };
  const truoc = s.slice(0, i).toUpperCase();
  const doan = bo0(truoc.split(/[.\-_]/).pop() ?? "");
  const tItem = bo0(tangItem ?? "");
  const tangTuMa = /* DOT-BIEN:tang-tu-ma */ TANG.test(doan);
  const tang = tangTuMa ? doan : tItem;
  return { ok: true, tang, so, tangTuMa, lechItem: tangTuMa && TANG.test(tItem) && tang !== tItem, ngoaiKhuon: !TANG.test(tang) };
}

/** Khoá khử trùng của một căn trong danh bạ: toà (building_key), tầng, số căn đã chuẩn hoá. */
export const khoaCan = (buildingKey, tang, so) => `${buildingKey}|${tang}|${so}`;
