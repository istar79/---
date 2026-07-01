import React, { useState, useEffect } from 'react';
import { Gamepad2, FileText, Monitor, Trash2, Folder, Volume2, VolumeX, Terminal, ShieldAlert } from 'lucide-react';
import Window from './Window';
import GameCanvas from './GameCanvas';
import RetroNotepad from './RetroNotepad';
import MyComputer from './MyComputer';
import { audioManager } from '../utils/audio';

interface OpenWindow {
  id: string;
  title: string;
  isOpen: boolean;
  isMinimized: boolean;
  icon: React.ReactNode;
  content: React.ReactNode;
  defaultX: number;
  defaultY: number;
  width: string;
  height: string;
}

export default function Desktop() {
  const [time, setTime] = useState('');
  const [startMenuOpen, setStartMenuOpen] = useState(false);
  const [focusedWindowId, setFocusedWindowId] = useState<string>('suberunker');
  const [isShutDown, setIsShutDown] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [recycleBinEmpty, setRecycleBinEmpty] = useState(false);

  // Default contents for Help Notepad
  const helpContent = `==================================================
           SUBERUNKER (졸라맨 똥피하기) v1.0
==================================================

추억의 명작 졸라맨 똥피하기 게임에 오신 것을 환영합니다!
이 게임은 2000년대 초반 학교 컴퓨터 실습실의 열기를 
그대로 재현한 Windows 95 스타일 졸라맨 똥피하기 게임입니다.

[조작법 가이드]
--------------------------------------------------
▶ 키보드 (데스크톱 PC):
  - 왼쪽 이동: [A] 또는 [◀ (왼쪽 방향키)]
  - 오른쪽 이동: [D] 또는 [▶ (오른쪽 방향키)]
  - 일시정지 / 시작: [Space] 키

▶ 터치스크린 (모바일/태블릿):
  - 화면에 대고 손가락을 좌우로 슬라이드하거나,
  - 화면 아래의 ◀ LEFT / RIGHT ▶ 버튼을 터치하여 쉽게 조작!

[점수 및 똥 종류]
--------------------------------------------------
💩 일반 똥 (갈색)  : 피할 때마다 +1점 (바닥에 닿으면 splat!)
⚡ 번개 똥 (작고 빠름): 피하기 어려우나 동일하게 피하면 +1점
🐘 대왕 똥 (거대함)  : 피하기는 쉬우나 범위가 넓음 (+1점)
🌀 지그재그 똥      : 좌우로 흔들리며 낙하 (+1점)
✨ 황금 똥 (반짝임)  : 먹어야 하는 보너스! (몸으로 받아내면 +5점 및 사운드!)

※ 황금 똥은 피하면 안되고, 몸으로 부딪쳐서 "점수"를 획득해야 합니다!

[시스템 특징]
--------------------------------------------------
1. 4가지 비주얼 테마 지원 (Retro PC, 칠판 낙서, 네온 사이버펑크, 모던)
2. 실감나는 CRT 모니터 아날로그 글레어 필터 효과 제공
3. 향수를 자극하는 8비트 사운드 이펙트 신디사이저 탑재
4. 로컬 최고 기록(High Score) 브라우저 자동 저장 기능

학원/학교 컴퓨터실에서 선생님 몰래 게임을 즐기던 그 스릴을 느껴보세요!

--------------------------------------------------
* 본 게임은 AI Studio 에이전트가 완성한 한글화 졸라맨 똥피하기 웹앱입니다.
* 문의처: jmartnet@gmail.com
==================================================`;

  const [windows, setWindows] = useState<OpenWindow[]>([
    {
      id: 'suberunker',
      title: '똥피하기_게임.exe',
      isOpen: true,
      isMinimized: false,
      icon: <Gamepad2 size={14} className="text-[#000080]" />,
      content: <GameCanvas />,
      defaultX: 30,
      defaultY: 30,
      width: '376px',
      height: 'auto',
    },
    {
      id: 'readme',
      title: '도움말.txt - 메모장',
      isOpen: true,
      isMinimized: false,
      icon: <FileText size={14} className="text-[#404040]" />,
      content: <RetroNotepad initialContent={helpContent} readOnly={true} />,
      defaultX: 420,
      defaultY: 50,
      width: '450px',
      height: '420px',
    },
  ]);

  // Handle system clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      let hours = now.getHours();
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12; // the hour '0' should be '12'
      setTime(`${hours}:${minutes} ${ampm}`);
    };

    updateTime();
    const timer = setInterval(updateTime, 60000);
    return () => clearInterval(timer);
  }, []);

  // Sync mute with sound utility
  const toggleMute = () => {
    const muteState = audioManager.toggleMute();
    setIsMuted(muteState);
  };

  // Focus utility
  const focusWindow = (id: string) => {
    setFocusedWindowId(id);
    setWindows(prev =>
      prev.map(win => {
        if (win.id === id) {
          return { ...win, isMinimized: false };
        }
        return win;
      })
    );
  };

  const openWindow = (id: string) => {
    audioManager.playClick();
    setWindows(prev =>
      prev.map(win => {
        if (win.id === id) {
          return { ...win, isOpen: true, isMinimized: false };
        }
        return win;
      })
    );
    focusWindow(id);
  };

  const closeWindow = (id: string) => {
    setWindows(prev =>
      prev.map(win => {
        if (win.id === id) {
          return { ...win, isOpen: false };
        }
        return win;
      })
    );
  };

  const minimizeWindow = (id: string) => {
    setWindows(prev =>
      prev.map(win => {
        if (win.id === id) {
          return { ...win, isMinimized: true };
        }
        return win;
      })
    );
    // Find next open and non-minimized window to focus
    const remaining = windows.filter(w => w.isOpen && !w.isMinimized && w.id !== id);
    if (remaining.length > 0) {
      setFocusedWindowId(remaining[remaining.length - 1].id);
    } else {
      setFocusedWindowId('');
    }
  };

  const toggleTask = (win: OpenWindow) => {
    audioManager.playClick();
    if (win.isMinimized || focusedWindowId !== win.id) {
      focusWindow(win.id);
    } else {
      minimizeWindow(win.id);
    }
  };

  // Dynamic notepad opening for file explorer double clicks
  const handleOpenFile = (title: string, content: string) => {
    const notepadId = `notepad-${title.replace(/[^a-zA-Z0-9]/g, '')}`;
    const newWin: OpenWindow = {
      id: notepadId,
      title: `${title} - 메모장`,
      isOpen: true,
      isMinimized: false,
      icon: <FileText size={14} className="text-[#404040]" />,
      content: <RetroNotepad initialContent={content} readOnly={true} />,
      defaultX: 150,
      defaultY: 150,
      width: '400px',
      height: '350px',
    };

    setWindows(prev => {
      // If already open, just focus
      if (prev.some(w => w.id === notepadId)) {
        return prev.map(w => w.id === notepadId ? { ...w, isOpen: true, isMinimized: false } : w);
      }
      return [...prev, newWin];
    });
    
    // Slight timeout to let state apply before focusing
    setTimeout(() => focusWindow(notepadId), 50);
  };

  // Add My Computer window if missing dynamically
  useEffect(() => {
    setWindows(prev => {
      const hasMyComputer = prev.some(w => w.id === 'my_computer');
      if (hasMyComputer) return prev;

      const myCompWin: OpenWindow = {
        id: 'my_computer',
        title: '내 컴퓨터',
        isOpen: false,
        isMinimized: false,
        icon: <Folder size={14} className="text-[#008080]" />,
        content: <MyComputer onOpenFile={handleOpenFile} />,
        defaultX: 80,
        defaultY: 80,
        width: '440px',
        height: '340px',
      };
      return [...prev, myCompWin];
    });
  }, []);

  // Empty Recycle Bin jokes
  const handleEmptyRecycleBin = () => {
    audioManager.playClick();
    setStartMenuOpen(false);
    audioManager.playSplat();
    setRecycleBinEmpty(true);
    alert('휴지통을 비웠습니다.\n(성적표.xlsx, 숙제하기싫다.doc 가 사라졌습니다!)');
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#E4E3E0] font-sans text-[#141414] text-xs select-none border-[12px] border-[#141414]">
      
      {/* Subtle Grid Overlay */}
      <div className="absolute inset-0 opacity-[0.05] pointer-events-none z-0" style={{ backgroundImage: 'radial-gradient(#141414 1.5px, transparent 0)', backgroundSize: '30px 30px' }} />

      {/* Giant Brutalist Watermark background */}
      <div className="absolute inset-0 flex flex-col justify-center items-center pointer-events-none select-none z-0 overflow-hidden opacity-10">
        <div className="text-[14vw] font-black tracking-tighter uppercase leading-[0.8] text-[#141414] text-center select-none font-sans">
          똥피하기
        </div>
        <div className="text-[3vw] font-black tracking-widest uppercase text-[#FF6321] text-center mt-6 select-none font-sans">
          졸라맨 // 2026-XP
        </div>
      </div>

      {/* SHUTDOWN SHIELD */}
      {isShutDown ? (
        <div 
          onClick={() => { setIsShutDown(false); audioManager.playStart(); }}
          className="absolute inset-0 z-[9999] bg-black flex flex-col items-center justify-center text-center p-6 cursor-pointer select-none"
        >
          <div className="max-w-md space-y-4">
            <p className="text-orange-500 font-serif text-xl sm:text-2xl leading-relaxed tracking-wider border-2 border-orange-500 p-6 rounded shadow-lg animate-pulse">
              이제 컴퓨터 전원을 안전하게 끄셔도 됩니다.
            </p>
            <p className="text-zinc-500 text-xs mt-8 animate-pulse font-mono">
              [화면 아무 곳이나 클릭하면 시스템이 다시 시작됩니다]
            </p>
          </div>
        </div>
      ) : null}

      {/* DESKTOP SHORTCUTS */}
      <div className="absolute left-6 top-6 flex flex-col gap-6 z-10">
        
        {/* My Computer Shortcut */}
        <div 
          onDoubleClick={() => openWindow('my_computer')}
          onTouchEnd={() => { if (window.innerWidth < 768) openWindow('my_computer'); }}
          className="flex flex-col items-center justify-center text-center cursor-pointer group w-[75px] active:scale-95 transition-transform"
        >
          <div className="w-12 h-12 flex items-center justify-center bg-white border-3 border-[#141414] rounded shadow-[4px_4px_0px_#141414] group-hover:bg-[#FF6321] group-hover:text-white text-[#141414] p-1 mb-1 transition-colors duration-150">
            <Monitor size={26} strokeWidth={2.5} />
          </div>
          <span className="text-[10px] font-black tracking-tight uppercase text-[#141414] text-center leading-tight">
            내 컴퓨터
          </span>
        </div>

        {/* Suberunker.exe Shortcut */}
        <div 
          onDoubleClick={() => openWindow('suberunker')}
          onTouchEnd={() => { if (window.innerWidth < 768) openWindow('suberunker'); }}
          className="flex flex-col items-center justify-center text-center cursor-pointer group w-[75px] active:scale-95 transition-transform"
        >
          <div className="w-12 h-12 flex items-center justify-center bg-white border-3 border-[#141414] rounded shadow-[4px_4px_0px_#141414] group-hover:bg-[#FF6321] group-hover:text-white text-[#FF6321] p-1 mb-1 transition-colors duration-150">
            <Gamepad2 size={26} strokeWidth={2.5} />
          </div>
          <span className="text-[10px] font-black tracking-tight uppercase text-[#FF6321] text-center leading-tight">
            게임 실행
          </span>
        </div>

        {/* Readme.txt Shortcut */}
        <div 
          onDoubleClick={() => openWindow('readme')}
          onTouchEnd={() => { if (window.innerWidth < 768) openWindow('readme'); }}
          className="flex flex-col items-center justify-center text-center cursor-pointer group w-[75px] active:scale-95 transition-transform"
        >
          <div className="w-12 h-12 flex items-center justify-center bg-white border-3 border-[#141414] rounded shadow-[4px_4px_0px_#141414] group-hover:bg-[#FF6321] group-hover:text-white text-[#141414] p-1 mb-1 transition-colors duration-150">
            <FileText size={26} strokeWidth={2.5} />
          </div>
          <span className="text-[10px] font-black tracking-tight uppercase text-[#141414] text-center leading-tight">
            도움말.txt
          </span>
        </div>

        {/* Recycle Bin Shortcut */}
        <div 
          onDoubleClick={handleEmptyRecycleBin}
          onTouchEnd={() => { if (window.innerWidth < 768) handleEmptyRecycleBin(); }}
          className="flex flex-col items-center justify-center text-center cursor-pointer group w-[75px] active:scale-95 transition-transform"
        >
          <div className="w-12 h-12 flex items-center justify-center bg-white border-3 border-[#141414] rounded shadow-[4px_4px_0px_#141414] group-hover:bg-[#FF6321] group-hover:text-white text-[#141414] p-1 mb-1 transition-colors duration-150">
            <Trash2 size={26} strokeWidth={2.5} className={recycleBinEmpty ? 'opacity-40' : 'text-[#854d0e]'} />
          </div>
          <span className="text-[10px] font-black tracking-tight uppercase text-[#141414] text-center leading-tight">
            휴지통
          </span>
        </div>

      </div>

      {/* SYSTEM WINDOWS LAYER */}
      {windows.map(win => (
        <Window
          key={win.id}
          id={win.id}
          title={win.title}
          isOpen={win.isOpen}
          isFocused={focusedWindowId === win.id}
          onClose={() => closeWindow(win.id)}
          onFocus={() => focusWindow(win.id)}
          onMinimize={() => minimizeWindow(win.id)}
          defaultX={win.defaultX}
          defaultY={win.defaultY}
          width={win.width}
          height={win.height}
          icon={win.icon}
        >
          {win.content}
        </Window>
      ))}

      {/* START MENU POPUP */}
      {startMenuOpen && (
        <div 
          className="absolute left-1.5 bottom-14 w-56 bg-[#E4E3E0] border-3 border-[#141414] shadow-[5px_5px_0px_#141414] p-1 flex z-[999] select-none text-black font-sans"
          onClick={() => setStartMenuOpen(false)}
        >
          {/* Windows Left Side Graphic Banner */}
          <div className="w-8 bg-[#141414] text-white flex items-end justify-center py-3 font-black select-none shrink-0 font-sans tracking-widest text-[11px] uppercase">
            <span style={{ writingMode: 'vertical-lr', transform: 'rotate(180deg)' }}>똥피하기</span>
          </div>
          
          {/* Start Menu Items */}
          <div className="flex-1 flex flex-col text-[11px] font-bold pl-1 select-none py-1 space-y-0.5 font-sans">
            
            <button
              onClick={() => openWindow('suberunker')}
              className="flex items-center gap-2.5 py-2 px-3 w-full text-left uppercase tracking-wider hover:bg-[#FF6321] hover:text-white transition-colors cursor-pointer"
            >
              <Gamepad2 size={13} strokeWidth={2.5} />
              <span>게임 시작 (똥피하기)</span>
            </button>
            
            <button
              onClick={() => openWindow('my_computer')}
              className="flex items-center gap-2.5 py-2 px-3 w-full text-left uppercase tracking-wider hover:bg-[#FF6321] hover:text-white transition-colors cursor-pointer"
            >
              <Monitor size={13} strokeWidth={2.5} />
              <span>내 컴퓨터 열기</span>
            </button>
            
            <button
              onClick={() => openWindow('readme')}
              className="flex items-center gap-2.5 py-2 px-3 w-full text-left uppercase tracking-wider hover:bg-[#FF6321] hover:text-white transition-colors cursor-pointer"
            >
              <FileText size={13} strokeWidth={2.5} />
              <span>도움말 가이드 읽기</span>
            </button>
            
            <button
              onClick={handleEmptyRecycleBin}
              className="flex items-center gap-2.5 py-2 px-3 w-full text-left uppercase tracking-wider hover:bg-[#FF6321] hover:text-white transition-colors cursor-pointer"
            >
              <Trash2 size={13} strokeWidth={2.5} />
              <span>휴지통 비우기</span>
            </button>

            <div className="h-[2px] bg-[#141414] my-1 mx-1.5" />
            
            <button
              onClick={toggleMute}
              className="flex items-center gap-2.5 py-2 px-3 w-full text-left uppercase tracking-wider hover:bg-[#FF6321] hover:text-white transition-colors cursor-pointer"
            >
              {isMuted ? <VolumeX size={13} strokeWidth={2.5} /> : <Volume2 size={13} strokeWidth={2.5} />}
              <span>{isMuted ? '음소거 해제' : '오디오 음소거'}</span>
            </button>
            
            <button
              onClick={() => setIsShutDown(true)}
              className="flex items-center gap-2.5 py-2 px-3 w-full text-left hover:bg-red-600 hover:text-white text-red-600 font-black uppercase tracking-wider transition-colors cursor-pointer"
            >
              <ShieldAlert size={13} strokeWidth={2.5} />
              <span>시스템 종료...</span>
            </button>
          </div>
        </div>
      )}

      {/* bottom retro TASKBAR */}
      <div className="absolute bottom-0 left-0 right-0 h-12 bg-[#141414] border-t-3 border-[#141414] px-3 py-1.5 flex items-center justify-between z-[990] select-none text-white font-sans">
        
        {/* Start Button & Tasks Area */}
        <div className="flex items-center gap-2 h-full flex-1 min-w-0 pr-4">
          
          {/* Start Menu Button */}
          <button
            onClick={() => { audioManager.playClick(); setStartMenuOpen(!startMenuOpen); }}
            className={`h-full px-4 flex items-center gap-2 font-black text-xs select-none cursor-pointer transition-colors duration-150 ${
              startMenuOpen
                ? 'bg-white text-black border-2 border-white'
                : 'bg-[#FF6321] text-white border-2 border-white hover:bg-white hover:text-black'
            }`}
          >
            <div className="w-3 h-3 bg-white rounded-full shrink-0 group-hover:bg-[#FF6321] border border-black animate-pulse" />
            <span className="text-[11px] font-sans font-black tracking-widest uppercase leading-none pb-0.5 select-none">시작</span>
          </button>

          <div className="w-[2px] h-6 bg-zinc-700 mx-1 shrink-0" />

          {/* Running Tasks */}
          <div className="flex items-center gap-2 h-full overflow-hidden flex-1 min-w-0">
            {windows
              .filter(win => win.isOpen)
              .map(win => {
                const isActive = focusedWindowId === win.id && !win.isMinimized;
                return (
                  <button
                    key={win.id}
                    onClick={() => toggleTask(win)}
                    className={`h-full px-3.5 max-w-[140px] flex items-center gap-2 text-[10px] font-black uppercase select-none cursor-pointer truncate flex-1 md:flex-initial border-2 transition-colors duration-150 ${
                      isActive
                        ? 'bg-[#FF6321] border-white text-white'
                        : 'bg-white border-[#141414] text-black hover:bg-[#D9D8D5]'
                    }`}
                  >
                    <span className="shrink-0">{win.icon}</span>
                    <span className="truncate leading-none pb-0.5 tracking-wider">{win.title.split(' - ')[0]}</span>
                  </button>
                );
              })}
          </div>

        </div>

        {/* System Tray Clock & Volume */}
        <div className="flex items-center gap-3 px-3 h-8 bg-[#D9D8D5] border-2 border-[#141414] shrink-0 text-[#141414] font-sans font-black text-[10px] select-none">
          
          <button 
            onClick={toggleMute}
            className="p-0.5 hover:bg-zinc-300 text-black cursor-pointer shrink-0 transition-colors"
            title={isMuted ? '음소거 해제' : '음소거'}
          >
            {isMuted ? <VolumeX size={12} strokeWidth={2.5} className="text-red-600" /> : <Volume2 size={12} strokeWidth={2.5} />}
          </button>
          
          <span className="text-[#141414] opacity-30">|</span>
          
          <span className="font-mono tracking-tight text-right whitespace-nowrap select-none">
            {time}
          </span>
        </div>

      </div>

    </div>
  );
}
