import { DatabaseZap, Eye, ShieldCheck } from "lucide-react";
import Link from "next/link";

import type { TwinTurnMeta } from "./types";

interface TwinTransparencyProps {
  conversationId?: string | undefined;
  lastTurn?: TwinTurnMeta | null;
}

export function TwinTransparency({
  conversationId,
  lastTurn,
}: TwinTransparencyProps) {
  return (
    <details className="rounded-xl border border-border bg-surface p-3 text-xs text-muted">
      <summary className="flex cursor-pointer items-center gap-2 font-semibold uppercase tracking-[0.14em]">
        <Eye className="h-3.5 w-3.5" />
        Transparency
      </summary>
      <div className="mt-3 space-y-2 leading-5">
        <p className="flex items-start gap-2">
          <DatabaseZap className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          Uses only portfolio corpus (`profile`, project narratives, career and approach
          documents).
        </p>
        <p className="flex items-start gap-2">
          <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          Enforced by classifier + validator. Out-of-scope prompts are intentionally
          deflected.
        </p>
        {conversationId ? (
          <p>
            Conversation: <span className="font-mono text-[11px]">{conversationId}</span>
          </p>
        ) : null}
        {lastTurn ? (
          <p>
            Last turn: `{lastTurn.providerId}` ({lastTurn.providerModel}) in{" "}
            {lastTurn.latencyMs}ms{lastTurn.cached ? ", cache hit" : ""}.
          </p>
        ) : null}
        <p>
          See implementation detail in{" "}
          <Link href="/case-study" className="font-semibold text-foreground underline">
            case study
          </Link>
          .
        </p>
      </div>
    </details>
  );
}
