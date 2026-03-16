import { Righteous } from "next/font/google";
import HeroSection from "@/app/components/HeroSection";
import ProblemSection from "@/app/components/ProblemSection";

const righteous = Righteous({ subsets: ["latin"], weight: ["400"] });

export type Data = {
  img: string;
  title: string;
  description: string;
  location: string;
};

export type CurrentSlideData = {
  data: Data;
  index: number;
};

export default function Home() {
  return (
    <main className={`${righteous.className} select-none antialiased`}>
      <HeroSection />
      <ProblemSection />
    </main>
  );
}