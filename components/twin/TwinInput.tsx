import type { FormEvent, KeyboardEvent } from "react";

import { Button } from "@/components/primitives/Button";

interface TwinInputProps {
  value: string;
  disabled: boolean;
  isOnline: boolean;
  onChange: (value: string) => void;
  onSubmit: () => void;
}

export function TwinInput({
  value,
  disabled,
  isOnline,
  onChange,
  onSubmit,
}: TwinInputProps) {
  const canSubmit = !disabled && value.trim().length > 0 && isOnline;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) {
      return;
    }
    onSubmit();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (canSubmit) {
        onSubmit();
      }
    }
  }

  return (
    <form
      className="rounded-2xl border border-border bg-surface p-3"
      onSubmit={handleSubmit}
    >
      <label htmlFor="twin-input" className="sr-only">
        Ask the digital twin
      </label>
      <textarea
        id="twin-input"
        data-twin-input="true"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ask about Mootez's systems, failures, or engineering decisions..."
        disabled={disabled}
        rows={3}
        className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm leading-6 text-foreground outline-none transition focus:border-accent focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-70"
      />
      <div className="mt-2 flex items-center justify-between gap-3">
        <p className="text-xs text-muted">
          {isOnline ? "Enter sends, Shift+Enter adds a new line." : "Offline mode: send is disabled."}
        </p>
        <Button type="submit" size="sm" disabled={!canSubmit}>
          Send
        </Button>
      </div>
    </form>
  );
}
