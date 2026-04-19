"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Route } from "next";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Copy, LoaderCircle, RotateCcw, TriangleAlert } from "lucide-react";

import { Button } from "@/components/primitives/Button";
import {
  getRoleLensDefinition,
  type RoleLens,
} from "@/lib/lens/roleLens";
import { cn } from "@/lib/utils";

import { TwinAvatar } from "./TwinAvatar";
import { TwinInput } from "./TwinInput";
import { TwinMessage } from "./TwinMessage";
import { TwinScopeNotice } from "./TwinScopeNotice";
import { TwinSuggestions } from "./TwinSuggestions";
import { TwinTransparency } from "./TwinTransparency";
import type {
  TwinMessageTone,
  TwinScopeCategory,
  TwinScopeNoticeState,
  TwinTurnMeta,
  TwinUiMessage,
} from "./types";

interface TwinPanelProps {
  initialConversationId?: string | undefined;
  initialSnapshot?: string | undefined;
  initialLens?: RoleLens | undefined;
  standalone?: boolean;
  className?: string;
}

interface TwinApiClassification {
  decision: "in_scope" | "out_of_scope" | "ambiguous";
  category: TwinScopeCategory;
  reason: string;
}

interface TwinApiSuccessResponse {
  status: "ok";
  conversationId: string;
  response: string;
  classification: TwinApiClassification;
  providerId: string;
  providerModel: string;
  cached: boolean;
  latencyMs: number;
  validator: {
    passed: boolean;
  };
  roleLens?: RoleLens;
}

interface TwinApiErrorResponse {
  status: "error";
  message: string;
}

interface TwinApiHistoryTurn {
  role: "user" | "assistant";
  content: string;
}

const STORAGE_PREFIX = "tazou:twin:conversation:";

const WELCOME_MESSAGE: TwinUiMessage = {
  id: "system-welcome",
  role: "system",
  content:
    "Ask about fit, projects, tradeoffs, or concerns. I only answer questions about Mootez — pick a prompt below or write your own.",
  tone: "default",
  streaming: false,
};

function createMessageId(prefix: string): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function toHistory(messages: TwinUiMessage[]): TwinApiHistoryTurn[] {
  return messages
    .filter((message) => message.role === "user" || message.role === "twin")
    .filter((message) => message.content.trim().length > 0 && !message.streaming)
    .map((message) => ({
      role: message.role === "user" ? "user" : "assistant",
      content: message.content,
    }));
}

function storageKey(conversationId: string): string {
  return `${STORAGE_PREFIX}${conversationId}`;
}

function normalizeSnapshotMessage(entry: unknown): TwinUiMessage | null {
  if (!entry || typeof entry !== "object") {
    return null;
  }

  const record = entry as {
    id?: unknown;
    role?: unknown;
    content?: unknown;
    tone?: unknown;
  };

  if (
    typeof record.id !== "string" ||
    (record.role !== "user" && record.role !== "twin" && record.role !== "system") ||
    typeof record.content !== "string"
  ) {
    return null;
  }

  const tone: TwinMessageTone =
    record.tone === "scope" || record.tone === "error" ? record.tone : "default";

  return {
    id: record.id,
    role: record.role,
    content: record.content,
    tone,
    streaming: false,
  };
}

function decodeSnapshot(snapshot: string): TwinUiMessage[] | null {
  if (!snapshot) {
    return null;
  }

  try {
    const normalized = snapshot.replace(/-/g, "+").replace(/_/g, "/");
    const padding = (4 - (normalized.length % 4)) % 4;
    const base64 = `${normalized}${"=".repeat(padding)}`;
    const raw = atob(base64);
    const bytes = Uint8Array.from(raw, (char) => char.charCodeAt(0));
    const decoded = new TextDecoder().decode(bytes);
    const parsed = JSON.parse(decoded);
    if (!Array.isArray(parsed)) {
      return null;
    }

    const messages = parsed
      .map((entry) => normalizeSnapshotMessage(entry))
      .filter((entry): entry is TwinUiMessage => entry !== null);

    if (messages.length === 0) {
      return null;
    }

    return messages;
  } catch {
    return null;
  }
}

function encodeSnapshot(messages: TwinUiMessage[]): string {
  try {
    const serializable = messages
      .filter((message) => !message.streaming)
      .map((message) => ({
        id: message.id,
        role: message.role,
        content: message.content,
        tone: message.tone,
      }));
    const json = JSON.stringify(serializable);
    const bytes = new TextEncoder().encode(json);

    let binary = "";
    for (const byte of bytes) {
      binary += String.fromCharCode(byte);
    }

    return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  } catch {
    return "";
  }
}

