"use client";

import React from "react";
import { motion } from "motion/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { IoIosGlobe } from "react-icons/io";
import { IoSearchOutline } from "react-icons/io5";
import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { useUserProfile } from "@/hooks/useUserProfile";
import AvatarProfilePage from "./AvatarProfilePage";

type SearchResult = {
  name: string;
  lng: number;
  lat: number;
};

type Props = {
  variant?: "dark" | "light";
  onSearch?: (result: SearchResult) => void;
};

function Header({ variant = "dark", onSearch }: Props) {
    const pathname = usePathname();
    const router = useRouter();
    const [query, setQuery] = React.useState("");
    const [loading, setLoading] = React.useState(false);
    const { profile } = useUserProfile();

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
    const isLanding = pathname === "/";
    const menus = isLanding ? landingMenus : appMenus;

    const containerClass = isLight
        ? "w-full flex flex-wrap items-center justify-between gap-2 px-5 py-3 text-xs font-medium uppercase bg-white border-b border-gray-100 md:px-10"
        : "absolute mt-5 flex w-full flex-wrap items-center justify-between gap-2 px-5 text-xs font-medium uppercase opacity-90 md:px-10";

    const textClass = isLight ? "text-gray-700" : "text-white";
    const menuHoverClass = isLight
        ? "border-b-blue-500 transition duration-300 ease-in-out hover:border-b-2 hover:text-gray-900"
        : "border-b-blue-500 transition duration-300 ease-in-out hover:border-b-2 hover:text-white";
    const activeBorderClass = isLight ? "border-b-2 border-b-blue-500 text-gray-900" : "border-b-2 border-b-blue-500";

    return (
        <div className={containerClass}>
            <div className={`flex items-center gap-2 font-medium tracking-[4px] ${textClass}`}>
                <IoIosGlobe className="text-xl"/>
                Bon Voyage
            </div>
            <ul className={`flex flex-wrap items-center gap-3 text-[11px] md:gap-10 ${textClass}`}>
                {menus.map(({ label, href }) => {
                    const isAnchor = href.includes("#");
                    const anchorId = isAnchor ? href.split("#")[1] : null;

                    const handleAnchorClick = (e: React.MouseEvent) => {
                        if (!anchorId) return;
                        e.preventDefault();
                        const target = document.getElementById(anchorId);
                        if (target) {
                            target.scrollIntoView({ behavior: "smooth", block: "start" });
                        }
                    };

                    return (
                        <motion.li
                            layout
                            key={href}
                            className={`${pathname === href ? activeBorderClass : ""} inline-block cursor-pointer ${menuHoverClass}`}
                            whileTap={{ scale: 0.93 }}
                        >
                            {isAnchor ? (
                                <a href={href} onClick={handleAnchorClick}>{label}</a>
                            ) : (
                                <Link href={href}>{label}</Link>
                            )}
                        </motion.li>
                    );
                })}

                {isLight && (
                    <li>
                        <form onSubmit={handleSearch} className="flex items-center gap-1 border-b border-gray-300 pb-0.5">
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="¿A dónde vas a viajar?"
                                className="bg-transparent outline-none text-[11px] uppercase tracking-wider placeholder:normal-case placeholder:tracking-normal w-32 md:w-44 placeholder:text-gray-400 text-gray-700"
                            />
                            <button type="submit" disabled={loading} className="text-gray-500 hover:text-gray-800 transition-colors">
                                <IoSearchOutline className="text-base" />
                            </button>
                        </form>
                    </li>
                )}

                <div className="flex items-center gap-4">
                    <SignedOut>
                        <SignInButton mode="modal">
                            <button data-testid="sign-in-button" className={`px-3 py-1 rounded border ${isLight ? "border-gray-400 text-gray-700 hover:bg-gray-100" : "border-white/50 hover:bg-white hover:text-black"} transition duration-300`}>
                                Iniciar sesión
                            </button>
                        </SignInButton>
                        <SignUpButton mode="modal">
                            <button className="px-3 py-1 rounded bg-cyan-500 text-black hover:bg-cyan-600 transition duration-300">
                                Registrarse
                            </button>
                        </SignUpButton>
                    </SignedOut>
                    <SignedIn>
                        {/* Overlay del avatar del backend sobre el botón de Clerk */}
                        <div className="relative inline-flex items-center justify-center">
                            <UserButton
                                appearance={{
                                    elements: {
                                        // Oculta el avatar del trigger para que se vea el overlay
                                        userButtonAvatarBox: profile?.avatar_url ? "opacity-0" : undefined,
                                        // Usa el avatar del backend como fondo en el popup
                                        userPreviewAvatarBox: profile?.avatar_url
                                            ? {
                                                backgroundImage: `url('${profile.avatar_url}')`,
                                                backgroundSize: "cover",
                                                backgroundPosition: "center",
                                                borderRadius: "50%",
                                              }
                                            : undefined,
                                        // Oculta la imagen de Clerk en el popup para que se vea el fondo
                                        userPreviewAvatarImage: profile?.avatar_url ? "opacity-0" : undefined,
                                    },
                                }}
                            >
                                <UserButton.UserProfilePage
                                    label="Mi Avatar"
                                    url="avatar"
                                    labelIcon={
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                                            <path fillRule="evenodd" d="M18.685 19.097A9.723 9.723 0 0021.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12a9.723 9.723 0 003.065 7.097A9.716 9.716 0 0012 21.75a9.716 9.716 0 006.685-2.653zm-12.54-1.285A7.486 7.486 0 0112 15a7.486 7.486 0 015.855 2.812A8.224 8.224 0 0112 20.25a8.224 8.224 0 01-5.855-2.438zM15.75 9a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" clipRule="evenodd" />
                                        </svg>
                                    }
                                >
                                    <AvatarProfilePage />
                                </UserButton.UserProfilePage>
                                <UserButton.MenuItems>
                                    {profile?.role === 'ADMIN' && (
                                        <UserButton.Link
                                            label="Panel Admin"
                                            labelIcon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path fillRule="evenodd" d="M2.25 13.5a8.25 8.25 0 018.25-8.25.75.75 0 01.75.75v6.75H18a.75.75 0 01.75.75 8.25 8.25 0 01-16.5 0z" clipRule="evenodd" /><path fillRule="evenodd" d="M12.75 3a.75.75 0 01.75-.75 8.25 8.25 0 018.25 8.25.75.75 0 01-.75.75h-7.5a.75.75 0 01-.75-.75V3z" clipRule="evenodd" /></svg>}
                                            href="/admin"
                                        />
                                    )}
                                    <UserButton.Link
                                        label="Mis viajes"
                                        labelIcon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" /></svg>}
                                        href="/my-trips"
                                    />
                                    <UserButton.Link
                                        label="Favoritos"
                                        labelIcon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" /></svg>}
                                        href="/favorites"
                                    />
                                    <UserButton.Link
                                        label="Wishlist"
                                        labelIcon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path fillRule="evenodd" d="M6.32 2.577a49.255 49.255 0 0111.36 0c1.497.174 2.57 1.46 2.57 2.93V21a.75.75 0 01-1.085.67L12 18.089l-7.165 3.583A.75.75 0 013.75 21V5.507c0-1.47 1.073-2.756 2.57-2.93z" clipRule="evenodd" /></svg>}
                                        href="/wishlist"
                                    />
                                </UserButton.MenuItems>
                            </UserButton>
                            {/* Avatar del backend superpuesto visualmente */}
                            {profile?.avatar_url && (
                                <div className="absolute inset-0 pointer-events-none rounded-full overflow-hidden flex items-center justify-center">
                                    <img
                                        src={profile.avatar_url}
                                        alt="avatar"
                                        className="w-8 h-8 rounded-full object-cover"
                                    />
                                </div>
                            )}
                        </div>
                    </SignedIn>
                </div>
            </ul>
        </div>
    );
}

export default Header;

// Menús de la landing page (links a secciones con anchor)
const landingMenus = [
    { label: "Cómo funciona", href: "/#como-funciona"   },
    { label: "Características", href: "/#caracteristicas" },
    { label: "Sobre nosotros",  href: "/#nosotros"        },
];

// Menús del panel de la app
const appMenus = [
    { label: "Inicio",        href: "/"          },
    { label: "DiscoveryMap",  href: "/dashboard" },
];
