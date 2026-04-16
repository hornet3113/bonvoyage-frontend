"use client";

import React from "react";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { IoIosGlobe } from "react-icons/io";
import { IoSearchOutline, IoMenuOutline, IoClose } from "react-icons/io5";
import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton, useAuth } from "@clerk/nextjs";
import { useUserProfile } from "@/hooks/useUserProfile";
import AvatarProfilePage from "./AvatarProfilePage";

type SearchResult = {
  name: string;
  lng: number;
  lat: number;
};

type Props = {
  variant?: "dark" | "light" | "glass";
  onSearch?: (result: SearchResult) => void;
  useLandingMenus?: boolean;
};

// ── Mobile slide-in menu ───────────────────────────────────────────────────────
function MobileMenuOverlay({
  open,
  onClose,
  menus,
  pathname,
  profile,
}: {
  open: boolean;
  onClose: () => void;
  menus: { label: string; href: string }[];
  pathname: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  profile: any;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[200] md:hidden">
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      {/* panel */}
      <div className="absolute top-0 right-0 h-full w-72 max-w-[85vw] bg-white shadow-2xl flex flex-col">
        {/* top bar */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2 text-gray-800">
            <IoIosGlobe className="text-xl" />
            <span className="font-medium tracking-[3px] text-xs uppercase">Bon Voyage</span>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 transition-colors">
            <IoClose className="text-gray-500 text-xl" />
          </button>
        </div>

        {/* nav links */}
        <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
          {menus.map(({ label, href }) => {
            const isAnchor = href.includes("#");
            const anchorId = isAnchor ? href.split("#")[1] : null;
            const isActive = pathname === href;

            const handleClick = (e: React.MouseEvent) => {
              if (anchorId) {
                e.preventDefault();
                document.getElementById(anchorId)?.scrollIntoView({ behavior: "smooth" });
              }
              onClose();
            };

            return isAnchor ? (
              <a
                key={href}
                href={href}
                onClick={handleClick}
                className={`block px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                  isActive ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                {label}
              </a>
            ) : (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                className={`block px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                  isActive ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        {/* auth */}
        <div className="px-5 py-4 border-t border-gray-100">
          <SignedOut>
            <div className="flex flex-col gap-2">
              <SignInButton mode="modal">
                <button className="w-full py-2.5 rounded-xl border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors">
                  Iniciar sesión
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="w-full py-2.5 rounded-xl bg-cyan-500 text-black text-sm font-semibold hover:bg-cyan-400 transition-colors">
                  Registrarse
                </button>
              </SignUpButton>
            </div>
          </SignedOut>
          <SignedIn>
            <div className="flex items-center gap-3">
              <div className="relative inline-flex items-center justify-center">
                <UserButton
                  appearance={{
                    elements: {
                      userButtonAvatarBox: profile?.avatar_url ? "opacity-0" : undefined,
                    },
                  }}
                />
                {profile?.avatar_url && (
                  <div className="absolute inset-0 pointer-events-none rounded-full overflow-hidden flex items-center justify-center">
                    <img src={profile.avatar_url} alt="avatar" className="w-8 h-8 rounded-full object-cover" />
                  </div>
                )}
              </div>
              <span className="text-sm text-gray-600 font-medium">Mi cuenta</span>
            </div>
          </SignedIn>
        </div>
      </div>
    </div>
  );
}

// ── Full UserButton with custom profile pages ─────────────────────────────────
function FullUserButton({ profile }: { profile: ReturnType<typeof useUserProfile>["profile"] }) {
  return (
    <div className="relative inline-flex items-center justify-center">
      <UserButton
        appearance={{
          elements: {
            userButtonAvatarBox: profile?.avatar_url ? "opacity-0" : undefined,
            userPreviewAvatarBox: profile?.avatar_url
              ? { backgroundImage: `url('${profile.avatar_url}')`, backgroundSize: "cover", backgroundPosition: "center", borderRadius: "50%" }
              : undefined,
            userPreviewAvatarImage: profile?.avatar_url ? "opacity-0" : undefined,
          },
        }}
      >
        <UserButton.UserProfilePage label="Mi Avatar" url="avatar" labelIcon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path fillRule="evenodd" d="M18.685 19.097A9.723 9.723 0 0021.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12a9.723 9.723 0 003.065 7.097A9.716 9.716 0 0012 21.75a9.716 9.716 0 006.685-2.653zm-12.54-1.285A7.486 7.486 0 0112 15a7.486 7.486 0 015.855 2.812A8.224 8.224 0 0112 20.25a8.224 8.224 0 01-5.855-2.438zM15.75 9a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" clipRule="evenodd" /></svg>}>
          <AvatarProfilePage />
        </UserButton.UserProfilePage>
        <UserButton.MenuItems>
          {profile?.role === "ADMIN" && (
            <UserButton.Link label="Panel Admin" labelIcon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path fillRule="evenodd" d="M2.25 13.5a8.25 8.25 0 018.25-8.25.75.75 0 01.75.75v6.75H18a.75.75 0 01.75.75 8.25 8.25 0 01-16.5 0z" clipRule="evenodd" /><path fillRule="evenodd" d="M12.75 3a.75.75 0 01.75-.75 8.25 8.25 0 018.25 8.25.75.75 0 01-.75.75h-7.5a.75.75 0 01-.75-.75V3z" clipRule="evenodd" /></svg>} href="/admin" />
          )}
          <UserButton.Link label="Mis viajes" labelIcon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" /></svg>} href="/my-trips" />
          <UserButton.Link label="Favoritos" labelIcon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" /></svg>} href="/favorites" />
          <UserButton.Link label="Wishlist" labelIcon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path fillRule="evenodd" d="M6.32 2.577a49.255 49.255 0 0111.36 0c1.497.174 2.57 1.46 2.57 2.93V21a.75.75 0 01-1.085.67L12 18.089l-7.165 3.583A.75.75 0 013.75 21V5.507c0-1.47 1.073-2.756 2.57-2.93z" clipRule="evenodd" /></svg>} href="/wishlist" />
        </UserButton.MenuItems>
      </UserButton>
      {profile?.avatar_url && (
        <div className="absolute inset-0 pointer-events-none rounded-full overflow-hidden flex items-center justify-center">
          <img src={profile.avatar_url} alt="avatar" className="w-8 h-8 rounded-full object-cover" />
        </div>
      )}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
function Header({ variant = "dark", onSearch, useLandingMenus }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const { profile } = useUserProfile();
  const { isSignedIn } = useAuth();

  const handleSearch = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}&language=es&limit=1`
      );
      const data = await response.json();
      const feature = data.features?.[0];
      if (feature) {
        const [lng, lat] = feature.center;
        if (onSearch) {
          onSearch({ name: feature.place_name, lng, lat });
        } else {
          router.push(`/dashboard`);
        }
        setQuery("");
      }
    } finally {
      setLoading(false);
    }
  };

  const isLight = variant === "light";
  const isGlass = variant === "glass";
  const isLanding = useLandingMenus || pathname === "/";
  const baseLandingMenus = isSignedIn
    ? [...landingMenus, { label: "DiscoveryMap", href: "/dashboard" }]
    : landingMenus;
  const menus = isLanding ? baseLandingMenus : appMenus;

  // ── Glass variant ──────────────────────────────────────────────────────────
  if (isGlass) {
    return (
      <>
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="relative z-10 w-full flex items-center justify-between gap-4 px-5 md:px-10 py-3 bg-black/40 backdrop-blur-md border-b border-white/10"
        >
          {/* Logo */}
          <div className="flex items-center gap-1.5 shrink-0">
            <IoIosGlobe className="text-lg text-white" />
            <span className="font-[family-name:var(--font-playfair)] italic text-white text-sm tracking-wide">
              Bon Voyage
            </span>
          </div>

          {/* Desktop nav links */}
          <ul className="hidden md:flex items-center gap-5 text-[11px] font-medium uppercase tracking-wider text-white/70 flex-1 justify-center">
            {menus.map(({ label, href }) => {
              const isAnchor = href.includes("#");
              const anchorId = isAnchor ? href.split("#")[1] : null;
              const isActive = pathname === href;
              const handleAnchorClick = (e: React.MouseEvent) => {
                if (!anchorId) return;
                e.preventDefault();
                document.getElementById(anchorId)?.scrollIntoView({ behavior: "smooth", block: "start" });
              };
              return (
                <motion.li layout key={href} className={`inline-block cursor-pointer transition-colors duration-200 hover:text-white ${isActive ? "text-cyan-400" : ""}`} whileTap={{ scale: 0.93 }}>
                  {isAnchor ? <a href={href} onClick={handleAnchorClick}>{label}</a> : <Link href={href}>{label}</Link>}
                </motion.li>
              );
            })}
          </ul>

          {/* Right side */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Search (desktop only) */}
            <form
              onSubmit={handleSearch}
              className="hidden md:flex items-center justify-end"
              onMouseEnter={() => { setSearchOpen(true); setTimeout(() => inputRef.current?.focus(), 50); }}
              onMouseLeave={() => { if (!query) setSearchOpen(false); }}
            >
              <motion.div layout className="flex items-center rounded-full border border-white/20 bg-white/10 overflow-hidden" style={{ paddingLeft: searchOpen ? "0.75rem" : 0 }} transition={{ duration: 0.25, ease: "easeOut" }}>
                <AnimatePresence>
                  {searchOpen && (
                    <motion.input key="search-input" ref={inputRef} initial={{ width: 0, opacity: 0 }} animate={{ width: 140, opacity: 1 }} exit={{ width: 0, opacity: 0 }} transition={{ duration: 0.25, ease: "easeOut" }} type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar destino..." className="bg-transparent outline-none text-[11px] text-white placeholder:text-white/40 pr-1" />
                  )}
                </AnimatePresence>
                <button type={searchOpen && query ? "submit" : "button"} disabled={loading} className="flex items-center justify-center w-8 h-8 text-white/70 hover:text-cyan-400 transition-colors duration-200">
                  <IoSearchOutline className="text-base" />
                </button>
              </motion.div>
            </form>

            {/* Auth (desktop) */}
            <SignedOut>
              <SignInButton mode="modal">
                <button data-testid="sign-in-button" className="hidden md:inline text-[11px] uppercase tracking-wider text-white/70 hover:text-white transition-colors duration-200">Entrar</button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="hidden md:inline text-[11px] uppercase tracking-wider font-semibold px-4 py-1.5 rounded-full bg-cyan-400 text-black hover:bg-cyan-300 transition-colors duration-200">Registrarse</button>
              </SignUpButton>
            </SignedOut>
            <SignedIn>
              <div className="hidden md:flex">
                <FullUserButton profile={profile} />
              </div>
            </SignedIn>

            {/* Hamburger (mobile only) */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden flex items-center justify-center w-9 h-9 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
            >
              <IoMenuOutline className="text-xl" />
            </button>
          </div>
        </motion.div>

        <MobileMenuOverlay open={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} menus={menus} pathname={pathname} profile={profile} />
      </>
    );
  }

  // ── Light variant ──────────────────────────────────────────────────────────
  if (isLight) {
    return (
      <>
        <div className="w-full flex items-center justify-between gap-4 px-5 md:px-10 py-3 bg-white border-b border-gray-100 text-xs font-medium uppercase">
          {/* Logo */}
          <div className="flex items-center gap-2 font-medium tracking-[4px] text-gray-800 shrink-0">
            <IoIosGlobe className="text-xl" />
            Bon Voyage
          </div>

          {/* Desktop nav links */}
          <ul className="hidden md:flex items-center gap-5 text-[11px] font-medium uppercase tracking-wider text-gray-500 flex-1 justify-center">
            {menus.map(({ label, href }) => {
              const isAnchor = href.includes("#");
              const anchorId = isAnchor ? href.split("#")[1] : null;
              const isActive = pathname === href;
              const handleAnchorClick = (e: React.MouseEvent) => {
                if (!anchorId) return;
                e.preventDefault();
                document.getElementById(anchorId)?.scrollIntoView({ behavior: "smooth", block: "start" });
              };
              return (
                <motion.li layout key={href} className={`inline-block cursor-pointer transition-colors duration-200 hover:text-gray-900 ${isActive ? "text-blue-500 border-b border-blue-400" : ""}`} whileTap={{ scale: 0.93 }}>
                  {isAnchor ? <a href={href} onClick={handleAnchorClick}>{label}</a> : <Link href={href}>{label}</Link>}
                </motion.li>
              );
            })}
          </ul>

          {/* Right side */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Search (desktop only) */}
            <form
              onSubmit={handleSearch}
              className="hidden md:flex items-center justify-end"
              onMouseEnter={() => { setSearchOpen(true); setTimeout(() => inputRef.current?.focus(), 50); }}
              onMouseLeave={() => { if (!query) setSearchOpen(false); }}
            >
              <motion.div layout className="flex items-center rounded-full border border-gray-200 bg-gray-100 overflow-hidden" style={{ paddingLeft: searchOpen ? "0.75rem" : 0 }} transition={{ duration: 0.25, ease: "easeOut" }}>
                <AnimatePresence>
                  {searchOpen && (
                    <motion.input key="search-input" ref={inputRef} initial={{ width: 0, opacity: 0 }} animate={{ width: 140, opacity: 1 }} exit={{ width: 0, opacity: 0 }} transition={{ duration: 0.25, ease: "easeOut" }} type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar destino..." className="bg-transparent outline-none text-[11px] text-gray-700 placeholder:text-gray-400 pr-1" />
                  )}
                </AnimatePresence>
                <button type={searchOpen && query ? "submit" : "button"} disabled={loading} className="flex items-center justify-center w-8 h-8 text-gray-500 hover:text-blue-500 transition-colors duration-200">
                  <IoSearchOutline className="text-base" />
                </button>
              </motion.div>
            </form>

            {/* Auth (desktop) */}
            <SignedOut>
              <SignInButton mode="modal">
                <button data-testid="sign-in-button" className="hidden md:inline px-3 py-1 rounded border border-gray-400 text-gray-700 hover:bg-gray-100 transition duration-300">Iniciar sesión</button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="hidden md:inline px-3 py-1 rounded bg-cyan-500 text-black hover:bg-cyan-600 transition duration-300">Registrarse</button>
              </SignUpButton>
            </SignedOut>
            <SignedIn>
              <div className="hidden md:flex">
                <FullUserButton profile={profile} />
              </div>
            </SignedIn>

            {/* Hamburger (mobile only) */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden flex items-center justify-center w-9 h-9 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
            >
              <IoMenuOutline className="text-xl" />
            </button>
          </div>
        </div>

        <MobileMenuOverlay open={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} menus={menus} pathname={pathname} profile={profile} />
      </>
    );
  }

  // ── Dark variant (landing page) ────────────────────────────────────────────
  return (
    <>
      <div className="absolute mt-5 z-10 flex w-full items-center justify-between gap-2 px-5 text-xs font-medium uppercase opacity-90 md:px-10">
        {/* Logo */}
        <div className="flex items-center gap-2 font-medium tracking-[4px] text-white">
          <IoIosGlobe className="text-xl" />
          Bon Voyage
        </div>

        {/* Desktop nav links */}
        <ul className="hidden md:flex flex-wrap items-center gap-3 text-[11px] text-white md:gap-10">
          {menus.map(({ label, href }) => {
            const isAnchor = href.includes("#");
            const anchorId = isAnchor ? href.split("#")[1] : null;
            const handleAnchorClick = (e: React.MouseEvent) => {
              if (!anchorId) return;
              e.preventDefault();
              document.getElementById(anchorId)?.scrollIntoView({ behavior: "smooth", block: "start" });
            };
            return (
              <motion.li layout key={href} className={`${pathname === href ? "border-b-2 border-b-blue-500" : ""} inline-block cursor-pointer border-b-blue-500 transition duration-300 ease-in-out hover:border-b-2 hover:text-white`} whileTap={{ scale: 0.93 }}>
                {isAnchor ? <a href={href} onClick={handleAnchorClick}>{label}</a> : <Link href={href}>{label}</Link>}
              </motion.li>
            );
          })}
        </ul>

        {/* Right side: auth + hamburger */}
        <div className="flex items-center gap-3">
          {/* Auth (desktop) */}
          <SignedOut>
            <SignInButton mode="modal">
              <button data-testid="sign-in-button" className="hidden md:inline px-3 py-1 rounded border border-white/50 hover:bg-white hover:text-black transition duration-300">Iniciar sesión</button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className="hidden md:inline px-3 py-1 rounded bg-cyan-500 text-black hover:bg-cyan-600 transition duration-300">Registrarse</button>
            </SignUpButton>
          </SignedOut>
          <SignedIn>
            <div className="hidden md:flex">
              <FullUserButton profile={profile} />
            </div>
          </SignedIn>

          {/* Hamburger (mobile only) */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="md:hidden flex items-center justify-center w-9 h-9 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            <IoMenuOutline className="text-xl" />
          </button>
        </div>
      </div>

      <MobileMenuOverlay open={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} menus={menus} pathname={pathname} profile={profile} />
    </>
  );
}

export default Header;

// Menús de la landing page
const landingMenus = [
  { label: "Cómo funciona",  href: "/#como-funciona"   },
  { label: "Características", href: "/#caracteristicas" },
  { label: "Sobre nosotros",  href: "/#nosotros"        },
];

// Menús del panel de la app
const appMenus = [
  { label: "Inicio",       href: "/"          },
  { label: "DiscoveryMap", href: "/dashboard" },
  { label: "Mis Viajes",   href: "/my-trips"  },
  { label: "Favoritos",    href: "/favorites" },
  { label: "Wishlist",     href: "/wishlist"  },
];
