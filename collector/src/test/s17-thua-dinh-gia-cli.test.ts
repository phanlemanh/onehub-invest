import { strict as assert } from "node:assert";
import { test } from "node:test";

import { checkConfigForPhase, egoOptions, parseCli, specDuongNode } from "../collectors/s17-thua-dinh-gia/main.js";
import { loadConfig } from "../collectors/s17-thua-dinh-gia/config.js";
import { resolve } from "node:path";

/**
 * Điểm vào của bộ thu S17: trần lời gọi và trần thời gian PHẢI khai khi chạy (không có mặc định), nhịp
 * kẹp trong mức nguồn đã chịu được (0,3–0,4 s/lời), pha cần phiên phải nói rõ chạy trong task space nào.
 */

const base = ["--phase", "reference", "--snapshots-root", "/tmp/snap", "--caps-calls", "1000", "--caps-minutes", "60"];

test("parseCli: thiếu trần lời gọi hoặc trần thời gian thì từ chối", () => {
  assert.throws(() => parseCli(["--phase", "reference", "--snapshots-root", "/tmp/snap", "--caps-minutes", "60"]));
  assert.throws(() => parseCli(["--phase", "reference", "--snapshots-root", "/tmp/snap", "--caps-calls", "1000"]));
  assert.throws(() => parseCli(base.map((a) => (a === "1000" ? "0" : a))), /dương/, "trần phải là số dương");
});

test("parseCli: nhịp ngoài 150–400 ms bị từ chối; trong mức thì nhận", () => {
  assert.throws(() => parseCli([...base, "--pace-ms", "100"]));
  assert.throws(() => parseCli([...base, "--pace-ms", "500"]));
  assert.equal(parseCli([...base, "--pace-ms", "350"]).paceMs, 350);
  assert.equal(parseCli(base).paceMs, 350, "mặc định 350 ms — giữa mức đã đo");
});

test("parseCli: --tab <nhãn trang> chọn trang chạy trong trang (pha cần phiên); pha không chạy trong trang không nhận", () => {
  const phien = [...base, "--phase", "session-check", "--space", "4"];
  assert.equal(parseCli([...phien, "--tab", "p2"]).tabLabel, "p2");
  assert.equal(parseCli(phien).tabLabel, undefined, "mặc định: tab đầu tiên của nguồn");
  assert.throws(() => parseCli([...phien, "--tab", "a b"]), /--tab/);
  assert.throws(() => parseCli([...base, "--tab", "p2"]), /không chạy trong trang/, "pha công khai chạy bằng Node");
  assert.throws(() => parseCli([...anh, "--tab", "p2"]), /không chạy trong trang/);
  const kq = egoOptions(parseCli([...phien, "--tab", "p2"]), loadConfig(JSON.stringify({ hosts: { api: "https://api.gia.test", agent: "https://agent.gia.test", web: "https://web.gia.test" }, paths: {}, session: { cookieName: "sid" } })), { statePath: "/a/s.json", logPath: "/a/l.jsonl", resultPath: "/a/r.json" });
  assert.equal(kq.tabLabel, "p2", "nhãn trang đi vào bản kê của tiến trình trình duyệt");
});

test("parseCli: --state-dir tương đối được đổi sang đường tuyệt đối — tiến trình trình duyệt chạy ở thư mục khác (lỗi thật 25/11: ENOENT ego-options.json)", () => {
  const p = parseCli([...base, "--phase", "session-check", "--space", "4", "--state-dir", "tt-thua"]);
  assert.equal(p.stateDir, resolve("tt-thua"), "đường dẫn thư mục trạng thái là tuyệt đối tính từ thư mục gọi lệnh");
});

test("parseCli: pha công khai đi bằng Node; pha cần phiên đi qua ego và phải khai space", () => {
  assert.equal(parseCli(base).via, "node");
  assert.equal(parseCli([...base, "--phase", "tile-mask", "--grid", "/tmp/luoi.json"]).via, "node");
  assert.throws(() => parseCli([...base, "--phase", "projects"]), /space/);
  const p = parseCli([...base, "--phase", "projects", "--space", "4"]);
  assert.equal(p.via, "ego");
  assert.equal(p.spaceId, 4);
});

test("parseCli: pha lạ, thiếu gốc snapshot, hoặc số không nguyên thì từ chối", () => {
  assert.throws(() => parseCli(base.map((a) => (a === "reference" ? "khac" : a))));
  assert.throws(() => parseCli(base.filter((a, i) => !(a === "/tmp/snap" || base[i - 1] === "--snapshots-root"))));
  assert.throws(() => parseCli(base.map((a) => (a === "1000" ? "1.5" : a))));
});

