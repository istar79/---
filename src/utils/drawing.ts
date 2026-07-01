import { Player, Poop, Splat, GameTheme } from '../types';

// Helper to draw a pixelated line style (crisp lines)
function setRetroLineStyle(ctx: CanvasRenderingContext2D, theme: GameTheme, color?: string) {
  ctx.strokeStyle = color || (theme === 'classic-chalk' ? '#ffffff' : '#3e2723'); // Dark brown for classic poop
  ctx.lineWidth = theme === 'modern' ? 2.5 : 3;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
}

/**
 * Draws the stickman character
 */
export function drawPlayer(
  ctx: CanvasRenderingContext2D,
  player: Player,
  theme: GameTheme
) {
  const { x, y, width, height, direction, animFrame, isHit, hitProgress } = player;
  
  ctx.save();
  
  // Set theme colors
  let outlineColor = '#000000';
  let fillColor = '#ffffff';
  
  if (theme === 'classic-chalk') {
    outlineColor = '#ffffff';
    fillColor = 'transparent';
  } else if (theme === 'cyberpunk') {
    outlineColor = '#00f0ff';
    fillColor = '#001a2e';
  } else if (theme === 'modern') {
    outlineColor = '#1e293b';
    fillColor = '#f8fafc';
  } else {
    // Retro PC / Windows 95
    outlineColor = '#000000';
    fillColor = '#ffffff';
  }

  setRetroLineStyle(ctx, theme, outlineColor);
  
  // Center coordinates of the stickman
  const cx = x + width / 2;
  const cy = y + height / 2;
  
  if (isHit) {
    // Draw dead/hit stickman (squashed on the ground or spinning away)
    ctx.translate(cx, cy);
    const rotation = hitProgress * Math.PI * 2;
    ctx.rotate(rotation);
    
    // Squashed head or sad face
    ctx.beginPath();
    ctx.arc(0, -10, 10, 0, Math.PI * 2);
    if (fillColor !== 'transparent') {
      ctx.fillStyle = fillColor;
      ctx.fill();
    }
    ctx.stroke();
    
    // Dead eyes (X X)
    ctx.beginPath();
    ctx.moveTo(-5, -13); ctx.lineTo(-1, -9);
    ctx.moveTo(-1, -13); ctx.lineTo(-5, -9);
    ctx.moveTo(1, -13); ctx.lineTo(5, -9);
    ctx.moveTo(5, -13); ctx.lineTo(1, -9);
    ctx.stroke();

    // Sad mouth
    ctx.beginPath();
    ctx.arc(0, -4, 4, Math.PI, 0);
    ctx.stroke();

    // Crooked spine and legs flying
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(0, 15); // spine
    // Limbs splayed out
    ctx.moveTo(0, 5); ctx.lineTo(-12, 0); // left arm
    ctx.moveTo(0, 5); ctx.lineTo(12, -2); // right arm
    ctx.moveTo(0, 15); ctx.lineTo(-10, 25); // left leg
    ctx.moveTo(0, 15); ctx.lineTo(10, 24); // right leg
    ctx.stroke();
    
    ctx.restore();
    return;
  }

  // Draw healthy stickman
  const headRadius = width / 3.5;
  const bodyLength = height * 0.4;
  
  // Idle bounce or running bounce
  const bounce = direction === 'idle' 
    ? Math.sin(animFrame * 0.15) * 1.5
    : Math.abs(Math.sin(animFrame * 0.3)) * 2.5;
  
  const headY = y + headRadius + 2 - bounce;
  const neckY = headY + headRadius;
  const hipY = neckY + bodyLength;
  
  // 1. Head
  ctx.beginPath();
  ctx.arc(cx, headY, headRadius, 0, Math.PI * 2);
  if (fillColor !== 'transparent') {
    ctx.fillStyle = fillColor;
    ctx.fill();
  }
  ctx.stroke();
  
  // Head details (Eyes looking in the direction, classic face)
  ctx.beginPath();
  const eyeOffset = direction === 'left' ? -3 : direction === 'right' ? 3 : 0;
  if (direction !== 'idle') {
    // Simple running eyes looking forward
    ctx.arc(cx + eyeOffset, headY - 2, 1.5, 0, Math.PI * 2);
    ctx.fillStyle = outlineColor;
    ctx.fill();
  } else {
    // Blink animation occasionally
    const isBlinking = Math.floor(animFrame / 15) % 10 === 0;
    if (isBlinking) {
      // flat blink line
      ctx.moveTo(cx - 3, headY - 2); ctx.lineTo(cx - 1, headY - 2);
      ctx.moveTo(cx + 1, headY - 2); ctx.lineTo(cx + 3, headY - 2);
    } else {
      ctx.arc(cx - 2, headY - 2, 1.5, 0, Math.PI * 2);
      ctx.arc(cx + 2, headY - 2, 1.5, 0, Math.PI * 2);
      ctx.fillStyle = outlineColor;
      ctx.fill();
    }
    ctx.stroke();
  }

  // Smile or open mouth if running fast
  ctx.beginPath();
  if (direction !== 'idle') {
    // Open running mouth (worried circle)
    ctx.arc(cx + eyeOffset, headY + 3, 2, 0, Math.PI * 2);
    if (fillColor !== 'transparent') {
      ctx.fillStyle = outlineColor;
      ctx.fill();
    }
  } else {
    // Idle small smile
    ctx.arc(cx, headY + 2, 3, 0.1 * Math.PI, 0.9 * Math.PI);
  }
  ctx.stroke();

  // 2. Torso (Spine)
  ctx.beginPath();
  ctx.moveTo(cx, neckY);
  ctx.lineTo(cx, hipY);
  ctx.stroke();

  // 3. Limbs (Arms & Legs)
  ctx.beginPath();
  if (direction === 'idle') {
    // Arms slightly breathing
    const armWiggle = Math.sin(animFrame * 0.1) * 1.5;
    ctx.moveTo(cx, neckY + 4);
    ctx.lineTo(cx - 10, neckY + 12 + armWiggle); // left arm
    ctx.moveTo(cx, neckY + 4);
    ctx.lineTo(cx + 10, neckY + 12 + armWiggle); // right arm
    
    // Legs standing flat
    ctx.moveTo(cx, hipY);
    ctx.lineTo(cx - 7, y + height); // left leg
    ctx.moveTo(cx, hipY);
    ctx.lineTo(cx + 7, y + height); // right leg
  } else {
    // RUNNING ANIMATION
    const runCycle = animFrame * 0.35;
    const leftAngle = Math.sin(runCycle);
    const rightAngle = -Math.sin(runCycle);
    
    // Arms swing
    ctx.moveTo(cx, neckY + 4);
    ctx.lineTo(cx + leftAngle * 12, neckY + 15 + Math.cos(runCycle) * 3); // left arm
    ctx.moveTo(cx, neckY + 4);
    ctx.lineTo(cx + rightAngle * 12, neckY + 15 - Math.cos(runCycle) * 3); // right arm

    // Legs split
    const leftLegEndX = cx + Math.sin(runCycle) * 12;
    const leftLegEndY = y + height - Math.abs(Math.cos(runCycle)) * 4;
    const rightLegEndX = cx - Math.sin(runCycle) * 12;
    const rightLegEndY = y + height - Math.abs(Math.sin(runCycle)) * 4;

    ctx.moveTo(cx, hipY);
    ctx.lineTo(leftLegEndX, leftLegEndY); // left leg
    ctx.moveTo(cx, hipY);
    ctx.lineTo(rightLegEndX, rightLegEndY); // right leg
  }
  ctx.stroke();

  ctx.restore();
}

