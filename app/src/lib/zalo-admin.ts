import { execFile } from "node:child_process";
import { copyFile, readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";

/**
 * Quản trị tài khoản zalouser cho /ops (multi-account V1).
 *
 * Bất biến hệ thống (user chốt 2026-10-20): **1 nhóm – 1 tài khoản** — không
 * hai tài khoản cùng bật 1 nhóm (tránh trùng dữ liệu + giảm rủi ro platform).
 *
 * Semantics config (đọc từ source OpenClaw account-helpers): merge account ≡
 * shallow spread channel-level → account KHÔNG có `groups` riêng sẽ kế thừa
 * groups của channel. Vì vậy mọi tài khoản mới luôn ghi `groups` tường minh.
 */

const OPENCLAW = path.join(homedir(), ".openclaw/bin/openclaw");
const CONFIG = path.join(homedir(), ".openclaw/openclaw.json");
const QR_DIR = "/tmp/openclaw";

const run = promisify(execFile);
const SLUG = /^[a-z0-9][a-z0-9-]{0,30}$/;

type GroupEntry = { enabled?: boolean; allow?: boolean };
type AccountCfg = {
  enabled?: boolean;
  profile?: string;
  name?: string;
  groupPolicy?: string;
  groups?: Record<string, GroupEntry>;
};
type ZalouserCfg = {
  enabled?: boolean;
  defaultAccount?: string;
  groups?: Record<string, GroupEntry>;
  accounts?: Record<string, AccountCfg>;
};

type Root = { channels?: { zalouser?: ZalouserCfg } };

async function readCfg(): Promise<Root> {
  return JSON.parse(await readFile(CONFIG, "utf8")) as Root;
}

async function writeCfg(cfg: Root): Promise<void> {
  await copyFile(CONFIG, `${CONFIG}.bak-${Date.now()}`);
  await writeFile(CONFIG, JSON.stringify(cfg, null, 2));
}

export type ZaloAccount = {
  accountId: string;
  name: string | null;
  profile: string;
  explicitGroups: boolean; // có groups riêng (không kế thừa channel)
  enabledGroups: string[]; // hiệu dụng sau kế thừa
};

/** Groups hiệu dụng của một account theo đúng semantics merge của OpenClaw. */
function effectiveGroups(z: ZalouserCfg | undefined, accountId: string): {
  explicit: boolean;
  groups: Record<string, GroupEntry>;
} {
  if (!z) return { explicit: false, groups: {} };
  if (accountId === "default") {
    // default hiện dùng groups cấp channel (layout đang chạy) — tôn trọng
    return { explicit: true, groups: z.groups ?? {} };
  }
  const acc = z.accounts?.[accountId];
  if (acc?.groups) return { explicit: true, groups: acc.groups };
  return { explicit: false, groups: z.groups ?? {} }; // kế thừa!
}

function enabledKeys(groups: Record<string, GroupEntry>): string[] {
  return Object.entries(groups)
    .filter(([, v]) => (v as { allow?: boolean }).allow !== false && v.enabled !== false)
    .map(([k]) => k);
}

export async function listZaloAccounts(): Promise<ZaloAccount[]> {
  const cfg = await readCfg();
  const z = cfg.channels?.zalouser;
  const ids = new Set<string>(["default"]);
  for (const id of Object.keys(z?.accounts ?? {})) ids.add(id);
  return [...ids].map((accountId) => {
    const eff = effectiveGroups(z, accountId);
    const acc = accountId === "default" ? undefined : z?.accounts?.[accountId];
    return {
      accountId,
      name: acc?.name ?? null,
      profile: acc?.profile ?? (accountId === "default" ? "default" : accountId),
      explicitGroups: eff.explicit,
      enabledGroups: enabledKeys(eff.groups),
    };
  });
}

export async function createZaloAccount(accountId: string, name?: string): Promise<ZaloAccount> {
  if (!SLUG.test(accountId)) throw new Error("id chỉ gồm a-z 0-9 và gạch ngang (≤31 ký tự)");
  const cfg = await readCfg();
  const z = (cfg.channels ??= {}).zalouser ??= {};
  if (z.accounts?.[accountId]) throw new Error(`tài khoản "${accountId}" đã tồn tại`);
  // groups tường minh (rỗng) — chặn kế thừa 4 nhóm của default (bất biến 1-1)
  ((z.accounts ??= {})[accountId] = {
    enabled: true,
    profile: accountId,
    ...(name ? { name } : {}),
    groupPolicy: "allowlist",
    groups: {},
  });
  await writeCfg(cfg);
  const list = await listZaloAccounts();
  return list.find((a) => a.accountId === accountId)!;
}

export async function deleteZaloAccount(accountId: string): Promise<void> {
  if (accountId === "default") throw new Error("không xoá được tài khoản default");
  const cfg = await readCfg();
  const z = cfg.channels?.zalouser;
  if (!z?.accounts?.[accountId]) return;
  delete z.accounts[accountId];
  await writeCfg(cfg);
}

/**
 * Bật/tắt nhóm cho account với bất biến 1 nhóm – 1 tài khoản.
 * Trả về owner xung đột khi vi phạm (caller trả 409).
 */
export async function setZaloGroupEnabled(
  accountId: string,
  groupId: string,
  enabled: boolean,
): Promise<{ conflictWith: string | null }> {
  const cfg = await readCfg();
  const z = (cfg.channels ??= {}).zalouser ??= {};
  const accounts = await listZaloAccounts();
  const me = accounts.find((a) => a.accountId === accountId);
  if (!me) throw new Error(`tài khoản "${accountId}" chưa tồn tại`);
  if (enabled) {
    const owner = accounts.find(
      (a) => a.accountId !== accountId && a.enabledGroups.includes(groupId),
    );
    if (owner) return { conflictWith: owner.accountId };
  }
  if (accountId === "default") {
    ((z.groups ??= {})[groupId] ??= {}).enabled = enabled;
  } else {
    const acc = (z.accounts ??= {})[accountId] ??= { enabled: true, profile: accountId };
    ((acc.groups ??= {})[groupId] ??= {}).enabled = enabled;
  }
  await writeCfg(cfg);
  return { conflictWith: null };
}

// ---------- Login QR (spawn CLI detached) ----------

type LoginHandle = { child: import("node:child_process").ChildProcess; startedAt: number };
const logins = new Map<string, LoginHandle>();

function qrFile(accountId: string): string {
  return path.join(QR_DIR, `openclaw-zalouser-qr-${accountId === "default" ? "default" : accountId}.png`);
}

export async function startZaloLogin(
  accountId: string,
): Promise<{ qrBase64: string | null; startedAt: string }> {
  const existing = logins.get(accountId);
  if (existing && existing.child.exitCode === null) {
    const b64 = await readQr(accountId);
    return { qrBase64: b64, startedAt: new Date(existing.startedAt).toISOString() };
  }
  const { spawn } = await import("node:child_process");
  const proc = spawn(OPENCLAW, ["channels", "login", "--channel", "zalouser", "--account", accountId], {
    detached: true,
    stdio: "ignore",
  });
  proc.unref();
  logins.set(accountId, { child: proc, startedAt: Date.now() });
  // QR sinh không tức thì — chờ tối đa 20s
  for (let i = 0; i < 20; i++) {
    await new Promise((r) => setTimeout(r, 1000));
    const b64 = await readQr(accountId);
    if (b64) return { qrBase64: b64, startedAt: new Date().toISOString() };
  }
  return { qrBase64: null, startedAt: new Date().toISOString() };
}

async function readQr(accountId: string): Promise<string | null> {
  try {
    const buf = await readFile(qrFile(accountId));
    return buf.toString("base64");
  } catch {
    return null;
  }
}

export async function zaloLoginStatus(accountId: string): Promise<{
  qrBase64: string | null;
  processAlive: boolean;
  connected: boolean | null;
}> {
  const handle = logins.get(accountId);
  const qrBase64 = await readQr(accountId);
  let connected: boolean | null = null;
  try {
    const { stdout } = await run(OPENCLAW, ["channels", "status"], { timeout: 15000 });
    // status in "Zalo Personal <accountId>: ..." — match đúng account để không
    // nhầm connected của account khác khi đa tài khoản
    const re = new RegExp(`Zalo Personal(\\s+${accountId})?\\s*:[^\\n]*connected`);
    connected = re.test(stdout);
  } catch {
    /* gateway không trả lời — để null */
  }
  return {
    qrBase64,
    processAlive: !!handle && handle.child.exitCode === null,
    connected,
  };
}

export async function cancelZaloLogin(accountId: string): Promise<void> {
  const handle = logins.get(accountId);
  if (handle && handle.child.exitCode === null) handle.child.kill("SIGTERM");
  logins.delete(accountId);
}

// ---------- Directory nhóm (membership thật) ----------

export type ZaloGroupDir = { groupId: string; name: string };

export async function listZaloGroupDirectory(accountId: string): Promise<ZaloGroupDir[]> {
  const { stdout } = await run(
    OPENCLAW,
    ["directory", "groups", "list", "--channel", "zalouser", ...(accountId !== "default" ? ["--account", accountId] : [])],
    { timeout: 20000 },
  );
  // bảng │ ID │ Name │
  const rows: ZaloGroupDir[] = [];
  for (const m of stdout.matchAll(/│\s*(group:\S+)\s*│\s*([^│]+?)\s*│/g)) {
    rows.push({ groupId: m[1], name: m[2] });
  }
  return rows;
}
