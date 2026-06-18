/** Client table with inline new/edit for games. */
"use client";

import { useState } from "react";
import { Plus, Pencil } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GameForm } from "./GameForm";

interface Game {
  id: string;
  name: string;
  slug: string;
  category: string | null;
  is_active: boolean;
}

export function GamesTable({ games }: { games: Game[] }) {
  const [showNew, setShowNew] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{games.length} games</p>
        <Button size="sm" onClick={() => setShowNew(true)} disabled={showNew}>
          <Plus size={14} /> New game
        </Button>
      </div>

      {showNew && <GameForm onClose={() => setShowNew(false)} />}

      <div className="border-t border-b border-border/40 overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-border/40 text-left">
              <th className="px-4 py-3 text-overline text-muted-foreground font-normal">Name</th>
              <th className="px-4 py-3 text-overline text-muted-foreground font-normal">Slug</th>
              <th className="px-4 py-3 text-overline text-muted-foreground font-normal">Category</th>
              <th className="px-4 py-3 text-overline text-muted-foreground font-normal">Status</th>
              <th className="px-4 py-3 text-overline text-muted-foreground font-normal" />
            </tr>
          </thead>
          <tbody>
            {games.map((g) =>
              editId === g.id ? (
                <tr key={g.id}>
                  <td colSpan={5} className="p-2">
                    <GameForm game={g} onClose={() => setEditId(null)} />
                  </td>
                </tr>
              ) : (
                <tr key={g.id} className="border-b border-border/30 hover:bg-accent/20 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground">{g.name}</td>
                  <td className="px-4 py-3 font-mono text-muted-foreground">{g.slug}</td>
                  <td className="px-4 py-3 text-muted-foreground">{g.category ?? "—"}</td>
                  <td className="px-4 py-3">
                    <Badge variant={g.is_active ? "success" : "muted"}>
                      {g.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" size="sm" onClick={() => setEditId(g.id)}>
                      <Pencil size={14} />
                    </Button>
                  </td>
                </tr>
              ),
            )}
            {games.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  No games in the catalog yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
