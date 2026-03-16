"use client";
import { motion } from "motion/react";
import Link from "next/link";
import { IoMdBookmark } from "react-icons/io";
import OtherInfo from "./OtherInfo";
import { Data, CurrentSlideData } from "@/app/page";

type Props = {
    transitionData: Data;
    currentSlideData: CurrentSlideData;
};

function SlideInfo({ transitionData, currentSlideData }: Props) {
    return (
        <>
            <motion.span layout className="mb-2 h-1 w-5 rounded-full bg-white" />
            <OtherInfo data={transitionData ? transitionData : currentSlideData.data} />
            <motion.div layout className="mt-6 flex items-center gap-3">
                <button className="flex h-[41px] w-[41px] items-center justify-center rounded-full bg-yellow-500 text-xs transition duration-300 ease-in-out hover:opacity-80">
                    <IoMdBookmark className="text-lg" />
                </button>
                <Link href="/dashboard">
                    <button className="w-fit rounded-full border-[1px] border-[#ffffff8f] px-6 py-3 text-[10px] font-thin uppercase tracking-widest transition duration-300 ease-in-out hover:bg-white hover:text-black">
                        Crear viaje
                    </button>
                </Link>
            </motion.div>
        </>
    );
}

export default SlideInfo;
