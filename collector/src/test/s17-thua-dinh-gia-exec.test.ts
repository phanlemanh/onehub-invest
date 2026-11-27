import { strict as assert } from "node:assert";
import { test } from "node:test";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { ConfigError, loadConfig } from "../collectors/s17-thua-dinh-gia/config.js";
import { RunStopped, type Response } from "../collectors/s17-thua-dinh-gia/client.js";
import { executePhase } from "../collectors/s17-thua-dinh-gia/runner.js";
import { emptyState } from "../collectors/s17-thua-dinh-gia/run.js";
import { egoOptions, parseCli, readRunResult, summarize } from "../collectors/s17-thua-dinh-gia/main.js";
import { buildExecOptions, type ExecResult } from "../collectors/s17-thua-dinh-gia/runner.js";

/**
 * Trình điều khiển một pha: đọc số dư trước và sau lượt (bằng chứng không tiêu điểm), lưu trạng thái ra
 * tệp để nối tiếp, ghi log ở máy. Dữ liệu GIẢ, máy chủ .test.
 */

const FAKE_CONFIG = {
  hosts: { api: "https://api.gia.test", agent: "https://agent.gia.test", web: "https://web.gia.test" },
  paths: {
    "project-list": "/v2.x/projects",
    "project-detail": "/v2.x/projects/{id}",
    "building-tree": "/v2.x/projects/{id}/tree",
    gallery: "/v2.x/gallery/{id}",
    "data-available": "/v2.x/data-available",
    "asset-type": "/v2.x/asset-type",
    balance: "/v2.x/balance",
  },
};

const json = (body: unknown, status = 200): Response => ({ status, contentType: "application/json", body: JSON.stringify(body) });
const env = (data: unknown) => ({ status: true, message: null, data, pagination: null, extra: {} });

/** `phu`: trường gắn thêm vào MỌI câu trả lời (thời gian, header). `loi`: câu trả lời giả cho đường kết thúc bằng `duoi`. */
type Harness = { sent: string[]; balances: number[]; phu: Partial<Response>; loi: Array<[string, Response]> };

function harness(): Harness & {
  exec: (o: { phase: "session-check" | "projects"; checkBalance: boolean; dir: string; caps?: { calls: number; minutes: number } }) => ReturnType<typeof executePhase>;
} {
  const h: Harness = { sent: [], balances: [], phu: {}, loi: [] };
  let balanceReads = 0;
  const traLoi = async (url: string): Promise<Response> => {
    h.sent.push(url);
    const p = new URL(url).pathname;
    const dat = h.loi.find(([duoi]) => p.endsWith(duoi));
    if (dat) return dat[1];
    if (p.endsWith("/balance")) {
      const v = h.balances[Math.min(balanceReads++, h.balances.length - 1)];
      return json(env({ available: v }));
    }
    if (p.endsWith("/projects")) {
      const page = Number(new URL(url).searchParams.get("page"));
      const content = page === 0 ? [{ id: 1 }] : [];
      return json(env({ projects: { content, totalElements: 1, totalPages: 1 } }));
    }
    if (p.includes("/gallery/")) return json(env([{ name: "album" }]));
    if (/\/projects\/\d+(\/tree)?$/.test(p)) return json(env({ properties: { is_exists_apartment_info: false } }));
    return json(env({ available: true }));
  };
  const transport = async (url: string): Promise<Response> => ({ ...(await traLoi(url)), ...h.phu });
  const exec = (o: { phase: "session-check" | "projects"; checkBalance: boolean; dir: string; caps?: { calls: number; minutes: number } }) =>
    executePhase({
      phase: o.phase,
      config: loadConfig(JSON.stringify(FAKE_CONFIG)),
      transport,
      snapshotRoot: join(o.dir, "snapshots"),
      statePath: join(o.dir, "state.json"),
      logPath: join(o.dir, "run.log.jsonl"),
      caps: o.caps ?? { calls: 100, minutes: 60 },
      paceMs: 0,
      batchItems: 100,
      checkBalance: o.checkBalance,
      env: { sleep: async () => undefined, now: () => new Date("2026-11-24T04:00:00.000Z") },
    });
  return Object.assign(h, { exec });
}

