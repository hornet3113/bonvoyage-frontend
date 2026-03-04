"use client";

import React from "react";
import { motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { IoIosGlobe } from "react-icons/io";
import { IoSearchOutline } from "react-icons/io5";
import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";

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
    const [query, setQuery] = React.useState("");
    const [loading, setLoading] = React.useState(false);

    const handleSearch = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!query.trim() || !onSearch) return;
        setLoading(true);
        const response = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}&language=es&limit=1`
        );
        const data = await response.json();
        const feature = data.features?.[0];
        if (feature) {
            const [lng, lat] = feature.center;
            onSearch({ name: feature.place_name, lng, lat });
            setQuery("");
        }
        setLoading(false);
    };

    const isLight = variant === "light";

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
                {menus.map(({ label, href }) => (
                    <motion.li
                        layout
                        key={href}
                        className={`${pathname === href ? activeBorderClass : ""} inline-block cursor-pointer ${menuHoverClass}`}
                    >
                        <Link href={href}>{label}</Link>
                    </motion.li>
                ))}

                {onSearch && (
                    <li>
                        <form onSubmit={handleSearch} className={`flex items-center gap-1 border-b ${isLight ? "border-gray-300" : "border-white/40"} pb-0.5`}>
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="¿A dónde vas a viajar?"
                                className={`bg-transparent outline-none text-[11px] uppercase tracking-wider placeholder:normal-case placeholder:tracking-normal w-32 md:w-44 ${isLight ? "placeholder:text-gray-400 text-gray-700" : "placeholder:text-white/50 text-white"}`}
                            />
                            <button type="submit" disabled={loading} className={`${isLight ? "text-gray-500 hover:text-gray-800" : "text-white/70 hover:text-white"} transition-colors`}>
                                <IoSearchOutline className="text-base" />
                            </button>
                        </form>
                    </li>
                )}

                <div className="flex items-center gap-4">
                    <SignedOut>
                        <SignInButton mode="modal">
                            <button className={`px-3 py-1 rounded border ${isLight ? "border-gray-400 text-gray-700 hover:bg-gray-100" : "border-white/50 hover:bg-white hover:text-black"} transition duration-300`}>
                                Sign In
                            </button>
                        </SignInButton>
                        <SignUpButton mode="modal">
                            <button className="px-3 py-1 rounded bg-yellow-500 text-black hover:bg-yellow-400 transition duration-300">
                                Sign Up
                            </button>
                        </SignUpButton>
                    </SignedOut>
                    <SignedIn>
                        <UserButton />
                    </SignedIn>
                </div>
            </ul>
        </div>
    );
}

export default Header;

const menus = [
    { label: "Home",          href: "/"             },
    { label: "Sobre Nosotros",href: "/about"        },
    { label: "Destinos",      href: "/destinations" },
    { label: "Blog",          href: "/blog"         },
    { label: "DiscoveryMap",  href: "/dashboard"    },
];
