"use server";

import { prisma } from "@/lib/prisma";
import { signIn } from "@/lib/auth";
import { hash } from "bcryptjs";
import { AuthError } from "next-auth";

const adminEmails = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase());

export async function registerAction(
  name: string,
  email: string,
  password: string
): Promise<{ error?: string }> {
  if (!name.trim())     return { error: "Name is required." };
  if (!email.trim())    return { error: "Email is required." };
  if (password.length < 8) return { error: "Password must be at least 8 characters." };

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { error: "An account with that email already exists." };

  const hashed = await hash(password, 12);
  const role = adminEmails.includes(email.toLowerCase()) ? "ADMIN" : "USER";

  await prisma.user.create({
    data: { name: name.trim(), email, password: hashed, role },
  });

  try {
    await signIn("credentials", { email, password, redirectTo: "/dashboard" });
  } catch (e) {
    if (e instanceof AuthError) return { error: "Account created but sign-in failed. Try logging in." };
    throw e;
  }
  return {};
}
