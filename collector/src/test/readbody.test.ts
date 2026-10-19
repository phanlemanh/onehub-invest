import { strict as assert } from "node:assert";
import { Readable } from "node:stream";
import { test } from "node:test";

import { readBody } from "../api/server.js";

// Review C1: nối chuỗi từng chunk corrupt ký tự đa byte khi char bị chặn
// ngang ranh giới chunk ("Tây Hồ" → "Tây H???"). Payload phải NGUYÊN VẬN.
test("readBody: ký tự Việt split giữa 2 chunk vẫn nguyên vẹn", async () => {
  const text = JSON.stringify({ agent_id: "a", group: "BĐS Hà Nội", messages: [{ text: "Bán CHCC 2PN 65m² Tây Hồ, 2,9 tỷ", ts: "2026-10-19T00:00:00Z" }] });
  const buf = Buffer.from(text, "utf8");
  // chặn ngang giữa "Tây Hồ" — tìm byte của 'Hồ' và cắt trước nó 1 byte
  const cut = text.indexOf("Tây Hồ");
  const byteCut = Buffer.byteLength(text.slice(0, cut + 4)) + 1; // giữa 'H' và 'ồ'
  const chunks = [buf.subarray(0, byteCut), buf.subarray(byteCut)];
  const body = JSON.parse(await readBody(Readable.from(chunks) as any)) as {
    messages: { text: string }[];
  };
  assert.equal(body.messages[0].text, "Bán CHCC 2PN 65m² Tây Hồ, 2,9 tỷ");
});