function loadConversationFromStorage(conversationId: string): TwinUiMessage[] | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(storageKey(conversationId));
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return null;
    }

    const messages = parsed
      .map((entry) => normalizeSnapshotMessage(entry))
      .filter((entry): entry is TwinUiMessage => entry !== null);

    return messages.length > 0 ? messages : null;
  } catch {
    return null;
  }
}

function saveConversationToStorage(
  conversationId: string,
  messages: TwinUiMessage[]
): void {
  if (typeof window === "undefined") {
    return;
  }

  const serializable = messages
    .filter((message) => !message.streaming && message.content.trim().length > 0)
    .map((message) => ({
      id: message.id,
      role: message.role,
      content: message.content,
      tone: message.tone,
    }));

  if (serializable.length === 0) {
    return;
  }

  window.localStorage.setItem(storageKey(conversationId), JSON.stringify(serializable));
}

export function TwinPanel({
  initialConversationId,
  initialSnapshot,
  initialLens = "general",
  standalone = false,
  className,
}: TwinPanelProps) {
  const router = useRouter();
  const pathname = usePathname();
  const scrollRef = useRef<HTMLDivElement>(null);
  const routeConversationId =
    initialConversationId && initialConversationId !== "new"
      ? initialConversationId
      : undefined;

  const [conversationId, setConversationId] = useState<string | undefined>(
    routeConversationId
  );
  const [messages, setMessages] = useState<TwinUiMessage[]>([WELCOME_MESSAGE]);
  const [inputValue, setInputValue] = useState("");
  const [activeLens, setActiveLens] = useState<RoleLens>(initialLens);
  const [isBusy, setIsBusy] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [scopeNotice, setScopeNotice] = useState<TwinScopeNoticeState | null>(null);
  const [lastTurnMeta, setLastTurnMeta] = useState<TwinTurnMeta | null>(null);
  const [shareState, setShareState] = useState<"idle" | "copied" | "failed">("idle");
  const [initialized, setInitialized] = useState(false);
  const lensDefinition = useMemo(
    () => getRoleLensDefinition(activeLens),
    [activeLens]
  );

  const shareUrl = useMemo(() => {
    if (!conversationId) {
      return null;
    }

    const snapshot = encodeSnapshot(messages);
    const path = `/twin/${conversationId}`;
    const params = new URLSearchParams();
    if (snapshot.length > 0) {
      params.set("snapshot", snapshot);
    }
    if (activeLens !== "general") {
      params.set("lens", activeLens);
    }
    const suffix = params.size > 0 ? `?${params.toString()}` : "";
    if (typeof window === "undefined") {
      return `${path}${suffix}`;
    }
    return `${window.location.origin}${path}${suffix}`;
  }, [conversationId, messages, activeLens]);

  useEffect(() => {
    if (typeof navigator === "undefined") {
      return;
    }

    const updateNetworkState = () => {
      setIsOnline(navigator.onLine);
    };

    updateNetworkState();
    window.addEventListener("online", updateNetworkState);
    window.addEventListener("offline", updateNetworkState);

    return () => {
      window.removeEventListener("online", updateNetworkState);
      window.removeEventListener("offline", updateNetworkState);
    };
  }, []);

  useEffect(() => {
    if (initialized) {
      return;
    }

    const fromSnapshot = initialSnapshot ? decodeSnapshot(initialSnapshot) : null;
    if (fromSnapshot && fromSnapshot.length > 0) {
      setMessages(fromSnapshot);
      if (routeConversationId) {
        setConversationId(routeConversationId);
      }
      setInitialized(true);
      return;
    }

    if (routeConversationId) {
      const fromStorage = loadConversationFromStorage(routeConversationId);
      if (fromStorage && fromStorage.length > 0) {
        setConversationId(routeConversationId);
        setMessages(fromStorage);
      } else {
        setConversationId(routeConversationId);
        setMessages([
          WELCOME_MESSAGE,
          {
            id: "system-missing-history",
            role: "system",
            content:
              "This shared conversation does not include a local history snapshot. Ask a fresh question to continue.",
            tone: "error",
            streaming: false,
          },
        ]);
      }
    }

    setInitialized(true);
  }, [initialized, initialSnapshot, routeConversationId]);

  useEffect(() => {
    setActiveLens(initialLens);
  }, [initialLens]);

  useEffect(() => {
    if (!conversationId) {
      return;
    }
    saveConversationToStorage(conversationId, messages);
  }, [conversationId, messages]);

  useEffect(() => {
    const viewport = scrollRef.current;
    if (!viewport) {
      return;
    }
    viewport.scrollTo({ top: viewport.scrollHeight, behavior: "smooth" });
  }, [messages, isBusy]);

  useEffect(() => {
    // Keep brand-new standalone sessions on /twin to avoid remounting the panel
    // right after the first successful turn.
    if (!standalone || !conversationId || isBusy || !routeConversationId) {
      return;
    }

    const targetPath = `/twin/${conversationId}`;
    if (pathname !== targetPath) {
      router.replace(targetPath as Route, { scroll: false });
    }
  }, [standalone, conversationId, pathname, router, isBusy, routeConversationId]);

  const streamMessage = useCallback(async (messageId: string, fullText: string) => {
    const chunks = fullText.split(/(\s+)/).filter((part) => part.length > 0);
    if (chunks.length === 0) {
      setMessages((previous) =>
        previous.map((message) =>
          message.id === messageId
            ? { ...message, content: fullText, streaming: false }
            : message
        )
      );
      return;
    }

    let nextText = "";
    for (let index = 0; index < chunks.length; index += 2) {
      const partA = chunks[index] ?? "";
      const partB = chunks[index + 1] ?? "";
      nextText += `${partA}${partB}`;

      setMessages((previous) =>
        previous.map((message) =>
          message.id === messageId
            ? { ...message, content: nextText, streaming: true }
            : message
        )
      );
      await wait(18);
    }

    setMessages((previous) =>
      previous.map((message) =>
        message.id === messageId
          ? { ...message, content: fullText, streaming: false }
          : message
      )
    );
  }, []);

  const sendMessage = useCallback(
    async (overrideInput?: string) => {
      const nextMessage = (overrideInput ?? inputValue).trim();
      if (!nextMessage || isBusy) {
        return;
      }

      if (!isOnline) {
        setErrorMessage("You are offline. Reconnect to continue the conversation.");
        return;
      }

      const requestHistory = toHistory(messages);
      const userMessage: TwinUiMessage = {
        id: createMessageId("user"),
        role: "user",
        content: nextMessage,
        tone: "default",
        streaming: false,
      };
      const responseMessageId = createMessageId("twin");
      const pendingTwin: TwinUiMessage = {
        id: responseMessageId,
        role: "twin",
        content: "",
        tone: "default",
        streaming: true,
      };

      setMessages((previous) => [...previous, userMessage, pendingTwin]);
      setInputValue("");
      setErrorMessage(null);
      setIsBusy(true);
      setShareState("idle");

      try {
        const response = await fetch("/api/twin/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: nextMessage,
            conversationId,
            history: requestHistory,
            roleLens: activeLens,
          }),
        });

        const payload = (await response.json()) as
          | TwinApiSuccessResponse
          | TwinApiErrorResponse;

        if (!response.ok || payload.status !== "ok") {
          const message =
            payload.status === "error"
              ? payload.message
              : "Twin request failed. Please retry.";
          throw new Error(message);
        }

        setConversationId(payload.conversationId);

        if (payload.classification.decision === "out_of_scope") {
          setScopeNotice({
            category: payload.classification.category,
            reason: payload.classification.reason,
          });
        } else {
          setScopeNotice(null);
        }

        setLastTurnMeta({
          providerId: payload.providerId,
          providerModel: payload.providerModel,
          latencyMs: payload.latencyMs,
          cached: payload.cached,
          validatorPassed: payload.validator.passed,
        });

        setMessages((previous) =>
          previous.map((message) =>
            message.id === responseMessageId
              ? {
                  ...message,
                  tone:
                    payload.classification.decision === "out_of_scope"
                      ? "scope"
                      : "default",
                }
              : message
          )
        );

        await streamMessage(responseMessageId, payload.response);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unexpected twin error occurred.";

        setErrorMessage(message);
        setMessages((previous) =>
          previous.map((entry) =>
            entry.id === responseMessageId
              ? {
                  ...entry,
                  role: "system",
                  tone: "error",
                  content: "Twin request failed. Check connectivity and try again.",
                  streaming: false,
                }
              : entry
          )
        );
      } finally {
        setIsBusy(false);
      }
    },
    [activeLens, conversationId, inputValue, isBusy, isOnline, messages, streamMessage]
  );

  const handleResetConversation = useCallback(() => {
    setMessages([WELCOME_MESSAGE]);
    setInputValue("");
    setErrorMessage(null);
    setScopeNotice(null);
    setLastTurnMeta(null);
    setShareState("idle");
    setConversationId(undefined);

    if (standalone && pathname !== "/twin") {
      const resetRoute = (
        activeLens === "general" ? "/twin" : `/twin?lens=${activeLens}`
      ) as Route;
      router.replace(resetRoute, { scroll: false });
    }
  }, [standalone, pathname, router, activeLens]);

  const handleShare = useCallback(async () => {
    if (!shareUrl || typeof navigator === "undefined" || !navigator.clipboard) {
      setShareState("failed");
      return;
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareState("copied");
      window.setTimeout(() => setShareState("idle"), 2000);
    } catch {
      setShareState("failed");
    }
  }, [shareUrl]);

  const hasUserMessages = messages.some((message) => message.role === "user");
  const transcriptHeight = standalone
    ? "h-[48vh] min-h-[300px] max-h-[620px]"
    : "h-[320px]";
  const fullViewRoute = (
    `${conversationId ? `/twin/${conversationId}` : "/twin"}${
      activeLens !== "general" ? `?lens=${activeLens}` : ""
    }`
  ) as Route;

  return (
    <aside
      data-twin-panel="true"
      className={cn(
        "rounded-3xl border border-border bg-surface p-4 shadow-[var(--shadow-panel)]",
        className
      )}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <TwinAvatar />
          <div>
            <p className="text-sm font-semibold">Ask my assistant</p>
            <p className="text-xs text-muted">
              Only answers questions about Mootez ({lensDefinition.shortLabel} view)
              {isBusy ? " • thinking" : ""}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleResetConversation}
            disabled={isBusy}
            className="gap-1"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            New
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleShare}
            disabled={!shareUrl}
            className="gap-1"
          >
            <Copy className="h-3.5 w-3.5" />
            Share
          </Button>
        </div>
      </div>

      <TwinScopeNotice category={scopeNotice?.category} reason={scopeNotice?.reason} />

      {errorMessage ? (
        <div className="mt-3 rounded-xl border border-error-border bg-error-background px-3 py-2 text-xs text-error-foreground">
          {errorMessage}
        </div>
      ) : null}

      {!isOnline ? (
        <div className="mt-3 rounded-xl border border-warning-border bg-warning-background px-3 py-2 text-xs text-warning-foreground">
          You are offline. The twin will resume once connection returns.
        </div>
      ) : null}

      {lastTurnMeta?.providerId === "local-fallback" ? (
        <div className="mt-3 rounded-xl border border-warning-border bg-warning-background px-3 py-2 text-xs text-warning-foreground">
          <p className="flex items-start gap-2">
            <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            Last response used local fallback mode because external providers were
            unavailable.
          </p>
        </div>
      ) : null}

      <div
        ref={scrollRef}
        className={cn("mt-3 space-y-3 overflow-y-auto pr-1", transcriptHeight)}
      >
        {messages.map((message) => (
          <TwinMessage
            key={message.id}
            role={message.role}
            content={message.content}
            tone={message.tone}
            streaming={message.streaming}
          />
        ))}
        {isBusy ? (
          <div className="flex items-center gap-2 text-xs text-muted">
            <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
            Waiting for twin response...
          </div>
        ) : null}
      </div>

      {!hasUserMessages ? (
        <div className="mt-3">
          <TwinSuggestions
            disabled={isBusy || !isOnline}
            onSelect={sendMessage}
            lens={activeLens}
          />
        </div>
      ) : null}

      <div className="mt-3">
        <TwinInput
          value={inputValue}
          disabled={isBusy}
          isOnline={isOnline}
          onChange={setInputValue}
          onSubmit={() => void sendMessage()}
        />
      </div>

      <div className="mt-3 space-y-2">
        <TwinTransparency conversationId={conversationId} lastTurn={lastTurnMeta} />
        {!standalone ? (
          <Link
            href={fullViewRoute}
            className="inline-block text-xs font-semibold uppercase tracking-[0.12em] text-accent underline"
          >
            Open full assistant view
          </Link>
        ) : null}
        {shareState === "copied" ? (
          <p className="text-xs text-success-foreground">
            Share link copied to clipboard.
          </p>
        ) : null}
        {shareState === "failed" ? (
          <p className="text-xs text-error-foreground">
            Could not copy automatically. Use the URL bar and copy manually.
          </p>
        ) : null}
      </div>
    </aside>
  );
}
