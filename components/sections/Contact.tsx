import { Globe, Linkedin, Mail, Phone } from "lucide-react";

import type { Profile } from "@/lib/content/schemas";
import type { Locale } from "@/lib/i18n/config";
import { formatMessage, getDictionary } from "@/lib/i18n/dictionary";

interface ContactProps {
  profile: Profile;
  locale: Locale;
}

export function Contact({ profile, locale }: ContactProps) {
  const dict = getDictionary(locale).contact;
  return (
    <section
      id="contact"
      data-mascot-anchor="section_contact"
      className="rounded-3xl border border-border bg-surface p-8 scroll-mt-24"
    >
      <h2 className="mb-2 text-2xl font-semibold">{dict.title}</h2>
      <p className="mb-6 max-w-2xl text-sm leading-6 text-muted">
        {profile.identity.availability} {dict.description}
      </p>
      <div className="grid gap-3 md:grid-cols-2">
        <a
          href={`mailto:${profile.contact.email}`}
          aria-label={formatMessage(dict.ariaEmail, { name: profile.name })}
          className="flex items-center gap-2 rounded-2xl border border-accent bg-accent px-4 py-3 text-sm font-semibold text-accent-foreground transition hover:opacity-90"
        >
          <Mail className="h-4 w-4" />
          {profile.contact.email}
        </a>
        <a
          href={profile.contact.linkedin}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={formatMessage(dict.ariaLinkedin, { name: profile.name })}
          className="flex items-center gap-2 rounded-2xl border border-border bg-background px-4 py-3 text-sm text-muted transition hover:text-foreground"
        >
          <Linkedin className="h-4 w-4 text-accent" />
          {dict.linkedin}
        </a>
        <a
          href={profile.contact.github}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={formatMessage(dict.ariaGithub, { name: profile.name })}
          className="flex items-center gap-2 rounded-2xl border border-border bg-background px-4 py-3 text-sm text-muted transition hover:text-foreground"
        >
          <Globe className="h-4 w-4 text-accent" />
          {dict.github}
        </a>
        {profile.contact.phone ? (
          <a
            href={`tel:${profile.contact.phone}`}
            aria-label={formatMessage(dict.ariaPhone, { name: profile.name })}
            className="flex items-center gap-2 rounded-2xl border border-border bg-background px-4 py-3 text-sm text-muted transition hover:text-foreground"
          >
            <Phone className="h-4 w-4 text-accent" />
            {profile.contact.phone}
          </a>
        ) : null}
      </div>
    </section>
  );
}
