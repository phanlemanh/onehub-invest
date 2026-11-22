// gateway-gia.ts — MH1 model-may-sang-haiku: máy giả Vercel AI Gateway và máy giả cổng MTPLX cho test, chạy trong tiến trình
// test, không gọi mạng. Gateway giả ghi từng yêu cầu (url, mã model ở header ai-language-model-id, thân JSON) và trả lời theo
// hàng đợi kịch bản (chữ trả lời, token vào, token ra). Máy giả MTPLX chỉ đếm yêu cầu — sau MH1 nó phải nhận 0.
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";

export type YeuCau = { url: string; model: string; than: Record<string, unknown>; thanChu: string };
export type TraLoi = { text: string; vao?: number; ra?: number; status?: number };

export type MayGia = {
  url: string;
  yeuCau: YeuCau[];
  /** Kịch bản: mỗi yêu cầu lấy một phần tử đầu hàng; hàng rỗng → `macDinh`. */
  hang: TraLoi[];
  macDinh: TraLoi;
  datLai(): void;
  dong(): Promise<void>;
};

const nghe = async (sv: Server) => {
  await new Promise<void>((r) => sv.listen(0, "127.0.0.1", r));
  return (sv.address() as AddressInfo).port;
};

/** Gateway giả theo khuôn trả lời của provider gateway (ai 7): content · finishReason · usage. */
export async function moGateway(macDinh: TraLoi = { text: "{}", vao: 100, ra: 20 }): Promise<MayGia> {
  // Một đối tượng duy nhất: máy chủ đọc chính `may.macDinh`, `may.hang` — test gán lại chúng thì máy chủ thấy ngay.
  const may = {
    url: "",
    dong: async () => {},
    yeuCau: [],
    hang: [],
    macDinh,
    datLai() {
      may.yeuCau.length = 0;
      may.hang.length = 0;
    },
  } as MayGia;
  const sv = createServer((req, res) => {
    let s = "";
    req.on("data", (d) => (s += d));
    req.on("end", () => {
      let than: Record<string, unknown> = {};
      try {
        than = JSON.parse(s);
      } catch {
        /* thân không phải JSON — giữ chữ thô */
      }
      may.yeuCau.push({ url: req.url ?? "", model: String(req.headers["ai-language-model-id"] ?? ""), than, thanChu: s });
      const p = may.hang.shift() ?? may.macDinh;
      res.setHeader("content-type", "application/json");
      if (p.status) {
        res.writeHead(p.status);
        res.end(JSON.stringify({ error: { message: "gia: loi", type: "internal_server_error" } }));
        return;
      }
      const vao = p.vao ?? 100;
      const ra = p.ra ?? 20;
      res.end(JSON.stringify({
        content: [{ type: "text", text: p.text }],
        finishReason: { unified: "stop", raw: "stop" },
        usage: { inputTokens: { total: vao, noCache: vao }, outputTokens: { total: ra, text: ra } },
        warnings: [],
      }));
    });
  });
  const cong = await nghe(sv);
  may.url = `http://127.0.0.1:${cong}/gw`;
  may.dong = () => new Promise((r) => sv.close(() => r()));
  return may;
}

/** Máy giả cổng MTPLX: đếm mọi yêu cầu, trả 500. Sau MH1 không lệnh nào được gọi tới nó. */
export async function moMtplx(): Promise<{ url: string; dem: () => number; dong: () => Promise<void> }> {
  let n = 0;
  const sv = createServer((req, res) => {
    req.resume();
    req.on("end", () => {
      n += 1;
      res.writeHead(500, { "content-type": "application/json" });
      res.end(JSON.stringify({ error: { message: "mtplx gia" } }));
    });
  });
  const cong = await nghe(sv);
  return { url: `http://127.0.0.1:${cong}/v1`, dem: () => n, dong: () => new Promise((r) => sv.close(() => r())) };
}

/** Chữ prompt và system của một yêu cầu Gateway (gom mọi phần text trong thân). */
export function chuCuaYeuCau(y: YeuCau): string {
  const out: string[] = [];
  const di = (v: unknown) => {
    if (typeof v === "string") out.push(v);
    else if (Array.isArray(v)) v.forEach(di);
    else if (v && typeof v === "object") for (const [k, x] of Object.entries(v)) if (k !== "providerOptions") di(x);
  };
  di(y.than.prompt ?? y.than);
  return out.join("\n");
}

/** Anthropic giả theo khuôn Messages API (MH1, đường thẳng): SDK @anthropic-ai/sdk thật trỏ tới qua ANTHROPIC_BASE_URL = `url`.
 * Ghi từng yêu cầu (mã model trong thân), trả theo hàng đợi kịch bản; `status` → thân lỗi `{type:"error", error:{type}}` với
 * `kieu` (mặc định theo mã: 402 billing_error, 401 authentication_error, còn lại api_error). `retry-after-ms: 0` để SDK thử lại
 * ngay với 429/5xx (402/401 SDK không thử lại). `toolUse` trả một khối tool_use (stop_reason tool_use) thay cho chữ. */
export type TraLoiAnthropic = TraLoi & { kieu?: string; toolUse?: { name: string; input: Record<string, unknown> } };
export type MayAnthropic = Omit<MayGia, "hang" | "macDinh"> & { hang: TraLoiAnthropic[]; macDinh: TraLoiAnthropic };
export async function moAnthropic(macDinh: TraLoiAnthropic = { text: "{}", vao: 100, ra: 20 }): Promise<MayAnthropic> {
  const may = {
    url: "",
    dong: async () => {},
    yeuCau: [],
    hang: [],
    macDinh,
    datLai() {
      may.yeuCau.length = 0;
      may.hang.length = 0;
    },
  } as MayAnthropic;
  let soTin = 0;
  const sv = createServer((req, res) => {
    let s = "";
    req.on("data", (d) => (s += d));
    req.on("end", () => {
      let than: Record<string, unknown> = {};
      try {
        than = JSON.parse(s);
      } catch {
        /* giữ chữ thô */
      }
      may.yeuCau.push({ url: req.url ?? "", model: String(than.model ?? ""), than, thanChu: s });
      const p = may.hang.shift() ?? may.macDinh;
      res.setHeader("content-type", "application/json");
      res.setHeader("retry-after-ms", "0");
      if (p.status) {
        const kieu = p.kieu ?? (p.status === 402 ? "billing_error" : p.status === 401 ? "authentication_error" : "api_error");
        res.writeHead(p.status);
        res.end(JSON.stringify({ type: "error", error: { type: kieu, message: "anthropic gia: loi" } }));
        return;
      }
      soTin += 1;
      const content = p.toolUse
        ? [{ type: "tool_use", id: `toolu_gia_${soTin}`, name: p.toolUse.name, input: p.toolUse.input }]
        : [{ type: "text", text: p.text }];
      res.end(JSON.stringify({
        id: `msg_gia_${soTin}`, type: "message", role: "assistant", model: String(than.model ?? ""), content,
        stop_reason: p.toolUse ? "tool_use" : "end_turn", stop_sequence: null,
        usage: { input_tokens: p.vao ?? 100, output_tokens: p.ra ?? 20 },
      }));
    });
  });
  const cong = await nghe(sv);
  may.url = `http://127.0.0.1:${cong}`;
  may.dong = () => new Promise((r) => sv.close(() => r()));
  return may;
}
