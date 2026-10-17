"use server";

import { randomBytes } from "node:crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { pool } from "@/lib/db";
import {
  createSession,
  destroySession,
  getSessionUser,
  hashPassword,
  verifyPassword,
} from "@/lib/auth";

const safeNext = (next: string | null | undefined) =>
  next && next.startsWith("/") && !next.startsWith("//") ? next : "/";

export async function login(formData: FormData): Promise<void> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const next = safeNext(formData.get("next") as string | null);
  if (!email || !password) {
    redirect(`/login?error=${encodeURIComponent("Email and password are required")}&next=${encodeURIComponent(next)}`);
  }
  const { rows } = await pool.query(
    `SELECT id, password_hash FROM users WHERE email = $1`,
    [email],
  );
  const user = rows[0];
  if (!user || !verifyPassword(password, user.password_hash)) {
    redirect(`/login?error=${encodeURIComponent("Invalid email or password")}&next=${encodeURIComponent(next)}`);
  }
  await createSession(user.id);
  redirect(next);
}

export async function register(formData: FormData): Promise<void> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const next = safeNext(formData.get("next") as string | null);
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || password.length < 8) {
    redirect(
      `/login?error=${encodeURIComponent("Valid email and password ≥ 8 characters required")}&next=${encodeURIComponent(next)}&mode=register`,
    );
  }
  const id = `usr_${randomBytes(8).toString("hex")}`;
  const { rowCount } = await pool.query(
    `INSERT INTO users (id, email, password_hash) VALUES ($1, $2, $3)
     ON CONFLICT (email) DO NOTHING`,
    [id, email, hashPassword(password)],
  );
  if (!rowCount) {
    redirect(`/login?error=${encodeURIComponent("Email already registered")}&next=${encodeURIComponent(next)}&mode=register`);
  }
  await createSession(id);
  redirect(next);
}

export async function logout(): Promise<void> {
  await destroySession();
  revalidatePath("/", "layout");
  redirect("/");
}

/** Toggle lưu/bỏ lưu một area; chuyển hướng đăng nhập nếu chưa có session. */
export async function toggleSaved(formData: FormData): Promise<void> {
  const areaId = String(formData.get("areaId") ?? "");
  const redirectTo = safeNext(formData.get("redirectTo") as string | null);
  const user = await getSessionUser();
  if (!user) {
    redirect(`/login?error=${encodeURIComponent("Sign in to save markets")}&next=${encodeURIComponent(redirectTo)}`);
  }
  const { rowCount } = await pool.query(
    `DELETE FROM saved_markets WHERE user_id = $1 AND area_id = $2`,
    [user.id, areaId],
  );
  if (!rowCount) {
    await pool.query(
      `INSERT INTO saved_markets (user_id, area_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [user.id, areaId],
    );
  }
  revalidatePath("/", "layout");
  redirect(redirectTo);
}

/**
 * Demo plan switch — thay cho billing webhook thật.
 * Chỉ đổi plan của chính user đang đăng nhập.
 */
export async function setPlan(formData: FormData): Promise<void> {
  const plan = String(formData.get("plan") ?? "");
  const redirectTo = safeNext(formData.get("redirectTo") as string | null);
  const user = await getSessionUser();
  if (user && (plan === "free" || plan === "pro")) {
    await pool.query(`UPDATE users SET plan = $1 WHERE id = $2`, [plan, user.id]);
  }
  revalidatePath("/", "layout");
  redirect(redirectTo);
}
