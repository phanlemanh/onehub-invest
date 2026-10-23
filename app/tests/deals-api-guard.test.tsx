// deals-api-guard.test.tsx — canCallOpsApi (cổng của GET /api/v1/deals khi tạm đóng): bearer
// OPS_API_TOKEN hoặc phiên ops; token đọc lúc gọi. Hồ sơ nghiệm thu: _acceptance/deals-api-tam-dong
// (AC-1…AC-4). Tên ca mở đầu bằng mã AC để evals bám.
import { test } from "node:test";
import assert from "node:assert/strict";

import type { User } from "../src/lib/auth";
import { canCallOpsApi } from "../src/lib/ops-access";

const user = (role: User["role"], email = `${role}@x.vn`): User => ({ id: "1", email, plan: "free", role });
const req = (auth?: string) =>
  new Request("http://localhost:3456/api/v1/deals", { headers: auth ? { authorization: auth } : {} });
const spy = (u: User | null) => {
  const s = { calls: 0, fn: async () => (s.calls++, u) };
  return s;
};
const none = async () => null;

// Gán/xoá OPS_API_TOKEN + OPS_EMAILS trong thân fn rồi khôi phục (undefined = xoá biến).
async function withEnv<T>(token: string | undefined, fn: () => Promise<T>, emails?: string): Promise<T> {
  const old = { t: process.env.OPS_API_TOKEN, e: process.env.OPS_EMAILS };
  const set = (k: "OPS_API_TOKEN" | "OPS_EMAILS", v: string | undefined) => {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  };
  set("OPS_API_TOKEN", token);
  set("OPS_EMAILS", emails);
  try {
    return await fn();
  } finally {
    set("OPS_API_TOKEN", old.t);
    set("OPS_EMAILS", old.e);
  }
}

test("AC-1 khách: không bearer, không phiên → không qua", async () => {
  assert.equal(await withEnv("T", () => canCallOpsApi(req(), none)), false);
  // Đối chứng cùng env: bearer đúng thì qua.
  assert.equal(await withEnv("T", () => canCallOpsApi(req("Bearer T"), none)), true);
});

test("AC-2 bearer đúng → qua, không gọi getUser", async () => {
  const s = spy(user("user"));
  assert.equal(await withEnv("T", () => canCallOpsApi(req("Bearer T"), s.fn)), true);
  assert.equal(s.calls, 0);
});

test("AC-3 bearer sai → không qua", async () => {
  assert.equal(await withEnv("T", () => canCallOpsApi(req("Bearer X"), none)), false);
});

test("AC-3 token máy chủ thiếu: 'Bearer ' và 'Bearer undefined' → không qua", async () => {
  for (const token of [undefined, ""]) {
    for (const h of ["Bearer ", "Bearer undefined"]) {
      assert.equal(await withEnv(token, () => canCallOpsApi(req(h), none)), false, `token=${token} header=${h}`);
    }
  }
});

test("AC-3 token đọc lúc gọi: xoá env giữa chừng → Bearer T không qua", async () => {
  assert.equal(await withEnv("T", () => canCallOpsApi(req("Bearer T"), none)), true);
  assert.equal(await withEnv(undefined, () => canCallOpsApi(req("Bearer T"), none)), false);
});

test("AC-3 scheme viết thường / thừa khoảng trắng → không qua", async () => {
  // Khoảng trắng đầu/cuối giá trị header do Headers của Fetch cắt sẵn (chuẩn HTTP) — không phải ca ở đây.
  for (const h of ["bearer T", "Bearer  T", "BearerT"]) {
    assert.equal(await withEnv("T", () => canCallOpsApi(req(h), none)), false, h);
  }
});

test("AC-4 phiên: ops/admin/email trong OPS_EMAILS qua; user, null không qua", async () => {
  const rows: [User | null, string | undefined, boolean, string][] = [
    [user("ops"), undefined, true, "role=ops"],
    [user("admin"), undefined, true, "role=admin"],
    [user("user", "a@x.vn"), "A@X.vn", true, "user có email trong OPS_EMAILS"],
    [user("user"), undefined, false, "role=user"],
    [null, undefined, false, "không phiên / phiên hết hạn (getSessionUser trả null)"],
  ];
  for (const [u, emails, want, label] of rows) {
    assert.equal(await withEnv("T", () => canCallOpsApi(req(), async () => u), emails), want, label);
  }
});

test("AC-4 getUser ném lỗi → reject, không cho qua", async () => {
  await withEnv("T", () =>
    assert.rejects(
      canCallOpsApi(req(), async () => {
        throw new Error("db sập");
      }),
      /db sập/,
    ),
  );
});
