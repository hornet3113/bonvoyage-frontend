"use client";
import { useState } from "react";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { IoMdBookmark } from "react-icons/io";
import { IoCheckmarkOutline } from "react-icons/io5";
import OtherInfo from "./OtherInfo";
import { Data, CurrentSlideData } from "@/app/page";
import { createApiClient } from "@/lib/api";

type Props = {
    transitionData: Data;
    currentSlideData: CurrentSlideData;
};

function SlideInfo({ transitionData, currentSlideData }: Props) {
    const router = useRouter();
    const { getToken } = useAuth();
    const [saved, setSaved] = useState(false);

    const activeData = transitionData ? transitionData : currentSlideData.data;

    const handleAddToWishlist = async () => {
        const api = createApiClient(getToken);
        try {
            await api.post("/api/v1/wishlist", {
                city: activeData.title,
                country: activeData.country ?? activeData.location,
            });
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch {
            // silent fail
        }
    };

    const handleCreateTrip = () => {
        const params = new URLSearchParams({
            fromWishlist: "1",
            city: activeData.title,
            country: activeData.country ?? "",
            lat: String(activeData.lat ?? ""),
            lng: String(activeData.lng ?? ""),
        });
        router.push(`/dashboard?${params.toString()}`);
    };

    return (
        <>
            <motion.span layout className="mb-2 h-1 w-5 rounded-full bg-white" />
            <OtherInfo data={activeData} />
            <motion.div layout className="mt-6 flex items-center gap-3">

                {/* Botón wishlist con tooltip */}
                <div className="group relative">
                    <button
                        onClick={handleAddToWishlist}
                        className={`flex h-[41px] w-[41px] items-center justify-center rounded-full transition duration-300 ease-in-out hover:opacity-80 ${
                            saved ? "bg-green-500" : "bg-cyan-500"
                        }`}
                    >
                        {saved
                            ? <IoCheckmarkOutline className="text-lg text-white" />
                            : <IoMdBookmark className="text-lg" />
                        }
                    </button>
                    <span className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded bg-black/80 px-2 py-1 text-[10px] text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                        Añadir a wishlist
                    </span>
                </div>

                {/* Botón crear viaje */}
                <button
                    onClick={handleCreateTrip}
                    className="w-fit rounded-full border-[1px] border-[#ffffff8f] px-6 py-3 text-[10px] font-thin uppercase tracking-widest transition duration-300 ease-in-out hover:bg-white hover:text-black"
                >
                    Crear viaje
                </button>

            </motion.div>
        </>
    );
}

export default SlideInfo;
