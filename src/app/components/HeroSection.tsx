import Image from "next/image";
import Link from "next/link";
import Header from "@/app/components/Header";

export default function HeroSection() {
    return (
        <section className="relative h-screen w-full overflow-hidden">
            <Image
                src="/images/slide1.jpg"
                alt="Hero background"
                fill
                className="object-cover"
                priority
            />
            <div className="absolute inset-0 bg-black/45" />

            <div className="relative z-10 flex h-full flex-col">
                <Header />

                <div className="flex flex-1 flex-col items-center justify-center gap-8 px-4 text-center text-white">
                    <h1 className="max-w-3xl text-5xl font-bold leading-tight md:text-6xl lg:text-7xl">
                        Planifica tu viaje en un solo lugar
                    </h1>

                    <div className="flex flex-wrap items-center justify-center gap-4">
                        <Link href="/dashboard">
                            <button className="rounded-full bg-yellow-500 px-8 py-3 text-sm font-medium text-black transition duration-300 ease-in-out hover:opacity-80">
                                Crear viaje
                            </button>
                        </Link>
                        <button className="w-fit rounded-full border-[1px] border-[#ffffff8f] px-8 py-3 text-sm font-thin transition duration-300 ease-in-out hover:bg-white hover:text-black">
                            Ver cómo funciona
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
}
