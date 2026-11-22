// model-agent.ts — MH1 model-may-sang-haiku: model của từng agent chạy qua runAgent chọn bằng tệp agent/config/model-agent.json
// (cùng khuôn bảng PL30). Mã model phải thuộc danh sách đóng MODEL_DUYET (ADR-0007 sửa đổi 06/11); tệp sai thì dừng trước lời gọi
// đầu. Giá USD mỗi triệu token, dùng cho trần tiền mỗi lượt (Mạnh duyệt Cổng Phạm vi 21/11: 0,5 USD mỗi lượt enrich, 1 USD mỗi
// lượt judge). Đường gọi (Mạnh 22/11 «Anthropic thẳng»): mỗi model có `duong` như bảng của bộ đọc gộp — "gateway" (Vercel AI
// Gateway, kèm cờ không giữ dữ liệu, không huấn luyện của tuyChonGui) hay "anthropic" (API Anthropic thẳng, không có cờ theo lời
// gọi — Mạnh chấp nhận như đọc gộp); `tu_lui` true thì thiếu khoá hay gặp lớp dừng (hết tiền, khoá sai) lùi sang đường kế.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { DUONG, DUONG_ANTHROPIC, KHOA_DUONG, MODEL_DUYET, dsDuong, tuyChonGui, type Duong } from "../enrich/doc-gop-s03/cau-hinh.js";

export type { Duong };

export const DUONG_CAU_HINH = join(import.meta.dirname, "../../config/model-agent.json");

export type Gia = { vao: number; ra: number };
/** `duong`: các đường theo thứ tự thử; `tuLui`: lùi sang đường kế khi thiếu khoá hay gặp lớp dừng. */
export type ModelAgent = { khoa: string; gateway: string; gia: Gia; tranUsd: number; duong: Duong[]; tuLui: boolean };
type CauHinhModelAgent = {
  phien_ban: 1;
  mac_dinh: string;
  tu_lui?: boolean;
  model: Record<string, { gateway: string; gia_vao: number; gia_ra: number; duong?: Duong | Duong[] }>;
  agent: Record<string, { model: string; tran_usd: number }>;
};

/** Lỗi cấu hình model: lệnh gọi agent dừng trước lời gọi đầu, mã thoát 2 (AC-2). */
export class LoiCauHinhModel extends Error {
  constructor(msg: string) {
    super(`model-agent: ${msg}`);
    this.name = "LoiCauHinhModel";
  }
}

const banGhi = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const laSoKhongAm = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v) && v >= 0;

/** Kiểm bảng đã parse; sai thì ném LoiCauHinhModel gọi tên đúng chỗ sai. */
export function kiemCauHinhModel(x: unknown): CauHinhModelAgent {
  if (!banGhi(x)) throw new LoiCauHinhModel("tệp không phải object JSON");
  if (x.phien_ban !== 1) throw new LoiCauHinhModel(`phien_ban phải là 1, nhận ${JSON.stringify(x.phien_ban)}`);
  if (!banGhi(x.model) || Object.keys(x.model).length === 0) throw new LoiCauHinhModel("thiếu bảng model");
  for (const [k, m] of Object.entries(x.model)) {
    if (!banGhi(m)) throw new LoiCauHinhModel(`model ${k} không phải object`);
    if (typeof m.gateway !== "string" || !(MODEL_DUYET as readonly string[]).includes(m.gateway)) {
      throw new LoiCauHinhModel(`model ${k} dùng ${JSON.stringify(m.gateway)} ngoài danh sách duyệt (${MODEL_DUYET.join(", ")})`);
    }
    if (!laSoKhongAm(m.gia_vao) || !laSoKhongAm(m.gia_ra)) throw new LoiCauHinhModel(`model ${k} có giá thiếu hay âm`);
    const ds = dsDuong(m.duong);
    if (!ds.length || new Set(ds).size !== ds.length) throw new LoiCauHinhModel(`model ${k} có duong ${JSON.stringify(m.duong)} rỗng hay lặp`);
    for (const d of ds) {
      if (!(DUONG as readonly unknown[]).includes(d)) throw new LoiCauHinhModel(`model ${k} có duong ${JSON.stringify(d)} — chỉ ${DUONG.join(" | ")}`);
      if (d === "anthropic" && !DUONG_ANTHROPIC[m.gateway]) throw new LoiCauHinhModel(`model ${k} (${m.gateway}) không có đường anthropic`);
    }
  }
  if (x.tu_lui !== undefined && typeof x.tu_lui !== "boolean") throw new LoiCauHinhModel(`tu_lui phải là true/false, nhận ${JSON.stringify(x.tu_lui)}`);
  if (typeof x.mac_dinh !== "string" || !(x.mac_dinh in x.model)) {
    throw new LoiCauHinhModel(`mac_dinh ${JSON.stringify(x.mac_dinh)} không phải khoá model đã khai`);
  }
  if (!banGhi(x.agent)) throw new LoiCauHinhModel("thiếu bảng agent");
  for (const [ten, a] of Object.entries(x.agent)) {
    if (!banGhi(a)) throw new LoiCauHinhModel(`agent ${ten} không phải object`);
    if (typeof a.model !== "string" || !(a.model in x.model)) {
      throw new LoiCauHinhModel(`agent ${ten} gán model ${JSON.stringify(a.model)} không phải khoá model đã khai`);
    }
    if (!laSoKhongAm(a.tran_usd)) throw new LoiCauHinhModel(`agent ${ten} có tran_usd thiếu hay âm`);
  }
  return x as unknown as CauHinhModelAgent;
}

