import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import type { CheckpointLike } from "./types.js";

/** Trạng thái chạy lưu JSON theo <stateDir>/<city>__<source>.json — resume được sau đứt quãng. */
export class Checkpoint implements CheckpointLike {
  private data: Record<string, unknown> = {};

  private constructor(private readonly file: string) {}

  static async load(file: string): Promise<Checkpoint> {
    const cp = new Checkpoint(file);
    try {
      cp.data = JSON.parse(await readFile(file, "utf8"));
    } catch {
      cp.data = {};
    }
    return cp;
  }

  get<T>(key: string): T | undefined {
    return this.data[key] as T | undefined;
  }

  set(key: string, value: unknown): void {
    this.data[key] = value;
  }

  async save(): Promise<void> {
    await mkdir(dirname(this.file), { recursive: true });
    await writeFile(this.file, JSON.stringify(this.data, null, 2));
  }
}
