/**
 * Cấu hình của bộ thu S17 (mốc ngày 1, claudedp-2411-20).
 *
 * Máy chủ và đường API thật là TẦNG A: đọc từ tệp local ngoài git (khuôn S08), không nằm trong code.
 * Code chỉ gọi đường theo VAI; mỗi vai khai trước tên tham số được nhận. Đường có đoạn `cp` (biến thể
 * trả phí theo lượt) bị từ chối ngay khi nạp cấu hình — bộ thu không bao giờ gọi biến thể đó.
 */

export type Role =
  | "province-catalog"
  | "term-catalog"
  | "full-config"
  | "attribute-dictionary"
  | "legal-docs"
  | "asset-type"
  | "confidence"
  | "land-purpose"
  | "land-price-by-district"
  | "project-list"
  | "project-detail"
  | "building-tree"
  | "gallery"
  | "apartment-list"
  | "apartment-detail"
  | "parcel-profile"
  | "parcel-suggest"
  | "project-suggest"
  | "market-price"
  | "data-available"
  | "balance";

export type RoleSpec = {
  host: "api" | "agent";
  /** Tên tham số chuỗi truy vấn được nhận; tên khác → từ chối trước khi gửi. */
  query: readonly string[];
  /** Tên đặt chỗ `{tên}` trong đường; bắt buộc đủ. */
  path?: readonly string[];
  /** Lời gọi cần phiên đăng nhập; lỗi mạng được đối chiếu với một lời công khai để biết hết phiên. */
  needsSession: boolean;
};

export const ROLES: Record<Role, RoleSpec> = {
  "province-catalog": { host: "api", query: ["area_code"], needsSession: false },
  "term-catalog": { host: "api", query: ["term"], needsSession: false },
  "full-config": { host: "api", query: [], needsSession: false },
  "attribute-dictionary": { host: "api", query: ["property_type"], needsSession: false },
  "legal-docs": { host: "api", query: [], path: ["type"], needsSession: false },
  "asset-type": { host: "api", query: [], needsSession: false },
  confidence: { host: "api", query: [], needsSession: false },
  "land-purpose": { host: "api", query: [], needsSession: false },
  "land-price-by-district": { host: "api", query: [], path: ["districtCode"], needsSession: false },
  "project-list": { host: "api", query: ["query", "page", "size", "map"], needsSession: true },
  "project-detail": { host: "api", query: ["for_house"], path: ["id"], needsSession: true },
  "building-tree": { host: "api", query: [], path: ["id"], needsSession: true },
  gallery: { host: "api", query: [], path: ["id"], needsSession: true },
  "apartment-list": { host: "api", query: ["thap", "text", "project_id", "page", "size"], needsSession: true },
  "apartment-detail": { host: "api", query: ["project_id", "ma_can"], needsSession: true },
  "parcel-profile": { host: "api", query: ["loaiTimKiem", "latitude", "longitude"], needsSession: true },
  "parcel-suggest": { host: "api", query: ["term", "size"], needsSession: true },
  "project-suggest": { host: "api", query: ["term", "for_house", "size"], needsSession: true },
  "market-price": { host: "api", query: ["lat", "lng"], needsSession: true },
  "data-available": { host: "api", query: [], needsSession: true },
  balance: { host: "agent", query: [], needsSession: true },
};

/** Vai công khai, nhẹ — đối chiếu khi lời kiểm phiên cũng gặp lỗi mạng. */
export const PROBE_ROLE: Role = "asset-type";
/** Vai cần phiên, nhẹ — hỏi đầu tiên khi một lời cần phiên gặp lỗi mạng: chạy được nghĩa là phiên còn sống. */
export const SESSION_PROBE_ROLE: Role = "data-available";

/** Vai mà mỗi pha sẽ gọi (không kể lời đối chiếu và số dư). */
export const PHASE_ROLES: Record<"reference" | "tile-mask" | "projects" | "session-check" | "apartments" | "parcels" | "lowrise" | "apartments-all" | "images", readonly Role[]> = {
  // Mốc mở rộng: pha ảnh chỉ tải tệp tĩnh, không gọi API nào của nguồn.
  images: [],
  "apartments-all": ["apartment-list", "apartment-detail"],
  parcels: ["parcel-profile", "parcel-suggest"],
  lowrise: ["project-suggest", "project-detail"],
  apartments: ["project-detail", "apartment-list", "apartment-detail"],
  reference: ["full-config", "province-catalog", "attribute-dictionary", "legal-docs", "asset-type", "confidence", "land-purpose", "land-price-by-district"],
  "tile-mask": ["full-config"],
  projects: ["project-list", "project-detail", "building-tree", "gallery"],
  "session-check": ["data-available"],
};