const CONFIG_DU_AN = {
  hosts: { api: "https://api.gia.test", agent: "https://agent.gia.test", web: "https://web.gia.test" },
  paths: { "project-list": "/v2.x/projects", "project-detail": "/v2.x/projects/{id}", "building-tree": "/v2.x/projects/{id}/tree", gallery: "/v2.x/gallery/{id}", "data-available": "/v2.x/data-available", "asset-type": "/v2.x/asset-type", balance: "/v2.x/balance", "full-config": "/v2.x/configuration" },
};

test("parseCli: nhịp nhanh nhất khi tăng tốc là 150 ms (Mạnh 24/11); dưới đó vẫn từ chối", () => {
  assert.throws(() => parseCli([...base, "--pace-ms", "100"]));
  assert.equal(parseCli([...base, "--pace-ms", "150"]).paceMs, 150);
  assert.equal(parseCli(base).paceMs, 350, "mặc định vẫn là nhịp cũ");
});

test("parseCli: pha thửa cần phiên, cần lưới khu thí điểm; số luồng trong 1–4", () => {
  const thua = [...base, "--phase", "parcels"];
  assert.throws(() => parseCli(thua), /space/);
  assert.throws(() => parseCli([...thua, "--space", "4"]), /parcels-grid/);
  const p = parseCli([...thua, "--space", "4", "--parcels-grid", "/tmp/luoi-thua.json", "--luong-song", "3", "--pace-ms", "200"]);
  assert.equal(p.via, "ego");
  assert.equal(p.concurrency, 3);
  assert.equal(p.parcelsGrid, "/tmp/luoi-thua.json");
  assert.equal(parseCli(base).concurrency, 1, "mặc định một luồng");
  assert.throws(() => parseCli([...thua, "--space", "4", "--parcels-grid", "/tmp/luoi-thua.json", "--luong-song", "9"]), /1 đến 8/);
});

test("checkConfigForPhase: pha cần phiên đòi tên cookie phiên trong cấu hình local; pha công khai không cần", () => {
  const config = CONFIG_DU_AN;
  assert.doesNotThrow(() => checkConfigForPhase(loadConfig(JSON.stringify(config)), parseCli([...base, "--phase", "tile-mask", "--grid", "/tmp/luoi.json"])));
  assert.throws(() => checkConfigForPhase(loadConfig(JSON.stringify(config)), parseCli([...base, "--phase", "projects", "--space", "4"])), /cookieName/);
  assert.doesNotThrow(() => checkConfigForPhase(loadConfig(JSON.stringify({ ...config, session: { cookieName: "PHIEN_GIA" } })), parseCli([...base, "--phase", "projects", "--space", "4"])));
  assert.throws(() => checkConfigForPhase(loadConfig(JSON.stringify({ ...config, session: { cookieName: "a b(c" } })), parseCli([...base, "--phase", "projects", "--space", "4"])), /cookieName/);
});

test("egoOptions: pha qua ego phải mang cờ đọc số dư và tên cookie phiên (lượt thật 24/11 thiếu cờ này)", () => {
  const config = loadConfig(JSON.stringify({ ...CONFIG_DU_AN, session: { cookieName: "PHIEN_GIA" } }));
  const via = parseCli([...base, "--phase", "lowrise", "--space", "4", "--thap-tang-id-tu", "1", "--thap-tang-id-den", "1850"]);
  const opts = egoOptions(via, config, { statePath: "/tmp/s.json", logPath: "/tmp/l.jsonl", resultPath: "/tmp/r.json" });
  assert.deepEqual(opts.lowriseSweep, { from: 1, to: 1850 }, "dải id quét thấp tầng đi sang tiến trình trình duyệt");
  assert.equal(opts.checkBalance, true);
  assert.equal(opts.cookieName, "PHIEN_GIA");
  assert.equal(opts.spaceId, 4);
  assert.equal(opts.via, "ego");
  assert.equal(opts.statePath, "/tmp/s.json");
  assert.equal(opts.snapshotRoot, "/tmp/snap", "thư mục snapshot phải sang được tiến trình ego (lượt thật 24/11 thiếu, mất 4 trang)");
  assert.equal(opts.resultPath, "/tmp/r.json");
  assert.equal(opts.logPath, "/tmp/l.jsonl");
  assert.ok(JSON.stringify(opts).includes("PHIEN_GIA"), "tệp tuỳ chọn là JSON bình thường");
  const congKhai = egoOptions(parseCli(base), config, { statePath: "/tmp/s.json", logPath: "/tmp/l.jsonl", resultPath: "/tmp/r.json" });
  assert.equal(congKhai.checkBalance, false, "pha công khai không đụng tài khoản");
});

