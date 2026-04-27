"use client";

import { useScroll, useTransform, motion } from "framer-motion";
import { useRef } from "react";
import Image from "next/image";

export function ZoomGallery() {
  const container = useRef(null);
  const { scrollYProgress } = useScroll({
    target: container,
    offset: ["start start", "end end"],
  });

  const scale1 = useTransform(scrollYProgress, [0, 1], [1.2, 1]);
  const scale2 = useTransform(scrollYProgress, [0, 1], [1.3, 1]);
  const scale3 = useTransform(scrollYProgress, [0, 1], [1.1, 1]);

  const y1 = useTransform(scrollYProgress, [0, 1], ["0vh", "0vh"]); // Center stays
  const y2 = useTransform(scrollYProgress, [0, 1], ["20vh", "-10vh"]); // Moves up faster
  const y3 = useTransform(scrollYProgress, [0, 1], ["30vh", "-20vh"]);
  const y4 = useTransform(scrollYProgress, [0, 1], ["10vh", "-5vh"]);

  const pictures = [
    {
      src: "https://images.unsplash.com/photo-1552611052-33e04de081de?q=80&w=1000&auto=format&fit=crop",
      scale: scale1,
      y: y1,
      rotate: -5,
      className: "opacity-40 md:opacity-100", // Center background image (dimmed to allow text to pop)
      pos: { width: "28vw", height: "35vh", top: "30vh", left: "36vw" },
    },
    {
      src: "https://images.unsplash.com/photo-1563245372-f21724e3856d?q=80&w=1000&auto=format&fit=crop",
      scale: scale2,
      y: y2,
      rotate: -12,
      className: "",
      pos: { width: "25vw", height: "40vh", top: "15vh", left: "8vw" }, // Top Left
    },
    {
      src: "https://images.unsplash.com/photo-1541696432-82c6da8ce7bf?q=80&w=1000&auto=format&fit=crop",
      scale: scale3,
      y: y3,
      rotate: 15,
      className: "",
      pos: { width: "24vw", height: "35vh", top: "20vh", right: "8vw" }, // Top Right
    },
    {
      src: "https://images.unsplash.com/photo-1585032226651-759b368d7246?q=80&w=1000&auto=format&fit=crop",
      scale: scale2,
      y: y4,
      rotate: 8,
      className: "",
      pos: { width: "22vw", height: "30vh", bottom: "15vh", left: "15vw" }, // Bottom Left
    },
    {
      src: "https://images.unsplash.com/photo-1555126634-323283e090fa?q=80&w=1000&auto=format&fit=crop",
      scale: scale3,
      y: y2,
      rotate: -8,
      className: "",
      pos: { width: "26vw", height: "32vh", bottom: "10vh", right: "12vw" }, // Bottom Right
    },
  ];

  return (
    <div ref={container} className="h-[250vh] relative">
      <div className="sticky top-0 h-screen overflow-hidden flex items-center justify-center bg-[var(--mm-ink)]">

        {/* Gallery Images */}
        <div className="w-full h-full absolute top-0 left-0 pointer-events-none z-10">
          <div className="w-full h-full relative">
            {pictures.map(({ src, scale, y, rotate, className, pos }, index) => {
              return (
                <motion.div
                  key={index}
                  style={{ scale, y, rotate, ...pos }}
                  className={`absolute flex items-center justify-center ${className}`}
                >
                  <div className="relative w-full h-full overflow-hidden rounded-2xl">
                    <Image
                      src={src}
                      fill
                      alt="Gallery image"
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-black/20" />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Central Text Content */}
        <motion.div
          style={{ opacity: useTransform(scrollYProgress, [0.3, 0.6], [0, 1]), scale: useTransform(scrollYProgress, [0.3, 0.6], [0.8, 1]) }}
          className="absolute z-50 flex flex-col items-center justify-center text-center max-w-2xl px-6 pointer-events-none"
        >
          <span className="text-xs uppercase tracking-[0.4em] text-[var(--mm-tan)] mb-4 drop-shadow-md">
            The Experience
          </span>
          <h2 className="font-display text-4xl md:text-6xl text-white mb-6 drop-shadow-2xl">
            A Symphony of Fire & Spice
          </h2>
          <p className="text-lg text-white/90 drop-shadow-lg font-medium max-w-xl mx-auto">
            Step into a world where culinary tradition meets theatrical presentation.
            Every dish is not just a meal, but a meticulously choreographed performance
            of flavor, aroma, and sound.
          </p>
        </motion.div>

      </div>
    </div>
  );
}
