"use client";
import { Righteous } from "next/font/google";
import { AnimatePresence } from "motion/react";
import React from "react";
import BackgroundImage from "@/app/components/BackgroundImage";
import Slides from "@/app/components/Slides";
import SlideInfo from "@/app/components/SlideInfo";
import Controls from "@/app/components/Controls";
import Header from "@/app/components/Header";
import { Data, CurrentSlideData } from "@/app/page";

const inter = Righteous({ subsets: ["latin"], weight: ["400"] });

const sliderData: Data[] = [
  {
    img: "/images/slide1.jpg",
    title: "Explora el mundo con nosotros",
    description: "Descubre lugares increíbles con nuestra experiencia de viaje personalizada.",
    location: "Mundo",
  },
  {
    img: "/images/slide2.jpg",
    title: "Explora bellos lugares",
    description: "probando textos para ver el slideje personalizada.",
    location: "Milan",
  },
  {
    img: "/images/slide3.png",
    title: "Probando contenido",
    description: "Prieba viajar con nosotro.",
    location: "Colombia",
  },
  {
    img: "/images/slide4.jpg",
    title: "Explora paisajes con nosotros",
    description: "Desconectate ya no me sale.",
    location: "Mexico",
  },
  {
    img: "/images/slide5.jpg",
    title: "Me quiero dar de baja",
    description: "Porque no se parece al tutorial.",
    location: "Tokio",
  },
];

const initData = sliderData[0];

export default function DestinationsPage() {
  const [data, setData] = React.useState<Data[]>(sliderData.slice(1));
  const [transitionData, setTransitionData] = React.useState<Data>(sliderData[0]);
  const [currentSlideData, setCurrentSlideData] = React.useState<CurrentSlideData>({
    data: initData,
    index: 0,
  });

  return (
    <main className={`${inter.className} select-none antialiased`}>
      <section className="relative h-screen overflow-hidden bg-black text-white">
        <AnimatePresence>
          <BackgroundImage
            key="background"
            transitionData={transitionData}
            currentSlideData={currentSlideData}
          />
          <div key="content" className="absolute top-0 left-0 z-20 h-full w-full">
            <Header />
            <div className="flex h-full w-full grid-cols-10 flex-col pt-20 md:grid md:pt-16">
              <div className="col-span-4 mb-3 flex h-full flex-1 flex-col justify-end px-5 md:mb-0 md:justify-center md:px-10">
                <SlideInfo
                  transitionData={transitionData}
                  currentSlideData={currentSlideData}
                />
              </div>
              <div className="col-span-6 flex h-full flex-1 flex-col justify-start p-4 md:justify-center md:p-10">
                <Slides data={data} />
                <Controls
                  currentSlideData={currentSlideData}
                  data={data}
                  transitionData={transitionData}
                  initData={initData}
                  handleData={setData}
                  handleTransitionData={setTransitionData}
                  handleCurrentSlideData={setCurrentSlideData}
                  sliderData={sliderData}
                />
              </div>
            </div>
          </div>
        </AnimatePresence>
      </section>
    </main>
  );
}
