import {
  BadgeCheck,
  BookOpenCheck,
  Building2,
  ExternalLink,
  GraduationCap,
} from "lucide-react";
import Image from "next/image";
import type { ComponentType } from "react";
import type { IconType } from "react-icons";
import { FaAws } from "react-icons/fa";
import {
  SiAnthropic,
  SiCoursera,
  SiGoogle,
  SiMeta,
  SiNvidia,
  SiScrumalliance,
} from "react-icons/si";

import type { Certification } from "@/lib/content/schemas";
import type { Locale } from "@/lib/i18n/config";
import { formatMessage, getDictionary } from "@/lib/i18n/dictionary";
import { cn } from "@/lib/utils";

interface CertificationsProps {
  certifications: Certification[];
  locale: Locale;
}

type LogoComponent = ComponentType<{ className?: string; "aria-hidden"?: boolean }>;

interface IssuerLogoConfig {
  Icon?: LogoComponent;
  imageSrc?: string;
  iconClassName?: string;
}

function toLogoComponent(Icon: IconType): LogoComponent {
  return Icon as unknown as LogoComponent;
}

function getIssuerLogoConfig(issuer: string): IssuerLogoConfig {
  const normalized = issuer.toLowerCase();

  if (normalized.includes("anthropic")) {
    return {
      Icon: toLogoComponent(SiAnthropic),
      iconClassName: "text-[#d4d4d4]",
    };
  }
  if (normalized.includes("google")) {
    return {
      Icon: toLogoComponent(SiGoogle),
      iconClassName: "text-[#4285f4]",
    };
  }
  if (normalized.includes("ibm")) {
    return {
      imageSrc: "/images/certifications/ibm-brand.svg",
    };
  }
  if (normalized.includes("nvidia")) {
    return {
      Icon: toLogoComponent(SiNvidia),
      iconClassName: "text-[#76b900]",
    };
  }
  if (normalized.includes("amazon web services") || normalized.includes("aws")) {
    return {
      Icon: toLogoComponent(FaAws),
      iconClassName: "text-[#ff9900]",
    };
  }
  if (normalized.includes("coursera")) {
    return {
      Icon: toLogoComponent(SiCoursera),
      iconClassName: "text-[#0056d2]",
    };
  }
  if (normalized.includes("meta")) {
    return {
      Icon: toLogoComponent(SiMeta),
      iconClassName: "text-[#0866ff]",
    };
  }
  if (normalized.includes("scrum")) {
    return {
      Icon: toLogoComponent(SiScrumalliance),
      iconClassName: "text-[#ef4444]",
    };
  }
  if (normalized.includes("university")) {
    return {
      Icon: GraduationCap,
      iconClassName: "text-accent",
    };
  }
  if (normalized.includes("learnquest")) {
    return {
      Icon: BookOpenCheck,
      iconClassName: "text-accent",
    };
  }
  if (normalized.includes("institute")) {
    return {
      Icon: Building2,
      iconClassName: "text-accent",
    };
  }

  return {
    Icon: BadgeCheck,
    iconClassName: "text-accent",
  };
}

export function Certifications({ certifications, locale }: CertificationsProps) {
  const dict = getDictionary(locale).certifications;
  return (
    <section
      id="certifications"
      data-mascot-anchor="section_certifications"
      className="rounded-3xl border border-border bg-surface p-8 scroll-mt-24"
    >
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-semibold">{dict.title}</h2>
        <a
          href="https://www.linkedin.com/in/mootez-aloui-490090211/details/certifications/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-xs text-muted transition hover:bg-background hover:text-foreground"
        >
          {dict.fullList}
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {certifications.map((cert) => {
          const { Icon, iconClassName, imageSrc } = getIssuerLogoConfig(cert.issuer);

          return (
            <article
              key={`${cert.title}-${cert.issuer}`}
              className="rounded-2xl border border-border bg-background p-4"
            >
              <div className="mb-3 flex items-start gap-3">
                <div
                  className="relative grid h-10 w-10 place-items-center rounded-lg border border-border bg-surface"
                  aria-label={formatMessage(dict.issuerLogo, { issuer: cert.issuer })}
                >
                  {imageSrc ? (
                    <Image
                      src={imageSrc}
                      alt={formatMessage(dict.issuerLogo, { issuer: cert.issuer })}
                      width={20}
                      height={20}
                      className="h-5 w-5 object-contain"
                    />
                  ) : Icon ? (
                    <Icon
                      className={cn("h-5 w-5", iconClassName)}
                      aria-hidden
                    />
                  ) : null}
                </div>
                <div>
                  <h3 className="text-sm font-semibold leading-5">{cert.title}</h3>
                  <p className="text-xs text-muted">
                    {cert.issuer} · {cert.date}
                  </p>
                </div>
              </div>
              <p className="mb-2 text-xs text-muted">
                {formatMessage(dict.credentialId, {
                  id: cert.credentialId || dict.notPublic,
                })}
              </p>
              <ul className="flex flex-wrap gap-1.5">
                {cert.skills.map((skill) => (
                  <li
                    key={skill}
                    className="rounded-full border border-border px-2 py-0.5 text-[11px] text-muted"
                  >
                    {skill}
                  </li>
                ))}
              </ul>
              {cert.verifyUrl ? (
                <a
                  href={cert.verifyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-accent underline"
                >
                  {dict.verify}
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}
