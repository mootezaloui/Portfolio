import type { RoleLens } from "@/lib/lens/roleLens";
import { withBasePath } from "../site/runtime";

const FALLBACK_LENS: RoleLens = "general";

const RESUME_BY_LENS: Partial<Record<RoleLens, string>> = {
  general: "/resume/mootez-aloui-general.pdf",
  ai: "/resume/mootez-aloui-ai.pdf",
  cyber: "/resume/mootez-aloui-cyber.pdf",
  ml: "/resume/mootez-aloui-ml.pdf",
};

function resolveLens(lens: RoleLens): RoleLens {
  return RESUME_BY_LENS[lens] ? lens : FALLBACK_LENS;
}

export function getResumeHref(lens: RoleLens): string {
  const resolved = resolveLens(lens);
  const path = RESUME_BY_LENS[resolved] ?? RESUME_BY_LENS[FALLBACK_LENS]!;
  return withBasePath(path);
}

export function getResumeDownloadName(lens: RoleLens): string {
  const resolved = resolveLens(lens);
  const suffix = resolved.replace("-", "_");
  return `Mootez_Aloui_Resume_${suffix}.pdf`;
}
