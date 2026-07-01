import React, { useState, useRef, useEffect } from 'react';
import { X, Minus, Square } from 'lucide-react';
import { audioManager } from '../utils/audio';

interface WindowProps {
  id: string;
  title: string;
  isOpen: boolean;
  isFocused: boolean;
  onClose: () => void;
  onFocus: () => void;
  onMinimize?: () => void;
  defaultX?: number;
  defaultY?: number;
  width?: string;
  height?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  key?: string | number;
}

export default function Window({
  id,
  title,
  isOpen,
  isFocused,
  onClose,
  onFocus,
  onMinimize,
  defaultX = 40,
  defaultY = 40,
  width = '450px',
  height = 'auto',
  icon,
  children,
}: WindowProps) {
  const [position, setPosition] = useState({ x: defaultX, y: defaultY });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const windowRef = useRef<HTMLDivElement>(null);

  // Center window on mobile devices
  useEffect(() => {
    if (window.innerWidth < 768) {
      // Small screen responsive sizing
      setPosition({ x: 10, y: 30 });
    } else {
      // Add slight random offset so they don't stack perfectly
      const offset = (Math.random() * 40) - 20;
      setPosition({ x: Math.max(20, defaultX + offset), y: Math.max(20, defaultY + offset) });
    }
  }, []);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    onFocus();
    setIsDragging(true);
    
    // Play subtle retro click sound
    audioManager.playClick();

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    dragStart.current = {
      x: clientX - position.x,
      y: clientY - position.y,
    };
    
    // Prevent default selection text behaviors
    if (!('touches' in e)) {
      e.preventDefault();
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging) return;

      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

      // Keep inside screen bounds roughly
      const newX = Math.max(-100, Math.min(window.innerWidth - 100, clientX - dragStart.current.x));
      const newY = Math.max(0, Math.min(window.innerHeight - 60, clientY - dragStart.current.y));

      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleMouseMove, { passive: false });
      window.addEventListener('touchend', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleMouseMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging, position]);

  if (!isOpen) return null;

  return (
    <div
      ref={windowRef}
      id={`win-${id}`}
      style={{
        position: 'absolute',
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: window.innerWidth < 768 ? 'calc(100vw - 20px)' : width,
        height: height,
        zIndex: isFocused ? 50 : 20,
      }}
      className={`flex flex-col bg-[#E4E3E0] border-3 border-[#141414] p-1 select-none font-sans outline-none transition-shadow duration-150 ${
        isFocused ? 'shadow-[6px_6px_0px_#141414]' : 'shadow-[3px_3px_0px_#141414]'
      }`}
      onClick={onFocus}
      onTouchStart={onFocus}
    >
      {/* Title Bar */}
      <div
        className={`flex items-center justify-between p-1.5 cursor-move select-none border-b-2 border-[#141414] transition-colors duration-150 ${
          isFocused ? 'bg-[#141414] text-white' : 'bg-[#D9D8D5] text-[#141414] opacity-80'
        }`}
        onMouseDown={handleMouseDown}
        onTouchStart={handleMouseDown}
      >
        <div className="flex items-center gap-2 pl-1 text-[12px] font-black tracking-wider uppercase select-none truncate">
          {icon && <span className="w-4 h-4 flex items-center justify-center select-none shrink-0 filter brightness-100">{icon}</span>}
          <span className="truncate pr-4 select-none">{title}</span>
        </div>
        
        {/* Window controls */}
        <div className="flex items-center gap-1 shrink-0 pl-1 select-none">
          {onMinimize && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                audioManager.playClick();
                onMinimize();
              }}
              className="w-[18px] h-[18px] flex items-center justify-center bg-white border-2 border-[#141414] hover:bg-[#FF6321] hover:text-white text-[#141414] transition-colors duration-100 select-none cursor-pointer"
            >
              <Minus size={10} strokeWidth={3} />
            </button>
          )}
          <button
            className="w-[18px] h-[18px] flex items-center justify-center bg-white border-2 border-[#141414] opacity-40 text-[#141414] select-none pointer-events-none"
          >
            <Square size={8} strokeWidth={3} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              audioManager.playClick();
              onClose();
            }}
            className="w-[18px] h-[18px] flex items-center justify-center bg-white border-2 border-[#141414] hover:bg-red-500 hover:text-white text-[#141414] font-bold transition-colors duration-100 select-none cursor-pointer"
          >
            <X size={10} strokeWidth={3} />
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto bg-[#E4E3E0] text-[#141414]">
        {children}
      </div>
    </div>
  );
}
