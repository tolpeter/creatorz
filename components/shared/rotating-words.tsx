"use client";

import { useEffect, useState } from "react";

/**
 * Végtelenített, slideshow-jellegű szó-váltó a hero főcímhez.
 * A megadott szavakat ciklikusan váltogatja finom fel-úszó + halványuló
 * animációval. A `key` újra-mountolja az elemet, így minden váltáskor
 * lejátszódik a belépő animáció.
 */
export function RotatingWords({
  words,
  className = "",
  interval = 2200,
}: {
  words: string[];
  className?: string;
  interval?: number;
}) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (words.length <= 1) return;
    const t = setInterval(
      () => setIndex((prev) => (prev + 1) % words.length),
      interval,
    );
    return () => clearInterval(t);
  }, [words.length, interval]);

  return (
    <span className="block">
      <span key={index} className={`animate-word-in inline-block ${className}`}>
        {words[index]}
      </span>
    </span>
  );
}
