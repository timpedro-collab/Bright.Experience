"use client";

import { useState, useCallback, useTransition } from "react";
import {
  Plus,
  Trash2,
  Save,
  ChevronDown,
  ChevronRight,
  Milestone,
  ListChecks,
  Image,
  ShieldCheck,
  Building2,
  Gamepad2,
  Package,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { saveTemplateData } from "@/app/actions/templates";

type SectionKey =
  | "milestones"
  | "tasks"
  | "assets"
  | "qa_items"
  | "compliance"
  | "venue_requirements"
  | "game_config"
  | "product_config";

const SECTIONS: {
  key: SectionKey;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  jsonField: string;
  isArray: boolean;
}[] = [
  { key: "milestones", label: "Milestones", icon: Milestone, jsonField: "milestones_json", isArray: true },
  { key: "tasks", label: "Tasks", icon: ListChecks, jsonField: "tasks_json", isArray: true },
  { key: "assets", label: "Assets", icon: Image, jsonField: "assets_json", isArray: true },
  { key: "qa_items", label: "QA Items", icon: CheckCircle2, jsonField: "qa_items_json", isArray: true },
  { key: "compliance", label: "Compliance Docs", icon: ShieldCheck, jsonField: "compliance_json", isArray: true },
  { key: "venue_requirements", label: "Venue Requirements", icon: Building2, jsonField: "venue_requirements_json", isArray: true },
  { key: "game_config", label: "Game Config Defaults", icon: Gamepad2, jsonField: "game_config_defaults_json", isArray: false },
  { key: "product_config", label: "Product Config Defaults", icon: Package, jsonField: "product_config_defaults_json", isArray: false },
];

const MILESTONE_FIELDS = ["name", "stage", "sort_order"];
const TASK_FIELDS = ["title", "description", "task_type", "category", "target_path", "assigned_role", "is_blocking", "priority", "sort_order"];
const ASSET_FIELDS = ["name", "description", "asset_type", "required_format", "required_dimensions", "required_file_types", "customer_visible"];
const QA_FIELDS = ["title", "description", "category", "sort_order"];
const COMPLIANCE_FIELDS = ["document_type", "title", "required_minimum"];
const VENUE_FIELDS = ["requirement_type", "description"];

function getFieldsForSection(key: SectionKey): string[] {
  switch (key) {
    case "milestones": return MILESTONE_FIELDS;
    case "tasks": return TASK_FIELDS;
    case "assets": return ASSET_FIELDS;
    case "qa_items": return QA_FIELDS;
    case "compliance": return COMPLIANCE_FIELDS;
    case "venue_requirements": return VENUE_FIELDS;
    default: return [];
  }
}

function emptyRow(key: SectionKey): Record<string, unknown> {
  const fields = getFieldsForSection(key);
  const obj: Record<string, unknown> = {};
  for (const f of fields) obj[f] = f === "is_blocking" || f === "customer_visible" ? false : "";
  return obj;
}

interface TemplateEditorProps {
  template: Record<string, unknown>;
}

export function TemplateEditor({ template }: TemplateEditorProps) {
  const templateId = template.id as string;
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [openSections, setOpenSections] = useState<Set<SectionKey>>(new Set(["milestones"]));
  const [data, setData] = useState<Record<string, unknown>>(() => {
    const initial: Record<string, unknown> = {};
    for (const s of SECTIONS) {
      initial[s.jsonField] = template[s.jsonField] ?? (s.isArray ? [] : null);
    }
    return initial;
  });

  const toggle = (key: SectionKey) =>
    setOpenSections((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  const updateArrayItem = useCallback(
    (jsonField: string, idx: number, field: string, value: unknown) => {
      setData((prev) => {
        const arr = [...(prev[jsonField] as Record<string, unknown>[])];
        arr[idx] = { ...arr[idx], [field]: value };
        return { ...prev, [jsonField]: arr };
      });
      setSaved(false);
    },
    []
  );

  const addRow = useCallback((key: SectionKey, jsonField: string) => {
    setData((prev) => {
      const arr = [...(prev[jsonField] as Record<string, unknown>[]), emptyRow(key)];
      return { ...prev, [jsonField]: arr };
    });
    setSaved(false);
  }, []);

  const removeRow = useCallback((jsonField: string, idx: number) => {
    setData((prev) => {
      const arr = (prev[jsonField] as Record<string, unknown>[]).filter((_, i) => i !== idx);
      return { ...prev, [jsonField]: arr };
    });
    setSaved(false);
  }, []);

  const updateObject = useCallback((jsonField: string, obj: Record<string, unknown> | null) => {
    setData((prev) => ({ ...prev, [jsonField]: obj }));
    setSaved(false);
  }, []);

  const handleSave = () => {
    startTransition(async () => {
      await saveTemplateData(templateId, data as Parameters<typeof saveTemplateData>[1]);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    });
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Edit template sections below. Changes are saved when you click Save.
        </p>
        <Button onClick={handleSave} disabled={isPending} size="sm" className="gap-1.5">
          {saved ? <CheckCircle2 size={14} /> : <Save size={14} />}
          {isPending ? "Saving…" : saved ? "Saved" : "Save template"}
        </Button>
      </div>

      {SECTIONS.map((section) => {
        const isOpen = openSections.has(section.key);
        const Icon = section.icon;
        const items = section.isArray ? (data[section.jsonField] as Record<string, unknown>[] ?? []) : null;

        return (
          <div key={section.key} className="border border-border/60 rounded-lg overflow-hidden">
            <button
              onClick={() => toggle(section.key)}
              className="flex items-center gap-3 w-full px-5 py-3.5 text-left hover:bg-white/[0.02] transition-colors"
            >
              {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              <Icon size={16} className="text-[var(--color-bb-cobalt)]" />
              <span className="text-sm font-medium">{section.label}</span>
              {items && (
                <span className="text-overline text-muted-foreground ml-auto">
                  {items.length} item{items.length !== 1 ? "s" : ""}
                </span>
              )}
            </button>

            {isOpen && (
              <div className="border-t border-border/40 px-5 py-4 space-y-4">
                {section.isArray ? (
                  <ArraySectionEditor
                    sectionKey={section.key}
                    jsonField={section.jsonField}
                    items={items!}
                    fields={getFieldsForSection(section.key)}
                    onUpdate={updateArrayItem}
                    onAdd={addRow}
                    onRemove={removeRow}
                  />
                ) : (
                  <ObjectSectionEditor
                    jsonField={section.jsonField}
                    value={data[section.jsonField] as Record<string, unknown> | null}
                    onChange={updateObject}
                  />
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ArraySectionEditor({
  sectionKey,
  jsonField,
  items,
  fields,
  onUpdate,
  onAdd,
  onRemove,
}: {
  sectionKey: SectionKey;
  jsonField: string;
  items: Record<string, unknown>[];
  fields: string[];
  onUpdate: (jsonField: string, idx: number, field: string, value: unknown) => void;
  onAdd: (key: SectionKey, jsonField: string) => void;
  onRemove: (jsonField: string, idx: number) => void;
}) {
  return (
    <div className="space-y-3">
      {items.length === 0 && (
        <p className="text-xs text-muted-foreground italic">No items. Add one below.</p>
      )}
      {items.map((item, idx) => (
        <div
          key={idx}
          className="grid gap-2 p-3 bg-white/[0.02] border border-border/30 rounded-md"
          style={{ gridTemplateColumns: `repeat(${Math.min(fields.length, 4)}, 1fr) auto` }}
        >
          {fields.map((field) => (
            <label key={field} className="space-y-1">
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                {field.replace(/_/g, " ")}
              </span>
              {typeof item[field] === "boolean" ? (
                <input
                  type="checkbox"
                  checked={!!item[field]}
                  onChange={(e) => onUpdate(jsonField, idx, field, e.target.checked)}
                  className="block mt-1"
                />
              ) : (
                <input
                  type="text"
                  value={String(item[field] ?? "")}
                  onChange={(e) => onUpdate(jsonField, idx, field, e.target.value)}
                  className="w-full px-2 py-1.5 text-xs bg-transparent border border-border/40 rounded outline-none focus:border-[var(--color-bb-cobalt)] transition-colors"
                />
              )}
            </label>
          ))}
          <button
            onClick={() => onRemove(jsonField, idx)}
            className="self-end text-red-400/60 hover:text-red-400 transition-colors p-1"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={() => onAdd(sectionKey, jsonField)} className="gap-1.5">
        <Plus size={12} /> Add item
      </Button>
    </div>
  );
}

function ObjectSectionEditor({
  jsonField,
  value,
  onChange,
}: {
  jsonField: string;
  value: Record<string, unknown> | null;
  onChange: (jsonField: string, obj: Record<string, unknown> | null) => void;
}) {
  const [raw, setRaw] = useState(value ? JSON.stringify(value, null, 2) : "");
  const [err, setErr] = useState("");

  const handleBlur = () => {
    if (!raw.trim()) {
      onChange(jsonField, null);
      setErr("");
      return;
    }
    try {
      const parsed = JSON.parse(raw);
      onChange(jsonField, parsed);
      setErr("");
    } catch {
      setErr("Invalid JSON");
    }
  };

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">
        Paste JSON defaults. Leave empty for no defaults.
      </p>
      <textarea
        value={raw}
        onChange={(e) => { setRaw(e.target.value); setErr(""); }}
        onBlur={handleBlur}
        rows={8}
        className={cn(
          "w-full font-mono text-xs bg-transparent border rounded-md p-3 outline-none transition-colors",
          err ? "border-red-400" : "border-border/40 focus:border-[var(--color-bb-cobalt)]"
        )}
      />
      {err && <p className="text-xs text-red-400">{err}</p>}
    </div>
  );
}
