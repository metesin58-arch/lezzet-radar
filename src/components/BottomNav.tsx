"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { HeartIcon, HomeIcon, MapIcon, SearchIcon } from "./icons";

const ITEMS = [
  { href: "/", label: "Ana sayfa", Icon: HomeIcon },
  { href: "/ara", label: "Ara", Icon: SearchIcon },
  { href: "/harita", label: "Harita", Icon: MapIcon },
  { href: "/favoriler", label: "Favoriler", Icon: HeartIcon },
];

export function BottomNav() {
  const path = usePathname();
  if (path.startsWith("/mekan/")) return null;
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-md px-4 pb-[max(env(safe-area-inset-bottom),14px)]">
      <ul className="flex items-center justify-between rounded-full border border-line bg-surface/95 px-3 py-2.5 shadow-[0_8px_30px_rgba(0,0,0,0.08)] backdrop-blur">
        {ITEMS.map(({ href, label, Icon }) => {
          const active = href === "/" ? path === "/" : path.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-label={label}
                aria-current={active ? "page" : undefined}
                className={`flex size-12 items-center justify-center rounded-full transition ${
                  active ? "bg-ink text-white shadow-lg" : "bg-canvas text-ink/70 hover:text-ink"
                }`}
              >
                <Icon className="size-[22px]" />
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