// ---------- mốc mở rộng (claudedp-2411-73): hai pha mới ----------

const anh = ["--phase", "images", "--snapshots-root", "/tmp/snap", "--caps-calls", "1000", "--caps-minutes", "60"];

test("parseCli: pha images đi bằng Node (không cần phiên), thư mục trạng thái riêng để chạy song song với pha cần phiên; lựa chọn ảnh nằm trong mức", () => {
  const p = parseCli(anh);
  assert.equal(p.via, "node");
  assert.ok(p.stateDir.endsWith("s17-thua-dinh-gia-anh"), `thư mục trạng thái riêng cho pha ảnh: ${p.stateDir}`);
  assert.deepEqual(p.anh, { luongSong: 4, soFile: 100, chiNgoai: false });
  assert.equal(parseCli(base).stateDir.endsWith("s17-thua-dinh-gia-anh"), false, "pha khác giữ nguyên thư mục cũ");
  const q = parseCli([...anh, "--anh-luong-song", "1", "--anh-so-file", "40"]);
  assert.deepEqual(q.anh, { luongSong: 1, soFile: 40, chiNgoai: false });
  assert.equal(parseCli([...anh, "--anh-luong-song", "12"]).anh?.luongSong, 12, "ảnh là tệp tĩnh: trần riêng 16 kết nối, khỏi trần 8 của lời API");
  assert.throws(() => parseCli([...anh, "--anh-luong-song", "17"]), /1 đến 16/);
  assert.throws(() => parseCli([...anh, "--anh-so-file", "0"]), /dương/);
});

test("parseCli: pha apartments-all cần phiên; nhận khoảng số căn, giới hạn số dự án, danh sách id", () => {
  assert.throws(() => parseCli([...anh, "--phase", "apartments-all"]), /space/);
  const p = parseCli([...anh, "--phase", "apartments-all", "--space", "4", "--tu-so-can", "3000", "--den-so-can", "9000", "--gioi-han", "7", "--project", "7", "--project", "8", "--luong-song", "6", "--pace-ms", "250"]);
  assert.equal(p.via, "ego");
  assert.deepEqual(p.tatCaDuAn, { tuSoCan: 3000, denSoCan: 9000, gioiHan: 7, ids: ["7", "8"] });
  assert.equal(p.concurrency, 6, "sáu luồng là trong trần mới");
  assert.equal(p.paceMs, 250);
  assert.throws(() => parseCli([...anh, "--phase", "apartments-all", "--space", "4", "--tu-so-can", "5000", "--den-so-can", "1000"]), /phải nhỏ hơn hoặc bằng/);
});

test("checkConfigForPhase: pha images đòi danh sách đuôi máy chủ ảnh trong cấu hình local; các pha khác không cần", () => {
  const config = CONFIG_DU_AN;
  assert.throws(() => checkConfigForPhase(loadConfig(JSON.stringify(config)), parseCli(anh)), /anh\.hostSuffixes|ảnh/);
  const coAnh = { ...config, anh: { hostSuffixes: ["cdn.gia.test"] } };
  assert.doesNotThrow(() => checkConfigForPhase(loadConfig(JSON.stringify(coAnh)), parseCli(anh)));
  assert.doesNotThrow(() => checkConfigForPhase(loadConfig(JSON.stringify(config)), parseCli([...base, "--phase", "tile-mask", "--grid", "/tmp/luoi.json"])), "pha khác không cần máy chủ ảnh");
  assert.throws(() => loadConfig(JSON.stringify({ ...config, anh: { hostSuffixes: [] } })), /hostSuffixes/);
  assert.throws(() => loadConfig(JSON.stringify({ ...config, anh: { hostSuffixes: ["cdn gia.test"] } })), /hostSuffixes/);
  assert.throws(() => loadConfig(JSON.stringify({ ...config, anh: { hostSuffixes: ["CDN.gia.test"] } })), /hostSuffixes/);
  assert.throws(() => loadConfig(JSON.stringify({ ...config, anh: { hostSuffixes: ["localhost"] } })), /hostSuffixes/, "phải có ít nhất một dấu chấm");
});