/**
 * Draws a classic retro spiral Poop (똥)
 */
export function drawPoop(
  ctx: CanvasRenderingContext2D,
  poop: Poop,
  theme: GameTheme
) {
  const { x, y, width, height, type, color, angle } = poop;
  
  ctx.save();
  ctx.translate(x + width / 2, y + height / 2);
  ctx.rotate(angle);

  // Set line styling
  let strokeColor = '#3e2723'; // Dark brown
  let fillColor = '#ffffff';

  if (theme === 'classic-chalk') {
    strokeColor = '#ffffff';
    fillColor = 'transparent';
  } else if (theme === 'cyberpunk') {
    strokeColor = '#ff007f';
    fillColor = '#1a000a';
    if (type === 'golden') {
      strokeColor = '#ffe600';
      fillColor = '#332b00';
    }
  } else if (theme === 'modern') {
    strokeColor = '#7c2d12'; // deep orange-brown
    fillColor = '#ffedd5'; // very soft orange
    if (type === 'golden') {
      strokeColor = '#854d0e';
      fillColor = '#fef08a';
    }
  } else {
    // Classic Retro PC / Win95
    strokeColor = '#3e2723';
    fillColor = '#ffffff';
    if (type === 'golden') {
      strokeColor = '#b58900';
      fillColor = '#ffecb3';
    }
  }

  setRetroLineStyle(ctx, theme, strokeColor);

  // Poop is rendered inside a local coordinate box around (0,0) with size width x height
  const w = width;
  const h = height;
  const hw = w / 2;
  const hh = h / 2;

  // Draw Poop Shape: 3 tiers of spirals, and the small curly tip
  // Fill first
  if (fillColor !== 'transparent') {
    ctx.fillStyle = fillColor;
    ctx.beginPath();
    
    // Bottom level
    ctx.moveTo(-hw, hh - 2);
    ctx.bezierCurveTo(-hw, hh - h * 0.3, hw, hh - h * 0.3, hw, hh - 2);
    ctx.bezierCurveTo(hw + 2, hh, -hw - 2, hh, -hw, hh - 2);
    
    // Base shape for full fill
    ctx.beginPath();
    ctx.moveTo(-hw * 0.85, hh - 1);
    ctx.bezierCurveTo(-hw * 1.1, hh - h * 0.35, -hw * 0.4, hh - h * 0.45, -hw * 0.6, hh - h * 0.6); // bottom-left to mid-left
    ctx.bezierCurveTo(-hw * 0.7, hh - h * 0.8, -hw * 0.2, hh - h * 0.85, -0.1 * hw, -hh * 0.8); // mid-left to top-left
    ctx.quadraticCurveTo(0, -hh * 1.05, hw * 0.1, -hh * 0.8); // curly tip
    ctx.bezierCurveTo(hw * 0.2, hh - h * 0.85, hw * 0.7, hh - h * 0.8, hw * 0.6, hh - h * 0.6); // top-right to mid-right
    ctx.bezierCurveTo(hw * 0.4, hh - h * 0.45, hw * 1.1, hh - h * 0.35, hw * 0.85, hh - 1); // mid-right to bottom-right
    ctx.closePath();
    
    ctx.fill();
  }

  // Draw outlines for the tiers
  ctx.beginPath();
  
  // TIER 1: Bottom tier
  ctx.moveTo(-hw * 0.85, hh - 2);
  ctx.bezierCurveTo(-hw * 1.1, hh - h * 0.35, hw * 1.1, hh - h * 0.35, hw * 0.85, hh - 2);
  ctx.bezierCurveTo(hw * 0.6, hh + 2, -hw * 0.6, hh + 2, -hw * 0.85, hh - 2);
  
  // TIER 2: Middle tier
  ctx.moveTo(-hw * 0.7, hh - h * 0.35);
  ctx.bezierCurveTo(-hw * 0.9, hh - h * 0.68, hw * 0.9, hh - h * 0.68, hw * 0.7, hh - h * 0.35);
  
  // TIER 3: Top tier & tip swirl
  ctx.moveTo(-hw * 0.45, hh - h * 0.68);
  ctx.bezierCurveTo(-hw * 0.5, hh - h * 0.95, 0, -hh * 1.05, 0, -hh * 0.85); // Up to the peak
  ctx.quadraticCurveTo(-hw * 0.15, -hh * 0.7, hw * 0.15, -hh * 0.75); // Curled tip details
  
  ctx.stroke();

  // Internal accent lines that separate tiers (crucial for retro 2.5D poop look)
  ctx.beginPath();
  // bottom separator
  ctx.moveTo(-hw * 0.65, hh - h * 0.3);
  ctx.quadraticCurveTo(0, hh - h * 0.15, hw * 0.65, hh - h * 0.3);
  // middle separator
  ctx.moveTo(-hw * 0.45, hh - h * 0.62);
  ctx.quadraticCurveTo(0, hh - h * 0.48, hw * 0.45, hh - h * 0.62);
  ctx.stroke();

  // Golden shine effect if golden type!
  if (type === 'golden') {
    ctx.fillStyle = theme === 'classic-chalk' ? '#ffffff' : '#ffd700';
    // Small sparkle stars around the poop
    const time = Date.now() * 0.005;
    for (let i = 0; i < 3; i++) {
      const sparkleAngle = time + i * (Math.PI * 2 / 3);
      const sx = Math.cos(sparkleAngle) * (hw + 8);
      const sy = Math.sin(sparkleAngle) * (hh + 8);
      
      ctx.beginPath();
      ctx.arc(sx, sy, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Speed lines for 'fast' type
  if (type === 'fast') {
    ctx.beginPath();
    ctx.moveTo(0, -hh - 10);
    ctx.lineTo(0, -hh - 4);
    ctx.moveTo(-hw * 0.5, -hh - 8);
    ctx.lineTo(-hw * 0.5, -hh - 3);
    ctx.moveTo(hw * 0.5, -hh - 8);
    ctx.lineTo(hw * 0.5, -hh - 3);
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Draws ground splat when poop falls
 */
export function drawSplat(
  ctx: CanvasRenderingContext2D,
  splat: Splat,
  theme: GameTheme
) {
  const { x, y, width, height, life, maxLife } = splat;
  
  ctx.save();
  
  let strokeColor = '#3e2723';
  let fillColor = '#ffffff';

  if (theme === 'classic-chalk') {
    strokeColor = '#ffffff';
    fillColor = 'transparent';
  } else if (theme === 'cyberpunk') {
    strokeColor = '#ff007f';
    fillColor = '#1a000a';
  } else if (theme === 'modern') {
    strokeColor = '#7c2d12';
    fillColor = '#ffedd5';
  } else {
    strokeColor = '#3e2723';
    fillColor = '#ffffff';
  }

  setRetroLineStyle(ctx, theme, strokeColor);

  // Splat opacity declines as it dies out
  const opacity = life / maxLife;
  ctx.globalAlpha = opacity;

  // Center around (x, y)
  const cx = x;
  const cy = y;
  const rx = width / 2;
  const ry = height / 2;

  // Splash drops around the central splat
  ctx.beginPath();
  // Central puddle
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  
  if (fillColor !== 'transparent') {
    ctx.fillStyle = fillColor;
    ctx.fill();
  }
  ctx.stroke();

  // Little splashes on the side
  ctx.beginPath();
  // Left splash droplet
  ctx.arc(cx - rx * 1.1, cy - ry * 0.2, rx * 0.25, 0, Math.PI * 2);
  // Right splash droplet
  ctx.arc(cx + rx * 1.1, cy - ry * 0.2, rx * 0.25, 0, Math.PI * 2);
  // Top splash droplets
  ctx.arc(cx - rx * 0.5, cy - ry * 1.2, rx * 0.2, 0, Math.PI * 2);
  ctx.arc(cx + rx * 0.5, cy - ry * 1.2, rx * 0.2, 0, Math.PI * 2);
  
  if (fillColor !== 'transparent') {
    ctx.fillStyle = fillColor;
    ctx.fill();
  }
  ctx.stroke();

  ctx.restore();
}

/**
 * Draws retro CRT Scanlines and curvature simulation
 */
export function drawCRTEffect(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
) {
  ctx.save();
  ctx.globalAlpha = 0.07;
  ctx.fillStyle = '#000000';

  // Draw horizontal scanlines
  for (let y = 0; y < height; y += 3) {
    ctx.fillRect(0, y, width, 1.5);
  }

  // Draw screen vignette / glow
  const gradient = ctx.createRadialGradient(
    width / 2, height / 2, Math.min(width, height) * 0.4,
    width / 2, height / 2, Math.max(width, height) * 0.8
  );
  gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0.55)');
  
  ctx.globalAlpha = 0.25;
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  ctx.restore();
}
