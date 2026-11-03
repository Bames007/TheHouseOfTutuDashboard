"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { gothamOffice, italiana } from "@/app/utils/constants";
import {
  Home,
  Sparkles,
  AlertCircle,
  ChevronRight,
  RotateCw,
  Wine,
  Flower2,
} from "lucide-react";
import { useEffect, useState } from "react";

export default function NotFound() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isMounted, setIsMounted] = useState(false);
  const [circles, setCircles] = useState<
    Array<{
      id: number;
      width: number;
      height: number;
      left: number;
      top: number;
      opacityClass: string;
    }>
  >([]);

  useEffect(() => {
    setIsMounted(true);

    // Generate circles only on client side with fixed positions
    const generatedCircles = Array.from({ length: 12 }, (_, i) => ({
      id: i,
      // Use deterministic values based on index, not random
      width: 50 + ((i * 10) % 100),
      height: 50 + ((i * 15) % 100),
      left: (i * 8.33) % 100,
      top: (i * 7.5) % 100,
      opacityClass:
        i % 3 === 0
          ? "bg-white/10"
          : i % 3 === 1
          ? "bg-white/5"
          : "bg-white/15",
    }));
    setCircles(generatedCircles);

    const handleMouseMove = (e: MouseEvent) => {
      if (isMounted) {
        setMousePosition({ x: e.clientX, y: e.clientY });
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [isMounted]);

  const parallaxX = isMounted ? mousePosition.x * 0.01 : 0;
  const parallaxY = isMounted ? mousePosition.y * 0.01 : 0;

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#691C33]">
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("/logo-white.png")`,
            backgroundSize: "70%",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        />
      </div>

      {/* Animated Floating Elements - Only on client */}
      {isMounted && (
        <>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
            className="absolute top-1/4 left-10 w-64 h-64 md:w-80 md:h-80 opacity-10"
            style={{
              backgroundImage: `url("/logo-white.png")`,
              backgroundSize: "contain",
              backgroundRepeat: "no-repeat",
            }}
          />

          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
            className="absolute bottom-1/4 right-10 w-96 h-96 opacity-5"
            style={{
              backgroundImage: `url("/logo-white.png")`,
              backgroundSize: "contain",
              backgroundRepeat: "no-repeat",
            }}
          />
        </>
      )}

      {/* Parallax Background Effects - Only on client */}
      {isMounted && circles.length > 0 && (
        <motion.div
          style={{ x: parallaxX * 0.5, y: parallaxY * 0.5 }}
          className="absolute inset-0 pointer-events-none"
        >
          {circles.map((circle) => (
            <motion.div
              key={circle.id}
              animate={{
                y: [0, -30, 0],
                x: [0, Math.sin(circle.id) * 20, 0],
              }}
              transition={{
                duration: 3 + circle.id * 0.5,
                repeat: Infinity,
                delay: circle.id * 0.2,
              }}
              className={`absolute ${circle.opacityClass} rounded-full blur-sm`}
              style={{
                width: `${circle.width}px`,
                height: `${circle.height}px`,
                left: `${circle.left}%`,
                top: `${circle.top}%`,
              }}
            />
          ))}
        </motion.div>
      )}

      <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Main Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center lg:text-left"
          >
            {/* Error Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-2 rounded-full mb-6"
            >
              <AlertCircle className="w-4 h-4 text-white" />
              <span
                className={`text-sm font-semibold text-white tracking-wider ${gothamOffice.className}`}
              >
                PAGE NOT FOUND
              </span>
            </motion.div>

            {/* Main Error Number */}
            <motion.h1
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className={`text-9xl md:text-[12rem] font-black text-white leading-none mb-4 ${italiana.className}`}
              style={{ textShadow: "0 10px 30px rgba(0,0,0,0.3)" }}
            >
              404
            </motion.h1>

            {/* Subtitle */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mb-8"
            >
              <h2
                className={`text-3xl md:text-4xl font-bold text-white mb-4 ${italiana.className}`}
              >
                Scent Trail Interrupted
              </h2>
              <p
                className={`text-white/90 text-lg md:text-xl ${gothamOffice.className} font-light leading-relaxed`}
              >
                The fragrance you're looking for has evaporated into the digital
                ether. Perhaps you followed an old scent trail, or this page has
                been bottled elsewhere.
              </p>
            </motion.div>

            {/* Perfumery Metaphor */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 mb-8"
            >
              <div className="flex items-center justify-center lg:justify-start gap-3 mb-3">
                <Flower2 className="w-5 h-5 text-white/60" />
                <span
                  className={`text-sm text-white/80 ${gothamOffice.className}`}
                >
                  Perfumery Insight
                </span>
              </div>
              <p className="text-white/70 text-sm italic text-center lg:text-left">
                "Like a rare top note that dissipates too quickly, some pages
                are meant to be fleeting. Return to your masterpiece."
              </p>
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <Link href="/">
                <motion.button
                  whileHover={{
                    scale: 1.02,
                    boxShadow: "0 10px 30px -10px rgba(255,255,255,0.1)",
                  }}
                  whileTap={{ scale: 0.98 }}
                  className="bg-white text-[#691C33] px-6 py-3 rounded-full font-semibold text-lg flex items-center justify-center gap-3 w-full sm:w-auto hover:bg-white/95 transition-colors"
                >
                  <Home className="w-5 h-5" />
                  Return Home
                  <ChevronRight className="w-4 h-4" />
                </motion.button>
              </Link>

              <motion.button
                whileHover={{
                  scale: 1.02,
                  backgroundColor: "rgba(255,255,255,0.15)",
                }}
                whileTap={{ scale: 0.98 }}
                onClick={() => window.location.reload()}
                className="border border-white/30 text-white px-6 py-3 rounded-full font-semibold text-lg flex items-center justify-center gap-3 w-full sm:w-auto bg-white/10 backdrop-blur-sm hover:bg-white/15 transition-colors"
              >
                <RotateCw className="w-5 h-5" />
                Refresh Scent
              </motion.button>
            </motion.div>

            {/* Navigation Suggestions */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mt-8"
            >
              <p
                className={`text-white/60 text-sm mb-3 ${gothamOffice.className}`}
              >
                Suggested paths to rediscover:
              </p>
              <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
                {[
                  { label: "Masterclass", href: "/#home" },
                  { label: "Curriculum", href: "/#curriculum" },
                  { label: "Enrollment", href: "/#enrollment" },
                  { label: "Contact", href: "/contact" },
                ].map((item) => (
                  <Link key={item.label} href={item.href}>
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-white text-sm transition-colors"
                    >
                      {item.label}
                    </motion.div>
                  </Link>
                ))}
              </div>
            </motion.div>
          </motion.div>

          {/* Right Column - Visual */}
          <motion.div
            initial={{ opacity: 0, x: 30, rotate: -5 }}
            animate={{ opacity: 1, x: 0, rotate: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="relative"
          >
            {/* Broken Bottle Illustration */}
            <div className="relative max-w-lg mx-auto">
              {/* Perfume Bottle Base */}
              <div className="relative">
                {/* Bottle Shadow */}
                <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 w-48 h-6 bg-black/20 blur-xl rounded-full" />

                {/* Main Bottle */}
                <div className="relative w-64 h-80 mx-auto">
                  {/* Bottle Glass */}
                  <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-white/5 backdrop-blur-sm rounded-t-3xl rounded-b-lg border border-white/30" />

                  {/* Liquid (Fading) */}
                  <motion.div
                    animate={{ height: ["60%", "40%", "60%"] }}
                    transition={{ duration: 8, repeat: Infinity }}
                    className="absolute bottom-0 left-1/4 w-1/2 bg-gradient-to-t from-[#691C33]/60 to-[#691C33]/30 rounded-b-lg"
                  />

                  {/* Crack Effect */}
                  <div className="absolute inset-0">
                    {[...Array(3)].map((_, i) => (
                      <motion.div
                        key={i}
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 2, delay: i * 0.3 }}
                        className="absolute left-1/2"
                        style={{
                          width: "2px",
                          height: "60%",
                          backgroundColor: "rgba(255,255,255,0.6)",
                          transform: `translateX(-50%) rotate(${i * 15}deg)`,
                          filter: "blur(1px)",
                        }}
                      />
                    ))}
                  </div>

                  {/* Broken Pieces - Only on client */}
                  {isMounted &&
                    [...Array(5)].map((_, i) => (
                      <motion.div
                        key={i}
                        animate={{
                          y: [0, -20, 0],
                          rotate: [0, 180, 360],
                        }}
                        transition={{
                          duration: 3 + i,
                          repeat: Infinity,
                          delay: i * 0.5,
                        }}
                        className={`absolute w-10 h-10 ${
                          i % 2 === 0 ? "bg-white/20" : "bg-[#691C33]/40"
                        } rounded-full border border-white/30 backdrop-blur-sm`}
                        style={{
                          left: `${20 + i * 15}%`,
                          top: `${30 + i * 10}%`,
                        }}
                      />
                    ))}
                </div>

                {/* Cap */}
                <motion.div
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute -top-8 left-1/2 transform -translate-x-1/2 w-16 h-8 bg-gradient-to-b from-gray-300 to-gray-400 rounded-t-lg"
                />

                {/* Evaporating Scent Lines - Only on client */}
                {isMounted && (
                  <div className="absolute -top-20 left-1/2 transform -translate-x-1/2">
                    {[...Array(5)].map((_, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 0 }}
                        animate={{ opacity: [0, 1, 0], y: -50 }}
                        transition={{
                          duration: 3,
                          repeat: Infinity,
                          delay: i * 0.6,
                        }}
                        className="absolute w-px h-12 bg-gradient-to-t from-white/30 to-transparent"
                        style={{
                          left: `${i * 10 - 20}px`,
                          rotate: `${i * 10}deg`,
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Floating Accent Icons - Only on client */}
              {isMounted && (
                <>
                  <motion.div
                    animate={{ rotate: 360, y: [0, -20, 0] }}
                    transition={{ duration: 8, repeat: Infinity }}
                    className="absolute -top-10 -right-10 w-16 h-16 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl flex items-center justify-center"
                  >
                    <Sparkles className="w-8 h-8 text-white" />
                  </motion.div>

                  <motion.div
                    animate={{ rotate: -360, y: [0, 20, 0] }}
                    transition={{ duration: 10, repeat: Infinity }}
                    className="absolute -bottom-5 -left-5 w-12 h-12 bg-[#691C33]/30 backdrop-blur-sm border border-white/20 rounded-xl flex items-center justify-center"
                  >
                    <Wine className="w-6 h-6 text-white" />
                  </motion.div>
                </>
              )}

              {/* Error Code Detail */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8 }}
                className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 text-center"
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-white/60 animate-pulse" />
                  <span
                    className={`text-white/80 text-sm ${gothamOffice.className}`}
                  >
                    ERROR: 404 • PAGE_NOT_FOUND • SCENT_LOST
                  </span>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Footer Note */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-center"
      >
        <p className={`text-white/40 text-xs ${gothamOffice.className}`}>
          © {new Date().getFullYear()} The Perfumery Academy • Every scent tells
          a story
        </p>
      </motion.div>
    </div>
  );
}
