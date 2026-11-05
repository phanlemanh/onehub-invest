// khu-trung-anh.test.mjs — hồ sơ _acceptance/khu-trung-anh-tin (GT1), ca «KTA-AC-n»: luật khử trùng băm của bên ghi. Hàm thuần.
// Ca đỏ: bản sao đột biến media-rows.mjs chép cạnh tệp thật, nạp rồi xoá ngay.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

import { mediaKey, mediaRowsFromPosts } from "../media-rows.mjs";

const PIPE = join(import.meta.dirname, "..");
const MR = join(PIPE, "media-rows.mjs");
const SNAP = "hanoi__s03__thu";
const sha = (c) => c.repeat(64);
const URL_ = (n) => `https://img.example.test/${n}.jpg`;
const tep = (n, s, them = {}) => ({ url: URL_(n), file: `media/${n}.jpg`, snapshotId: SNAP, ...(s === undefined ? {} : { sha256: s }), ...them });
const bai = (id, media_files, media = null) => ({ post_id: id, snapshot_id: SNAP, media_files, media });
const OF = "o1";
const gon = (rows) => rows.map((r) => [r.originating_system_resource_record_key, r.local_file ? r.local_file.split("/media/")[1] : r.media_url, r.media_order]);

let nMut = 0;
async function banSao(thay) {
  let src = readFileSync(MR, "utf8");
  for (const [cu, moi] of thay) {
    assert.ok(src.includes(cu), `đột biến không khớp mã nguồn: «${cu}»`);
    src = src.replace(cu, moi);
  }
  const f = join(PIPE, `.kta-mr-${process.pid}-${++nMut}.mjs`);
  writeFileSync(f, src);
  try {
    return await import(pathToFileURL(f).href);
  } finally {
    rmSync(f, { force: true });
  }
}

// [tên, các bài, dòng mong đợi [bài, tệp hoặc URL, thứ tự]]
const AC1 = [
  ["trong một bài", [bai("p1", [tep("a", sha("a")), tep("b", sha("a"))])], [["p1", "a.jpg", 0]]],
  ["giữa hai bài", [bai("p1", [tep("a", sha("a"))]), bai("p2", [tep("b", sha("a"))])], [["p1", "a.jpg", 0]]],
  ["băm viết hoa", [bai("p1", [tep("a", sha("a"))]), bai("p2", [tep("b", sha("A"))])], [["p1", "a.jpg", 0]]],
  ["ba lần trùng", [bai("p1", [tep("a", sha("a"))]), bai("p2", [tep("b", sha("a"))]), bai("p3", [tep("c", sha("a"))])], [["p1", "a.jpg", 0]]],
  [
    "hai băm xen kẽ, thứ tự liền nhau",
    [bai("p1", [tep("a", sha("a")), tep("b", sha("a")), tep("c", sha("b"))]), bai("p2", [tep("d", sha("a")), tep("e", sha("b")), tep("f", sha("c"))])],
    [["p1", "a.jpg", 0], ["p1", "c.jpg", 1], ["p2", "f.jpg", 2]],
  ],
];

function kiemAc1(fn, mk) {
  for (const [ten, posts, mong] of AC1) {
    const rows = fn(OF, "S03", posts);
    assert.deepEqual(gon(rows), mong, `KTA-AC-1 lệch: ${ten}`);
    for (const r of rows) assert.equal(r.media_key, mk(OF, r.local_file, r.media_url), `KTA-AC-1 khoá đổi: ${ten}`);
  }
}

test("KTA-AC-1 mỗi băm một dòng, giữ lần đầu, thứ tự liền nhau, khoá theo tệp đầu", () => {
  kiemAc1(mediaRowsFromPosts, mediaKey);
  // Cùng băm ở hai tin khác nhau vẫn là hai dòng: khử chỉ trong một tin.
  const posts = [bai("p1", [tep("a", sha("a"))])];
  assert.notEqual(mediaRowsFromPosts("o1", "S03", posts)[0].media_key, mediaRowsFromPosts("o2", "S03", posts)[0].media_key);
});

test("KTA-AC-1 ca đỏ: bỏ khử băm thì báo tên dòng", async () => {
  const dot = await banSao([["(sha && seenSha.has(sha))", "false"]]);
  assert.throws(() => kiemAc1(dot.mediaRowsFromPosts, dot.mediaKey), /KTA-AC-1 lệch: trong một bài/);
});

