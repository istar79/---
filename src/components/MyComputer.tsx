import React, { useState } from 'react';
import { Folder, FileText, HardDrive, Cpu, ArrowLeft } from 'lucide-react';
import { audioManager } from '../utils/audio';

interface FileNode {
  name: string;
  type: 'folder' | 'file' | 'drive' | 'system';
  content?: string;
  children?: FileNode[];
}

interface MyComputerProps {
  onOpenFile: (title: string, content: string) => void;
}

export default function MyComputer({ onOpenFile }: MyComputerProps) {
  const systemRoot: FileNode = {
    name: '내 컴퓨터',
    type: 'folder',
    children: [
      {
        name: '로컬 디스크 (C:)',
        type: 'drive',
        children: [
          {
            name: 'Program Files',
            type: 'folder',
            children: [
              {
                name: '똥피하기 1.0',
                type: 'folder',
                children: [
                  { name: '똥피하기.exe', type: 'system', content: '게임 실행 파일입니다.' },
                  { name: '설정.ini', type: 'file', content: '[Suberunker]\nTheme=retro-pc\nCRT=true\nVolume=100\n[Leaderboard]\nBestScore=100' },
                ]
              }
            ]
          },
          {
            name: '내 문서',
            type: 'folder',
            children: [
              { name: '비밀_도움말.txt', type: 'file', content: '축하합니다! 2000년대 추억의 명작 졸라맨 똥피하기(Suberunker)를 발견하셨습니다.\n\n재밌는 사실: 이 게임은 플래시 게임 시절에 한국 중고생들에게 최고의 인기 게임이었습니다.\n학원이나 학교 실습실 컴퓨터에서 몰래 즐기던 추억을 떠올려보세요!\n\n개발자 이메일: jmartnet@gmail.com' },
              { name: '1998년_일기.txt', type: 'file', content: '1998년 7월 1일 날씨 맑음\n\n오늘 드디어 컴퓨터 학원에서 똥피하기 40점을 넘겼다!\n친구가 자기 50점 넘었다고 자랑하는데 너무 분하다.\n내일은 꼭 60점을 넘기고 말테다.\n학원 선생님 몰래 하다가 들켜서 혼났지만 멈출 수 없다.' },
            ]
          },
          {
            name: 'Windows',
            type: 'folder',
            children: [
              { name: 'System32', type: 'folder', children: [] },
              { name: '메모장.exe', type: 'system', content: '메모장 프로그램입니다.' },
              { name: '카드놀이.exe', type: 'system', content: '카드놀이 프로그램입니다.' }
            ]
          }
        ]
      },
      {
        name: '컴퓨터 사양.txt',
        type: 'system',
        content: '=== 레트로 컴퓨터 하드웨어 사양 ===\n\n- CPU: Intel Pentium Processor @ 133MHz\n- RAM: 16.0 MB EDO RAM\n- Storage: 1.2 GB IDE Hard Drive\n- Display: Trident 9680 PCI 1MB SVGA Card\n- Sound: Sound Blaster 16 ISA PNP Audio\n- Network: US Robotics 33.6K Internal Faxmodem\n- OS: Microsoft Windows 95 (4.00.950)'
      }
    ]
  };

  const [history, setHistory] = useState<FileNode[][]>([[systemRoot]]);
  const currentLevel = history[history.length - 1];
  const currentNode = currentLevel[currentLevel.length - 1];

  const handleDoubleClick = (node: FileNode) => {
    audioManager.playClick();
    if (node.type === 'folder' || node.type === 'drive') {
      const nextLevel = [...currentLevel, node];
      setHistory([...history, nextLevel]);
    } else if (node.type === 'file') {
      onOpenFile(node.name, node.content || '');
    } else if (node.type === 'system') {
      onOpenFile(node.name, node.content || '');
    }
  };

  const handleGoBack = () => {
    if (history.length > 1) {
      audioManager.playClick();
      setHistory(history.slice(0, -1));
    }
  };

  const getIcon = (type: FileNode['type']) => {
    switch (type) {
      case 'drive':
        return <HardDrive size={30} strokeWidth={2.5} className="text-[#141414]" />;
      case 'folder':
        return <Folder size={30} strokeWidth={2.5} className="text-[#FF6321]" />;
      case 'file':
        return <FileText size={30} strokeWidth={2.5} className="text-[#141414]" />;
      case 'system':
        return <Cpu size={30} strokeWidth={2.5} className="text-[#FF6321]" />;
      default:
        return <Folder size={30} strokeWidth={2.5} className="text-[#141414]" />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#E4E3E0] text-[#141414] select-none font-sans">
      
      {/* Toolbar */}
      <div className="flex items-center gap-2 p-2 bg-[#D9D8D5] border-b-2 border-[#141414] text-[11px]">
        <button
          onClick={handleGoBack}
          disabled={history.length <= 1}
          className={`flex items-center gap-1.5 px-2.5 py-1 transition-all uppercase font-black text-[10px] tracking-wider ${
            history.length <= 1
              ? 'opacity-35 bg-transparent border-2 border-zinc-400 text-zinc-400 cursor-not-allowed'
              : 'bg-white border-2 border-[#141414] text-black hover:bg-[#FF6321] hover:text-white cursor-pointer shadow-[2px_2px_0px_#141414] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none'
          }`}
        >
          <ArrowLeft size={11} strokeWidth={3} />
          <span>뒤로</span>
        </button>
        <div className="h-5 w-[2px] bg-[#141414] mx-1" />
        <div className="flex-1 px-2.5 py-1 bg-white border-2 border-[#141414] text-[9px] font-mono font-bold uppercase tracking-wider text-[#141414] truncate">
          주소: {history.map(lvl => lvl[lvl.length - 1].name).join(' / ')}
        </div>
      </div>

      {/* Grid Explorer */}
      <div className="flex-1 p-4 grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-x-3 gap-y-4 overflow-auto items-start align-baseline bg-white border-inner">
        {currentNode.children && currentNode.children.length > 0 ? (
          currentNode.children.map((node, idx) => (
            <div
              key={idx}
              className="flex flex-col items-center justify-start text-center cursor-pointer group hover:bg-[#FF6321]/10 border-2 border-transparent hover:border-[#141414] p-1.5 rounded h-[85px] w-[65px] transition-all"
              onDoubleClick={() => handleDoubleClick(node)}
              onTouchEnd={(e) => {
                // Support tap for mobile since double click can be tricky
                if (window.innerWidth < 768) {
                  handleDoubleClick(node);
                }
              }}
            >
              <div className="mb-1.5 shrink-0 select-none group-hover:scale-105 transition-transform">
                {getIcon(node.type)}
              </div>
              <span className="text-[10px] font-bold uppercase tracking-tight leading-tight line-clamp-2 select-none group-hover:text-[#FF6321] break-all">
                {node.name}
              </span>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center text-zinc-400 font-mono text-[10px] uppercase tracking-wider py-8 select-none">
            이 폴더는 비어있습니다.
          </div>
        )}
      </div>
    </div>
  );
}
