/** Inline form for creating/editing a game in the admin catalog. */
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createGame, updateGame } from "@/app/actions/catalog";

interface GameFormProps {
  game?: { id: string; name: string; slug: string; category: string | null };
  onClose: () => void;
}

export function GameForm({ game, onClose }: GameFormProps) {
  const [name, setName] = useState(game?.name ?? "");
  const [slug, setSlug] = useState(game?.slug ?? "");
  const [category, setCategory] = useState(game?.category ?? "");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      try {
        if (game) {
          await updateGame(game.id, { name, category: category || undefined });
        } else {
          await createGame({ name, slug, category: category || undefined });
        }
        router.refresh();
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="border border-border/60 bg-card/30 rounded-md p-5 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="game-name">Name</Label>
          <Input id="game-name" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        {!game && (
          <div className="space-y-1.5">
            <Label htmlFor="game-slug">Slug</Label>
            <Input id="game-slug" value={slug} onChange={(e) => setSlug(e.target.value)} required />
          </div>
        )}
        <div className="space-y-1.5">
          <Label htmlFor="game-category">Category</Label>
          <Input id="game-category" value={category} onChange={(e) => setCategory(e.target.value)} />
        </div>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={pending}>
          {pending && <Loader2 size={14} className="animate-spin" />}
          {game ? "Save" : "Create"}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onClose}>Cancel</Button>
      </div>
    </form>
  );
}
