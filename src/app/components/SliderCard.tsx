import { motion } from "motion/react";

type Props = {
    data: any;
};

function SliderCard({ data }: Props) {
    return (
        <motion.div
            className="relative h-64 min-w-[185px] overflow-hidden rounded-2xl shadow-md md:h-[400px] md:min-w-[200px]"
            layout
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1, transition: { duration: 0.4 } }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: "spring", damping: 20, stiffness: 100 }}
        >
            <motion.img
                layoutId={data.img}
                alt="Transition Image"
                src={data.img}
                className="absolute h-full w-full object-cover"
            />
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

            <motion.div className="absolute z-10 flex h-full flex-col justify-end p-4">
                <motion.div layout className="mb-2 h-[2px] w-3 rounded-full bg-white" />
                <motion.p layoutId={data.location} className="mb-1 text-[10px] uppercase tracking-widest text-white/60">
                    {data.location}
                </motion.p>
                <motion.h1
                    layoutId={data.title}
                    className="text-2xl font-black uppercase leading-tight text-white md:text-3xl"
                >
                    {data.title}
                </motion.h1>
            </motion.div>
        </motion.div>
    );
}

export default SliderCard;
