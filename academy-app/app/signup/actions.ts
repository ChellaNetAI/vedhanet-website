"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signup(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("full_name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();

  if (!email || !password || !fullName) {
    redirect(`/signup?error=${encodeURIComponent("Fill in your name, email and password.")}`);
  }
  if (password.length < 6) {
    redirect(`/signup?error=${encodeURIComponent("Password must be at least 6 characters.")}`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, phone },
    },
  });

  if (error) {
    redirect(`/signup?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/login?error=" + encodeURIComponent("Check your email to confirm your account, then log in."));
}
