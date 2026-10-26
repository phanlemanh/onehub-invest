// node --test scripts/auth-error-e2-superseded.test.mjs
// Hồ sơ _acceptance/auth-error-e2-superseded, ca «AE2-AC-2»: ô E2 đã ký của auth-error-thu-lai-retry khai được thay
// đúng khuôn superseded_by (kit 2.24) bởi AC-1 của hồ sơ này. Không cần DB.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { test } from "node:test";

const REPO = path.join(import.meta.dirname, "..");
const { parseEvals } = createRequire(import.meta.url)(path.join(REPO, "lib/eval-yaml.cjs"));

const SUPERSEDE = "auth-error-e2-superseded#AC-1";
const CMD = "config:executors.test.scripts";
const read = (f) => readFileSync(path.join(REPO, f), "utf8");

export function checkE2Supersede(evalsText) {
  const e2 = parseEvals(evalsText, ["status", "superseded_by", "cmd"]).find((e) => e.id === "E2");
  if (!e2) return ["auth-error-thu-lai-retry không có ô E2"];
  const errs = [];
  if (e2.status !== "not-run") errs.push("auth-error-thu-lai-retry/E2 chưa khai status: not-run");
  if (e2.superseded_by !== SUPERSEDE) errs.push(`superseded_by của auth-error-thu-lai-retry/E2 là ${e2.superseded_by || "(trống)"}, cần ${SUPERSEDE}`);
  if (e2.cmd !== CMD) errs.push(`cmd của auth-error-thu-lai-retry/E2 là ${e2.cmd || "(trống)"}, phải giữ ${CMD}`);
  return errs;
}

test("AE2-AC-2 ô E2 của auth-error-thu-lai-retry được thay đúng", () => {
  const evals = read("_acceptance/auth-error-thu-lai-retry/evals.yaml");
  assert.deepEqual(checkE2Supersede(evals), []);
  assert.match(read("_acceptance/auth-error-e2-superseded/contract.md"), /^- AC-1:/m, "hồ sơ thay phải có AC-1");
  // Chiều đỏ trên bản sao chuỗi: sai đích, thiếu status → bộ kiểm gọi đúng lỗi.
  const wrong = evals.replace(`superseded_by: ${SUPERSEDE}`, "superseded_by: auth-error-khac#AC-1");
  assert.deepEqual(checkE2Supersede(wrong), [`superseded_by của auth-error-thu-lai-retry/E2 là auth-error-khac#AC-1, cần ${SUPERSEDE}`]);
  const noStatus = evals.replace(/^(\s*- id: E2\n(?:\s{4}.*\n)*?)\s{4}status: not-run\n/m, "$1");
  assert.deepEqual(checkE2Supersede(noStatus), ["auth-error-thu-lai-retry/E2 chưa khai status: not-run"]);
});
