// data-level.test.tsx — bậc nghiêm của một tin (FRAMING §3.4, Mạnh duyệt 26/10): B1 chỉ khi đủ năm trường lõi.
import assert from "node:assert/strict"
import { describe, test } from "node:test"

import { coreFields, levelOf, type LevelInput } from "../src/lib/data-level"

const FULL: LevelInput = { kind: "sale", propertyType: "apartment", priceVnd: 3_200_000_000, areaM2: 81, ward: "Bảy Hiền", linked: false }

describe("bậc nghiêm theo năm trường lõi", () => {
  test("đủ năm trường, chưa gắn căn → B1", () => {
    assert.equal(levelOf(FULL), "B1")
  })
  test("đủ năm trường và gắn căn → B2", () => {
    assert.equal(levelOf({ ...FULL, linked: true }), "B2")
  })
  test("thiếu một trường bất kỳ → B0, kể cả khi đã gắn căn", () => {
    const thieu: Partial<LevelInput>[] = [
      { kind: null },
      { propertyType: "unknown" },
      { propertyType: null },
      { priceVnd: null },
      { priceVnd: 0 },
      { areaM2: null },
      { ward: null },
    ]
    for (const t of thieu) assert.equal(levelOf({ ...FULL, ...t, linked: true }), "B0", JSON.stringify(t))
  })
  test("tin S03 điển hình (loại hình chưa rõ, chưa gắn phường) → B0, thiếu đúng hai trường", () => {
    const r = { ...FULL, propertyType: "unknown", ward: null }
    assert.equal(levelOf(r), "B0")
    assert.deepEqual(coreFields(r).filter((f) => !f.ok).map((f) => f.key), ["propertyType", "ward"])
  })
})
