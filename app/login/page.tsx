// app/login/page.tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LoginForm } from "./form";

export default async function Page() {
  const sb = await createClient();
  const { data } = await sb.auth.getUser();
  const admins = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  if (data.user) {
    const admins = (process.env.ADMIN_EMAILS || '')
      .split(',').map(s => s.trim().toLowerCase()).filter(Boolean)
    const email = (data.user.email || '').toLowerCase()
    if (admins.length === 0 || admins.includes(email)) redirect('/admin')
    redirect('/') // non-admin landing
  }

  return <LoginForm />;
}
