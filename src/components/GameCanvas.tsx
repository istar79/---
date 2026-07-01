import React, { useEffect, useRef, useState } from 'react';
import { Play, RotateCcw, Volume2, VolumeX, Monitor, Sun, Moon, Zap } from 'lucide-react';
import { Player, Poop, Splat, GameState, GameTheme, ScoreRecord } from '../types';
import { drawPlayer, drawPoop, drawSplat, drawCRTEffect } from '../utils/drawing';
import { audioManager } from '../utils/audio';

// Constants
const CANVAS_WIDTH = 360;
const CANVAS_HEIGHT = 540;
const GROUND_Y = 500;
const PLAYER_WIDTH = 28;
const PLAYER_HEIGHT = 48;

export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Game state synced to React for menus/HUD
  const [gameState, setGameState] = useState<GameState>('menu');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem('suberunker_highscore');
    return saved ? parseInt(saved, 10) : 0;
  });
  
  const [theme, setTheme] = useState<GameTheme>('retro-pc');
  const [useCRT, setUseCRT] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [playerSkin, setPlayerSkin] = useState<string>('classic');
  const [difficulty, setDifficulty] = useState<'easy' | 'normal' | 'hard'>('normal');

  // Ref for mutable game loop state to avoid React re-render lag
  const stateRef = useRef({
    gameState: 'menu' as GameState,
    difficulty: 'normal' as 'easy' | 'normal' | 'hard',
    score: 0,
    highScore: 0,
    player: {
      x: CANVAS_WIDTH / 2 - PLAYER_WIDTH / 2,
      y: GROUND_Y - PLAYER_HEIGHT,
      width: PLAYER_WIDTH,
      height: PLAYER_HEIGHT,
      speed: 5.5,
      targetX: CANVAS_WIDTH / 2 - PLAYER_WIDTH / 2,
      direction: 'idle' as 'left' | 'right' | 'idle',
      isHit: false,
      hitProgress: 0,
      animFrame: 0,
    } as Player,
    poops: [] as Poop[],
    splats: [] as Splat[],
    keys: {
      left: false,
      right: false,
    },
    spawnTimer: 0,
    spawnInterval: 400, // ms between spawns
    lastTime: 0,
    poopIdCounter: 0,
    splatIdCounter: 0,
    combo: 0,
    lastPoopSpawnTime: 0,
  });

  // Sync highscore with storage
  useEffect(() => {
    stateRef.current.highScore = highScore;
  }, [highScore]);

  // Sync difficulty to ref
  useEffect(() => {
    stateRef.current.difficulty = difficulty;
  }, [difficulty]);

  // Handle Mute setting
  const handleToggleMute = () => {
    const newMute = audioManager.toggleMute();
    setIsMuted(newMute);
  };

  // Sound play wrapper
  const triggerClick = () => {
    audioManager.playClick();
  };

  // Keyboard handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === 'arrowleft' || k === 'a') {
        stateRef.current.keys.left = true;
      }
      if (k === 'arrowright' || k === 'd') {
        stateRef.current.keys.right = true;
      }
      if (e.key === ' ' && stateRef.current.gameState === 'gameover') {
        startGame();
      } else if (e.key === ' ' && stateRef.current.gameState === 'playing') {
        // Space to pause
        pauseGame();
      } else if (e.key === ' ' && stateRef.current.gameState === 'paused') {
        resumeGame();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === 'arrowleft' || k === 'a') {
        stateRef.current.keys.left = false;
      }
      if (k === 'arrowright' || k === 'd') {
        stateRef.current.keys.right = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Main game loop logic
  useEffect(() => {
    let animationFrameId: number;

    const updateGame = (timestamp: number) => {
      const state = stateRef.current;
      if (state.gameState !== 'playing' && state.gameState !== 'gameover') {
        animationFrameId = requestAnimationFrame(updateGame);
        return;
      }

      if (!state.lastTime) state.lastTime = timestamp;
      const deltaTime = timestamp - state.lastTime;
      state.lastTime = timestamp;

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // --- PHYSICS & UPDATES ---
      if (state.gameState === 'playing') {
        // 1. Move Player
        const p = state.player;
        p.animFrame++;

        if (state.keys.left) {
          p.x -= p.speed;
          p.direction = 'left';
        } else if (state.keys.right) {
          p.x += p.speed;
          p.direction = 'right';
        } else {
          // Slide control or idle deceleration
          const dx = p.targetX - p.x;
          if (Math.abs(dx) > 2) {
            p.x += Math.sign(dx) * Math.min(Math.abs(dx), p.speed);
            p.direction = dx < 0 ? 'left' : 'right';
          } else {
            p.direction = 'idle';
          }
        }

        // Clamp player inside canvas
        p.x = Math.max(0, Math.min(CANVAS_WIDTH - p.width, p.x));
        p.targetX = Math.max(0, Math.min(CANVAS_WIDTH - p.width, p.targetX));

        // 2. Spawn Poops
        // Spawn rate scales with score depending on difficulty
        if (state.difficulty === 'easy') {
          state.spawnInterval = Math.max(220, 580 - Math.min(250, state.score * 1.8));
        } else if (state.difficulty === 'hard') {
          state.spawnInterval = Math.max(70, 260 - Math.min(160, state.score * 3.5));
        } else {
          state.spawnInterval = Math.max(110, 420 - Math.min(150, state.score * 2.5));
        }
        
        if (timestamp - state.lastPoopSpawnTime > state.spawnInterval) {
          spawnPoop();
          state.lastPoopSpawnTime = timestamp;
        }

        // 3. Update Poops (Falling physics)
        for (let i = state.poops.length - 1; i >= 0; i--) {
          const poop = state.poops[i];
          
          // Apply velocity
          poop.y += poop.speed;
          poop.x += poop.vx;
          
          // Zig-zag movement
          if (poop.type === 'zig-zag') {
            poop.vx = Math.sin(poop.y / 15) * 2;
          }

          // Rotating poops
          poop.angle += 0.02;

          // Check hit/collision with player (lenient hitbox)
          const px_center = p.x + p.width / 2;
          const py_top = p.y;
          const py_bottom = p.y + p.height;
          
          const poop_cx = poop.x + poop.width / 2;
          const poop_cy = poop.y + poop.height / 2;
          
          // Hitbox rectangle: narrow center core of stickman
          const h_dist = Math.abs(px_center - poop_cx);
          const v_dist = Math.abs((p.y + p.height / 2) - poop_cy);
          
          // Lenient overlapping conditions
          const collided = h_dist < (p.width * 0.45 + poop.width * 0.45) && 
                           v_dist < (p.height * 0.5 + poop.height * 0.4);

          if (collided) {
            if (poop.type === 'golden') {
              // Collect reward!
              state.score += 5;
              setScore(state.score);
              audioManager.playCoin();
              state.poops.splice(i, 1); // remove golden poop
              continue;
            } else {
              // HIT! Trigger death sequence
              triggerHit();
            }
          }

          // Check ground hit
          if (poop.y + poop.height >= GROUND_Y) {
            // Remove poop, spawn splat
            state.poops.splice(i, 1);
            
            if (poop.type !== 'golden') {
              // Award points for dodging
              state.score += 1;
              setScore(state.score);
              
              // Spawn ground splat
              spawnSplat(poop.x + poop.width / 2, GROUND_Y, poop.width);
              audioManager.playSplat();
            }
          }
        }
      } else if (state.gameState === 'gameover') {
        // Death animation update
        const p = state.player;
        if (p.hitProgress < 1) {
          p.hitProgress += 0.02;
          p.x += p.direction === 'left' ? 1.5 : -1.5;
          p.y -= Math.sin(p.hitProgress * Math.PI) * 4; // slight bounce
          if (p.y > GROUND_Y - p.height) p.y = GROUND_Y - p.height;
        }
      }

      // 4. Update Splats (decay life)
      for (let i = state.splats.length - 1; i >= 0; i--) {
        const splat = state.splats[i];
        splat.life -= deltaTime;
        if (splat.life <= 0) {
          state.splats.splice(i, 1);
        }
      }

      // --- RENDERING ---
      renderCanvas(ctx, state, theme, useCRT);

      animationFrameId = requestAnimationFrame(updateGame);
    };

    animationFrameId = requestAnimationFrame(updateGame);
    return () => cancelAnimationFrame(animationFrameId);
  }, [theme, useCRT]);

  const spawnPoop = () => {
    const state = stateRef.current;
    state.poopIdCounter++;
    
    // Size varies by type
    let width = 24;
    let height = 24;
    let type = 'normal' as any;
    
    // Choose type based on score probabilities
    const rand = Math.random() * 100;
    const currentScore = state.score;

    let goldPoopChance = 93; // 100 - 7 = 7% (Normal)
    if (state.difficulty === 'easy') goldPoopChance = 85; // 15% (Easy)
    if (state.difficulty === 'hard') goldPoopChance = 96; // 4% (Hard)

    if (currentScore > 25 && rand < (state.difficulty === 'hard' ? 12 : 6)) {
      type = 'zig-zag';
    } else if (currentScore > 15 && rand < (state.difficulty === 'hard' ? 22 : 15)) {
      type = 'giant';
      width = 46;
      height = 46;
    } else if (currentScore > 10 && rand < (state.difficulty === 'hard' ? 35 : 25)) {
      type = 'fast';
      width = 18;
      height = 18;
    } else if (rand > goldPoopChance) {
      type = 'golden';
      width = 22;
      height = 22;
    }

    // Speed scales with difficulty + type multiplier
    let baseSpeed = 2.8;
    let speedScale = 0.08;
    if (state.difficulty === 'easy') {
      baseSpeed = 1.8;
      speedScale = 0.04;
    } else if (state.difficulty === 'hard') {
      baseSpeed = 3.8;
      speedScale = 0.14;
    }

    const finalBaseSpeed = baseSpeed + Math.min(5.5, state.score * speedScale);
    let speed = finalBaseSpeed + Math.random() * 1.5;

    if (type === 'fast') speed *= 1.6;
    if (type === 'giant') speed *= 0.65;
    if (type === 'golden') speed *= 0.9;
    if (type === 'zig-zag') speed *= 0.8;

    const x = Math.random() * (CANVAS_WIDTH - width);
    const y = -height;

    state.poops.push({
      id: `p-${state.poopIdCounter}`,
      x,
      y,
      width,
      height,
      speed,
      type,
      color: type === 'golden' ? '#ffd700' : '#4e342e',
      angle: Math.random() * Math.PI,
      vx: 0,
    });
  };

  const spawnSplat = (x: number, y: number, poopWidth: number) => {
    const state = stateRef.current;
    state.splatIdCounter++;
    state.splats.push({
      id: `s-${state.splatIdCounter}`,
      x,
      y,
      width: poopWidth * 1.4,
      height: poopWidth * 0.4,
      life: 1500, // fade out in 1.5s
      maxLife: 1500,
      color: '#4e342e',
    });
  };

  const triggerHit = () => {
    const state = stateRef.current;
    state.gameState = 'gameover';
    state.player.isHit = true;
    state.player.hitProgress = 0;
    
    audioManager.playHit();
    setGameState('gameover');

    // Update highscore
    if (state.score > highScore) {
      setHighScore(state.score);
      localStorage.setItem('suberunker_highscore', state.score.toString());
    }
  };

  // Canvas drawing orchestra
  const renderCanvas = (
    ctx: CanvasRenderingContext2D,
    state: any,
    currentTheme: GameTheme,
    crtEnabled: boolean
  ) => {
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // 1. Draw Background depending on theme
    if (currentTheme === 'retro-pc') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    } else if (currentTheme === 'classic-chalk') {
      ctx.fillStyle = '#1e3f20'; // Chalkboard green
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      
      // Board frame lines
      ctx.strokeStyle = 'rgba(255,255,255,0.15)';
      ctx.lineWidth = 1;
      for (let i = 0; i < CANVAS_HEIGHT; i += 40) {
        ctx.beginPath();
        ctx.moveTo(0, i); ctx.lineTo(CANVAS_WIDTH, i);
        ctx.stroke();
      }
    } else if (currentTheme === 'cyberpunk') {
      ctx.fillStyle = '#0a0512';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      
      // Retro grid lines
      ctx.strokeStyle = 'rgba(255, 0, 127, 0.15)';
      ctx.lineWidth = 1.5;
      for (let x = 0; x < CANVAS_WIDTH; x += 30) {
        ctx.beginPath();
        ctx.moveTo(x, 0); ctx.lineTo(x, CANVAS_HEIGHT);
        ctx.stroke();
      }
      for (let y = 0; y < CANVAS_HEIGHT; y += 30) {
        ctx.beginPath();
        ctx.moveTo(0, y); ctx.lineTo(CANVAS_WIDTH, y);
        ctx.stroke();
      }
    } else if (currentTheme === 'modern') {
      // Soft modern cream gradient
      ctx.fillStyle = '#faf8f5';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }

    // 2. Draw Floor line
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    ctx.lineTo(CANVAS_WIDTH, GROUND_Y);
    if (currentTheme === 'classic-chalk') {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    } else if (currentTheme === 'cyberpunk') {
      ctx.strokeStyle = '#00f0ff';
    } else if (currentTheme === 'modern') {
      ctx.strokeStyle = '#cbd5e1';
    } else {
      ctx.strokeStyle = '#3e2723';
    }
    ctx.lineWidth = 4;
    ctx.stroke();

    // 3. Render Splats on the floor
    state.splats.forEach((splat: Splat) => {
      drawSplat(ctx, splat, currentTheme);
    });

    // 4. Render Player
    drawPlayer(ctx, state.player, currentTheme);

    // 5. Render Falling Poops
    state.poops.forEach((poop: Poop) => {
      drawPoop(ctx, poop, currentTheme);
    });

    // 6. Draw HUD: Scores (rendered in retro styled numeric fonts directly)
    // Matches the retro Windows 95 'Suberunker' screen top left placement
    ctx.save();
    
    // Choose HUD font colors
    let numColor = '#331b00';
    if (currentTheme === 'classic-chalk') numColor = '#ffffff';
    else if (currentTheme === 'cyberpunk') numColor = '#00f0ff';
    else if (currentTheme === 'modern') numColor = '#1e293b';

    ctx.fillStyle = numColor;
    
    // Scoreboard labels style
    ctx.font = '900 36px "Courier New", Courier, monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    
    // Draw Current Score (Upper) and High Score (Lower)
    ctx.fillText(`${state.score}`, 18, 16);
    ctx.fillText(`${state.highScore}`, 18, 54);

    // Little labels to make it look even higher fidelity
    ctx.font = 'bold 9px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = currentTheme === 'classic-chalk' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.45)';
    if (currentTheme === 'cyberpunk') ctx.fillStyle = 'rgba(0, 240, 255, 0.6)';
    ctx.fillText('현재 점수', 18, 8);
    ctx.fillText('최고 기록', 18, 48);

    ctx.restore();

    // 7. Apply CRT scanlines effect if enabled
    if (crtEnabled) {
      drawCRTEffect(ctx, CANVAS_WIDTH, CANVAS_HEIGHT);
    }
  };

  // --- CONTROLS ---
  const startGame = () => {
    audioManager.playStart();
    const state = stateRef.current;
    
    // Reset state
    state.gameState = 'playing';
    state.score = 0;
    state.poops = [];
    state.splats = [];
    let startSpeed = 6.2;
    if (state.difficulty === 'easy') startSpeed = 5.2;
    if (state.difficulty === 'hard') startSpeed = 7.5;

    state.player = {
      x: CANVAS_WIDTH / 2 - PLAYER_WIDTH / 2,
      y: GROUND_Y - PLAYER_HEIGHT,
      width: PLAYER_WIDTH,
      height: PLAYER_HEIGHT,
      speed: startSpeed,
      targetX: CANVAS_WIDTH / 2 - PLAYER_WIDTH / 2,
      direction: 'idle',
      isHit: false,
      hitProgress: 0,
      animFrame: 0,
    };
    state.lastPoopSpawnTime = performance.now();
    
    setScore(0);
    setGameState('playing');
  };

  const pauseGame = () => {
    triggerClick();
    const state = stateRef.current;
    state.gameState = 'paused';
    setGameState('paused');
  };

  const resumeGame = () => {
    triggerClick();
    const state = stateRef.current;
    state.gameState = 'playing';
    state.lastTime = performance.now();
    state.lastPoopSpawnTime = performance.now();
    setGameState('playing');
  };

  // Drag movement for mobile touch control
  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || stateRef.current.gameState !== 'playing') return;

    const rect = canvas.getBoundingClientRect();
    const touchX = e.touches[0].clientX - rect.left;
    
    // Scale horizontal touch position to logical canvas width
    const scaledX = (touchX / rect.width) * CANVAS_WIDTH;
    stateRef.current.player.targetX = scaledX - PLAYER_WIDTH / 2;
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    // Treat touch start as movement target too
    handleTouchMove(e);
  };

  // Virtual buttons for tap movement
  const handlePressLeft = (pressed: boolean) => {
    stateRef.current.keys.left = pressed;
  };

  const handlePressRight = (pressed: boolean) => {
    stateRef.current.keys.right = pressed;
  };

  return (
    <div className="flex flex-col items-center select-none bg-[#E4E3E0] font-mono outline-none p-1">
      
      {/* Settings / Controls Menu bar */}
      <div className="w-full bg-[#D9D8D5] p-2 border-2 border-[#141414] flex items-center justify-between text-xs overflow-x-auto gap-2">
        <div className="flex items-center gap-1.5 shrink-0">
          <button 
            onClick={handleToggleMute}
            title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
            className="p-1.5 bg-white border-2 border-[#141414] text-[#141414] font-black uppercase text-[10px] tracking-wider hover:bg-[#FF6321] hover:text-white transition-colors cursor-pointer shadow-[2px_2px_0px_#141414] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
          >
            {isMuted ? <VolumeX size={13} strokeWidth={2.5} /> : <Volume2 size={13} strokeWidth={2.5} />}
          </button>
          
          <button 
            onClick={() => { triggerClick(); setUseCRT(!useCRT); }}
            title="CRT Monitor Filter"
            className={`p-1.5 border-2 border-[#141414] flex items-center gap-1 transition-colors cursor-pointer shadow-[2px_2px_0px_#141414] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none ${
              useCRT 
                ? 'bg-[#FF6321] text-white' 
                : 'bg-white text-[#141414] hover:bg-[#D9D8D5]'
            }`}
          >
            <Monitor size={12} strokeWidth={2.5} />
            <span className="text-[10px] font-black uppercase">CRT</span>
          </button>
        </div>

        {/* Theme select buttons */}
        <div className="flex items-center gap-1 bg-white p-1 border-2 border-[#141414] shadow-[2px_2px_0px_#141414]">
          <button 
            onClick={() => { triggerClick(); setTheme('retro-pc'); }}
            className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-wider transition-colors ${
              theme === 'retro-pc' ? 'bg-[#FF6321] text-white' : 'bg-transparent text-[#141414] hover:bg-[#D9D8D5]'
            }`}
          >
            Retro PC
          </button>
          <button 
            onClick={() => { triggerClick(); setTheme('classic-chalk'); }}
            className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-wider transition-colors ${
              theme === 'classic-chalk' ? 'bg-[#FF6321] text-white' : 'bg-transparent text-[#141414] hover:bg-[#D9D8D5]'
            }`}
          >
            Chalk
          </button>
          <button 
            onClick={() => { triggerClick(); setTheme('cyberpunk'); }}
            className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-wider transition-colors ${
              theme === 'cyberpunk' ? 'bg-[#FF6321] text-white' : 'bg-transparent text-[#141414] hover:bg-[#D9D8D5]'
            }`}
          >
            Neon
          </button>
          <button 
            onClick={() => { triggerClick(); setTheme('modern'); }}
            className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-wider transition-colors ${
              theme === 'modern' ? 'bg-[#FF6321] text-white' : 'bg-transparent text-[#141414] hover:bg-[#D9D8D5]'
            }`}
          >
            Minimal
          </button>
        </div>
      </div>

      {/* Main Canvas View */}
      <div className="relative border-3 border-[#141414] bg-white w-full max-w-[360px] mx-auto aspect-[2/3] mt-2 select-none overflow-hidden touch-none shadow-[4px_4px_0px_#141414]">
        
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          className="w-full h-full cursor-crosshair select-none block"
        />

        {/* --- MENU OVERLAYS --- */}
        {gameState === 'menu' && (
          <div className="absolute inset-0 bg-[#000000]/70 backdrop-blur-[1px] flex flex-col items-center justify-center text-center p-6 select-none animate-fade-in text-white">
            <h1 className="text-3xl font-black tracking-tighter text-[#FF6321] mb-1 font-sans uppercase animate-pulse">
              졸라맨 똥피하기
            </h1>
            <p className="text-[10px] text-zinc-300 font-mono tracking-widest uppercase mb-4">
              클래식 똥 피하기 게임 // v1.0
            </p>

            {/* Difficulty Selector */}
            <div className="w-full max-w-[200px] mb-4 bg-black/80 border border-zinc-700 p-2 font-sans">
              <div className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider mb-2 text-center">
                난이도 선택
              </div>
              <div className="grid grid-cols-3 gap-1">
                <button
                  onClick={() => { triggerClick(); setDifficulty('easy'); }}
                  className={`py-1 text-[10px] font-black border transition-all cursor-pointer ${
                    difficulty === 'easy'
                      ? 'bg-green-600 text-white border-white'
                      : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
                  }`}
                >
                  쉬움
                </button>
                <button
                  onClick={() => { triggerClick(); setDifficulty('normal'); }}
                  className={`py-1 text-[10px] font-black border transition-all cursor-pointer ${
                    difficulty === 'normal'
                      ? 'bg-[#FF6321] text-white border-white'
                      : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
                  }`}
                >
                  보통
                </button>
                <button
                  onClick={() => { triggerClick(); setDifficulty('hard'); }}
                  className={`py-1 text-[10px] font-black border transition-all cursor-pointer ${
                    difficulty === 'hard'
                      ? 'bg-red-600 text-white border-white animate-pulse'
                      : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
                  }`}
                >
                  매움
                </button>
              </div>
            </div>

            <div className="space-y-4 w-full max-w-[190px]">
              <button
                onClick={startGame}
                className="w-full py-3 px-5 bg-[#FF6321] border-2 border-white hover:bg-white hover:text-black hover:border-[#141414] text-white font-black tracking-widest text-sm flex items-center justify-center gap-2 shadow-[4px_4px_0px_rgba(255,255,255,0.15)] transition-all cursor-pointer active:scale-95"
              >
                <Play size={16} fill="currentColor" strokeWidth={2.5} />
                게임 시작!
              </button>
            </div>

            {/* Instruction quick sheet */}
            <div className="mt-5 text-left bg-black border-2 border-white p-3 text-[10px] space-y-1 leading-relaxed text-zinc-300 max-w-[280px] font-sans">
              <div className="font-black text-[#FF6321] text-center uppercase tracking-wider mb-2">조작 방법 및 게임 규칙</div>
              <div>💻 <span className="text-white font-bold">PC:</span> 좌우 방향키(◀/▶) 또는 A/D 키로 이동</div>
              <div>📱 <span className="text-white font-bold">모바일:</span> 화면 좌우 슬라이드 또는 하단 버튼 터치</div>
              <div>💩 <span className="text-red-400 font-bold">갈색 똥:</span> 무조건 피하세요! (부딪히면 사망)</div>
              <div>✨ <span className="text-yellow-400 font-bold">황금 똥:</span> 몸으로 받아내세요! (+5점 보너스!)</div>
            </div>
          </div>
        )}

        {gameState === 'paused' && (
          <div className="absolute inset-0 bg-[#000000]/80 flex flex-col items-center justify-center text-center p-6 text-white select-none">
            <h2 className="text-3xl font-black text-[#FF6321] tracking-widest uppercase mb-6">일시 정지</h2>
            <button
              onClick={resumeGame}
              className="py-2.5 px-6 bg-white border-2 border-white text-black hover:bg-[#FF6321] hover:text-white font-black text-xs uppercase tracking-wider transition-colors duration-100 cursor-pointer shadow-[3px_3px_0px_#141414]"
            >
              게임 계속하기
            </button>
          </div>
        )}

        {gameState === 'gameover' && (
          <div className="absolute inset-0 bg-red-950/85 flex flex-col items-center justify-center text-center p-6 text-white select-none animate-fade-in">
            <h2 className="text-4xl font-black text-red-500 tracking-tighter uppercase mb-1 animate-pulse">게임 오버</h2>
            <p className="text-zinc-300 text-[11px] font-sans tracking-wide mb-5">똥에 맞아 졸라맨이 쓰러졌습니다!</p>

            <div className="bg-black px-5 py-4 border-2 border-red-500 mb-6 font-mono text-sm max-w-[210px] w-full shadow-[4px_4px_0px_rgba(239,68,68,0.25)]">
              <div className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold font-sans">최종 점수</div>
              <div className="text-3xl font-black text-yellow-400 my-1">{score}</div>
              <div className="text-[9px] text-zinc-500 uppercase tracking-wider font-bold font-sans">최고 기록: {highScore}</div>
            </div>

            <button
              onClick={startGame}
              className="py-3 px-6 bg-[#FF6321] border-2 border-white text-white font-black tracking-widest text-sm flex items-center gap-2 shadow-[4px_4px_0px_rgba(0,0,0,0.5)] active:translate-x-[1px] active:translate-y-[1px]"
            >
              <RotateCcw size={15} strokeWidth={2.5} />
              다시 하기
            </button>
            <span className="text-[9px] text-zinc-400 mt-3 font-sans uppercase tracking-wide">[Space] 키를 눌러 바로 시작할 수 있습니다</span>
          </div>
        )}
      </div>

      {/* Mobile control buttons - Only visible or clickable when playing */}
      <div className="w-full max-w-[360px] grid grid-cols-2 gap-3 mt-3 p-1 shrink-0">
        <button
          onTouchStart={() => handlePressLeft(true)}
          onTouchEnd={() => handlePressLeft(false)}
          onMouseDown={() => handlePressLeft(true)}
          onMouseUp={() => handlePressLeft(false)}
          onMouseLeave={() => handlePressLeft(false)}
          className="py-4 bg-[#FF6321] text-white border-3 border-[#141414] hover:bg-white hover:text-black font-black tracking-widest text-lg flex items-center justify-center gap-2 select-none touch-none cursor-pointer shadow-[4px_4px_0px_#141414] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
        >
          ◀ 왼쪽 이동
        </button>
        <button
          onTouchStart={() => handlePressRight(true)}
          onTouchEnd={() => handlePressRight(false)}
          onMouseDown={() => handlePressRight(true)}
          onMouseUp={() => handlePressRight(false)}
          onMouseLeave={() => handlePressRight(false)}
          className="py-4 bg-[#FF6321] text-white border-3 border-[#141414] hover:bg-white hover:text-black font-black tracking-widest text-lg flex items-center justify-center gap-2 select-none touch-none cursor-pointer shadow-[4px_4px_0px_#141414] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
        >
          오른쪽 이동 ▶
        </button>
      </div>

      {/* Quick Pause overlay in bottom of box */}
      {gameState === 'playing' && (
        <button
          onClick={pauseGame}
          className="mt-2 text-[10px] text-[#FF6321] font-black uppercase tracking-widest hover:underline cursor-pointer font-sans"
        >
          [게임 일시정지]
        </button>
      )}
    </div>
  );
}
