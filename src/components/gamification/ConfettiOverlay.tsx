'use client';
import { useState, useEffect, useRef } from 'react';
import ReactConfetti from 'react-confetti';

interface ConfettiOverlayProps {
  trigger: boolean;
  duration?: number;
}

export function ConfettiOverlay({ trigger, duration = 4000 }: ConfettiOverlayProps) {
  const [show, setShow] = useState(false);
  const prevTrigger = useRef(false);

  useEffect(() => {
    if (trigger && !prevTrigger.current) {
      setShow(true);
    }
    prevTrigger.current = trigger;
  }, [trigger]);

  useEffect(() => {
    if (!show) return;
    const timer = setTimeout(() => setShow(false), duration);
    return () => clearTimeout(timer);
  }, [show, duration]);

  if (!show) return null;

  return (
    <ReactConfetti
      width={typeof window !== 'undefined' ? window.innerWidth : 0}
      height={typeof window !== 'undefined' ? window.innerHeight : 0}
      recycle={false}
      numberOfPieces={200}
      colors={['#6366f1', '#a855f7', '#22d3ee', '#4ade80', '#facc15']}
    />
  );
}