const AC2 = [
  ["thiếu băm: tệp khác nhau giữ cả hai", [bai("p1", [tep("a"), tep("b")])], [["p1", "a.jpg", 0], ["p1", "b.jpg", 1]]],
  ["thiếu băm: cùng tệp một dòng", [bai("p1", [tep("a"), tep("a")])], [["p1", "a.jpg", 0]]],
  ["băm 63 ký tự coi như thiếu", [bai("p1", [tep("a", "a".repeat(63)), tep("b", "a".repeat(63))])], [["p1", "a.jpg", 0], ["p1", "b.jpg", 1]]],
  ["băm không phải hex coi như thiếu", [bai("p1", [tep("a", sha("z")), tep("b", sha("z"))])], [["p1", "a.jpg", 0], ["p1", "b.jpg", 1]]],
  ["cùng tệp, lần sau mới có băm: một dòng, không hai khoá", [bai("p1", [tep("a"), tep("a", sha("a"))])], [["p1", "a.jpg", 0]]],
  ["tải lỗi có băm rác vẫn là URL", [bai("p1", [{ url: URL_("x"), error: "http-500", sha256: sha("a") }, tep("a", sha("a"))])], [["p1", "a.jpg", 0], ["p1", URL_("x"), 1]]],
  ["chỉ URL lặp giữa các bài", [bai("p1", null, [{ url: URL_("u") }]), bai("p2", null, [{ url: URL_("u") }, { url: URL_("v") }])], [["p1", URL_("u"), 0], ["p2", URL_("v"), 1]]],
  ["URL của tệp đã khử không quay lại", [bai("p1", [tep("a", sha("a"))]), bai("p2", [tep("b", sha("a"))], [{ url: URL_("b") }])], [["p1", "a.jpg", 0]]],
];

const kiemAc2 = (fn) => {
  for (const [ten, posts, mong] of AC2) assert.deepEqual(gon(fn(OF, "S03", posts)), mong, `KTA-AC-2 lệch: ${ten}`);
};

test("KTA-AC-2 thiếu băm khử theo tệp, chỉ URL khử theo URL; hàm không đọc đĩa, không gọi mạng", () => {
  kiemAc2(mediaRowsFromPosts);
  const nhap = [...readFileSync(MR, "utf8").matchAll(/^import .* from "([^"]+)";$/gm)].map((m) => m[1]);
  assert.deepEqual(nhap, ["node:crypto"], "KTA-AC-2 media-rows.mjs chỉ được import node:crypto");
  assert.doesNotMatch(readFileSync(MR, "utf8"), /\bfetch\(/);
});

test("KTA-AC-2 ca đỏ: URL của tệp đã khử quay lại", async () => {
  const dot = await banSao([
    ["if (url) seenUrl.add(url);\n      const sha = shaTep(e);\n      if (seenLocal.has(local) || (sha && seenSha.has(sha))) continue;",
     "const sha = shaTep(e);\n      if (seenLocal.has(local) || (sha && seenSha.has(sha))) continue;\n      if (url) seenUrl.add(url);"],
  ]);
  assert.throws(() => kiemAc2(dot.mediaRowsFromPosts), /KTA-AC-2 lệch: URL của tệp đã khử/);
});

test("KTA-AC-2 ca đỏ: tệp lần sau có băm sinh hai dòng cùng khoá", async () => {
  const dot = await banSao([["if (seenLocal.has(local) || (sha && seenSha.has(sha))) continue;", "if (seenSha.has(sha ?? local)) continue;"], ["if (sha) seenSha.add(sha);", "seenSha.add(sha ?? local);"]]);
  assert.throws(() => kiemAc2(dot.mediaRowsFromPosts), /KTA-AC-2 lệch: cùng tệp, lần sau mới có băm/);
});

// Lần sau có tên tệp, URL, băm sắp nhỏ hơn lần đầu: bản giữ vẫn phải là lần đầu theo post_ids.
const AC9 = [
  ["tệp lần sau nhỏ hơn", [bai("p2", [tep("z", sha("a"))]), bai("p1", [tep("a", sha("a"))])], "z.jpg"],
  ["bài lần sau có mã nhỏ hơn", [bai("p9", [tep("m", sha("b"))]), bai("p0", [tep("n", sha("b"))])], "m.jpg"],
  ["trong một bài, tệp sau nhỏ hơn", [bai("p1", [tep("y", sha("c")), tep("b", sha("c"))])], "y.jpg"],
  ["ba lần, lần giữa nhỏ nhất", [bai("p1", [tep("k", sha("d"))]), bai("p2", [tep("a", sha("d"))]), bai("p3", [tep("t", sha("d"))])], "k.jpg"],
];
const kiemAc9 = (fn) => {
  for (const [ten, posts, giu] of AC9) {
    const mot = fn(OF, "S03", posts);
    assert.deepEqual(fn(OF, "S03", posts), mot, `KTA-AC-9 hai lượt khác nhau: ${ten}`);
    assert.equal(mot[0].local_file.split("/media/")[1], giu, `KTA-AC-9 bản giữ sai: ${ten}`);
  }
};
test("KTA-AC-9 cùng đầu vào cùng kết quả, bản giữ là lần đầu theo post_ids", () => kiemAc9(mediaRowsFromPosts));
test("KTA-AC-9 ca đỏ: chọn bản giữ theo tên tệp nhỏ nhất", async () => {
  const dot = await banSao([["const out = [];\n  const seenLocal", "posts = posts.map((p) => ({ ...p, media_files: p.media_files })).sort((a, b) => JSON.stringify(a.media_files).localeCompare(JSON.stringify(b.media_files)));\n  const out = [];\n  const seenLocal"]]);
  assert.throws(() => kiemAc9(dot.mediaRowsFromPosts), /KTA-AC-9 bản giữ sai: tệp lần sau nhỏ hơn/);
});
