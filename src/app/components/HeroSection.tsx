"use client";

import React from "react";
import { AnimatePresence, motion, useScroll, useTransform } from "motion/react";
import BackgroundImage from "./BackgroundImage";
import Slides from "./Slides";
import SlideInfo from "./SlideInfo";
import Controls from "./Controls";
import Header from "./Header";
import { Data, CurrentSlideData } from "@/app/page";

const sliderData: Data[] = [
  {
    img: "/images/slide1.png",
    category: "Turquía · Puente entre Continentes",
    title: "Estambul",
    description:
      "Explora la magia de la antigua Constantinopla. Desde los intrincados mosaicos de Santa Sofía hasta el bullicio del Gran Bazar, vive una experiencia donde el oriente se encuentra con el occidente.",
    location: "Turquía · Europa & Asia",
    country: "Turquía",
    lat: 41.0082,
    lng: 28.9784,
  },
  {
    img: "/images/slide2.png",
    category: "Reino Unido · El Corazón del Támesis",
    title: "Londres",
    description:
      "Camina por la historia viva entre el Big Ben y el London Eye. Desde la elegancia de Notting Hill hasta la vanguardia de Shoreditch, Londres ofrece una mezcla perfecta de tradición real y cultura moderna.",
    location: "Reino Unido · Europa",
    country: "Reino Unido",
    lat: 51.5074,
    lng: -0.1278,
  },
  {
    img: "/images/slide3.png",
    category: "Emiratos Árabes · El Lujo del Futuro",
    title: "Dubai",
    description:
      "Admira el horizonte más futurista del mundo desde la cima del Burj Khalifa. Sumérgete en el lujo infinito de sus islas artificiales o vive la adrenalina de un safari por las dunas doradas del desierto.",
    location: "Emiratos Árabes · Medio Oriente",
    country: "Emiratos Árabes",
    lat: 25.2048,
    lng: 55.2708,
  },
  {
    img: "/images/slide4.png",
    category: "Francia · La Ciudad de la Luz",
    title: "París",
    description:
      "Déjate seducir por el encanto de Montmartre y la majestuosidad de la Torre Eiffel. Disfruta de una tarde en los jardines de las Tullerías y descubre por qué París sigue siendo la capital mundial del arte y el romance.",
    location: "Francia · Europa",
    country: "Francia",
    lat: 48.8566,
    lng: 2.3522,
  },
  {
    img: "/images/slide5.png",
    category: "España · Arte y Mediterráneo",
    title: "Barcelona",
    description:
      "Descubre el universo surrealista de Gaudí en la Sagrada Familia y el Park Güell. Pierde la noción del tiempo en las calles del Barrio Gótico y termina el día disfrutando de la brisa marina en la Barceloneta.",
    location: "España · Mediterráneo",
    country: "España",
    lat: 41.3851,
    lng: 2.1734,
  },
];

const initData = sliderData[0];

export default function HeroSection() {
  const [data, setData] = React.useState<Data[]>(sliderData.slice(1));
  const [transitionData, setTransitionData] = React.useState<Data>(sliderData[0]);
  const [currentSlideData, setCurrentSlideData] = React.useState<CurrentSlideData>({
    data: initData,
    index: 0,
  });

  // Parallax: background drifts down slower than scroll speed
  const { scrollY } = useScroll();
  const bgY = useTransform(scrollY, [0, 700], [0, 120]);

  return (
    <section className="relative h-screen overflow-hidden bg-black text-white">
      {/* Parallax background layer — moves at ~17% of scroll speed */}
      <motion.div
        style={{ y: bgY }}
        className="absolute -top-[80px] bottom-[-80px] left-0 right-0 z-0 will-change-transform"
      >
        <AnimatePresence>
          <BackgroundImage
            key="background"
            transitionData={transitionData}
            currentSlideData={currentSlideData}
          />
        </AnimatePresence>
      </motion.div>

      {/* Gradient lateral para legibilidad */}
      <div className="absolute inset-0 z-10 bg-gradient-to-r from-black/70 via-black/20 to-transparent" />

      {/* Contenido fijo — no se mueve con el parallax */}
      <div className="absolute top-0 left-0 z-20 h-full w-full">
        <Header />
        <div className="flex h-full w-full grid-cols-10 flex-col pt-20 md:grid md:pt-16">
          {/* Left — info del destino activo */}
          <div className="col-span-4 mb-3 flex h-full flex-1 flex-col justify-end px-5 md:mb-0 md:justify-center md:px-10">
            <SlideInfo
              transitionData={transitionData}
              currentSlideData={currentSlideData}
            />
          </div>

          {/* Right — cards del slider + controles */}
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
    </section>
  );
}
