"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { blogPosts } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { generateAndPublishPost } from "@/lib/blog/generate";

async function requireAdmin() {
  const current = await getCurrentUser();
  if (current?.dbUser?.role !== "admin") return null;
  return current;
}

/** Egy új AI blogbejegyzés azonnali generálása (admin). */
export async function generateBlogPostNow() {
  if (!(await requireAdmin())) return { error: "Csak admin" };
  try {
    const res = await generateAndPublishPost();
    revalidatePath("/blog");
    revalidatePath("/admin/blog");
    revalidatePath("/sitemap.xml");
    return { success: true, slug: res.slug, title: res.title };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Ismeretlen hiba a generálás során" };
  }
}

/** Bejegyzés státuszának váltása (publikált ↔ piszkozat). */
export async function toggleBlogStatus(id: string, publish: boolean) {
  if (!(await requireAdmin())) return { error: "Csak admin" };
  await db
    .update(blogPosts)
    .set({ status: publish ? "published" : "draft", updatedAt: new Date() })
    .where(eq(blogPosts.id, id));
  revalidatePath("/blog");
  revalidatePath("/admin/blog");
  return { success: true };
}

/** Bejegyzés törlése. */
export async function deleteBlogPost(id: string) {
  if (!(await requireAdmin())) return { error: "Csak admin" };
  await db.delete(blogPosts).where(eq(blogPosts.id, id));
  revalidatePath("/blog");
  revalidatePath("/admin/blog");
  return { success: true };
}
