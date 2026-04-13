import { Righteous } from "next/font/google";
import HeroSection from "@/app/components/HeroSection";
import HowItWorksSection from "@/app/components/HowItWorksSection";
import ProblemSection from "@/app/components/ProblemSection";
import AboutUsSection from "@/app/components/AboutUsSection";
import FeaturesSection from "@/app/components/FeaturesSection";
import CTASection from "@/app/components/CTASection";
import Footer from "@/app/components/Footer";

const righteous = Righteous({ subsets: ["latin"], weight: ["400"] });

export type Data = {
  img: string;
  title: string;
  description: string;
  location: string;
  category?: string;
  country?: string;
  lat?: number;
  lng?: number;
};

export type CurrentSlideData = {
  data: Data;
  index: number;
};

export default function Home() {
  return (
    <main className={`${righteous.className} select-none antialiased`}>
      <HeroSection />
      <HowItWorksSection />
      <ProblemSection />
      <FeaturesSection />
      <AboutUsSection />
      <CTASection />
      <Footer />
    </main>
  );
}