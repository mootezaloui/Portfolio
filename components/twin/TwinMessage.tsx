import { Bot, LoaderCircle, ShieldAlert, User2 } from "lucide-react";

import { cn } from "@/lib/utils";

import type { TwinMessageRole, TwinMessageTone } from "./types";

interface TwinMessageProps {
  role: TwinMessageRole;
  content: string;
  tone?: TwinMessageTone;
  streaming?: boolean;
}

function getLabel(role: TwinMessageRole): string {
  if (role === "user") {
    return "You";
  }
  if (role === "twin") {
    return "Digital Twin";
  }
  return "System";
}

export function TwinMessage({
  role,
  content,
  tone = "default",
  streaming = false,
}: TwinMessageProps) {
  const isUser = role === "user";
  const isSystem = role === "system";
  const isScope = tone === "scope";
  const isError = tone === "error";

  return (
    <article className={cn("flex w-full", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "w-full max-w-[90%] rounded-2xl border px-4 py-3 sm:max-w-[85%]",
          isUser && "border-accent bg-accent text-accent-foreground",
          !isUser && !isSystem && "border-border bg-surface text-foreground",
          isSystem && "border-dashed border-border bg-background text-muted",
          isScope &&
            "border-warning-border bg-warning-background text-warning-foreground",
          isError && "border-error-border bg-error-background text-error-foreground"
        )}
      >
        <p
          className={cn(
            "mb-1 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.16em]",
            isUser ? "text-accent-foreground/80" : "text-muted"
          )}
        >
          {role === "user" ? <User2 className="h-3 w-3" /> : null}
          {role === "twin" ? <Bot className="h-3 w-3" /> : null}
          {isSystem ? <ShieldAlert className="h-3 w-3" /> : null}
          {getLabel(role)}
        </p>
        <p className="whitespace-pre-wrap text-sm leading-6">
          {content.length > 0 ? content : "..."}
          {streaming ? (
            <span className="ml-1 inline-flex items-center align-middle">
              <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
            </span>
          ) : null}
        </p>
      </div>
    </article>
  );
}