export type S17Config = {
  hosts: { api: string; agent: string; web: string };
  paths: Partial<Record<Role, string>>;
  /** Tên cookie phiên trong tab của nguồn — chỉ pha cần phiên dùng; giá trị cookie không bao giờ rời trang. */
  session?: { cookieName: string };
};

export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfigError";
  }
}

const trimSlash = (s: string) => s.replace(/\/+$/, "");

const isHttpUrl = (s: string): boolean => {
  try {
    const u = new URL(s);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
};

/** Đường hợp lệ: bắt đầu bằng `/`, không `..`, không dấu cách, không `?`/`#`, không đoạn nào tên `cp`. */
function checkPath(role: string, path: unknown): string {
  if (typeof path !== "string" || !path.startsWith("/")) throw new ConfigError(`đường của vai "${role}" phải bắt đầu bằng "/"`);
  if (/[\s?#]/.test(path) || path.split("/").includes("..")) throw new ConfigError(`đường của vai "${role}" có ký tự không được phép`);
  if (path.split("/").some((seg) => seg.toLowerCase() === "cp")) throw new ConfigError(`đường của vai "${role}" có đoạn trả phí theo lượt — bộ thu S17 không gọi`);
  return path;
}

/** Nạp và kiểm cấu hình từ chuỗi JSON của tệp local. */
export function loadConfig(text: string): S17Config {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch (e) {
    throw new ConfigError(`cấu hình S17 không đọc được JSON: ${String(e)}`);
  }
  const obj = raw as { hosts?: Record<string, unknown>; paths?: Record<string, unknown>; session?: { cookieName?: unknown } | null } | null;
  if (!obj || typeof obj !== "object") throw new ConfigError("cấu hình S17 phải là một đối tượng");
  const hosts: Record<string, string> = {};
  for (const key of ["api", "agent", "web"] as const) {
    const v = obj.hosts?.[key];
    // Chỉ nhận https: phiên đi trong header của lời gọi tới máy chủ này, một chỗ sai là phiên đi dạng rõ.
    if (typeof v !== "string" || !/^https:\/\/[^\s/?#]+(?:[/?][^\s]*)?$/.test(v)) throw new ConfigError(`thiếu máy chủ "${key}" hợp lệ (https) trong cấu hình S17`);
    hosts[key] = trimSlash(v);
  }
  const paths: Partial<Record<Role, string>> = {};
  for (const [role, path] of Object.entries(obj.paths ?? {})) {
    if (!(role in ROLES)) throw new ConfigError(`vai lạ trong cấu hình S17: "${role}"`);
    paths[role as Role] = checkPath(role, path);
  }
  let session: { cookieName: string } | undefined;
  if (obj.session !== undefined) {
    const name: unknown = obj.session?.cookieName;
    if (typeof name !== "string" || !/^[A-Za-z0-9_-]{1,64}$/.test(name)) {
      throw new ConfigError("session.cookieName trong cấu hình S17 phải là một tên cookie hợp lệ");
    }
    session = { cookieName: name };
  }
  return { hosts: { api: hosts.api, agent: hosts.agent, web: hosts.web }, paths, ...(session ? { session } : {}) };
}

/** Đường (khuôn) của một vai. Thiếu thì dừng: không gọi mò. Kiểm lại đoạn trả phí và đặt chỗ. */
export function rolePath(config: S17Config, role: Role): string {
  const template = config.paths[role];
  if (template === undefined) throw new ConfigError(`cấu hình local S17 chưa khai đường cho vai "${role}"`);
  checkPath(role, template);
  const wanted = new Set(ROLES[role].path ?? []);
  for (const m of template.matchAll(/\{(\w+)\}/g)) {
    if (!wanted.delete(m[1])) throw new ConfigError(`đường của vai "${role}" có đặt chỗ lạ "{${m[1]}}"`);
  }
  if (wanted.size) throw new ConfigError(`đường của vai "${role}" thiếu đặt chỗ "${[...wanted][0]}"`);
  return template;
}
