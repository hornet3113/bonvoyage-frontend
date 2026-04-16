import Link from "next/link";
import Header from "./Header";
import Footer from "./Footer";

interface Section {
  title: string;
  content: string | string[];
}

interface LegalPageLayoutProps {
  title: string;
  subtitle: string;
  lastUpdated: string;
  sections: Section[];
}

export default function LegalPageLayout({
  title,
  subtitle,
  lastUpdated,
  sections,
}: LegalPageLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Header variant="dark" useLandingMenus />

      {/* Hero header */}
      <div className="bg-slate-900 border-b border-slate-800 pt-20 pb-12 px-6 md:px-16">
        <div className="mx-auto max-w-3xl">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs uppercase tracking-widest text-cyan-400 hover:text-cyan-300 transition-colors mb-6"
          >
            ← Volver al inicio
          </Link>
          <h1 className="text-4xl md:text-5xl font-medium text-white">{title}</h1>
          <p className="mt-3 text-slate-400 text-base">{subtitle}</p>
          <p className="mt-4 text-xs text-slate-600 uppercase tracking-widest">
            Última actualización: {lastUpdated}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-16 md:px-16">
        <div className="mx-auto max-w-3xl space-y-12">
          {sections.map((section, index) => (
            <section key={index}>
              <h2 className="text-xl font-medium text-white mb-4 pb-2 border-b border-slate-800">
                {section.title}
              </h2>
              {Array.isArray(section.content) ? (
                <ul className="space-y-2">
                  {section.content.map((item, i) => (
                    <li key={i} className="flex gap-3 text-slate-300 text-sm leading-relaxed">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-500" />
                      {item}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-slate-300 text-sm leading-relaxed">{section.content}</p>
              )}
            </section>
          ))}

        </div>
      </div>
      <Footer />
    </div>
  );
}
