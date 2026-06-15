/** Client-side security controls: password change and global sign-out. */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function SecurityForm({ email, createdAt }: { email: string; createdAt?: string }) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const router = useRouter();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg("");
    if (newPassword.length < 8) { setErrorMsg("Password must be at least 8 characters."); return; }
    if (newPassword !== confirmPassword) { setErrorMsg("Passwords do not match."); return; }

    setStatus("saving");
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) { setErrorMsg(error.message); setStatus("error"); return; }
    setNewPassword(""); setConfirmPassword(""); setStatus("success");
  }

  async function handleSignOutEverywhere() {
    await supabase.auth.signOut({ scope: "global" });
    router.push("/login");
  }

  return (
    <div className="space-y-10">
      <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
        <div>
          <label className="text-sm font-medium text-foreground block mb-1.5">New password</label>
          <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
            placeholder="At least 8 characters" required minLength={8} />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground block mb-1.5">Confirm password</label>
          <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Repeat new password" required minLength={8} />
        </div>
        {errorMsg && <p className="text-sm text-destructive">{errorMsg}</p>}
        {status === "success" && <p className="text-sm text-green-500">Password updated successfully.</p>}
        <Button type="submit" disabled={status === "saving"}>
          {status === "saving" ? "Updating…" : "Update password"}
        </Button>
      </form>

      <div className="border-t border-border/40 pt-8 max-w-md">
        <h3 className="text-sm font-semibold text-foreground">Session information</h3>
        <div className="mt-3 flex flex-col divide-y divide-border/40 border-t border-b border-border/40">
          <div className="py-2.5 flex justify-between">
            <span className="text-sm text-muted-foreground">Email</span>
            <span className="text-sm text-foreground font-medium">{email}</span>
          </div>
          {createdAt && (
            <div className="py-2.5 flex justify-between">
              <span className="text-sm text-muted-foreground">Account created</span>
              <span className="text-sm text-foreground font-medium tabular-nums">
                {new Date(createdAt).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>

        <Button variant="destructive" className="mt-6" onClick={handleSignOutEverywhere}>
          Sign out everywhere
        </Button>
        <p className="mt-2 text-xs text-muted-foreground">
          Ends all active sessions across every browser and device.
        </p>
      </div>
    </div>
  );
}
