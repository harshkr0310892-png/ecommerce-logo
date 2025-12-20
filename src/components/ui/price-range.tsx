"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface PriceRangeProps {
  min?: number;
  max?: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
  className?: string;
}

export function PriceRange({
  min = 100,
  max = 10000,
  value: [minVal, maxVal],
  onChange,
  className,
}: PriceRangeProps) {
  const [localMin, setLocalMin] = useState(minVal);
  const [localMax, setLocalMax] = useState(maxVal);
  const [isDragging, setIsDragging] = useState(false);

  // Update local state when props change
  useEffect(() => {
    if (!isDragging) {
      setLocalMin(minVal);
      setLocalMax(maxVal);
    }
  }, [minVal, maxVal, isDragging]);

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value === '' ? min : Math.min(Number(e.target.value), localMax - 100);
    setLocalMin(value);
    if (e.target.value !== '') {
      onChange([value, localMax]);
    }
  };

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value === '' ? max : Math.max(Number(e.target.value), localMin + 100);
    setLocalMax(value);
    if (e.target.value !== '') {
      onChange([localMin, value]);
    }
  };

  const handleMinInputBlur = () => {
    if (localMin < min) {
      const newMin = min;
      setLocalMin(newMin);
      onChange([newMin, localMax]);
    } else {
      onChange([localMin, localMax]);
    }
  };

  const handleMaxInputBlur = () => {
    if (localMax > max) {
      const newMax = max;
      setLocalMax(newMax);
      onChange([localMin, newMax]);
    } else {
      onChange([localMin, localMax]);
    }
  };

  const handleMinRangeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (value <= localMax - 100) {
      setLocalMin(value);
      onChange([value, localMax]);
    }
  };

  const handleMaxRangeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (value >= localMin + 100) {
      setLocalMax(value);
      onChange([localMin, value]);
    }
  };

  const minPercent = ((localMin - min) / (max - min)) * 100;
  const maxPercent = ((localMax - min) / (max - min)) * 100;

  return (
    <div className={cn("w-full space-y-6", className)}>
      <div className="text-center text-lg font-bold text-foreground transition-all duration-200">
        ₹{localMin.toLocaleString()} - ₹{localMax.toLocaleString()}
      </div>

      <div className="relative h-1.5 w-full rounded-full bg-[#303030]">
        <div 
          className="absolute h-full rounded-full bg-gradient-to-r from-[#ffd500] to-[#ff9a00] transition-all duration-200"
          style={{
            left: `${minPercent}%`,
            width: `${maxPercent - minPercent}%`,
          }}
        />
        
        <input
          type="range"
          min={min}
          max={max}
          value={localMin}
          onChange={handleMinRangeChange}
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={() => {
            setIsDragging(false);
            onChange([localMin, localMax]);
          }}
          className="absolute top-1/2 h-0 w-full -translate-y-1/2 cursor-pointer appearance-none bg-transparent [&::-webkit-slider-thumb]:relative [&::-webkit-slider-thumb]:z-10 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#ffd500] [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(255,213,0,0.5)] [&::-webkit-slider-thumb]:transition-all [&::-webkit-slider-thumb]:duration-200 [&::-webkit-slider-thumb]:hover:scale-125 [&::-webkit-slider-thumb]:hover:shadow-[0_0_15px_rgba(255,213,0,0.8)]"
        />
        
        <input
          type="range"
          min={min}
          max={max}
          value={localMax}
          onChange={handleMaxRangeChange}
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={() => {
            setIsDragging(false);
            onChange([localMin, localMax]);
          }}
          className="absolute top-1/2 h-0 w-full -translate-y-1/2 cursor-pointer appearance-none bg-transparent [&::-webkit-slider-thumb]:relative [&::-webkit-slider-thumb]:z-10 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#ffd500] [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(255,213,0,0.5)] [&::-webkit-slider-thumb]:transition-all [&::-webkit-slider-thumb]:duration-200 [&::-webkit-slider-thumb]:hover:scale-125 [&::-webkit-slider-thumb]:hover:shadow-[0_0_15px_rgba(255,213,0,0.8)]"
        />
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <label className="mb-1 block text-sm text-muted-foreground">Min</label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              ₹
            </span>
            <input
              type="number"
              min={min}
              max={localMax - 100}
              value={localMin}
              onChange={handleMinChange}
              onBlur={handleMinInputBlur}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 pl-7 text-sm text-foreground outline-none transition-all duration-200 focus:border-[#ffb400] focus:ring-2 focus:ring-[#ffb400]/50"
            />
          </div>
        </div>
        
        <div className="mt-5 h-0.5 w-3 bg-muted-foreground/30" />
        
        <div className="flex-1">
          <label className="mb-1 block text-sm text-muted-foreground">Max</label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              ₹
            </span>
            <input
              type="number"
              min={localMin + 100}
              max={max}
              value={localMax}
              onChange={handleMaxChange}
              onBlur={handleMaxInputBlur}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 pl-7 text-sm text-foreground outline-none transition-all duration-200 focus:border-[#ffb400] focus:ring-2 focus:ring-[#ffb400]/50"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
