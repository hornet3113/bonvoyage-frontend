"use client";
import { Barlow_Condensed } from "next/font/google";
import { AnimatePresence } from "motion/react";
import React from "react";
import BackgroundImage from "@/app/components/BackgroundImage";
import Slides from "@/app/components/Slides";
import SlideInfo from "@/app/components/SlideInfo";
import Controls from "@/app/components/Controls";
import Header from "@/app/components/Header";
import { Data, CurrentSlideData } from "@/app/page";

const barlow = Barlow_Condensed({ subsets: ["latin"], weight: ["400", "700", "800"] });

const sliderData: Data[] = [
  {
    img: "/images/slide1.jpg",
    category: "Turquía · Puente entre Continentes",
    title: "Estambul",
    description:
      "Explora la magia de la antigua Constantinopla. Desde los intrincados mosaicos de Santa Sofía hasta el bullicio del Gran Bazar, vive una experiencia donde el oriente se encuentra con el occidente.",
    location: "Turquía · Europa & Asia",
  },
  {
    img: "/images/slide2.jpg",
    category: "Reino Unido · El Corazón del Támesis",
    title: "Londres",
    description:
      "Camina por la historia viva entre el Big Ben y el London Eye. Desde la elegancia de Notting Hill hasta la vanguardia de Shoreditch, Londres ofrece una mezcla perfecta de tradición real y cultura moderna.",
    location: "Reino Unido · Europa",
  },
  {
    img: "/images/slide3.png",
    category: "Emiratos Árabes · El Lujo del Futuro",
    title: "Dubai",
    description:
      "Admira el horizonte más futurista del mundo desde la cima del Burj Khalifa. Sumérgete en el lujo infinito de sus islas artificiales o vive la adrenalina de un safari por las dunas doradas del desierto.",
    location: "Emiratos Árabes · Medio Oriente",
  },
  {
    img: "/images/slide4.jpg",
    category: "Francia · La Ciudad de la Luz",
    title: "París",
    description:
      "Déjate seducir por el encanto de Montmartre y la majestuosidad de la Torre Eiffel. Disfruta de una tarde en los jardines de las Tullerías y descubre por qué París sigue siendo la capital mundial del arte y el romance.",
    location: "Francia · Europa",
  },
  {
    img: "/images/slide5.jpg",
    category: "España · Arte y Mediterráneo",
    title: "Barcelona",
    description:
      "Descubre el universo surrealista de Gaudí en la Sagrada Familia y el Park Güell. Pierde la noción del tiempo en las calles del Barrio Gótico y termina el día disfrutando de la brisa marina en la Barceloneta.",
    location: "España · Mediterráneo",
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
    <main className={`${barlow.className} select-none antialiased`}>
      <section className="relative h-screen overflow-hidden bg-black text-white">
        <AnimatePresence>
          <BackgroundImage
            key="background"
            transitionData={transitionData}
            currentSlideData={currentSlideData}
          />
          {/* Gradient lateral para legibilidad del texto */}
          <div className="absolute inset-0 z-10 bg-gradient-to-r from-black/70 via-black/20 to-transparent" />

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
