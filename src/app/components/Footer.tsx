import Link from "next/link";
import { IoIosGlobe } from "react-icons/io";

const legalLinks = [
  { label: "Privacidad", href: "/privacy" },
  { label: "Términos de Uso", href: "/terms" },
  { label: "Cookies", href: "/cookies" },
];

export default function Footer() {
  return (
    <footer className="bg-slate-950 border-t border-slate-800 px-6 py-10 md:px-16">
      <div className="mx-auto max-w-5xl flex flex-col items-center gap-6 text-center sm:flex-row sm:justify-between sm:text-left">

        {/* Brand */}
        <div className="flex items-center gap-2 text-xs font-medium tracking-[4px] uppercase text-slate-400">
          <IoIosGlobe className="text-base text-cyan-500" />
          Bon Voyage
        </div>

        {/* Legal links */}
        <nav className="flex flex-wrap justify-center gap-6 sm:justify-end">
          {legalLinks.map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              className="text-xs uppercase tracking-widest text-slate-600 transition-colors hover:text-slate-300"
            >
              {label}
            </Link>
          ))}
        </nav>

      </div>

      <p className="mt-6 text-center text-xs text-slate-700 uppercase tracking-widest">
        © {new Date().getFullYear()} Bon Voyage · Planifica. Confirma. Viaja.
      </p>
    </footer>
  );
}
