'use client';

import React, { useState, useEffect } from 'react';

interface SplitFlapPanelProps {
  value: string;
  widthClass?: string;
  textClass?: string;
}

function SplitFlapPanel({ value, widthClass = "w-8 md:w-10", textClass = "text-2xl md:text-4xl" }: SplitFlapPanelProps) {
  const [prev, setPrev] = useState(value);
  const [flip, setFlip] = useState(false);

  useEffect(() => {
    if (value !== prev) {
      setFlip(true);
      const timer = setTimeout(() => {
        setPrev(value);
        setFlip(false);
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [value, prev]);

  return (
    <div className={`relative h-12 md:h-16 ${widthClass} bg-zinc-100 dark:bg-black text-zinc-900 dark:text-white rounded-lg flex flex-col overflow-hidden select-none border border-zinc-200 dark:border-zinc-900 shadow-sm font-mono font-black items-center justify-center ${textClass}`}>
      {/* Top half static (new value) */}
      <div className="absolute top-0 left-0 w-full h-1/2 bg-zinc-200/50 dark:bg-zinc-900/90 overflow-hidden border-b border-zinc-300/40 dark:border-black/30">
        <div className="absolute top-0 left-0 w-full h-[200%] flex items-center justify-center">
          {value}
        </div>
      </div>

      {/* Bottom half static (old value) */}
      <div className="absolute bottom-0 left-0 w-full h-1/2 bg-zinc-200/70 dark:bg-zinc-900/90 overflow-hidden border-t border-zinc-300/40 dark:border-black/30">
        <div className="absolute bottom-0 left-0 w-full h-[200%] flex items-center justify-center">
          {prev}
        </div>
      </div>

      {/* Flap flipping down */}
      {flip && (
        <div 
          className="absolute top-0 left-0 w-full h-1/2 bg-zinc-200 dark:bg-zinc-900 overflow-hidden origin-bottom border-b border-zinc-300/50 dark:border-black/30 z-20 backface-hidden"
          style={{
            animation: 'splitFlapFlip 0.35s ease-in-out forwards',
            transformStyle: 'preserve-3d',
            perspective: '200px'
          }}
        >
          <div className="absolute top-0 left-0 w-full h-[200%] flex items-center justify-center">
            {prev}
          </div>
        </div>
      )}

      {/* Bottom half revealing new value */}
      {flip && (
        <div 
          className="absolute bottom-0 left-0 w-full h-1/2 bg-zinc-200 dark:bg-zinc-900 overflow-hidden origin-top border-t border-zinc-300/50 dark:border-black/30 z-10 backface-hidden"
          style={{
            animation: 'splitFlapReveal 0.35s ease-in-out forwards',
            transformStyle: 'preserve-3d',
            perspective: '200px'
          }}
        >
          <div className="absolute bottom-0 left-0 w-full h-[200%] flex items-center justify-center">
            {value}
          </div>
        </div>
      )}

      {/* Center split line */}
      <div className="absolute top-[calc(50%-0.5px)] left-0 w-full h-[1px] bg-zinc-300/80 dark:bg-black/80 z-30" />
    </div>
  );
}

export function AirportClock() {
  const [time, setTime] = useState<Date | null>(null);

  useEffect(() => {
    setTime(new Date());
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!time) {
    return (
      <div className="h-full flex flex-col justify-center gap-6 bg-white dark:bg-zinc-950 rounded-xl p-5 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white min-h-[180px]">
        <div className="text-center italic text-zinc-500 dark:text-zinc-400 text-xs py-4">
          Synchronizing board time...
        </div>
        <div className="border-t border-zinc-200 dark:border-zinc-800/80 pt-3 flex flex-col gap-0.5">
          <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest leading-none">Date & Day</span>
          <span className="text-sm font-extrabold tracking-wider font-mono text-zinc-300 dark:text-zinc-700 mt-1">-- // --</span>
        </div>
      </div>
    );
  }

  let hoursNum = time.getHours();
  const ampm = hoursNum >= 12 ? 'PM' : 'AM';
  hoursNum = hoursNum % 12;
  if (hoursNum === 0) hoursNum = 12;

  const hours = String(hoursNum).padStart(2, '0');
  const minutes = String(time.getMinutes()).padStart(2, '0');
  const seconds = String(time.getSeconds()).padStart(2, '0');

  const formattedDay = time.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
  const formattedDate = time.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase();

  return (
    <div className="flex flex-col justify-between h-full bg-white dark:bg-zinc-950 rounded-xl p-5 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white shadow-none relative overflow-hidden select-none min-h-[180px] transition-colors duration-300">
      <div className="absolute inset-0 opacity-5 dark:opacity-[0.03] pointer-events-none bg-[radial-gradient(circle,#000_1px,transparent_1px)] dark:bg-[radial-gradient(circle,#fff_1px,transparent_1px)] bg-[size:8px_8px]" />

      <div className="relative z-10 flex flex-col h-full justify-between gap-6 py-2">
        <div className="flex-1 flex items-center justify-center">
          <div className="flex items-center justify-center gap-1.5 py-1">
            <div className="flex gap-0.5">
              <SplitFlapPanel value={hours[0]} />
              <SplitFlapPanel value={hours[1]} />
            </div>
            
            <div className="flex flex-col gap-1 text-zinc-400 dark:text-zinc-600 text-xl font-black px-0.5">
              <div className="w-1 h-1 rounded-full bg-zinc-400 dark:bg-zinc-650" />
              <div className="w-1 h-1 rounded-full bg-zinc-400 dark:bg-zinc-650" />
            </div>

            <div className="flex gap-0.5">
              <SplitFlapPanel value={minutes[0]} />
              <SplitFlapPanel value={minutes[1]} />
            </div>

            <div className="flex flex-col gap-1 text-zinc-400 dark:text-zinc-650 text-xl font-black px-0.5">
              <div className="w-1 h-1 rounded-full bg-zinc-400 dark:bg-zinc-650" />
              <div className="w-1 h-1 rounded-full bg-zinc-400 dark:bg-zinc-650" />
            </div>

            <div className="flex gap-0.5">
              <SplitFlapPanel value={seconds[0]} />
              <SplitFlapPanel value={seconds[1]} />
            </div>

            <div className="ml-1.5">
              <SplitFlapPanel value={ampm} widthClass="w-12 md:w-16" textClass="text-lg md:text-2xl" />
            </div>
          </div>
        </div>

        <div className="border-t border-zinc-150 dark:border-zinc-800/80 pt-3 flex flex-col gap-0.5 text-left">
          <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest leading-none">Date & Day</span>
          <span className="text-xs font-extrabold tracking-wider font-mono text-zinc-700 dark:text-zinc-350 mt-1.5">
            {formattedDay} // {formattedDate}
          </span>
        </div>
      </div>
    </div>
  );
}