test("egoOptions: lựa chọn của hai pha mới đi sang tiến trình trình duyệt nguyên vẹn", () => {
  const config = { ...CONFIG_DU_AN, session: { cookieName: "PHIEN_GIA" } };
  const v = parseCli([...anh, "--phase", "apartments-all", "--space", "4", "--tu-so-can", "3000", "--gioi-han", "7"]);
  const o = egoOptions(v, loadConfig(JSON.stringify(config)), { statePath: "/tmp/s.json", logPath: "/tmp/l.jsonl", resultPath: "/tmp/r.json" }) as Record<string, unknown>;
  assert.deepEqual(o.tatCaDuAn, { tuSoCan: 3000, gioiHan: 7 });
  assert.equal(o.checkBalance, true, "pha căn hộ toàn bộ có đụng tới tài khoản: đọc số dư trước và sau");
});

test("parseCli + specDuongNode: lượt ảnh máy chủ ngoài là một lượt riêng (thư mục trạng thái riêng); đường Node chuyển đủ lựa chọn ảnh (lượt soát 25/11: hai cờ bị rơi)", () => {
  const v = parseCli([...anh, "--anh-may-chu-ngoai", "--anh-luong-song", "6", "--anh-so-file", "40"]);
  assert.equal(v.anh?.chiNgoai, true);
  assert.ok(v.stateDir.endsWith("s17-thua-dinh-gia-anh-ngoai"));
  const config = { ...CONFIG_DU_AN, anh: { hostSuffixes: ["cdn.gia.test"], ngoai: true } };
  assert.throws(() => checkConfigForPhase(loadConfig(JSON.stringify(CONFIG_DU_AN)), parseCli(anh)), /hostSuffixes|ảnh/);
  assert.throws(() => checkConfigForPhase(loadConfig(JSON.stringify({ ...CONFIG_DU_AN, anh: { hostSuffixes: ["cdn.gia.test"] } })), v), /anh\.ngoai/);
  assert.doesNotThrow(() => checkConfigForPhase(loadConfig(JSON.stringify(config)), v));
  const spec = specDuongNode(v, loadConfig(JSON.stringify(config)), { statePath: "/tmp/s.json", logPath: "/tmp/l.jsonl" }, {}) as Record<string, unknown>;
  assert.deepEqual(spec.anh, { luongSong: 6, soFile: 40, chiNgoai: true }, "lựa chọn ảnh tới được trình điều khiển");
  assert.equal(spec.checkBalance, false, "pha ảnh không đọc số dư");
  assert.equal(spec.runId, undefined, "mã lượt chỉ dành cho tiến trình trình duyệt");
  assert.equal(spec.snapshotRoot, "/tmp/snap");
  assert.equal((spec.caps as { calls: number }).calls, 1000);
});

test("parseCli: --bo-doc-so-du chỉ dành cho --phase session-check — bản kê của tiến trình trình duyệt không đọc số dư; pha lấy dữ liệu thì từ chối", () => {
  const phien = [...base, "--phase", "session-check", "--space", "4", "--caps-calls", "1"];
  const config = loadConfig(JSON.stringify({ hosts: { api: "https://api.gia.test", agent: "https://agent.gia.test", web: "https://web.gia.test" }, paths: {}, session: { cookieName: "sid" } }));
  const duong = { statePath: "/a/s.json", logPath: "/a/l.jsonl", resultPath: "/a/r.json" };
  const macDinh = parseCli(phien);
  assert.equal(macDinh.boDocSoDu, undefined, "mặc định không tắt");
  assert.equal(egoOptions(macDinh, config, duong).checkBalance, true, "kiểm phiên mặc định có đọc số dư");
  const motLoi = parseCli([...phien, "--bo-doc-so-du"]);
  assert.equal(motLoi.boDocSoDu, true);
  assert.equal(egoOptions(motLoi, config, duong).checkBalance, false, "lời gọi thử: không đọc số dư, chỉ lời kiểm phiên tới máy chủ API");
  assert.throws(() => parseCli([...base, "--phase", "projects", "--space", "4", "--bo-doc-so-du"]), /--bo-doc-so-du/, "pha lấy dữ liệu luôn đọc số dư");
  assert.throws(() => parseCli([...base, "--bo-doc-so-du"]), /--bo-doc-so-du/, "pha công khai cũng không nhận");
});
