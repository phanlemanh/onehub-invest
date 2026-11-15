// cau-hinh.ts — PL30 `chon-model-theo-o`: bảng chọn model theo ô cho bộ đọc gộp S03. Đổi model của một ô chỉ bằng sửa
// tệp agent/config/doc-gop-s03.json (câu chặn của hàng); mã bộ đọc không đổi. Tệp sai thì dừng trước lời gọi đầu.
// Ba mã model là danh sách đóng theo ADR-0007 sửa đổi 06/11 («Model khác cần lời mới của Mạnh»). Cờ gửi (không giữ dữ
// liệu, không huấn luyện, DeepSeek chỉ qua Baseten) đặt ở đây theo mã model, bảng chọn không tắt được.
// goi-thang-anthropic (15/11, Mạnh: «tận dụng chứ không thay thế Vercel AI Gateway»): mỗi model có `duong` — một đường hay danh
// sách đường theo thứ tự thử: "gateway" (mặc định) và "anthropic" (API Anthropic thẳng, chỉ model có trong DUONG_ANTHROPIC).
// `tu_lui` (mặc định false): đường đang dùng gặp lớp dừng (hết tiền, khoá sai) hay thiếu khoá thì lùi sang đường kế trong cùng
// trần, ghi dòng `chuyen-duong`; false thì dừng và báo. Mã model (trường `gateway`) là danh tính nhãn: silver_labels.model không đổi
// theo đường (bài đã đọc không bị đọc lại khi đổi đường); ai_calls.model mang tiền tố đường (`anthropic:` / `gateway:`).
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { FIELDS, laField, type Field } from "./o.js";

export const MODEL_DUYET = ["anthropic/claude-haiku-5.5", "zai/glm-5.3-flash", "deepseek/deepseek-v4.1-flash-1017"] as const;
/** Model được gọi thẳng API Anthropic và mã gọi tương ứng (skill claude-api: Claude Haiku 5.5 = `claude-haiku-5-5`). */
export const DUONG_ANTHROPIC: Readonly<Record<string, string>> = Object.freeze({ "anthropic/claude-haiku-5.5": "claude-haiku-5-5" });
export const DUONG = ["gateway", "anthropic"] as const;
export type Duong = (typeof DUONG)[number];
/** Biến môi trường chứa khoá của từng đường (đọc lúc gọi, không lưu). */
export const KHOA_DUONG: Readonly<Record<Duong, string>> = Object.freeze({ gateway: "AI_GATEWAY_API_KEY", anthropic: "ANTHROPIC_API_KEY" });
/** Giá trị ô «để người duyệt»: không model nào điền ô này vào kết quả gộp. */
export const NGUOI = "nguoi";
export const DUONG_MAC_DINH = join(import.meta.dirname, "../../../config/doc-gop-s03.json");

export type Model = { gateway: string; gia_vao: number; gia_ra: number; duong?: Duong | Duong[] };
export type CauHinh = { phien_ban: 1; mac_dinh: string; model: Record<string, Model>; o: Partial<Record<Field, string>>; tu_lui?: boolean };
/** `duong`: các đường theo thứ tự thử (đường đầu là đường dùng khi mọi khoá đủ). */
export type NhomGoi = { khoa: string; gateway: string; duong: Duong[]; gia: { vao: number; ra: number }; o: Field[] };
export type KeHoach = { nhom: NhomGoi[]; nguoi: Field[]; tuLui: boolean };

/** Đường của một model, chuẩn về danh sách (vắng → ["gateway"]). */
export const dsDuong = (d: unknown): Duong[] => (d === undefined ? ["gateway"] : Array.isArray(d) ? (d as Duong[]) : [d as Duong]);
/** Mã gọi theo đường; ai_calls.model = `<đường>:<mã gọi>`. */
export const maGoi = (gateway: string, duong: Duong): string => (duong === "anthropic" ? DUONG_ANTHROPIC[gateway] ?? gateway : gateway);
export const modelSo = (gateway: string, duong: Duong): string => `${duong}:${maGoi(gateway, duong)}`;

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
    if (!(MODEL_DUYET as readonly string[]).includes(m.gateway)) {
      throw new Error(`bảng chọn: model ${k} dùng gateway ${m.gateway} ngoài ba mã đã duyệt (${MODEL_DUYET.join(", ")})`);
    }
    const ds = dsDuong(m.duong);
    if (!ds.length || new Set(ds).size !== ds.length) throw new Error(`bảng chọn: model ${k} có duong ${JSON.stringify(m.duong)} rỗng hay lặp`);
    for (const d of ds) {
      if (!(DUONG as readonly unknown[]).includes(d)) {
        throw new Error(`bảng chọn: model ${k} có duong ${JSON.stringify(d)} — chỉ ${DUONG.join(" | ")}`);
      }
      if (d === "anthropic" && !DUONG_ANTHROPIC[m.gateway]) {
        throw new Error(`bảng chọn: model ${k} (${m.gateway}) không có đường anthropic — chỉ ${Object.keys(DUONG_ANTHROPIC).join(", ")}`);
      }
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
  if (x.tu_lui !== undefined && typeof x.tu_lui !== "boolean") throw new Error(`bảng chọn: tu_lui phải là true/false, nhận ${JSON.stringify(x.tu_lui)}`);
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
    return { khoa, gateway: m.gateway, duong: dsDuong(m.duong), gia: { vao: m.gia_vao, ra: m.gia_ra }, o };
  });
  return { nhom, nguoi, tuLui: c.tu_lui === true };
}

/** Đường dùng được của một nhóm theo khoá có trong môi trường. Không tự lùi: chỉ đường đầu (thiếu khoá của nó → rỗng). Tự lùi:
 * mọi đường có khoá, giữ thứ tự. */
export function duongDung(n: NhomGoi, tuLui: boolean, env: NodeJS.ProcessEnv = process.env): Duong[] {
  const co = (d: Duong) => !!env[KHOA_DUONG[d]];
  return tuLui ? n.duong.filter(co) : co(n.duong[0]) ? [n.duong[0]] : [];
}

/** Khoá vắng làm một nhóm không còn đường nào → lệnh thoát 5 trước lời gọi đầu. Trả tên biến (xếp theo tên). */
export function khoaThieu(kh: KeHoach, env: NodeJS.ProcessEnv = process.env): string[] {
  const thieu = new Set<string>();
  for (const n of kh.nhom) {
    if (duongDung(n, kh.tuLui, env).length) continue;
    for (const d of kh.tuLui ? n.duong : [n.duong[0]]) if (!env[KHOA_DUONG[d]]) thieu.add(KHOA_DUONG[d]);
  }
  return [...thieu].sort();
}

/** Khoá của mọi đường trong kế hoạch (để in và kiểm), xếp theo tên. */
export function khoaCan(kh: KeHoach): string[] {
  return [...new Set(kh.nhom.flatMap((n) => n.duong.map((d) => KHOA_DUONG[d])))].sort();
}

/** Cờ gửi kèm mọi lời gọi Gateway, theo mã Gateway — không đọc từ bảng chọn. */
export function tuyChonGui(gateway: string): { gateway: { zeroDataRetention: true; disallowPromptTraining: true; only?: string[] } } {
  const chung = { zeroDataRetention: true as const, disallowPromptTraining: true as const };
  return { gateway: gateway.startsWith("deepseek/") ? { ...chung, only: ["baseten"] } : chung };
}
