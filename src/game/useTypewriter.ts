import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export function useTypewriter(text: string, onTypeTick: () => void) {
  const [visibleCount, setVisibleCount] = useState(0);
  const [startedAt, setStartedAt] = useState(() => performance.now());
  const lastTickGroup = useRef(0);
  const tickRef = useRef(onTypeTick);
  tickRef.current = onTypeTick;
  const deadlines = useMemo(() => {
    let elapsed = 0;
    return Array.from(text, (character) => {
      elapsed += 18;
      if (".,;:!?".includes(character)) elapsed += 65;
      else if (character === "\n") elapsed += 100;
      return elapsed;
    });
  }, [text]);

  useEffect(() => {
    setStartedAt(performance.now());
    setVisibleCount(0);
    lastTickGroup.current = 0;
  }, [text]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const elapsed = Math.max(0, performance.now() - startedAt);
      let visible = 0;
      while (visible < deadlines.length && deadlines[visible]! <= elapsed) visible += 1;
      setVisibleCount((current) => Math.max(current, visible));
      const partial = text.slice(0, visible);
      const eligible = Array.from(partial).filter(
        (character) => !/[ \n\t.,;:!?]/.test(character),
      ).length;
      const group = Math.floor(eligible / 3);
      if (group > lastTickGroup.current) {
        lastTickGroup.current = group;
        tickRef.current();
      }
      if (visible === text.length) window.clearInterval(timer);
    }, 16);
    return () => window.clearInterval(timer);
  }, [deadlines, startedAt, text]);

  const revealAll = useCallback(() => {
    setVisibleCount(text.length);
    lastTickGroup.current = Math.floor(
      Array.from(text).filter((character) => !/[ \n\t.,;:!?]/.test(character)).length / 3,
    );
  }, [text]);

  return {
    visibleText: text.slice(0, visibleCount),
    isComplete: visibleCount === text.length,
    revealAll,
  };
}
