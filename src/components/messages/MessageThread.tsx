/** Per-event message thread with chronological messages and compose area */
"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Send, Lock, Loader2, Paperclip, FileText, ExternalLink, X } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { timeSince } from "@/lib/dates";
import { sendMessage, type MessageTopic } from "@/app/actions/messages";
import type { Message } from "@/types";

const TOPIC_OPTIONS: { value: MessageTopic; label: string }[] = [
  { value: "general", label: "General" },
  { value: "creative", label: "Creative" },
  { value: "logistics", label: "Logistics" },
  { value: "compliance", label: "Compliance" },
  { value: "configuration", label: "Configuration" },
  { value: "finance", label: "Finance" },
];

interface MessageThreadProps {
  eventId: string;
  messages: Message[];
  currentUserId: string;
  isInternal: boolean;
}

export function MessageThread({
  eventId,
  messages,
  currentUserId,
  isInternal,
}: MessageThreadProps) {
  const [body, setBody] = useState("");
  const [internalOnly, setInternalOnly] = useState(false);
  const [attachments, setAttachments] = useState<{ name: string; url: string; size: number }[]>([]);
  const [topic, setTopic] = useState<MessageTopic>("general");
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  function getInitials(name?: string) {
    if (!name) return "?";
    return name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }

  function handleSend() {
    if ((!body.trim() && attachments.length === 0) || pending) return;
    const text = body || (attachments.length > 0 ? `Shared ${attachments.length} file${attachments.length === 1 ? "" : "s"}` : "");
    const atts = [...attachments];
    setBody("");
    setAttachments([]);
    const selectedTopic = topic;
    startTransition(async () => {
      const result = await sendMessage(eventId, text, internalOnly, atts.length > 0 ? atts : undefined, selectedTopic !== "general" ? selectedTopic : undefined);
      if (!result.success) {
        setBody(text);
        setAttachments(atts);
        toast.error(result.error);
        return;
      }
      router.refresh();
    });
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-16rem)]">
      <div className="flex-1 overflow-y-auto space-y-4 pr-2">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-heading text-lg font-bold text-foreground mb-1.5">
              No messages yet
            </p>
            <p className="text-sm text-muted-foreground max-w-md">
              Start a conversation below. Messages keep everyone aligned
              without endless email chains.
            </p>
          </div>
        )}
        {messages.map((msg) => {
          const isOwn = msg.senderId === currentUserId;
          return (
            <div
              key={msg.id}
              className={cn("flex gap-3", isOwn && "flex-row-reverse")}
            >
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarFallback className="text-xs bg-brand/20 text-brand">
                  {getInitials(msg.senderName)}
                </AvatarFallback>
              </Avatar>

              <div
                className={cn(
                  "max-w-[70%] rounded-xl p-3",
                  isOwn
                    ? "bg-brand/10 border border-brand/20"
                    : "bg-white/[0.04] border border-white/[0.06]"
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-foreground">
                    {msg.senderName ?? "Unknown"}
                  </span>
                  {msg.isInternal && (
                    <Badge
                      variant="outline"
                      className="text-[10px] px-1.5 py-0 border-amber-500/40 text-amber-400"
                    >
                      Internal
                    </Badge>
                  )}
                  <span className="text-[10px] text-muted-foreground ml-auto">
                    {timeSince(msg.createdAt)}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {msg.body}
                </p>
                {msg.attachments && msg.attachments.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {(msg.attachments as unknown[]).map((raw, i) => {
                      const att =
                        typeof raw === "string"
                          ? { name: raw.split("/").pop() ?? "file", url: raw }
                          : (raw as { name: string; url: string });
                      return (
                        <a
                          key={i}
                          href={att.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-xs text-[var(--color-bb-cobalt)] hover:underline"
                        >
                          <FileText size={12} className="shrink-0" />
                          {att.name}
                          <ExternalLink size={10} className="shrink-0" />
                        </a>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <ComposeArea
        body={body}
        internalOnly={internalOnly}
        isInternal={isInternal}
        pending={pending}
        attachments={attachments}
        eventId={eventId}
        topic={topic}
        onBodyChange={setBody}
        onToggleInternal={() => setInternalOnly((v) => !v)}
        onTopicChange={setTopic}
        onSend={handleSend}
        onKeyDown={handleKeyDown}
        onAttachmentAdd={(att) => setAttachments((prev) => [...prev, att])}
        onAttachmentRemove={(idx) => setAttachments((prev) => prev.filter((_, i) => i !== idx))}
      />
    </div>
  );
}

function ComposeArea({
  body,
  internalOnly,
  isInternal,
  pending,
  attachments,
  eventId,
  topic,
  onBodyChange,
  onToggleInternal,
  onTopicChange,
  onSend,
  onKeyDown,
  onAttachmentAdd,
  onAttachmentRemove,
}: {
  body: string;
  internalOnly: boolean;
  isInternal: boolean;
  pending: boolean;
  attachments: { name: string; url: string; size: number }[];
  eventId: string;
  topic: MessageTopic;
  onBodyChange: (v: string) => void;
  onToggleInternal: () => void;
  onTopicChange: (t: MessageTopic) => void;
  onSend: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onAttachmentAdd: (att: { name: string; url: string; size: number }) => void;
  onAttachmentRemove: (idx: number) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.set("eventId", eventId);
      fd.set("file", file);
      const { uploadMessageAttachment } = await import("@/app/actions/messages");
      const result = await uploadMessageAttachment(fd);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      onAttachmentAdd({ name: file.name, url: result.data!.url, size: file.size });
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="mt-4 pt-4 border-t border-white/[0.06]">
      {isInternal && (
        <div className="flex items-center gap-3 mb-2">
          <button
            onClick={onToggleInternal}
            className={cn(
              "flex items-center gap-1.5 text-xs px-2 py-1 rounded-lg transition-colors",
              internalOnly
                ? "bg-amber-500/10 text-amber-400"
                : "text-muted-foreground hover:text-muted-foreground"
            )}
          >
            <Lock size={12} />
            {internalOnly ? "Internal only" : "Visible to customer"}
          </button>
          <select
            value={topic}
            onChange={(e) => onTopicChange(e.target.value as MessageTopic)}
            className="px-2 py-1 rounded-lg border border-white/[0.06] bg-transparent text-xs text-muted-foreground outline-none"
          >
            {TOPIC_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      )}

      {attachments.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {attachments.map((att, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white/[0.04] border border-white/[0.06] text-xs text-muted-foreground"
            >
              <FileText size={10} />
              <span className="truncate max-w-[140px]">{att.name}</span>
              <button
                onClick={() => onAttachmentRemove(i)}
                className="text-muted-foreground hover:text-destructive ml-0.5"
              >
                <X size={10} />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          title="Attach file"
        >
          {uploading ? <Loader2 size={16} className="animate-spin" /> : <Paperclip size={16} />}
        </Button>
        <input ref={fileRef} type="file" className="hidden" onChange={handleFileSelect} />
        <Input
          placeholder="Type a message..."
          value={body}
          onChange={(e) => onBodyChange(e.target.value)}
          onKeyDown={onKeyDown}
          className="flex-1"
        />
        <Button onClick={onSend} disabled={(!body.trim() && attachments.length === 0) || pending} size="icon">
          {pending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
        </Button>
      </div>
    </div>
  );
}
