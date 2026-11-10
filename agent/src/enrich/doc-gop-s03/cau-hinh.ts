// cau-hinh.ts — PL30 `chon-model-theo-o`: bảng chọn model theo ô cho bộ đọc gộp S03. Đổi model của một ô chỉ bằng sửa
// tệp agent/config/doc-gop-s03.json (câu chặn của hàng); mã bộ đọc không đổi. Tệp sai thì dừng trước lời gọi đầu.
// Ba mã Gateway là danh sách đóng theo ADR-0007 sửa đổi 06/11 («Model khác cần lời mới của Mạnh»). Cờ gửi (không giữ dữ
// liệu, không huấn luyện, DeepSeek chỉ qua Baseten) đặt ở đây theo mã Gateway, bảng chọn không tắt được.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { FIELDS, laField, type Field } from "./o.js";

export const GATEWAY_DUYET = ["anthropic/claude-haiku-5.5", "zai/glm-5.3-flash", "deepseek/deepseek-v4.1-flash-1017"] as const;
/** Giá trị ô «để người duyệt»: không model nào điền ô này vào kết quả gộp. */
export const NGUOI = "nguoi";
export const DUONG_MAC_DINH = join(import.meta.dirname, "../../../config/doc-gop-s03.json");

export type Model = { gateway: string; gia_vao: number; gia_ra: number };
export type CauHinh = { phien_ban: 1; mac_dinh: string; model: Record<string, Model>; o: Partial<Record<Field, string>> };
export type NhomGoi = { khoa: string; gateway: string; gia: { vao: number; ra: number }; o: Field[] };
export type KeHoach = { nhom: NhomGoi[]; nguoi: Field[] };

const laSoKhongAm = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v) && v >= 0;
const banGhi = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);

/** Kiểm một bảng đã parse; sai thì ném Error gọi tên đúng chỗ sai. */
export function kiemCauHinh(x: unknown): CauHinh {
  if (!banGhi(x)) throw new Error("bảng chọn: không phải object JSON");
  if (x.phien_ban !== 1) throw new Error(`bảng chọn: phien_ban phải là 1, nhận ${JSON.stringify(x.phien_ban)}`);
  if (!banGhi(x.model) || Object.keys(x.model).length === 0) throw new Error("bảng chọn: thiếu model");
  for (const [k, m] of Object.entries(x.model)) {
    if (k === NGUOI) throw new Error(`bảng chọn: khoá model «${NGUOI}» dành cho người duyệt`);
    if (!banGhi(m)) throw new Error(`bảng chọn: model ${k} không phải object`);
    if (typeof m.gateway !== "string" || !m.gateway) throw new Error(`bảng chọn: model ${k} thiếu gateway`);
    if (!(GATEWAY_DUYET as readonly string[]).includes(m.gateway)) {
      throw new Error(`bảng chọn: model ${k} dùng gateway ${m.gateway} ngoài ba mã đã duyệt (${GATEWAY_DUYET.join(", ")})`);
    }
    if (!laSoKhongAm(m.gia_vao)) throw new Error(`bảng chọn: model ${k} thiếu gia_vao`);
    if (!laSoKhongAm(m.gia_ra)) throw new Error(`bảng chọn: model ${k} thiếu gia_ra`);
  }
  // Hai khoá cùng một mã Gateway: kết quả gộp và nhãn của khoá sau đè khoá trước, lời gọi thừa vẫn tốn tiền (S4-r1 t4).
  const daGap = new Map<string, string>();
  for (const [k, m] of Object.entries(x.model) as [string, { gateway: string }][]) {
    const truoc = daGap.get(m.gateway);
    if (truoc) throw new Error(`bảng chọn: model ${truoc} và ${k} trùng gateway ${m.gateway}`);
    daGap.set(m.gateway, k);
  }
  const khoa = new Set(Object.keys(x.model));
  if (typeof x.mac_dinh !== "string" || !khoa.has(x.mac_dinh)) throw new Error(`bảng chọn: mac_dinh ${JSON.stringify(x.mac_dinh)} không phải khoá model đã khai`);
  const o = x.o ?? {};
  if (!banGhi(o)) throw new Error("bảng chọn: o không phải object");
  for (const [f, v] of Object.entries(o)) {
    if (!laField(f)) throw new Error(`bảng chọn: ô ${f} không có trong 17 ô (${FIELDS.join(", ")})`);
    if (typeof v !== "string" || (v !== NGUOI && !khoa.has(v))) throw new Error(`bảng chọn: ô ${f} giao cho ${JSON.stringify(v)} — không phải khoá model đã khai hay «${NGUOI}»`);
  }
  return x as unknown as CauHinh;
}

/** Nạp bảng từ tệp (mặc định tệp của kho). `sha` là sha256 hex của byte tệp — ghi vào từng dòng nhãn. */
export function napCauHinh(duong: string = DUONG_MAC_DINH): { cauHinh: CauHinh; sha: string } {
  const byte = readFileSync(duong);
  let x: unknown;
  try {
    x = JSON.parse(byte.toString("utf8"));
  } catch (e) {
    throw new Error(`bảng chọn: ${duong} không phải JSON (${(e as Error).message})`);
  }
  return { cauHinh: kiemCauHinh(x), sha: createHash("sha256").update(byte).digest("hex") };
}

/** Mỗi model có ô một nhóm (một lời gọi mỗi bài), xếp theo khoá; ô «nguoi» không thuộc nhóm nào. */
export function keHoach(c: CauHinh): KeHoach {
  const theoKhoa = new Map<string, Field[]>();
  const nguoi: Field[] = [];
  for (const f of FIELDS) {
    const k = c.o[f] ?? c.mac_dinh;
    if (k === NGUOI) nguoi.push(f);
    else theoKhoa.set(k, [...(theoKhoa.get(k) ?? []), f]);
  }
  const nhom = [...theoKhoa.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([khoa, o]) => {
    const m = c.model[khoa];
    return { khoa, gateway: m.gateway, gia: { vao: m.gia_vao, ra: m.gia_ra }, o };
  });
  return { nhom, nguoi };
}

/** Cờ gửi kèm mọi lời gọi Gateway, theo mã Gateway — không đọc từ bảng chọn. */
export function tuyChonGui(gateway: string): { gateway: { zeroDataRetention: true; disallowPromptTraining: true; only?: string[] } } {
  const chung = { zeroDataRetention: true as const, disallowPromptTraining: true as const };
  return { gateway: gateway.startsWith("deepseek/") ? { ...chung, only: ["baseten"] } : chung };
}
