"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function enroll(formData: FormData) {
  const courseId = String(formData.get("course_id") ?? "");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  await supabase.from("enrollments").insert({ user_id: user.id, course_id: courseId });

  revalidatePath("/courses");
  revalidatePath("/dashboard");
  redirect(`/courses/${courseId}`);
}
