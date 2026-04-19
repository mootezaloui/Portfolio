import { Button } from "@/components/primitives/Button";
import { getRoleLensDefinition, type RoleLens } from "@/lib/lens/roleLens";

interface TwinSuggestionsProps {
  disabled: boolean;
  onSelect: (value: string) => void;
  suggestions?: string[];
  lens?: RoleLens;
}

export function TwinSuggestions({
  disabled,
  onSelect,
  suggestions,
  lens = "general",
}: TwinSuggestionsProps) {
  const resolved =
    suggestions ?? getRoleLensDefinition(lens).assistantPrompts;

  return (
    <div className="space-y-2">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
        Try asking
      </p>
      <ul className="grid gap-2">
        {resolved.map((item) => (
          <li key={item}>
            <Button
              variant="outline"
              size="sm"
              type="button"
              disabled={disabled}
              onClick={() => onSelect(item)}
              className="h-auto w-full justify-start whitespace-normal px-3 py-2 text-left text-xs leading-5"
            >
              {item}
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
