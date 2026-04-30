"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hash, compare } from "bcryptjs";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

async function getSession() {
  const session = await auth();
  if (!session) redirect("/login");
  return session;
}

export async function updateProfileAction(name: string): Promise<{ error?: string }> {
  const session = await getSession();
  if (!name.trim()) return { error: "Name cannot be empty." };
  await prisma.user.update({ where: { id: session.user.id }, data: { name: name.trim() } });
  revalidatePath("/account");
  revalidatePath("/dashboard");
  return {};
}

export async function changePasswordAction(
  currentPassword: string,
  newPassword: string
): Promise<{ error?: string }> {
  const session = await getSession();
  if (newPassword.length < 8) return { error: "New password must be at least 8 characters." };

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user?.password) return { error: "No password set on this account." };

  const valid = await compare(currentPassword, user.password);
  if (!valid) return { error: "Current password is incorrect." };

  const hashed = await hash(newPassword, 12);
  await prisma.user.update({ where: { id: session.user.id }, data: { password: hashed } });
  return {};
}
