"use server";

import { createClient } from "@/lib/supabase/server";

export async function saveProgress(lessonId: string, progressSeconds: number, completed: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("lesson_progress").upsert(
    {
      user_id: user.id,
      lesson_id: lessonId,
      progress_seconds: Math.round(progressSeconds),
      completed,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,lesson_id" }
  );
}
