"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";

export async function createCourse(formData: FormData) {
  const session = await requireAdmin();
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  if (!title) return;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("courses")
    .insert({ title, description, created_by: session.user.id })
    .select("id")
    .single();

  if (error || !data) return;

  revalidatePath("/admin");
  redirect(`/admin/courses/${data.id}`);
}

export async function togglePublish(courseId: string, isPublished: boolean) {
  await requireAdmin();
  const admin = createAdminClient();
  await admin.from("courses").update({ is_published: isPublished }).eq("id", courseId);
  revalidatePath("/admin");
  revalidatePath("/courses");
}

export async function createModule(formData: FormData) {
  await requireAdmin();
  const courseId = String(formData.get("course_id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const position = Number(formData.get("position") ?? 0);
  if (!title || !courseId) return;

  const admin = createAdminClient();
  await admin.from("modules").insert({ course_id: courseId, title, position });

  revalidatePath(`/admin/courses/${courseId}`);
}

export async function createLesson(formData: FormData) {
  await requireAdmin();
  const courseId = String(formData.get("course_id") ?? "");
  const moduleId = String(formData.get("module_id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const kind = String(formData.get("kind") ?? "video") === "short" ? "short" : "video";
  const videoPath = String(formData.get("video_path") ?? "").trim();
  const isPreview = formData.get("is_preview") === "on";
  const position = Number(formData.get("position") ?? 0);

  if (!title || !moduleId) return;

  const admin = createAdminClient();
  await admin.from("lessons").insert({
    module_id: moduleId,
    title,
    kind,
    video_path: videoPath || null,
    is_preview: isPreview,
    position,
  });

  revalidatePath(`/admin/courses/${courseId}`);
}

export async function createDocument(formData: FormData) {
  await requireAdmin();
  const courseId = String(formData.get("course_id") ?? "");
  const lessonId = String(formData.get("lesson_id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const filePath = String(formData.get("file_path") ?? "").trim();

  if (!title || !lessonId || !filePath) return;

  const admin = createAdminClient();
  await admin.from("documents").insert({ lesson_id: lessonId, title, file_path: filePath });

  revalidatePath(`/admin/courses/${courseId}`);
}

export async function enrollStudent(formData: FormData) {
  await requireAdmin();
  const courseId = String(formData.get("course_id") ?? "");
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!courseId || !email) return;

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (!profile) {
    redirect(
      `/admin/courses/${courseId}?error=${encodeURIComponent(
        `No student found with email ${email}. They need to sign up first.`
      )}`
    );
  }

  const { error } = await admin
    .from("enrollments")
    .insert({ user_id: profile.id, course_id: courseId });

  if (error && !error.message.includes("duplicate")) {
    redirect(`/admin/courses/${courseId}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath(`/admin/courses/${courseId}`);
}

export async function unenrollStudent(formData: FormData) {
  await requireAdmin();
  const courseId = String(formData.get("course_id") ?? "");
  const enrollmentId = String(formData.get("enrollment_id") ?? "");
  if (!courseId || !enrollmentId) return;

  const admin = createAdminClient();
  await admin.from("enrollments").delete().eq("id", enrollmentId);

  revalidatePath(`/admin/courses/${courseId}`);
}

const ALLOWED_BUCKETS = ["videos", "shorts", "documents"] as const;
type Bucket = (typeof ALLOWED_BUCKETS)[number];

/**
 * Mints a short-lived signed *upload* URL so the admin's browser can PUT the
 * file (video/PDF) straight into Supabase Storage, skipping the server
 * entirely. Large lecture videos would otherwise blow past serverless
 * request body limits if routed through a server action/API route.
 */
export async function createUploadTarget(bucket: string, fileName: string) {
  await requireAdmin();
  if (!ALLOWED_BUCKETS.includes(bucket as Bucket)) {
    throw new Error("Invalid bucket");
  }

  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${crypto.randomUUID()}-${safeName}`;

  const admin = createAdminClient();
  const { data, error } = await admin.storage
    .from(bucket)
    .createSignedUploadUrl(path);

  if (error || !data) throw new Error(error?.message ?? "Could not create upload URL");

  return { path: data.path, token: data.token };
}
