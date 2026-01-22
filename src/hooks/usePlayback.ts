import { useState, useEffect, useRef, useCallback } from 'react';

interface UsePlaybackProps {
  duration: number; // Total duration in seconds
  initialSpeed?: number;
}

export const usePlayback = ({ duration, initialSpeed = 1 }: UsePlaybackProps) => {
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(initialSpeed);
  
  const requestRef = useRef<number | null>(null);
  const previousTimeRef = useRef<number | null>(null);
  
  // Use a ref for the animate callback to handle recursion without circular dependencies
  const animateRef = useRef<(time: number) => void>();

  const animate = useCallback((time: number) => {
    if (previousTimeRef.current !== undefined && previousTimeRef.current !== null) {
      const deltaTime = (time - previousTimeRef.current) / 1000; // ms to seconds
      
      setCurrentTime((prevTime) => {
        const nextTime = prevTime + deltaTime * speed;
        if (nextTime >= duration) {
          setIsPlaying(false);
          return duration;
        }
        return nextTime;
      });
    }
    previousTimeRef.current = time;
    
    if (isPlaying && animateRef.current) {
      requestRef.current = requestAnimationFrame(animateRef.current);
    }
  }, [duration, isPlaying, speed]);

  // Update ref
  useEffect(() => {
    animateRef.current = animate;
  }, [animate]);

  useEffect(() => {
    if (isPlaying && animateRef.current) {
      requestRef.current = requestAnimationFrame(animateRef.current);
    } else {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
      previousTimeRef.current = null;
    }

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [isPlaying]);

  const togglePlay = () => setIsPlaying((p) => !p);
  const seek = (time: number) => {
    setCurrentTime(time);
    previousTimeRef.current = null; // Reset delta tracking
  };

  return {
    currentTime,
    isPlaying,
    speed,
    togglePlay,
    setSpeed,
    seek,
  };
};