"use client";

import { motion } from "framer-motion";
import { UserPlus, Shield } from "lucide-react";

const MEMBERS = [
  { name: "James Chen", role: "Account Admin", initial: "JC", active: true },
  { name: "Sarah Park", role: "Marketing Lead", initial: "SP", active: true },
  { name: "Mika Tanaka", role: "Brand Manager", initial: "MT", active: true },
  { name: "Invite new member", role: "", initial: "+", isInvite: true },
];

export function SettingsTeam() {
  return (
    <div className="w-full max-w-sm mx-auto">
      <motion.div
        className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
      >
        <div className="px-5 py-3.5 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="size-3.5 text-[var(--color-bb-cyan)]" />
            <span className="text-xs font-semibold text-white/80">Team management</span>
          </div>
          <span className="text-[10px] text-white/30 tabular-nums">3 members</span>
        </div>

        <ul className="divide-y divide-white/5">
          {MEMBERS.map((m, i) => (
            <motion.li
              key={m.name}
              className="flex items-center gap-3 px-5 py-3"
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + i * 0.15 }}
            >
              {m.isInvite ? (
                <>
                  <div className="flex items-center justify-center size-8 rounded-full border-2 border-dashed border-white/15 text-white/30">
                    <UserPlus className="size-3.5" />
                  </div>
                  <motion.span
                    className="text-xs text-[var(--color-bb-cyan)] font-medium"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    Invite a team member
                  </motion.span>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-center size-8 rounded-full bg-[var(--color-bb-cobalt)]/30 border border-white/10 text-[10px] font-bold text-white/70">
                    {m.initial}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-white/80 truncate">{m.name}</p>
                    <p className="text-[10px] text-white/35">{m.role}</p>
                  </div>
                  <span className="flex items-center gap-1">
                    <span className="size-1.5 rounded-full bg-emerald-400" />
                    <span className="text-[9px] text-white/30">Active</span>
                  </span>
                </>
              )}
            </motion.li>
          ))}
        </ul>
      </motion.div>
    </div>
  );
}
