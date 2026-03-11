/**
 * Port of 2026 Website index.html effects: sparkles, glitch, ambient particles, audio, CRT.
 * Call initFightEffects() from onMount after the DOM is ready.
 */
const AUDIO_COUNT = 23;
const AUDIO_FOLDER = '/audio/';
const AUDIO_EXT = '.mp3';
const AUDIO_COOLDOWN_MS = 380;
const SPARKLES_PER_FRAME = 3;
const PIXEL_THRESHOLD = 40;

function drawStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, outer: number, inner: number) {
  const spikes = 4;
  const step = Math.PI / spikes;
  let rot = -Math.PI / 2;
  ctx.beginPath();
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    ctx.lineTo(cx + Math.cos(rot) * r, cy + Math.sin(rot) * r);
    rot += step;
  }
  ctx.closePath();
  ctx.fill();
}

export function initFightEffects() {
  const logoImg = document.getElementById('logo-img') as HTMLImageElement;
  const effectCanvas = document.getElementById('effect-canvas') as HTMLCanvasElement;
  const glitchCanvas = document.getElementById('glitch-canvas') as HTMLCanvasElement;
  const ambientCanvas = document.getElementById('ambient-canvas') as HTMLCanvasElement;
  const noiseCanvas = document.getElementById('noise-canvas') as HTMLCanvasElement;

  if (!logoImg || !effectCanvas || !glitchCanvas || !ambientCanvas || !noiseCanvas) return;

  const ctx = effectCanvas.getContext('2d')!;
  const glitchCtx = glitchCanvas.getContext('2d')!;
  const ambientCtx = ambientCanvas.getContext('2d')!;
  const noiseCtx = noiseCanvas.getContext('2d')!;

  const detectCanvas = document.createElement('canvas');
  const detectCtx = detectCanvas.getContext('2d', { willReadFrequently: true })!;

  let mouseX = -9999, mouseY = -9999;
  let onLogo = false;
  let wasOnLogo = false;
  let logoOK: boolean | 'bbox' = false;
  let sparkles: Sparkle[] = [];
  let audioIndex = 0;
  let lastSoundAt = 0;
  let activeSounds: HTMLAudioElement[] = [];
  let audioUnlocked = false;
  let revealComplete = false;

  const sounds = Array.from({ length: AUDIO_COUNT }, (_, i) => {
    const a = new Audio();
    if (i < 3) {
      a.preload = 'auto';
      a.src = AUDIO_FOLDER + (i + 1) + AUDIO_EXT;
    } else {
      setTimeout(() => {
        a.preload = 'auto';
        a.src = AUDIO_FOLDER + (i + 1) + AUDIO_EXT;
      }, (i - 2) * 150);
    }
    return a;
  });

  const clickPrompt = document.getElementById('click-prompt');

  function initCanvases() {
    const w = logoImg.offsetWidth;
    const h = logoImg.offsetHeight;
    effectCanvas.width = w;
    effectCanvas.height = h;
    detectCanvas.width = logoImg.naturalWidth;
    detectCanvas.height = logoImg.naturalHeight;
    try {
      detectCtx.drawImage(logoImg, 0, 0);
      detectCtx.getImageData(0, 0, 1, 1);
      logoOK = true;
    } catch {
      logoOK = 'bbox';
    }
  }

  function pixelIsLogo(elX: number, elY: number): boolean {
    if (!logoOK) return false;
    if (logoOK === 'bbox') return true;
    const sx = logoImg.naturalWidth / logoImg.offsetWidth;
    const sy = logoImg.naturalHeight / logoImg.offsetHeight;
    const px = Math.round(elX * sx);
    const py = Math.round(elY * sy);
    if (px < 0 || py < 0 || px >= detectCanvas.width || py >= detectCanvas.height) return false;
    try {
      const [r, g, b] = detectCtx.getImageData(px, py, 1, 1).data;
      const brightness = r * 0.299 + g * 0.587 + b * 0.114;
      return brightness > PIXEL_THRESHOLD;
    } catch {
      logoOK = 'bbox';
      return true;
    }
  }

  class Sparkle {
    x: number; y: number; vx: number; vy: number; life: number; decay: number;
    r: number; rot: number; hue: number; type: number;
    constructor(x: number, y: number) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.4 + Math.random() * 1.8;
      this.x = x; this.y = y;
      this.vx = Math.cos(angle) * speed;
      this.vy = Math.sin(angle) * speed - 0.8;
      this.life = 1;
      this.decay = 0.012 + Math.random() * 0.018;
      this.r = 4 + Math.random() * 7;
      this.rot = Math.random() * Math.PI / 4;
      this.hue = 36 + Math.random() * 24;
      this.type = Math.random();
    }
    update() {
      this.x += this.vx; this.y += this.vy;
      this.vy += 0.04; this.vx *= 0.98;
      this.life -= this.decay;
    }
    draw(c: CanvasRenderingContext2D) {
      if (this.life <= 0) return;
      const a = Math.max(0, this.life);
      const scale = a;
      c.save();
      c.globalAlpha = a;
      c.translate(this.x, this.y);
      c.rotate(this.rot);
      if (this.type > 0.55) {
        const outer = this.r * scale;
        const inner = outer * 0.08;
        c.shadowColor = `hsl(${this.hue}, 100%, 85%)`;
        c.shadowBlur = 12;
        c.fillStyle = `hsl(${this.hue}, 100%, 85%)`;
        drawStar(c, 0, 0, outer, inner);
        c.shadowBlur = 6;
        c.fillStyle = 'rgba(255,255,255,0.95)';
        drawStar(c, 0, 0, outer * 0.18, outer * 0.06);
      } else if (this.type > 0.25) {
        const s = this.r * scale * 0.8;
        c.shadowColor = `hsl(${this.hue}, 100%, 85%)`;
        c.shadowBlur = 10;
        c.fillStyle = `hsl(${this.hue}, 100%, 88%)`;
        c.beginPath();
        c.moveTo(0, -s);
        c.lineTo(s * 0.28, 0);
        c.lineTo(0, s);
        c.lineTo(-s * 0.28, 0);
        c.closePath();
        c.fill();
      } else {
        const len = this.r * scale * 1.2;
        const wid = len * 0.12;
        c.shadowColor = `hsl(${this.hue}, 100%, 90%)`;
        c.shadowBlur = 8;
        c.fillStyle = 'rgba(255,255,255,0.92)';
        c.fillRect(-len / 2, -wid / 2, len, wid);
      }
      c.restore();
    }
  }

  function triggerSound() {
    if (!audioUnlocked || !revealComplete) return;
    const now = Date.now();
    if (now - lastSoundAt < AUDIO_COOLDOWN_MS) return;
    activeSounds = activeSounds.filter((s) => !s.paused && s.currentTime > 0);
    if (activeSounds.length >= 2) return;
    for (let attempt = 0; attempt < sounds.length; attempt++) {
      const snd = sounds[audioIndex];
      audioIndex = (audioIndex + 1) % sounds.length;
      if (snd.readyState >= 2) {
        lastSoundAt = now;
        snd.currentTime = 0;
        snd.play().catch(() => {});
        activeSounds.push(snd);
        break;
      }
    }
  }

  function drawGlitchFrame() {
    glitchCtx.clearRect(0, 0, glitchCanvas.width, glitchCanvas.height);
    const rect = logoImg.getBoundingClientRect();
    const numBands = 2 + Math.floor(Math.random() * 4);
    for (let i = 0; i < numBands; i++) {
      const bandY = rect.top + Math.random() * rect.height;
      const bandH = 2 + Math.random() * 14;
      const offsetX = (Math.random() - 0.5) * 28;
      glitchCtx.fillStyle = '#160808';
      glitchCtx.fillRect(rect.left, bandY, rect.width, bandH);
      glitchCtx.save();
      glitchCtx.beginPath();
      glitchCtx.rect(rect.left, bandY, rect.width, bandH);
      glitchCtx.clip();
      glitchCtx.globalCompositeOperation = 'screen';
      glitchCtx.drawImage(logoImg, rect.left + offsetX, rect.top, rect.width, rect.height);
      glitchCtx.restore();
    }
    if (Math.random() < 0.5) {
      const lineY = rect.top + Math.random() * rect.height;
      const lineH = 1 + Math.floor(Math.random() * 2);
      glitchCtx.fillStyle = `rgba(253, 193, 10, ${0.2 + Math.random() * 0.4})`;
      glitchCtx.fillRect(0, lineY, glitchCanvas.width, lineH);
    }
  }

  function runGlitch() {
    const duration = 150 + Math.random() * 250;
    const startTime = Date.now();
    function step() {
      if (Date.now() - startTime < duration) {
        drawGlitchFrame();
        setTimeout(step, 40 + Math.random() * 50);
      } else {
        glitchCtx.clearRect(0, 0, glitchCanvas.width, glitchCanvas.height);
      }
    }
    step();
  }

  function scheduleGlitch() {
    setTimeout(() => {
      runGlitch();
      scheduleGlitch();
    }, 4000 + Math.random() * 7000);
  }

  class DriftParticle {
    x = 0; y = 0; vx = 0; vy = 0; r = 0; hue = 0; maxLife = 0; life = 0;
    constructor(randomStart: boolean) {
      this.init(randomStart);
    }
    init(randomStart: boolean) {
      this.x = Math.random() * ambientCanvas.width;
      this.y = randomStart ? Math.random() * ambientCanvas.height : ambientCanvas.height + 10;
      this.vx = (Math.random() - 0.5) * 0.25;
      this.vy = -(0.15 + Math.random() * 0.35);
      this.r = 0.8 + Math.random() * 1.6;
      this.hue = 38 + Math.random() * 18;
      this.maxLife = 300 + Math.random() * 400;
      this.life = randomStart ? Math.floor(Math.random() * this.maxLife) : 0;
    }
    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.life++;
      if (this.life >= this.maxLife || this.y < -10) this.init(false);
    }
    draw(c: CanvasRenderingContext2D) {
      const alpha = Math.sin((this.life / this.maxLife) * Math.PI) * 0.35;
      if (alpha <= 0) return;
      c.save();
      c.globalAlpha = alpha;
      c.fillStyle = `hsl(${this.hue}, 100%, 65%)`;
      c.shadowColor = `hsl(${this.hue}, 100%, 75%)`;
      c.shadowBlur = 5;
      c.beginPath();
      c.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      c.fill();
      c.restore();
    }
  }

  const driftParticles = Array.from({ length: 22 }, () => new DriftParticle(true));

  noiseCanvas.width = 320;
  noiseCanvas.height = 180;
  let noiseFrame = 0;

  function drawNoise() {
    const w = noiseCanvas.width;
    const h = noiseCanvas.height;
    const img = noiseCtx.createImageData(w, h);
    const data = img.data;
    for (let i = 0; i < data.length; i += 4) {
      const v = Math.random() * 255;
      data[i] = data[i + 1] = data[i + 2] = v;
      data[i + 3] = 255;
    }
    noiseCtx.putImageData(img, 0, 0);
  }

  function glitchReveal() {
    const scene = document.getElementById('scene');
    if (!scene) return;
    const frames: [number, number, number, boolean][] = [
      [60, 1, 6.0, true], [120, 0, 1, false], [210, 1, 4.5, true], [290, 0, 1, false],
      [360, 1, 3.5, true], [420, 0, 1, false], [480, 1, 3.0, true], [540, 0, 1, false],
      [600, 1, 2.5, true], [650, 0, 1, false], [700, 1, 2.0, true], [800, 0, 1, false],
      [850, 1, 1.8, true], [990, 0, 1, false], [1050, 1, 1.5, true], [1200, 1, 1.2, true],
      [1400, 1, 1.0, false],
    ];
    frames.forEach(([delay, opacity, brightness, doGlitch]) => {
      setTimeout(() => {
        scene.style.opacity = String(opacity);
        scene.style.filter = brightness > 1 ? `brightness(${brightness})` : '';
        if (doGlitch) drawGlitchFrame();
      }, delay);
    });
    setTimeout(() => {
      glitchCtx.clearRect(0, 0, glitchCanvas.width, glitchCanvas.height);
      revealComplete = true;
      scheduleGlitch();
    }, 1600);
  }

  const unlockAudio = () => {
    if (audioUnlocked) return;
    audioUnlocked = true;
    const gate = document.getElementById('tap-gate');
    if (gate) gate.classList.add('done');
    if (clickPrompt) {
      clickPrompt.style.animation = 'none';
      clickPrompt.style.opacity = '1';
      clickPrompt.innerHTML = 'crank it up . here we go.<span class="prompt-sub" id="prompt-sub-line">speakers on</span>';
    }
    setTimeout(() => {
      const sub = document.getElementById('prompt-sub-line');
      if (sub) sub.textContent = 'the logo is your instrument';
    }, 2250);
    try {
      const p = sounds[0];
      if (p) {
        p.volume = 0;
        p.play().then(() => { p.pause(); p.currentTime = 0; p.volume = 1; }).catch(() => {});
      }
    } catch {}
    try {
      const intro = sounds[15];
      if (intro) {
        intro.currentTime = 0;
        intro.play().catch(() => {});
      }
    } catch {}
    setTimeout(() => {
      clickPrompt?.classList.add('hidden');
      setTimeout(() => {
        clickPrompt?.remove();
        document.body.classList.add('unlocked');
        try {
          glitchReveal();
        } catch {
          const s = document.getElementById('scene');
          if (s) s.style.opacity = '1';
        }
      }, 900);
    }, 4500);
  };

  (window as unknown as { unlockAudio: () => void }).unlockAudio = unlockAudio;
  window.addEventListener('click', unlockAudio, { once: true });
  window.addEventListener('touchstart', unlockAudio, { once: true });

  logoImg.addEventListener('load', initCanvases);
  if (logoImg.complete && logoImg.naturalWidth) initCanvases();
  window.addEventListener('resize', initCanvases);

  function resizeGlitch() {
    glitchCanvas.width = window.innerWidth;
    glitchCanvas.height = window.innerHeight;
  }
  resizeGlitch();
  window.addEventListener('resize', resizeGlitch);

  function resizeAmbient() {
    ambientCanvas.width = window.innerWidth;
    ambientCanvas.height = window.innerHeight;
  }
  resizeAmbient();
  window.addEventListener('resize', resizeAmbient);

  window.addEventListener('mousemove', (e) => {
    const rect = logoImg.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
    onLogo = pixelIsLogo(mouseX, mouseY);
    logoImg.style.animationPlayState = onLogo ? 'paused' : 'running';
  });
  window.addEventListener('mouseleave', () => { onLogo = false; });

  function animate() {
    requestAnimationFrame(animate);
    ctx.clearRect(0, 0, effectCanvas.width, effectCanvas.height);
    noiseFrame++;
    if (noiseFrame % 2 === 0) drawNoise();
    ambientCtx.clearRect(0, 0, ambientCanvas.width, ambientCanvas.height);
    for (const p of driftParticles) {
      p.update();
      p.draw(ambientCtx);
    }
    if (onLogo) {
      for (let i = 0; i < SPARKLES_PER_FRAME; i++) {
        sparkles.push(new Sparkle(mouseX + (Math.random() - 0.5) * 10, mouseY + (Math.random() - 0.5) * 10));
      }
      triggerSound();
    }
    if (!onLogo && wasOnLogo) {
      activeSounds.forEach((s) => { s.pause(); s.currentTime = 0; });
      activeSounds = [];
      lastSoundAt = 0;
    }
    wasOnLogo = onLogo;
    sparkles = sparkles.filter((s) => s.life > 0);
    for (const s of sparkles) {
      s.update();
      s.draw(ctx);
    }
  }
  animate();
}
