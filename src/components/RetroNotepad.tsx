import React, { useState } from 'react';

interface NotepadProps {
  initialContent: string;
  readOnly?: boolean;
}

export default function RetroNotepad({ initialContent, readOnly = false }: NotepadProps) {
  const [content, setContent] = useState(initialContent);

  return (
    <div className="flex flex-col h-full bg-[#ffffff] text-black text-xs font-mono select-text outline-none">
      
      {/* Menu Bar */}
      <div className="flex gap-4 px-2 py-1 bg-[#D9D8D5] border-b-2 border-[#141414] text-[10px] font-sans font-black uppercase text-black">
        <span className="hover:bg-[#FF6321] hover:text-white px-1.5 py-0.5 transition-colors cursor-default">파일</span>
        <span className="hover:bg-[#FF6321] hover:text-white px-1.5 py-0.5 transition-colors cursor-default">편집</span>
        <span className="hover:bg-[#FF6321] hover:text-white px-1.5 py-0.5 transition-colors cursor-default">찾기</span>
        <span className="hover:bg-[#FF6321] hover:text-white px-1.5 py-0.5 transition-colors cursor-default">도움말</span>
      </div>

      {/* Text Area */}
      <textarea
        className="flex-1 w-full h-full p-4 bg-white text-[#141414] focus:outline-none resize-none leading-relaxed overflow-auto select-text selection:bg-[#FF6321] selection:text-white font-mono border-none text-[11px]"
        value={content}
        onChange={(e) => !readOnly && setContent(e.target.value)}
        readOnly={readOnly}
        spellCheck={false}
      />
    </div>
  );
}
