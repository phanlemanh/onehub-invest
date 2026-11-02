// luu-tang-huong.test.tsx — hồ sơ s03-luu-tang-huong AC-11: bên đọc floor_raw gặp khoảng tầng. Thẻ ghép căn, bộ chấm ghép và
// do-the-duyet coi khoảng là thiếu số chứ không lệch; giá trị số so như cũ. Không đổi giao diện.
import { test } from "node:test"
import assert from "node:assert/strict"

import { khoaTang as khoaTangApp, soTruongGhepCan, TRUONG_GHEP_CAN } from "../src/lib/ops/review-can-cu"
import { khoaTang as khoaTangAgent, soTang } from "../../agent/src/agents/judge-entity"
import { TRUONG } from "../../pipeline/do-the-duyet.mjs"

const KHOANG = ["tầng cao", "tầng trung", "tầng thấp"]

test("SV2-AC-11 thẻ ghép căn: khoảng so với số ra thiếu, chữ hiện nguyên; số khác số ra lệch", () => {
  assert.ok(TRUONG_GHEP_CAN.some((t) => t.key === "floor"), "thẻ phải có hàng Tầng")
  for (const k of KHOANG) {
    assert.equal(khoaTangApp(k), null, `SV2-AC-11 khoá «${k}»`)
    const hang = soTruongGhepCan({ floor: k }, { floor: "12" }).find((h) => h.key === "floor")
    assert.equal(hang?.so, "thieu", `SV2-AC-11 hàng Tầng «${k}»`)
    assert.equal(hang?.a, k, `SV2-AC-11 chữ hiện nguyên «${k}»`)
  }
  assert.equal(soTruongGhepCan({ floor: "13" }, { floor: "12" }).find((h) => h.key === "floor")?.so, "lech", "đối chứng số khác số")
  assert.equal(soTruongGhepCan({ floor: "12" }, { floor: "12" }).find((h) => h.key === "floor")?.so, "khop", "đối chứng số bằng số")
})

test("SV2-AC-11 bộ chấm ghép: khoảng so với số ra thiếu; số khác số ra lệch", () => {
  for (const k of KHOANG) {
    assert.equal(khoaTangAgent(k), null)
    assert.equal(soTang(k, "12"), "thieu", `SV2-AC-11 soTang «${k}»`)
    assert.equal(soTang(k, "tầng cao"), "thieu", `SV2-AC-11 hai khoảng «${k}»`)
  }
  assert.equal(soTang("13", "12"), "lech", "đối chứng số khác số")
})

test("SV2-AC-11 do-the-duyet coi khoảng là có tầng", () => {
  for (const k of KHOANG) assert.equal(TRUONG.tang({ floor_raw: k }), true, `SV2-AC-11 «${k}»`)
  assert.equal(TRUONG.tang({ floor_raw: null }), false, "đối chứng trống")
})
