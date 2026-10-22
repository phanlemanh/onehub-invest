import { describe, it } from "node:test";
import assert from "node:assert/strict";
import plugin from "../index.mjs";

const NINE = [
  "no-raw-table", "no-raw-controls", "no-native-dialogs", "no-raw-palette",
  "no-hardcoded-color", "no-arbitrary-text-size", "no-banned-motion",
  "no-aschild", "no-emoji-icons",
];

describe("plugin onehub-ui", () => {
  it("có tên và đủ chín luật hợp đồng", () => {
    assert.equal(plugin.meta.name, "onehub-ui");
    for (const name of NINE) assert.ok(plugin.rules[name], `thiếu luật ${name}`);
  });
  it("mỗi luật có meta chuẩn", () => {
    for (const name of NINE) {
      const { meta } = plugin.rules[name];
      assert.equal(meta.type, "problem", name);
      assert.ok(meta.docs?.description, `${name} thiếu docs.description`);
      assert.ok(meta.messages && Object.keys(meta.messages).length, `${name} thiếu messages`);
      assert.deepEqual(meta.schema, [], name);
    }
  });
});
