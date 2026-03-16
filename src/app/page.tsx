import HeroSection from "@/app/components/HeroSection";
import ProblemSection from "@/app/components/ProblemSection";

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
    <main className="select-none antialiased">
      <HeroSection />
      <ProblemSection />
    </main>
  );
}