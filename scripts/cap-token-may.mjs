#!/usr/bin/env node
// cap-token-may.mjs — cấp hoặc thu hồi token máy theo tên (TV4 `so-lenh-bo-ap`, ADR-0015 §2) trên DB mà DATABASE_URL trỏ.
//
//   DATABASE_URL=… node scripts/cap-token-may.mjs --name may-thu-1 --scope ops:pull   # in token MỘT lần ra stdout
//   DATABASE_URL=… node scripts/cap-token-may.mjs --thu-hoi may-thu-1                  # đặt revoked_at
//
// DB chỉ giữ băm sha256 hex của token; token không được ghi vào tệp hay log nào. Cấp token thật cho cloud là việc của người
// (ADR-0015 «Việc của người»): người chạy lệnh tự chép token vào ~/.oneinvest/cloud.env (OPS_MACHINE_TOKEN) của máy thu.
// Tên trùng một token còn hiệu lực → thoát 2 (thu hồi trước rồi cấp lại). Mượn `pg` từ app/ (gốc kho không có node_modules).
import { createHash, randomBytes } from "node:crypto";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pg = createRequire(path.join(REPO, "app", "package.json"))("pg");

const doc = (ten) => {
  const i = process.argv.indexOf(ten);
  return i > 0 ? process.argv[i + 1] : undefined;
};

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("cap-token-may: thiếu DATABASE_URL");
    return 2;
  }
  const ten = doc("--name");
  const thuHoi = doc("--thu-hoi");
  if (!ten === !thuHoi) {
    console.error("cap-token-may: dùng đúng một trong --name <tên> --scope <s,…> hoặc --thu-hoi <tên>");
    return 2;
  }
  const c = new pg.Client({ connectionString: url });
  await c.connect();
  try {
    if (thuHoi) {
      const r = await c.query(`UPDATE machine_tokens SET revoked_at = now() WHERE name = $1 AND revoked_at IS NULL`, [thuHoi]);
      if (r.rowCount === 0) {
        console.error(`cap-token-may: không có token còn hiệu lực tên ${thuHoi}`);
        return 2;
      }
      console.error(`cap-token-may: đã thu hồi ${thuHoi}`);
      return 0;
    }
    if (!/^[a-z0-9][a-z0-9-]{1,62}$/.test(ten)) {
      console.error("cap-token-may: tên chỉ gồm chữ thường, số, gạch ngang");
      return 2;
    }
    const scopes = (doc("--scope") ?? "").split(",").map((s) => s.trim()).filter(Boolean);
    if (scopes.length === 0) {
      console.error("cap-token-may: thiếu --scope");
      return 2;
    }
    const token = `om_${randomBytes(32).toString("hex")}`;
    const bam = createHash("sha256").update(token).digest("hex");
    const r = await c.query(
      `INSERT INTO machine_tokens (name, token_hash, scopes) VALUES ($1, $2, $3)
       ON CONFLICT (name) DO UPDATE SET token_hash = EXCLUDED.token_hash, scopes = EXCLUDED.scopes,
              created_at = now(), revoked_at = NULL, last_used_at = NULL
       WHERE machine_tokens.revoked_at IS NOT NULL`,
      [ten, bam, scopes],
    );
    if (r.rowCount === 0) {
      console.error(`cap-token-may: tên ${ten} đang có token còn hiệu lực — thu hồi trước`);
      return 2;
    }
    process.stdout.write(`${token}\n`);
    console.error(`cap-token-may: đã cấp ${ten} (${scopes.join(", ")}) — token in một lần ở stdout`);
    return 0;
  } finally {
    await c.end();
  }
}

main().then((code) => process.exit(code), (e) => {
  console.error(`cap-token-may: ${e.message}`);
  process.exit(1);
});
