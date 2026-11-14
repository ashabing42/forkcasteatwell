import { supabase } from "@/integrations/supabase/client";

const KEY = "forkcast-admin-return";

export function getImpersonation(): { email: string } | null {
  try { const v = localStorage.getItem(KEY); return v ? { email: JSON.parse(v).viewing } : null; } catch { return null; }
}

export async function startImpersonation(tokenHash: string, email: string) {
  const { data } = await supabase.auth.getSession();
  if (!data.session) throw new Error("No admin session");
  localStorage.setItem(KEY, JSON.stringify({ access_token: data.session.access_token, refresh_token: data.session.refresh_token, viewing: email }));
  const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: "magiclink" });
  if (error) { localStorage.removeItem(KEY); throw error; }
}

export async function stopImpersonation() {
  const raw = localStorage.getItem(KEY);
  localStorage.removeItem(KEY);
  if (!raw) return;
  const s = JSON.parse(raw);
  const { error } = await supabase.auth.setSession({ access_token: s.access_token, refresh_token: s.refresh_token });
  if (error) await supabase.auth.signOut();
}
