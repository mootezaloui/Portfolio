import { ShieldAlert } from "lucide-react";

import type { TwinScopeCategory } from "./types";

interface TwinScopeNoticeProps {
  category?: TwinScopeCategory | undefined;
  reason?: string | undefined;
}

const categoryLabel: Record<TwinScopeCategory, string> = {
  mootez_context: "Mootez context",
  project_context: "Project context",
  career_context: "Career context",
  opinion_context: "Professional opinion context",
  prompt_injection: "Prompt-injection attempt",
  coding_request: "General coding request",
  general_knowledge: "General-knowledge request",
  realtime_external: "Real-time external request",
  unknown: "Unclear context",
};

export function TwinScopeNotice({ category, reason }: TwinScopeNoticeProps) {
  return (
    <div className="rounded-xl border border-warning-border bg-warning-background p-3 text-xs text-warning-foreground">
      <p className="mb-1 flex items-center gap-1 font-semibold uppercase tracking-[0.12em]">
        <ShieldAlert className="h-3.5 w-3.5" />
        Policy Scope
      </p>
      <p className="leading-5">
        The twin only answers questions about Mootez&apos;s work, systems, and engineering
        decisions.
      </p>
      {category ? (
        <p className="mt-2 text-[11px] leading-5 text-warning-foreground">
          Last deflection: {categoryLabel[category]}. {reason}
        </p>
      ) : null}
    </div>
  );
}