/** Nạp tệp cấu hình (mặc định tệp của kho; biến MODEL_AGENT_CAU_HINH trỏ tệp khác — dùng cho test). */
export function napCauHinhModel(duong: string = process.env.MODEL_AGENT_CAU_HINH || DUONG_CAU_HINH): CauHinhModelAgent {
  let chu: string;
  try {
    chu = readFileSync(duong, "utf8");
  } catch {
    throw new LoiCauHinhModel(`không đọc được tệp ${duong}`);
  }
  let x: unknown;
  try {
    x = JSON.parse(chu);
  } catch (e) {
    throw new LoiCauHinhModel(`tệp ${duong} không phải JSON (${(e as Error).message})`);
  }
  return kiemCauHinhModel(x);
}

/** Model, giá và trần mặc định của một agent; agent không có khoá trong tệp → LoiCauHinhModel. */
export function modelCuaAgent(ten: string, cauHinh: CauHinhModelAgent = napCauHinhModel()): ModelAgent {
  const a = cauHinh.agent[ten];
  if (!a) throw new LoiCauHinhModel(`agent ${ten} không có khoá trong tệp cấu hình`);
  const m = cauHinh.model[a.model];
  return {
    khoa: a.model, gateway: m.gateway, gia: { vao: m.gia_vao, ra: m.gia_ra }, tranUsd: a.tran_usd,
    duong: dsDuong(m.duong), tuLui: cauHinh.tu_lui === true,
  };
}

/** Thiếu khoá: không còn đường nào gọi được — lệnh dừng trước lời gọi đầu, mã thoát 5 (AC-2). */
export class LoiThieuKhoa extends Error {
  constructor(readonly khoa: string[]) {
    super(`model-agent: thiếu khoá ${khoa.join(", ")} — không gọi model`);
    this.name = "LoiThieuKhoa";
  }
}

/** Đường gọi được theo khoá có trong môi trường. Không tự lùi: chỉ đường đầu (thiếu khoá của nó → rỗng). Tự lùi: mọi đường có
 * khoá, giữ thứ tự. */
export function duongCoKhoa(m: Pick<ModelAgent, "duong" | "tuLui">, env: NodeJS.ProcessEnv = process.env): Duong[] {
  const co = (d: Duong) => !!env[KHOA_DUONG[d]];
  return m.tuLui ? m.duong.filter(co) : co(m.duong[0]) ? [m.duong[0]] : [];
}

/** Tên biến khoá còn thiếu khi không đường nào gọi được (rỗng = đủ), xếp theo tên. */
export function khoaThieuAgent(m: Pick<ModelAgent, "duong" | "tuLui">, env: NodeJS.ProcessEnv = process.env): string[] {
  if (duongCoKhoa(m, env).length) return [];
  return [...new Set((m.tuLui ? m.duong : [m.duong[0]]).map((d) => KHOA_DUONG[d]))].sort();
}

/** Tuỳ chọn gửi kèm lời gọi Gateway của agent (cờ không giữ dữ liệu, không huấn luyện) — cùng hàm của PL30. */
export const tuyChonGateway = (gateway: string) => tuyChonGui(gateway);

/** Chi phí USD của một lời gọi theo token và giá mỗi triệu token. */
export const chiPhiUsd = (gia: Gia, vao: number | null, ra: number | null): number =>
  ((vao ?? 0) * gia.vao + (ra ?? 0) * gia.ra) / 1_000_000;

/** Trần token ra mỗi lời gọi — cùng maxOutputTokens của runAgent (modelParams), dùng ước tối đa của lời kế. */
export const TRAN_TOKEN_RA = 4096;

/** Ước tối đa token vào từ chữ đầu vào: một token ít nhất một byte UTF-8 nên số byte là cận trên. */
export const uocTokenVao = (chu: string): number => Buffer.byteLength(chu, "utf8");

export type Tran = {
  readonly tranUsd: number;
  daChi(): number;
  /** Đã chi + ước tối đa của lời gọi kế (token vào theo chữ, token ra theo trần) không vượt trần. */
  coTheGoi(chuVao: string): boolean;
  ghi(vao: number | null, ra: number | null): void;
  hetTran(): boolean;
};

/** Bộ đếm trần tiền của một lượt (AC-5). Lượt dừng trước lời gọi đầu tiên mà coTheGoi trả false. */
export function taoTran(tranUsd: number, gia: Gia): Tran {
  let chi = 0;
  let het = false;
  return {
    tranUsd,
    daChi: () => chi,
    coTheGoi(chuVao) {
      const ok = chi + chiPhiUsd(gia, uocTokenVao(chuVao), TRAN_TOKEN_RA) <= tranUsd;
      if (!ok) het = true;
      return ok;
    },
    ghi(vao, ra) {
      chi += chiPhiUsd(gia, vao, ra);
    },
    hetTran: () => het,
  };
}

/** Đọc --tran-usd của argv; vắng thì trần mặc định của agent trong tệp cấu hình. Giá trị sai → LoiCauHinhModel. */
export function tranTuArgv(argv: string[], macDinh: number): number {
  const i = argv.indexOf("--tran-usd");
  if (i < 0) return macDinh;
  const v = Number(argv[i + 1]);
  if (!Number.isFinite(v) || v < 0) throw new LoiCauHinhModel(`--tran-usd phải là số không âm, nhận ${JSON.stringify(argv[i + 1])}`);
  return v;
}
