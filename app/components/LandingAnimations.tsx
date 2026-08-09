"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

export default function LandingAnimations() {
  useGSAP(() => {
    // Only animate if the user hasn't requested reduced motion
    const mm = gsap.matchMedia();

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      // 1. Hero fade and slide up
      gsap.from(".hero h1, .hero p, .hero .hero-actions", {
        y: 40,
        opacity: 0,
        duration: 0.8,
        stagger: 0.2,
        ease: "power3.out",
        delay: 0.1,
      });

      // 2. Sections fade and slide up on scroll
      const sections = gsap.utils.toArray(".section");
      sections.forEach((section: any) => {
        gsap.from(section, {
          y: 60,
          opacity: 0,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: {
            trigger: section,
            start: "top 85%",
          },
        });
      });

      // 3. Pricing tiers stagger in on scroll
      const tiers = gsap.utils.toArray(".ptier");
      if (tiers.length > 0) {
        gsap.from(tiers, {
          y: 40,
          opacity: 0,
          duration: 0.6,
          stagger: 0.2,
          ease: "power2.out",
          scrollTrigger: {
            trigger: tiers[0] as HTMLElement,
            start: "top 85%",
          },
        });
      }
    });

    return () => mm.revert(); // clean up
  }, []);

  return null;
}
