/** Per-event message thread with chronological messages and compose area */
"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { Send, Lock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { timeSince } from "@/lib/dates";
import { sendMessage } from "@/app/actions/messages";
import type { Message } from "@/types";

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
  const [pending, startTransition] = useTransition();
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
    if (!body.trim() || pending) return;
    const text = body;
    setBody("");
    startTransition(async () => {
      try {
        await sendMessage(eventId, text, internalOnly);
      } catch (err) {
        setBody(text);
        toast.error(
          err instanceof Error ? err.message : "Failed to send message"
        );
      }
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
                  <span className="text-xs font-medium text-text-primary">
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
                  <span className="text-[10px] text-text-muted ml-auto">
                    {timeSince(msg.createdAt)}
                  </span>
                </div>
                <p className="text-sm text-text-secondary whitespace-pre-wrap">
                  {msg.body}
                </p>
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
        onBodyChange={setBody}
        onToggleInternal={() => setInternalOnly((v) => !v)}
        onSend={handleSend}
        onKeyDown={handleKeyDown}
      />
    </div>
  );
}

function ComposeArea({
  body,
  internalOnly,
  isInternal,
  pending,
  onBodyChange,
  onToggleInternal,
  onSend,
  onKeyDown,
}: {
  body: string;
  internalOnly: boolean;
  isInternal: boolean;
  pending: boolean;
  onBodyChange: (v: string) => void;
  onToggleInternal: () => void;
  onSend: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
}) {
  return (
    <div className="mt-4 pt-4 border-t border-white/[0.06]">
      {isInternal && (
        <button
          onClick={onToggleInternal}
          className={cn(
            "flex items-center gap-1.5 text-xs mb-2 px-2 py-1 rounded-lg transition-colors",
            internalOnly
              ? "bg-amber-500/10 text-amber-400"
              : "text-text-muted hover:text-text-secondary"
          )}
        >
          <Lock size={12} />
          {internalOnly ? "Internal only" : "Visible to customer"}
        </button>
      )}
      <div className="flex gap-2">
        <Input
          placeholder="Type a message..."
          value={body}
          onChange={(e) => onBodyChange(e.target.value)}
          onKeyDown={onKeyDown}
          className="flex-1"
        />
        <Button onClick={onSend} disabled={!body.trim() || pending} size="icon">
          {pending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
        </Button>
      </div>
    </div>
  );
}
