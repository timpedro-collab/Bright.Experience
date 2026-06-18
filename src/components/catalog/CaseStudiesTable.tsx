/** Client table with inline new/edit and publish action for case studies. */
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Send, Loader2, Pencil } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CaseStudyForm } from "./CaseStudyForm";
import { publishCaseStudy } from "@/app/actions/catalog-content";

interface CaseStudy {
  id: string;
  title: string;
  slug: string;
  client_name: string | null;
  event_type: string | null;
  location: string | null;
  is_published: boolean;
}

export function CaseStudiesTable({ studies }: { studies: CaseStudy[] }) {
  const [showNew, setShowNew] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{studies.length} case studies</p>
        <Button size="sm" onClick={() => setShowNew(true)} disabled={showNew}>
          <Plus size={14} /> New case study
        </Button>
      </div>

      {showNew && <CaseStudyForm onClose={() => setShowNew(false)} />}

      <div className="border-t border-b border-border/40 overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-border/40 text-left">
              <th className="px-4 py-3 text-overline text-muted-foreground font-normal">Title</th>
              <th className="px-4 py-3 text-overline text-muted-foreground font-normal">Client</th>
              <th className="px-4 py-3 text-overline text-muted-foreground font-normal">Type</th>
              <th className="px-4 py-3 text-overline text-muted-foreground font-normal">Location</th>
              <th className="px-4 py-3 text-overline text-muted-foreground font-normal">Status</th>
              <th className="px-4 py-3 text-overline text-muted-foreground font-normal" />
            </tr>
          </thead>
          <tbody>
            {studies.map((s) =>
              editId === s.id ? (
                <tr key={s.id}>
                  <td colSpan={6} className="p-2">
                    <CaseStudyForm study={s} onClose={() => setEditId(null)} />
                  </td>
                </tr>
              ) : (
                <CaseStudyRow key={s.id} study={s} onEdit={() => setEditId(s.id)} />
              ),
            )}
            {studies.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  No case studies yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CaseStudyRow({ study, onEdit }: { study: CaseStudy; onEdit: () => void }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handlePublish() {
    startTransition(async () => {
      await publishCaseStudy(study.id);
      router.refresh();
    });
  }

  return (
    <tr className="border-b border-border/30 hover:bg-accent/20 transition-colors">
      <td className="px-4 py-3 font-medium text-foreground">{study.title}</td>
      <td className="px-4 py-3 text-muted-foreground">{study.client_name ?? "—"}</td>
      <td className="px-4 py-3 text-muted-foreground">{study.event_type ?? "—"}</td>
      <td className="px-4 py-3 text-muted-foreground">{study.location ?? "—"}</td>
      <td className="px-4 py-3">
        <Badge variant={study.is_published ? "success" : "warning"}>
          {study.is_published ? "Published" : "Draft"}
        </Badge>
      </td>
      <td className="px-4 py-3 text-right">
        <div className="flex items-center justify-end gap-1">
          <Button variant="ghost" size="sm" onClick={onEdit}>
            <Pencil size={14} />
          </Button>
          {!study.is_published && (
            <Button variant="ghost" size="sm" disabled={pending} onClick={handlePublish}>
              {pending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              Publish
            </Button>
          )}
        </div>
      </td>
    </tr>
  );
}
