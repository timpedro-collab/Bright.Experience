/** Client table with inline new/edit and is_active toggle for machines. */
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Loader2, Power } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MachineForm } from "./MachineForm";
import { updateMachine } from "@/app/actions/catalog";

interface Machine {
  id: string;
  name: string;
  slug: string;
  tagline: string | null;
  hero_image_url: string | null;
  is_active: boolean;
  sort_order: number | null;
}

export function MachinesTable({ machines }: { machines: Machine[] }) {
  const [showNew, setShowNew] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{machines.length} machines</p>
        <Button size="sm" onClick={() => setShowNew(true)} disabled={showNew}>
          <Plus size={14} /> New machine
        </Button>
      </div>

      {showNew && <MachineForm onClose={() => setShowNew(false)} />}

      {machines.length === 0 ? (
        <div className="px-4 py-8 text-center text-muted-foreground">
          No machines in the catalog yet.
        </div>
      ) : (
        <div className="border-t border-b border-border/40 overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-border/40 text-left">
                <th className="px-4 py-3 text-overline text-muted-foreground font-normal">Name</th>
                <th className="px-4 py-3 text-overline text-muted-foreground font-normal">Slug</th>
                <th className="px-4 py-3 text-overline text-muted-foreground font-normal">Tagline</th>
                <th className="px-4 py-3 text-overline text-muted-foreground font-normal">Status</th>
                <th className="px-4 py-3 text-overline text-muted-foreground font-normal" />
              </tr>
            </thead>
            <tbody>
              {machines.map((m) => (
                editId === m.id ? (
                  <tr key={m.id}>
                    <td colSpan={5} className="p-2">
                      <MachineForm machine={m} onClose={() => setEditId(null)} />
                    </td>
                  </tr>
                ) : (
                  <MachineRow key={m.id} machine={m} onEdit={() => setEditId(m.id)} />
                )
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function MachineRow({ machine, onEdit }: { machine: Machine; onEdit: () => void }) {
  const [toggling, startTransition] = useTransition();
  const router = useRouter();

  function handleToggleActive() {
    startTransition(async () => {
      await updateMachine(machine.id, { isActive: !machine.is_active });
      router.refresh();
    });
  }

  return (
    <tr className="border-b border-border/30 hover:bg-accent/20 transition-colors">
      <td className="px-4 py-3 font-medium text-foreground">{machine.name}</td>
      <td className="px-4 py-3 font-mono text-muted-foreground">{machine.slug}</td>
      <td className="px-4 py-3 text-muted-foreground truncate max-w-[200px]">{machine.tagline ?? "—"}</td>
      <td className="px-4 py-3">
        <Button
          variant="ghost"
          size="sm"
          disabled={toggling}
          onClick={handleToggleActive}
          className="gap-1.5 px-2"
        >
          {toggling ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Power size={14} />
          )}
          <Badge variant={machine.is_active ? "success" : "muted"}>
            {machine.is_active ? "Active" : "Inactive"}
          </Badge>
        </Button>
      </td>
      <td className="px-4 py-3 text-right">
        <Button variant="ghost" size="sm" onClick={onEdit}>
          <Pencil size={14} />
        </Button>
      </td>
    </tr>
  );
}
