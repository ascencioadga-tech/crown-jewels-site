import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="bg-ink text-paper">
      <div className="mx-auto max-w-7xl px-6 lg:px-10 pt-20 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 lg:gap-16 mb-16">
          {/* Brand block */}
          <div className="md:col-span-5">
            <div className="w-[200px] -ml-1">
              <Image
                src="/crown-jewels-logo.png"
                alt="Crown Jewels Produce"
                width={580}
                height={260}
                sizes="200px"
                className="w-full h-auto"
              />
            </div>
            <p className="mt-7 text-paper/65 text-sm max-w-sm leading-relaxed">
              Year-round produce programs from California, Mexico, Chile, and
              Peru. Three generations of grower-direct relationships, kept by
              name.
            </p>
          </div>

          {/* Link columns */}
          <div className="md:col-span-7 grid grid-cols-2 md:grid-cols-3 gap-10">
            <FooterColumn
              title="Site"
              links={[
                { label: "Commodities", href: "#commodities" },
                { label: "Growers & regions", href: "#growers" },
                { label: "Year-round program", href: "#programs" },
                { label: "Our family", href: "#about" },
                { label: "Contact", href: "#contact" },
              ]}
            />
            <FooterColumn
              title="Office"
              links={[
                { label: "Fresno, California" },
                { label: "sales@crownjewelsproduce.com", href: "mailto:sales@crownjewelsproduce.com" },
                { label: "(559) 000-0000", href: "tel:+15590000000" },
              ]}
            />
            <FooterColumn
              title="Connect"
              links={[
                { label: "LinkedIn", href: "https://www.linkedin.com/company/crown-jewels-produce-llc", external: true },
                { label: "Instagram", href: "https://www.instagram.com/cjproduce/", external: true },
                { label: "YouTube", href: "https://www.youtube.com/channel/UCfFVDcvWTYQRZAErSdEOW-Q", external: true },
              ]}
            />
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-paper/10 pt-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs text-paper/50">
          <span>© {new Date().getFullYear()} Crown Jewels Produce, LLC.</span>
          <Link href="/admin" className="hover:text-paper transition-colors">
            Team login →
          </Link>
        </div>
      </div>
    </footer>
  );
}

type FooterLink = {
  label: string;
  href?: string;
  external?: boolean;
};

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: FooterLink[];
}) {
  return (
    <div>
      <p className="eyebrow text-paper/40 mb-5">{title}</p>
      <ul className="space-y-2.5 text-sm text-paper/75">
        {links.map((l) => (
          <li key={l.label}>
            {l.href ? (
              <a
                href={l.href}
                {...(l.external
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
                className="hover:text-paper transition-colors"
              >
                {l.label}
              </a>
            ) : (
              <span>{l.label}</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
