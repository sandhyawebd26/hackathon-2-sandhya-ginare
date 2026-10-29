"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

type LandingParallaxBandProps = {
  imageSrc: string;
  imageAlt: string;
  kicker: string;
  title: string;
  minHeight?: string;
};

export function LandingParallaxBand({
  imageSrc,
  imageAlt,
  kicker,
  title,
  minHeight = "70vh",
}: LandingParallaxBandProps) {
  const ref = useRef<HTMLElement>(null);
  const [offset, setOffset] = useState(0);
  const [visible, setVisible] = useState(false);
  const [motionOk, setMotionOk] = useState(true);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setMotionOk(false);
      setVisible(true);
      return;
    }

    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    observer.observe(node);

    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const rect = node.getBoundingClientRect();
        const center = rect.top + rect.height / 2 - window.innerHeight / 2;
        setOffset(center * 0.06);
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <section ref={ref} className="relative mt-12 overflow-hidden text-[#f4efe6]" style={{ minHeight }}>
      <img
        src={imageSrc}
        alt={imageAlt}
        className="absolute inset-0 h-[115%] w-full object-cover will-change-transform"
        style={motionOk ? { transform: `translate3d(0, ${offset}px, 0)` } : undefined}
      />
      <div className="absolute inset-0 bg-black/45" />
      <div className="relative flex flex-col justify-end px-6 py-16 md:px-16" style={{ minHeight }}>
        <p
          className={cn(
            "landing-reveal text-[11px] uppercase tracking-[0.28em] text-[#d4bc8a]",
            visible && "landing-reveal-visible",
          )}
        >
          {kicker}
        </p>
        <p
          className={cn("landing-reveal display mt-4 max-w-3xl text-5xl leading-none md:text-7xl", visible && "landing-reveal-visible")}
          style={{ ["--reveal-delay" as string]: "120ms" }}
        >
          {title}
        </p>
      </div>
    </section>
  );
}