const withTmp = async (fn: (dir: string) => Promise<void>): Promise<void> => {
  const dir = await mkdtemp(join(tmpdir(), "s17-exec-"));
  try {
    await fn(dir);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
};

test("executePhase: đọc số dư trước và sau lượt; không đổi thì lượt xong bình thường", async () => withTmp(async (dir) => {
  const h = harness();
  h.balances.push(20);
  const r = await h.exec({ phase: "session-check", checkBalance: true, dir });
  assert.equal(r.ok, true);
  assert.equal(r.summary?.alive, true);
  assert.equal(r.balanceBefore, 20);
  assert.equal(r.balanceAfter, 20);
  assert.equal(h.sent.length, 3, "số dư trước + một lời kiểm phiên + số dư sau");
  assert.equal(r.calls, 3);
}));

const docPhanHoi = async (dir: string): Promise<Array<Record<string, unknown>>> =>
  (await readFile(join(dir, "run.log.jsonl"), "utf8"))
    .split("\n")
    .filter(Boolean)
    .map((l) => {
      const { at: _bo, ...r } = JSON.parse(l) as Record<string, unknown>;
      return r;
    })
    .filter((r) => r.suKien === "phan-hoi");

test("executePhase: pha kiểm phiên ghi lại MỌI câu trả lời thành dòng «phan-hoi» (vai, trạng thái, thời gian, header được chọn) — để đọc được nguồn nói gì", async () => withTmp(async (dir) => {
  const h = harness();
  h.balances.push(20);
  h.phu = { ms: 42, headers: { "x-ratelimit-remaining": "12", date: "Thu, 26 Nov 2026 05:00:00 GMT" } };
  await h.exec({ phase: "session-check", checkBalance: true, dir });
  const ds = await docPhanHoi(dir);
  assert.deepEqual(ds.map((r) => r.vai), ["balance", "data-available", "balance"]);
  assert.deepEqual(ds[0], { suKien: "phan-hoi", vai: "balance", status: 200, ms: 42, contentType: "application/json", headers: { "x-ratelimit-remaining": "12", date: "Thu, 26 Nov 2026 05:00:00 GMT" } });
}));

test("executePhase: pha khác chỉ ghi «phan-hoi» khi câu trả lời KHÔNG phải 200 — dòng nhật ký mang số đo và các trường chẩn đoán đã che, thân gốc nằm ở tệp riêng trong máy; câu 200 không ghi", async () => withTmp(async (dir) => {
  const h = harness();
  const than = '{"status":false,"message":"khong co"}';
  h.phu = { ms: 9, headers: { date: "Thu, 26 Nov 2026 05:00:00 GMT" } };
  h.loi.push(["/projects/1/tree", { status: 404, contentType: "application/json", body: than }]);
  await h.exec({ phase: "projects", checkBalance: false, dir }).catch(() => undefined);
  const ds = await docPhanHoi(dir);
  assert.equal(ds.length, 1);
  const { thanThoTep, ...dong } = ds[0] as Record<string, unknown> & { thanThoTep?: string };
  assert.deepEqual(dong, {
    suKien: "phan-hoi",
    vai: "building-tree",
    status: 404,
    ms: 9,
    contentType: "application/json",
    headers: { date: "Thu, 26 Nov 2026 05:00:00 GMT" },
    than: { dai: than.length, kieu: "json", chanDoan: { status: false }, daBo: 1 },
  });
  assert.equal(typeof thanThoTep, "string", "dòng nhật ký trỏ tới tệp giữ thân gốc");
  const goc = await readFile(join(dir, "phan-hoi", thanThoTep as string), "utf8");
  assert.equal(goc.slice(goc.indexOf("\n\n") + 2), than, "tệp riêng giữ nguyên thân gốc");
}));

test("executePhase: số dư giảm thì dừng cả lượt với lý do balance-spent", async () => withTmp(async (dir) => {
  const h = harness();
  h.balances.push(20, 16);
  const r = await h.exec({ phase: "session-check", checkBalance: true, dir });
  assert.equal(r.ok, false);
  assert.equal(r.stopReason, "balance-spent");
  assert.equal(r.balanceBefore, 20);
  assert.equal(r.balanceAfter, 16);
}));

test("executePhase: không đọc số dư khi pha không đụng tài khoản", async () => withTmp(async (dir) => {
  const h = harness();
  const r = await h.exec({ phase: "session-check", checkBalance: false, dir });
  assert.equal(r.ok, true);
  assert.equal(h.sent.length, 1);
  assert.equal(r.balanceBefore, undefined);
}));

/** Một lượt kiểm phiên với vận chuyển tùy: `khiGoi(url)` chạy TRƯỚC khi trả lời (nơi duy nhất thấy được pha đang chạy). */
async function chayVoiVanChuyen(dir: string, khiGoi: (url: string) => Promise<void>, o: { concurrency?: number } = {}): Promise<{ r: ExecResult; daHoi: string[] }> {
  const daHoi: string[] = [];
  const r = await executePhase({
    phase: "session-check",
    config: loadConfig(JSON.stringify(FAKE_CONFIG)),
    transport: async (url: string) => {
      await khiGoi(url);
      daHoi.push(url);
      return new URL(url).pathname.endsWith("/balance") ? json(env({ available: 20 })) : json(env({ available: true }));
    },
    snapshotRoot: join(dir, "snapshots"),
    statePath: join(dir, "state.json"),
    logPath: join(dir, "run.log.jsonl"),
    caps: { calls: 100, minutes: 60 },
    paceMs: 0,
    batchItems: 100,
    checkBalance: true,
    ...(o.concurrency ? { concurrency: o.concurrency } : {}),
    env: { sleep: async () => undefined, now: () => new Date("2026-11-24T04:00:00.000Z") },
  });
  return { r, daHoi };
}

test("tệp DUNG xuất hiện giữa lượt → lượt dừng sạch ở lời kế tiếp: operator-stop, xoá tệp DUNG, không ghi nhận bị chặn (giết tiến trình không đủ — mã vẫn sống trong dịch vụ trình duyệt, đo 24/11 18:09)", async () => withTmp(async (dir) => {
  const tepDung = join(dir, "DUNG");
  const { r, daHoi } = await chayVoiVanChuyen(dir, async (url) => {
    if (!new URL(url).pathname.endsWith("/balance")) await writeFile(tepDung, "", { flag: "wx" }).catch(() => undefined);
  });
  assert.equal(r.ok, false);
  assert.equal(r.stopReason, "operator-stop");
  assert.equal(r.blocks, 0);
  assert.equal(daHoi.length, 2, "số dư trước + một lời kiểm phiên; lời sau (gồm số dư sau) không gửi");
  await assert.rejects(readFile(tepDung), "tệp DUNG được tiêu dùng: xoá sau khi lượt dừng");
  assert.equal(r.blocks, 0, "dừng theo yêu cầu không phải bị chặn");
  const dong = (await readFile(join(dir, "run.log.jsonl"), "utf8")).trim().split("\n").map((l) => JSON.parse(l) as Record<string, unknown>);
  const ketQua = dong.find((d) => d.suKien === "ket-qua");
  assert.equal(ketQua?.reason, "operator-stop");
  assert.equal(ketQua?.ok, false);
  assert.equal(dong.at(-1)?.suKien, "dung-theo-yeu-cau", "ghi sổ việc đã tiêu dùng tệp DUNG");
  // Lượt kế chạy nhanh (nhiều luồng) phải chạy bình thường: dừng theo yêu cầu KHÔNG khoá tăng tốc như bị chặn.
  const lanHai = await chayVoiVanChuyen(dir, async () => undefined, { concurrency: 2 });
  assert.equal(lanHai.r.ok, true, `lượt kế bị dừng oan: ${lanHai.r.stopReason}`);
  assert.ok(lanHai.daHoi.length > 0);
}));

test("tệp DUNG có sẵn từ trước lượt → không gửi lời nào, trả operator-stop, xoá tệp", async () => withTmp(async (dir) => {
  await writeFile(join(dir, "DUNG"), "");
  const { r, daHoi } = await chayVoiVanChuyen(dir, async () => undefined);
  assert.equal(r.ok, false);
  assert.equal(r.stopReason, "operator-stop");
  assert.equal(daHoi.length, 0, "không gửi lời nào");
  await assert.rejects(readFile(join(dir, "DUNG")));
}));

test("executePhase: dừng vì bị chặn thì trả ok=false kèm lý do, snapshot có lý do dừng", async () => withTmp(async (dir) => {
  const h = harness();
  const transport = async (url: string): Promise<Response> => (new URL(url).pathname.endsWith("/projects") ? json({ message: "denied" }, 403) : json(env({})));
  const r = await executePhase({
    phase: "projects",
    config: loadConfig(JSON.stringify(FAKE_CONFIG)),
    transport,
    snapshotRoot: join(dir, "snapshots"),
    statePath: join(dir, "state.json"),
    logPath: join(dir, "run.log.jsonl"),
    caps: { calls: 100, minutes: 60 },
    paceMs: 0,
    batchItems: 100,
    checkBalance: false,
    env: { sleep: async () => undefined, now: () => new Date("2026-11-24T04:00:00.000Z") },
  });
  assert.equal(r.ok, false);
  assert.equal(r.stopReason, "blocked");
  assert.equal(r.blocks, 1);
  assert.equal(h.sent.length, 0);
}));

test("executePhase: trạng thái lưu ra tệp; chạy lại đọc lại và không lặp việc đã xong", async () => withTmp(async (dir) => {
  const h = harness();
  const first = await h.exec({ phase: "projects", checkBalance: false, dir });
  assert.equal(first.ok, true);
  const saved = JSON.parse(await readFile(join(dir, "state.json"), "utf8")) as { listDone: boolean; projectIds: string[]; detailDone: string[] };
  assert.equal(saved.listDone, true);
  assert.deepEqual(saved.detailDone, ["1"]);
  const callsAfterFirst = h.sent.length;
  const second = await h.exec({ phase: "projects", checkBalance: false, dir });
  assert.equal(second.ok, true);
  assert.equal(second.summary?.items, 0);
  assert.equal(h.sent.length, callsAfterFirst, "lượt hai không gọi gì");
  const log = (await readFile(join(dir, "run.log.jsonl"), "utf8")).trim().split("\n").map((l) => JSON.parse(l) as Record<string, unknown>);
  assert.ok(log.some((e) => e.suKien === "ket-qua" && e.ok === true), "log kết thúc lượt ở máy");
}));

test("executePhase: lỗi ngoài dự kiến (cấu hình thiếu đường) không bị nuốt, ném tiếp sau khi chốt phần đã có", async () => withTmp(async (dir) => {
  const h = harness();
  const { "project-list": _omit, ...pathsMissing } = FAKE_CONFIG.paths;
  await assert.rejects(
    () =>
      executePhase({
        phase: "projects",
        config: loadConfig(JSON.stringify({ ...FAKE_CONFIG, paths: pathsMissing })),
        transport: async (url: string): Promise<Response> => {
          h.sent.push(url);
          return json(env({}));
        },
        snapshotRoot: join(dir, "snapshots"),
        statePath: join(dir, "state.json"),
        logPath: join(dir, "run.log.jsonl"),
        caps: { calls: 100, minutes: 60 },
        paceMs: 0,
        batchItems: 100,
        checkBalance: false,
        env: { sleep: async () => undefined, now: () => new Date("2026-11-24T04:00:00.000Z") },
      }),
    ConfigError,
  );
  assert.equal(h.sent.length, 0, "thiếu đường thì không gửi gì");
}));

// ---------- tăng tốc có khoá (Mạnh 24/11: bị chặn lần một thì lùi về nhịp cũ, lần hai thì dừng) ----------

const FAKE_CONFIG_TANG_TOC = {
  ...FAKE_CONFIG,
  paths: { ...FAKE_CONFIG.paths, "full-config": "/v2.x/configuration" },
};
/** Nguồn lành cho pha mặt nạ: cấu hình đầy đủ có cơ sở tile, tile có dữ liệu. */
const nguonLanh = async (url: string): Promise<Response> =>
  new URL(url).pathname.endsWith("/configuration") ? json(env({ boundaries_conf: { _boundaries_black: "https://tiles.gia.test/data/ranh_thua" } })) : json(env({ ok: 1 }));

test("tăng tốc: chưa từng bị chặn thì được chạy nhanh (nhiều luồng, nhịp ngắn)", async () => withTmp(async (dir) => {
  const r = await executePhase({
    phase: "tile-mask",
    config: loadConfig(JSON.stringify(FAKE_CONFIG_TANG_TOC)),
    transport: nguonLanh,
    snapshotRoot: join(dir, "snapshots"),
    statePath: join(dir, "state.json"),
    logPath: join(dir, "run.log.jsonl"),
    caps: { calls: 100, minutes: 60 },
    paceMs: 150,
    concurrency: 4,
    batchItems: 100,
    checkBalance: false,
    grid: [{ marketId: "vn-a", name: "A", tiles: ["17/1/1"] }],
    env: { sleep: async () => undefined, now: () => new Date("2026-11-24T04:00:00.000Z") },
  });
  assert.equal(r.ok, true);
  assert.equal(JSON.parse(await readFile(join(dir, "state.json"), "utf8")).blockedRuns, 0);
}));

test("tăng tốc: bị chặn một lần thì ghi vào trạng thái; lần sau chỉ còn nhịp cũ một luồng", async () => withTmp(async (dir) => {
  const statePath = join(dir, "state.json");
  const base = {
    phase: "tile-mask" as const,
    config: loadConfig(JSON.stringify(FAKE_CONFIG_TANG_TOC)),
    snapshotRoot: join(dir, "snapshots"),
    statePath,
    logPath: join(dir, "run.log.jsonl"),
    caps: { calls: 100, minutes: 60 },
    batchItems: 100,
    checkBalance: false,
    grid: [{ marketId: "vn-a", name: "A", tiles: ["17/1/1"] }],
    env: { sleep: async () => undefined, now: () => new Date("2026-11-24T04:00:00.000Z") },
  };
  // Lượt 1: nguồn trả 403 → bị chặn
  const r1 = await executePhase({ ...base, transport: async () => json({ message: "denied" }, 403), paceMs: 200, concurrency: 2 });
  assert.equal(r1.stopReason, "blocked");
  assert.equal(JSON.parse(await readFile(statePath, "utf8")).blockedRuns, 1, "ghi lại một lần bị chặn");
  // Lượt 2 (tăng tốc): từ chối ngay, không gửi gì
  const sent: string[] = [];
  const r2 = await executePhase({ ...base, paceMs: 200, concurrency: 2, transport: async (url) => {
    sent.push(url);
    return nguonLanh(url);
  } });
  assert.equal(r2.stopReason, "fast-after-block", "đã bị chặn một lần thì không được tăng tốc nữa");
  assert.equal(sent.length, 0);
  // Lượt 2 (nhịp cũ, một luồng): được chạy
  const r3 = await executePhase({ ...base, paceMs: 350, concurrency: 1, transport: nguonLanh });
  assert.equal(r3.ok, true);
}));

test("tăng tốc: bị chặn hai lần thì dừng hẳn, kể cả nhịp cũ — chờ người quyết", async () => withTmp(async (dir) => {
  const statePath = join(dir, "state.json");
  await writeFile(statePath, JSON.stringify({ ...emptyState(), blockedRuns: 2 }));
  const sent: string[] = [];
  const r = await executePhase({
    phase: "tile-mask",
    config: loadConfig(JSON.stringify(FAKE_CONFIG_TANG_TOC)),
    transport: async (url) => {
      sent.push(url);
      return nguonLanh(url);
    },
    snapshotRoot: join(dir, "snapshots"),
    statePath,
    logPath: join(dir, "run.log.jsonl"),
    caps: { calls: 100, minutes: 60 },
    paceMs: 350,
    concurrency: 1,
    batchItems: 100,
    checkBalance: false,
    grid: [{ marketId: "vn-a", name: "A", tiles: ["17/1/1"] }],
    env: { sleep: async () => undefined, now: () => new Date("2026-11-24T04:00:00.000Z") },
  });
  assert.equal(r.stopReason, "blocked-twice");
  assert.equal(sent.length, 0, "không gửi lời nào");
}));

test("RunStopped mang tên lớp để nhận diện ở ranh giới tiến trình", () => {
  const e = new RunStopped("blocked", "x");
  assert.equal(e.name, "RunStopped");
  assert.equal(e.reason, "blocked");
});

test("executePhase: không đọc được số dư thì dừng TRƯỚC khi chạy pha, lý do balance-unreadable (đo 24/11)", async () => withTmp(async (dir) => {
  const sent: string[] = [];
  const transport = async (url: string): Promise<Response> => {
    sent.push(url);
    return new URL(url).pathname.endsWith("/balance") ? json(env({ detail_by_type: [] })) : json(env({ available: true }));
  };
  const r = await executePhase({
    phase: "session-check",
    config: loadConfig(JSON.stringify(FAKE_CONFIG)),
    transport,
    snapshotRoot: join(dir, "snapshots"),
    statePath: join(dir, "state.json"),
    logPath: join(dir, "run.log.jsonl"),
    caps: { calls: 100, minutes: 60 },
    paceMs: 0,
    batchItems: 100,
    checkBalance: true,
    env: { sleep: async () => undefined, now: () => new Date("2026-11-24T04:00:00.000Z") },
  });
  assert.equal(r.ok, false);
  assert.equal(r.stopReason, "balance-unreadable");
  assert.equal(sent.length, 1, "chỉ có lời đọc số dư; pha không chạy");
}));

test("summarize: kết quả thiếu trường (lỗi ngoài dự kiến) vẫn in được dòng tóm tắt", () => {
  const line = summarize({ ok: false, message: "lỗi" } as unknown as Awaited<ReturnType<typeof executePhase>>);
  assert.equal(line.ok, false);
  assert.equal(line.snapshots, 0);
  assert.doesNotMatch(JSON.stringify(line), /undefined/);
});

test("summarize: lượt dừng giữa chừng chưa đọc số dư sau thì để trống, không nói «đổi»", () => {
  const line = summarize({ ok: false, stopReason: "call-cap", snapshots: [], calls: 5, blocks: 0, balanceBefore: 20 } as unknown as Awaited<ReturnType<typeof executePhase>>);
  assert.equal(line.ok, false);
  assert.equal("soDuKhongDoi" in line, true);
  assert.equal(line.soDuKhongDoi, undefined, "chưa có số sau thì không kết luận gì");
  assert.equal(summarize({ ok: true, snapshots: [], calls: 3, blocks: 0, balanceBefore: 20, balanceAfter: 20 } as unknown as Awaited<ReturnType<typeof executePhase>>).soDuKhongDoi, true);
});

// ---------- mọi tuỳ chọn đều đi qua ranh giới tiến trình (lỗi thật 24/11: thiếu snapshotRoot, thiếu số dư, thiếu dải id thấp tầng) ----------

test("buildExecOptions: mọi trường của bản kê đi nguyên vẹn sang tuỳ chọn của trình điều khiển", () => {
  // Mỗi trường một giá trị nhận diện riêng; sau đó kiểm đúng giá trị ấy ở đầu ra.
  const ke = {
    config: loadConfig(JSON.stringify(FAKE_CONFIG)),
    snapshotRoot: "/goc/snapshot",
    statePath: "/trang-thai/s.json",
    logPath: "/nhat-ky/l.jsonl",
    caps: { calls: 41, minutes: 7 },
    paceMs: 211,
    batchItems: 13,
    checkBalance: true,
    grid: [{ marketId: "vn-a", name: "A", tiles: ["17/1/1"] }],
    parcels: [{ khuVucId: "vn-k", ten: "K", dienTichKm2: 1, buocM: 30, diem: [[21, 105] as [number, number]] }],
    lowriseTerms: ["Villa"],
    lowriseSweep: { from: 3, to: 9 },
    concurrency: 4,
    listOnly: true,
    projects: ["1004"],
    proveBuilding: "P12",
    apartmentPageSize: 77,
    tileZoom: 19,
    emptyTileBytes: 1234,
    listSize: 55,
    tatCaDuAn: { tuSoCan: 3000, denSoCan: 9000, gioiHan: 7, ids: ["7"], concurrency: 2, apartmentPageSize: 77 },
    anh: { luongSong: 3, soFile: 120 },
    tabLabel: "p2",
  };
  const o = buildExecOptions(ke) as Record<string, unknown>;
  assert.equal(o.phase, undefined, "pha do nơi gọi đặt");
  assert.equal(o.snapshotRoot, "/goc/snapshot");
  assert.equal(o.statePath, "/trang-thai/s.json");
  assert.equal(o.logPath, "/nhat-ky/l.jsonl");
  assert.deepEqual(o.caps, { calls: 41, minutes: 7 });
  assert.equal(o.paceMs, 211);
  assert.equal(o.tabLabel, "p2", "trang chạy trong trang (mở thêm để hai pha song song) đi sang tiến trình trình duyệt");
  assert.equal(o.batchItems, 13);
  assert.equal(o.checkBalance, true);
  assert.equal(o.grid, ke.grid);
  assert.equal(o.parcels, ke.parcels);
  assert.deepEqual(o.lowriseTerms, ["Villa"]);
  assert.deepEqual(o.lowriseSweep, { from: 3, to: 9 });
  assert.equal(o.concurrency, 4);
  assert.equal(o.listOnly, true);
  assert.deepEqual(o.projects, ["1004"]);
  assert.equal(o.proveBuilding, "P12");
  assert.equal(o.apartmentPageSize, 77);
  assert.equal(o.tileZoom, 19);
  assert.equal(o.emptyTileBytes, 1234);
  assert.equal(o.listSize, 55);
  assert.deepEqual(o.tatCaDuAn, ke.tatCaDuAn);
  assert.deepEqual(o.anh, { luongSong: 3, soFile: 120 });
  assert.equal(o.transport, undefined, "vận chuyển do nơi gọi đặt (Node hay trình duyệt)");
  // Không trường nào của bản kê bị bỏ sót: mọi khoá của ke (trừ config) đều có mặt trong đầu ra.
  for (const k of Object.keys(ke)) if (k !== "config") assert.ok(k in o, `thiếu trường ${k}`);
});

test("main: đường dẫn tệp đưa cho tiến trình trình duyệt phải tuyệt đối (tiến trình ấy không chạy trong thư mục của người gọi)", () => {
  const goc = "/goc/du-an/collector";
  const v = parseCli([
    "--phase", "parcels", "--space", "4", "--caps-calls", "10", "--caps-minutes", "5", "--snapshots-root", "/goc/snap",
    "--parcels-grid", "state/luoi-thua.json", "--thap-tang-terms", "tu-khoa.json", "--grid", "state/luoi-tile.json",
  ]);
  const cfg = loadConfig(JSON.stringify(FAKE_CONFIG));
  const o = egoOptions(v, cfg, { statePath: "/tmp/s.json", logPath: "/tmp/l.jsonl", resultPath: "/tmp/r.json" }, goc);
  assert.equal(o.parcelsGrid, `${goc}/state/luoi-thua.json`);
  assert.equal(o.lowriseTermsFile, `${goc}/tu-khoa.json`);
  assert.equal(o.grid, `${goc}/state/luoi-tile.json`, "lưới tile cũng là tệp");
  assert.equal(o.snapshotRoot, "/goc/snap");
  assert.equal(o.lowriseSweep, undefined);
  assert.equal(o.config, cfg);
});

test("mỗi lượt qua trình duyệt có một mã lượt; kết quả chỉ được nhận khi mang đúng mã của LƯỢT NÀY (lượt soát 24/11: tệp kết quả còn sót của lượt trước bị đọc làm kết quả lượt mới)", async () => withTmp(async (dir) => {
  const v = parseCli(["--phase", "session-check", "--space", "4", "--caps-calls", "3", "--caps-minutes", "5", "--snapshots-root", join(dir, "snap")]);
  const a = egoOptions(v, loadConfig(JSON.stringify(FAKE_CONFIG)), { statePath: join(dir, "s.json"), logPath: join(dir, "l.jsonl"), resultPath: join(dir, "r.json") }) as Record<string, unknown>;
  const b = egoOptions(v, loadConfig(JSON.stringify(FAKE_CONFIG)), { statePath: join(dir, "s.json"), logPath: join(dir, "l.jsonl"), resultPath: join(dir, "r.json") }) as Record<string, unknown>;
  assert.match(String(a.runId), /^[0-9a-f]{16}$/);
  assert.notEqual(a.runId, b.runId, "mỗi lượt một mã riêng");
  const resultPath = join(dir, "r.json");
  assert.equal(await readRunResult(resultPath, String(a.runId)), null, "chưa có tệp kết quả");
  await writeFile(resultPath, JSON.stringify({ ok: true, runId: "lan-truoc" }));
  assert.equal(await readRunResult(resultPath, String(a.runId)), null, "kết quả của lượt khác không được nhận");
  await writeFile(resultPath, JSON.stringify({ ok: false, stopReason: "blocked", runId: a.runId }));
  assert.equal((await readRunResult(resultPath, String(a.runId)))?.stopReason, "blocked");
}));

test("executePhase: kiểm phiên không đọc số dư với trần MỘT lời — gửi đúng MỘT lời kiểm phiên tới máy chủ API, kết quả alive, không có số dư", async () => withTmp(async (dir) => {
  const h = harness();
  const r = await h.exec({ phase: "session-check", checkBalance: false, dir, caps: { calls: 1, minutes: 5 } });
  assert.deepEqual([r.ok, r.calls, r.summary?.alive, r.balanceBefore, r.balanceAfter], [true, 1, true, undefined, undefined]);
  assert.equal(h.sent.length, 1);
  assert.match(h.sent[0], /\/data-available$/, "đúng một lời, là lời kiểm phiên (máy chủ API)");
}));

// ---------- claudedp-2611-19: dòng «phan-hoi» không được chứa định danh tài khoản thu, mã phiên, khoá, cookie ----------

// Mọi chuỗi dưới đây là GIẢ (tự bịa), không lấy từ nguồn.
const KIM_GIA = {
  phien: "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiI3Nzc3IiwidXNlciI6InR1dF9RSEifQ.c2lnbmF0dXJlLV9TVS1EYU5nLV8yMzQ1Njc4OTAtYWJjZGVmZ2hpamtsbW5vcA",
  khoas: ["sk-live-QWERTYUIOP1234567890asdfghjkl", "phc_ZXCVBNM1234567890qwertyuiopASDF", "AKIAIOSFODNN7EXAMPLEQWERTYUIOPASDFGHJK"],
  cookie: "JSESSIONID_GIA=ABCDEF0123456789abcdefABCDEF01; PHIEN_GIA=ZXCVBNM0987654321zxcvbnmQWERTY; refresh-token-gia=QWERTYUIOP0987654321asdfghjklzxcvbnm",
  dinhDanh: ["thu.thu", "thu.thu@example.test", "Thu Thị Thu", "87654321", "0912345678"],
};
const docThanTho = async (dir: string, dong: Record<string, unknown>): Promise<string> => readFile(join(dir, "phan-hoi", String(dong.thanThoTep)), "utf8");

test("dòng «phan-hoi» KHÔNG chứa định danh tài khoản thu, mã phiên, khoá, cookie dù thân câu trả lời lỗi có (claudedp-2611-19); thân gốc chỉ vào tệp riêng trong máy", async () => withTmp(async (dir) => {
  const h = harness();
  const than = JSON.stringify({
    status: false,
    code: 401,
    message: `Tài khoản ${KIM_GIA.dinhDanh[1]} (user_id ${KIM_GIA.dinhDanh[3]}, SĐT ${KIM_GIA.dinhDanh[4]}) bị khóa; token ${KIM_GIA.phien}`,
    username: KIM_GIA.dinhDanh[0],
    email: KIM_GIA.dinhDanh[1],
    name: KIM_GIA.dinhDanh[2],
    user_id: Number(KIM_GIA.dinhDanh[3]),
    phone: KIM_GIA.dinhDanh[4],
    token: KIM_GIA.phien,
    api_key: KIM_GIA.khoas[0],
    keys: KIM_GIA.khoas,
    cookie: KIM_GIA.cookie,
    authorization: `Bearer ${KIM_GIA.phien}`,
    traceId: "a1b2c3d4e5f60718",
    requestId: KIM_GIA.phien, // mã phiên đội lốt khoá «mã yêu cầu»: phải bị bỏ (có dấu chấm)
    limit: 20000,
    remaining: 0,
    reset: 1799999999999,
    errors: [{ field: "token", message: `khoá ${KIM_GIA.khoas[1]}`, code: "TOKEN_INVALID" }],
    error: KIM_GIA.phien,
    retryAfter: KIM_GIA.khoas[0],
  });
  h.loi.push(["/projects/1/tree", { status: 403, contentType: "application/json", body: than }]);
  h.phu = { ms: 12, headers: { "retry-after": "30", "ratelimit-remaining": "0", "x-request-id": "req-09f1c2d3e4b5" } };
  await h.exec({ phase: "projects", checkBalance: false, dir }).catch(() => undefined);
  const nhatKy = await readFile(join(dir, "run.log.jsonl"), "utf8");
  const dong = (await docPhanHoi(dir)).filter((d) => d.status === 403);
  assert.equal(dong.length, 1);
  // (a) không một dấu nhận diện nào lọt vào tệp nhật ký
  const kim = [KIM_GIA.phien, "eyJhbGciOiJIUzI1NiJ9", "eyJzdWIiOiI3Nzc3IiwidXNlciI6InR1dF9RSEifQ", "c2lnbmF0dXJlLV9TVS1EYU5nLV8yMzQ1Njc4OTAt", ...KIM_GIA.khoas, ...KIM_GIA.dinhDanh, "JSESSIONID", "ABCDEF0123456789", "refresh-token", "Bearer", "Tài khoản", "TOKEN_INVALID "];
  for (const k of kim) assert.equal(nhatKy.includes(k), false, `nhật ký không được chứa «${k.slice(0, 28)}»`);
  assert.equal(/"thanTho"\s*:/.test(nhatKy), false, "thân gốc không có trường nào trong nhật ký");
  // (b) chẩn đoán vẫn còn đủ
  assert.deepEqual(dong[0], {
    suKien: "phan-hoi",
    vai: "building-tree",
    status: 403,
    ms: 12,
    contentType: "application/json",
    headers: { "retry-after": "30", "ratelimit-remaining": "0", "x-request-id": "req-09f1c2d3e4b5" },
    than: { dai: than.length, kieu: "json", chanDoan: { status: false, code: 401, traceId: "a1b2c3d4e5f60718", limit: 20000, remaining: 0, reset: 1799999999999, errors: [{ code: "TOKEN_INVALID" }] }, daBo: 16 },
    thanThoTep: dong[0].thanThoTep,
  });
  // Thân gốc còn nguyên ở tệp riêng (tầng A, không lên kênh)
  const goc = await docThanTho(dir, dong[0]);
  for (const k of [KIM_GIA.phien, KIM_GIA.dinhDanh[1], KIM_GIA.dinhDanh[4], KIM_GIA.cookie]) assert.equal(goc.includes(k), true, `tệp riêng giữ «${k.slice(0, 20)}»`);
}));

test("đối chứng (claudedp-2611-19): câu 429 vẫn ghi đủ chẩn đoán — mã trạng thái, retry-after, ratelimit-*, mã yêu cầu, và các trường số của thân; chữ tự do của thân không vào nhật ký", async () => withTmp(async (dir) => {
  const h = harness();
  const than = JSON.stringify({
    timestamp: "2026-11-27T15:00:00.000+00:00",
    status: 429,
    error: "Too Many Requests",
    message: `Số lượt tra cứu trong ngày của tài khoản ${KIM_GIA.dinhDanh[0]} đã hết: 20000`,
    traceId: "ffeeddccbbaa0099",
    limit: 20000,
    remaining: 0,
    resetAt: 1799999999999,
    path: "/v9.x-gia/data-available",
  });
  h.loi.push(["/projects/1/tree", { status: 429, contentType: "application/json", body: than }]);
  h.phu = { ms: 77, headers: { "retry-after": "30", "ratelimit-limit": "20000", "ratelimit-remaining": "0", "ratelimit-reset": "60", "x-request-id": "req-7788" } };
  const r = await h.exec({ phase: "projects", checkBalance: false, dir }).catch(() => undefined);
  void r;
  const nhatKy = await readFile(join(dir, "run.log.jsonl"), "utf8");
  const dong = (await docPhanHoi(dir)).filter((d) => d.status === 429);
  assert.equal(dong.length, 1);
  const { thanThoTep, ...d } = dong[0] as Record<string, unknown> & { thanThoTep?: string };
  assert.deepEqual(d, {
    suKien: "phan-hoi",
    vai: "building-tree",
    status: 429,
    ms: 77,
    contentType: "application/json",
    headers: { "retry-after": "30", "ratelimit-limit": "20000", "ratelimit-remaining": "0", "ratelimit-reset": "60", "x-request-id": "req-7788" },
    than: { dai: than.length, kieu: "json", chanDoan: { status: 429, traceId: "ffeeddccbbaa0099", limit: 20000, remaining: 0, resetAt: 1799999999999 }, daBo: 4 },
  });
  assert.equal(typeof thanThoTep, "string");
  assert.equal(nhatKy.includes(KIM_GIA.dinhDanh[0]), false, "tên tài khoản trong lời báo của thân không vào nhật ký");
  assert.equal(nhatKy.includes("Too Many Requests"), false, "chữ tự do của thân không vào nhật ký");
}));

test("thân KHÔNG phải JSON (trang HTML thử thách, trang lỗi XML) thì nhật ký chỉ có loại và độ dài; token, cookie, khoá trong trang không vào nhật ký", async () => withTmp(async (dir) => {
  const html = "<html><head><script>var csrf='QWERTYUIOP0987654321asdfghjkl'; document.cookie=\"SID=ZXCVBNM0987654321zxcvbnm\";</script>Just a moment...</html>";
  const xml = "<Error><Code>NoSuchKey</Code><AWSAccessKeyId>ASIAIOSFODNN7EXAMPLEQWERTYUIOPASDFGHJKL</AWSAccessKeyId></Error>";
  // Mỗi câu ở một thư mục trạng thái riêng: lượt trước đã ghi «dự án 1 đã lấy chi tiết» nên lượt sau sẽ không hỏi lại toà.
  const mot = async (ten: string, phuongTien: { status: number; contentType: string; body: string }) => {
    const h = harness();
    h.loi.push(["/projects/1/tree", phuongTien]);
    await h.exec({ phase: "projects", checkBalance: false, dir: join(dir, ten) }).catch(() => undefined);
    const ds = (await docPhanHoi(join(dir, ten))).filter((d) => d.status === phuongTien.status);
    assert.ok(ds.length >= 1, `có dòng phan-hoi cho câu ${phuongTien.status}`);
    return ds[0];
  };
  const dHtml = await mot("a", { status: 503, contentType: "text/html", body: html }); // 5xx: nguồn thử lại nên có vài dòng, lấy dòng đầu
  const dXml = await mot("b", { status: 404, contentType: "application/xml", body: xml });
  assert.deepEqual(
    [[dHtml.status, dHtml.contentType, dHtml.than], [dXml.status, dXml.contentType, dXml.than]],
    [
      [503, "text/html", { dai: html.length, kieu: "html", chanDoan: {}, daBo: 0 }],
      [404, "application/xml", { dai: xml.length, kieu: "xml", chanDoan: {}, daBo: 0 }],
    ],
  );
  const nhatKy = (await readFile(join(dir, "a", "run.log.jsonl"), "utf8")) + (await readFile(join(dir, "b", "run.log.jsonl"), "utf8"));
  for (const k of ["QWERTYUIOP0987654321", "SID=", "document.cookie", "Just a moment", "ASIAIOSFODNN7", "NoSuchKey"]) assert.equal(nhatKy.includes(k), false, `nhật ký không được chứa «${k}»`);
  const goc = await docThanTho(join(dir, "a"), dHtml);
  assert.equal(goc.includes("document.cookie"), true, "thân gốc HTML còn ở tệp riêng");
}));

test("thân câu trả lời lỗi DÀI: tệp riêng chỉ giữ 64 KB đầu; nhật ký ghi đúng độ dài thật (đột biến bỏ chỗ cắt phải bị bắt)", async () => withTmp(async (dir) => {
  const h = harness();
  const than = "y".repeat(65_536 + 5_000) + "HET";
  h.loi.push(["/projects/1/tree", { status: 404, contentType: "application/json", body: than }]);
  await h.exec({ phase: "projects", checkBalance: false, dir }).catch(() => undefined);
  const ds = await docPhanHoi(dir);
  assert.equal(ds.length, 1);
  assert.deepEqual(ds[0].than, { dai: than.length, kieu: "khac", chanDoan: {}, daBo: 0 }, "không phải JSON hợp lệ: loại «khac», độ dài thật");
  const goc = await docThanTho(dir, ds[0]);
  const thanTep = goc.slice(goc.indexOf("\n\n") + 2);
  assert.equal(thanTep.length, 65_536, "tệp riêng cắt ở 64 KB");
  assert.equal(thanTep.includes("HET"), false, "phần sau 64 KB không lọt vào tệp");
}));

test("tăng tốc: bị chặn HAI LẦN THẬT thì dừng hẳn — lượt 1 trả 403, lượt 2 (một luồng, nhịp cũ) trả 403 nữa → trạng thái ghi 2 → lượt 3 dừng blocked-twice, không gửi gì (lượt xét vòng 1, AC-2: đo đường cộng dồn, không viết tay số 2)", async () => withTmp(async (dir) => {
  const statePath = join(dir, "state.json");
  const docState = async () => (JSON.parse(await readFile(statePath, "utf8")) as { blockedRuns?: number }).blockedRuns;
  const base = {
    phase: "tile-mask" as const,
    config: loadConfig(JSON.stringify(FAKE_CONFIG_TANG_TOC)),
    snapshotRoot: join(dir, "snapshots"),
    statePath,
    logPath: join(dir, "run.log.jsonl"),
    caps: { calls: 100, minutes: 60 },
    batchItems: 100,
    checkBalance: false,
    grid: [{ marketId: "vn-a", name: "A", tiles: ["17/1/1"] }],
    env: { sleep: async () => undefined, now: () => new Date("2026-11-24T04:00:00.000Z") },
  };
  // Lượt 1: nguồn trả 403 → bị chặn lần thứ nhất.
  const r1 = await executePhase({ ...base, paceMs: 350, concurrency: 1, transport: async () => json({ message: "denied" }, 403) });
  assert.equal(r1.stopReason, "blocked");
  assert.equal(await docState(), 1, "sau lượt 1 trạng thái ghi 1");
  // Lượt 2: một luồng, nhịp cũ (được chạy vì mới bị chặn một lần) → nguồn trả 403 lần nữa.
  const r2 = await executePhase({ ...base, paceMs: 350, concurrency: 1, transport: async () => json({ message: "denied" }, 403) });
  assert.equal(r2.stopReason, "blocked", "lượt 2 được gửi và bị chặn lần thứ hai");
  assert.equal(await docState(), 2, "sau lượt 2 trạng thái CỘNG DỒN thành 2 (đột biến «= 1» thì còn 1 → ca đỏ)");
  // Lượt 3: dừng hẳn trước khi gửi lời nào, kể cả ở nhịp cũ.
  const sent: string[] = [];
  const r3 = await executePhase({ ...base, paceMs: 350, concurrency: 1, transport: async (url) => {
    sent.push(url);
    return nguonLanh(url);
  } });
  assert.equal(r3.stopReason, "blocked-twice", "lần thứ ba dừng hẳn, chờ người quyết");
  assert.equal(sent.length, 0, "không gửi lời nào");
  assert.equal(await docState(), 2, "lượt bị từ chối không đổi số lần bị chặn");
}));
