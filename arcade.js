// ===== Game Configuration =====
const GAMES = [
  {
    id: 'gogodrive',
    title: '고고드라이브',
    path: 'games/gogodrive/고고드라이브.html',
    color: '#FFD700',
    description: '3D RACING',
    screenshot: 'games/gogodrive/screenshots/gameplay.png',
  },
  {
    id: 'shoot',
    title: '베스트 슈터',
    path: 'games/shoot/index.html',
    color: '#FF4488',
    description: '2D SHOOTING',
    screenshot: 'games/shoot/screenshots/gameplay.png',
  },
  {
    id: 'robot-fighter',
    title: '로봇 파이터',
    path: 'games/robot-fighter/index.html',
    color: '#44BBFF',
    description: '3D ACTION',
    screenshot: 'games/robot-fighter/screenshots/gameplay.png',
  },
];

// ===== DOM Elements =====
const coinCountEl = document.getElementById('coin-count');
const addCoinBtn = document.getElementById('add-coin-btn');
const canvasContainer = document.getElementById('three-canvas-container');
const passwordModal = document.getElementById('password-modal');
const pinInputs = document.querySelectorAll('.pin-input');
const pinError = document.getElementById('pin-error');
const pinCancel = document.getElementById('pin-cancel');
const gameViewport = document.getElementById('game-viewport');
const gameIframe = document.getElementById('game-iframe');
const gameLoading = document.getElementById('game-loading');
const exitBtn = document.getElementById('exit-btn');

// ===== State =====
let coins = parseInt(localStorage.getItem('arcade-coins') || '0', 10);

// ===== Coin System =====
function updateCoins(value) {
  coins = value;
  coinCountEl.textContent = coins;
  localStorage.setItem('arcade-coins', coins);
  if (window._rendererReady) updateCoinCursor();
}

coinCountEl.textContent = coins;

// ===== Sound Effects (Web Audio API) =====
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playCoinSound() {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.type = 'sine';
  osc.frequency.setValueAtTime(1200, audioCtx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(2400, audioCtx.currentTime + 0.08);
  gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
  osc.start(audioCtx.currentTime);
  osc.stop(audioCtx.currentTime + 0.2);
}

function playErrorSound() {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.type = 'square';
  osc.frequency.setValueAtTime(150, audioCtx.currentTime);
  gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
  osc.start(audioCtx.currentTime);
  osc.stop(audioCtx.currentTime + 0.3);
}

// ===== Arcade BGM =====
let bgmStarted = false;
let bgmInterval = null;
let bgmPadNodes = [];
let bgmGain = null;
let bgmBeat = 0;

function startArcadeBGM() {
  if (bgmStarted) return;
  bgmStarted = true;
  if (audioCtx.state === 'suspended') audioCtx.resume();

  bgmGain = audioCtx.createGain();
  bgmGain.gain.value = 0.12;
  bgmGain.connect(audioCtx.destination);

  // Warm ambient pad (arcade hum)
  const padGain = audioCtx.createGain();
  padGain.gain.value = 0.04;
  padGain.connect(bgmGain);
  [130.81, 164.81, 196.00, 261.63].forEach(freq => { // C3 E3 G3 C4
    const osc = audioCtx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(padGain);
    osc.start();
    bgmPadNodes.push(osc);
  });
  bgmPadNodes.push(padGain);

  const BPM = 120;
  const beatMs = (60 / BPM) * 1000;

  // Funky arcade melody - pentatonic scale for that retro feel
  const melodyNotes = [
    523.25, 0, 659.25, 0, 783.99, 659.25, 0, 523.25,
    587.33, 0, 783.99, 0, 1046.5, 783.99, 0, 659.25,
    523.25, 659.25, 783.99, 1046.5, 783.99, 659.25, 523.25, 0,
    440.00, 523.25, 587.33, 659.25, 523.25, 0, 440.00, 0
  ];

  const bassNotes = [
    130.81, 0, 130.81, 0, 146.83, 0, 146.83, 0,  // C3 D3
    164.81, 0, 164.81, 0, 130.81, 0, 196.00, 0,  // E3 C3 G3
    174.61, 0, 174.61, 0, 146.83, 0, 146.83, 0,  // F3 D3
    130.81, 0, 196.00, 0, 164.81, 0, 130.81, 0   // C3 G3 E3 C3
  ];

  bgmInterval = setInterval(() => {
    if (!bgmGain) return;
    const now = audioCtx.currentTime;
    const idx = bgmBeat % 32;

    // Kick on 0, 4, 8... (every 4 beats)
    if (idx % 4 === 0) {
      const kick = audioCtx.createOscillator();
      const kGain = audioCtx.createGain();
      kick.type = 'sine';
      kick.frequency.setValueAtTime(120, now);
      kick.frequency.exponentialRampToValueAtTime(35, now + 0.08);
      kGain.gain.setValueAtTime(0.18, now);
      kGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      kick.connect(kGain);
      kGain.connect(bgmGain);
      kick.start(now);
      kick.stop(now + 0.15);
    }

    // Hi-hat every beat
    const hatBuf = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.03, audioCtx.sampleRate);
    const hatData = hatBuf.getChannelData(0);
    for (let i = 0; i < hatData.length; i++) hatData[i] = (Math.random() * 2 - 1) * 0.2;
    const hatSrc = audioCtx.createBufferSource();
    hatSrc.buffer = hatBuf;
    const hatGain = audioCtx.createGain();
    hatGain.gain.setValueAtTime(idx % 2 === 0 ? 0.06 : 0.03, now);
    hatGain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
    hatSrc.connect(hatGain);
    hatGain.connect(bgmGain);
    hatSrc.start(now);

    // Snare on 2, 6, 10... (offbeat)
    if (idx % 4 === 2) {
      const sBuf = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.08, audioCtx.sampleRate);
      const sData = sBuf.getChannelData(0);
      for (let i = 0; i < sData.length; i++) sData[i] = (Math.random() * 2 - 1);
      const sSrc = audioCtx.createBufferSource();
      sSrc.buffer = sBuf;
      const sGain = audioCtx.createGain();
      sGain.gain.setValueAtTime(0.07, now);
      sGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      sSrc.connect(sGain);
      sGain.connect(bgmGain);
      sSrc.start(now);
    }

    // Bass line
    const bassFreq = bassNotes[idx];
    if (bassFreq > 0) {
      const bass = audioCtx.createOscillator();
      const bGain = audioCtx.createGain();
      bass.type = 'sawtooth';
      bass.frequency.value = bassFreq;
      bGain.gain.setValueAtTime(0.08, now);
      bGain.gain.exponentialRampToValueAtTime(0.001, now + beatMs / 1200);
      bass.connect(bGain);
      bGain.connect(bgmGain);
      bass.start(now);
      bass.stop(now + beatMs / 1100);
    }

    // Melody (every 2 beats)
    if (idx % 2 === 0) {
      const melFreq = melodyNotes[idx];
      if (melFreq > 0) {
        const mel = audioCtx.createOscillator();
        const mGain = audioCtx.createGain();
        mel.type = 'square';
        mel.frequency.value = melFreq;
        mGain.gain.setValueAtTime(0.025, now);
        mGain.gain.setValueAtTime(0.025, now + beatMs / 600);
        mGain.gain.exponentialRampToValueAtTime(0.001, now + beatMs / 400);
        mel.connect(mGain);
        mGain.connect(bgmGain);
        mel.start(now);
        mel.stop(now + beatMs / 350);
      }
    }

    // Arpeggio sparkle (random chiptune bleeps)
    if (Math.random() < 0.15) {
      const arpFreqs = [1046.5, 1318.5, 1568.0, 2093.0];
      const arp = audioCtx.createOscillator();
      const aGain = audioCtx.createGain();
      arp.type = 'square';
      arp.frequency.value = arpFreqs[Math.floor(Math.random() * arpFreqs.length)];
      aGain.gain.setValueAtTime(0.015, now);
      aGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      arp.connect(aGain);
      aGain.connect(bgmGain);
      arp.start(now);
      arp.stop(now + 0.1);
    }

    bgmBeat++;
  }, beatMs);
}

function stopArcadeBGM() {
  bgmStarted = false;
  if (bgmInterval) { clearInterval(bgmInterval); bgmInterval = null; }
  bgmPadNodes.forEach(n => { try { n.stop(); } catch(e) {} try { n.disconnect(); } catch(e) {} });
  bgmPadNodes = [];
  if (bgmGain) { try { bgmGain.disconnect(); } catch(e) {} bgmGain = null; }
}

// Start BGM on first user interaction
document.addEventListener('click', () => { startArcadeBGM(); }, { once: true });

// ===== Three.js Scene Setup =====
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a3a5c);
scene.fog = new THREE.FogExp2(0x1a3a5c, 0.008);

const camera = new THREE.PerspectiveCamera(50, canvasContainer.clientWidth / canvasContainer.clientHeight, 0.1, 100);
camera.position.set(0, 2.8, 6.5);
camera.lookAt(0, 1.4, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(canvasContainer.clientWidth, canvasContainer.clientHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
canvasContainer.appendChild(renderer.domElement);
window._rendererReady = true;
updateCoinCursor();

// ===== Lighting =====
// Warm ambient (moderate)
const ambientLight = new THREE.AmbientLight(0x776699, 0.5);
scene.add(ambientLight);

// Warm ceiling spotlight
const spotLight = new THREE.SpotLight(0xffeedd, 1.0, 25, Math.PI / 3, 0.3, 0.6);
spotLight.position.set(0, 8, 3);
spotLight.target.position.set(0, 0, 0);
spotLight.castShadow = true;
spotLight.shadow.mapSize.width = 1024;
spotLight.shadow.mapSize.height = 1024;
scene.add(spotLight);
scene.add(spotLight.target);

// Cheerful neon light (warm pink/orange)
const neonLight = new THREE.PointLight(0xff77cc, 1.0, 15);
neonLight.position.set(0, 5.5, 4);
scene.add(neonLight);

// Front fill
const fillLight = new THREE.PointLight(0xccbbff, 0.5, 18);
fillLight.position.set(0, 2.5, 6);
scene.add(fillLight);

// Additional warm front lights per cabinet
const frontLightPositions = [-2.5, 0, 2.5];
frontLightPositions.forEach((x) => {
  const fl = new THREE.PointLight(0xfff5e0, 0.5, 6);
  fl.position.set(x, 2.0, 3.0);
  scene.add(fl);
});

// Ceiling lights (visible light fixtures)
[-3, 0, 3].forEach((x) => {
  const bulbGeo = new THREE.SphereGeometry(0.15, 12, 12);
  const bulbMat = new THREE.MeshBasicMaterial({ color: 0xffffee });
  const bulb = new THREE.Mesh(bulbGeo, bulbMat);
  bulb.position.set(x, 5.8, 1);
  scene.add(bulb);
  const ceilLight = new THREE.PointLight(0xfff5e0, 0.4, 8);
  ceilLight.position.set(x, 5.7, 1);
  scene.add(ceilLight);
});

// ===== Floor =====
function createFloor() {
  const floorCanvas = document.createElement('canvas');
  floorCanvas.width = 512;
  floorCanvas.height = 512;
  const fCtx = floorCanvas.getContext('2d');
  // Carpet texture - luxurious brown
  // Base color
  fCtx.fillStyle = '#3A2415';
  fCtx.fillRect(0, 0, 512, 512);
  // Carpet pattern - retro arcade style
  const patternColors = ['#4A2E1A', '#311C0E', '#553820', '#281508'];
  // Random carpet fiber noise
  for (let i = 0; i < 8000; i++) {
    const cx = Math.random() * 512;
    const cy = Math.random() * 512;
    fCtx.fillStyle = patternColors[Math.floor(Math.random() * patternColors.length)];
    fCtx.fillRect(cx, cy, 2, 2);
  }
  // Diamond/star pattern overlay
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      const cx = x * 64 + 32;
      const cy = y * 64 + 32;
      if ((x + y) % 3 === 0) {
        fCtx.fillStyle = 'rgba(255, 200, 50, 0.15)';
        fCtx.beginPath();
        fCtx.moveTo(cx, cy - 12);
        fCtx.lineTo(cx + 12, cy);
        fCtx.lineTo(cx, cy + 12);
        fCtx.lineTo(cx - 12, cy);
        fCtx.closePath();
        fCtx.fill();
      }
      if ((x + y) % 4 === 1) {
        fCtx.strokeStyle = 'rgba(255, 180, 80, 0.12)';
        fCtx.lineWidth = 1.5;
        fCtx.beginPath();
        fCtx.arc(cx, cy, 15, 0, Math.PI * 2);
        fCtx.stroke();
      }
    }
  }
  const floorTex = new THREE.CanvasTexture(floorCanvas);
  floorTex.wrapS = THREE.RepeatWrapping;
  floorTex.wrapT = THREE.RepeatWrapping;
  floorTex.repeat.set(4, 4);

  const floorGeo = new THREE.PlaneGeometry(20, 20);
  const floorMat = new THREE.MeshStandardMaterial({
    map: floorTex,
    roughness: 0.7,
    metalness: 0.05,
  });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = 0;
  floor.receiveShadow = true;
  scene.add(floor);
}
createFloor();

// ===== Back Wall =====
function createBackWall() {
  const wallGeo = new THREE.PlaneGeometry(20, 8);
  const wallCanvas = document.createElement('canvas');
  wallCanvas.width = 512;
  wallCanvas.height = 256;
  const wCtx = wallCanvas.getContext('2d');
  // Warm gradient wall
  const grad = wCtx.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, '#2e6088');
  grad.addColorStop(1, '#1a3a5c');
  wCtx.fillStyle = grad;
  wCtx.fillRect(0, 0, 512, 256);
  // Brick pattern
  wCtx.strokeStyle = 'rgba(255,255,255,0.06)';
  wCtx.lineWidth = 1;
  for (let row = 0; row < 16; row++) {
    const y = row * 16;
    wCtx.beginPath(); wCtx.moveTo(0, y); wCtx.lineTo(512, y); wCtx.stroke();
    const offset = row % 2 === 0 ? 0 : 32;
    for (let col = 0; col < 17; col++) {
      const x = col * 32 + offset;
      wCtx.beginPath(); wCtx.moveTo(x, y); wCtx.lineTo(x, y + 16); wCtx.stroke();
    }
  }
  const wallTex = new THREE.CanvasTexture(wallCanvas);
  const wallMat = new THREE.MeshStandardMaterial({ map: wallTex, roughness: 0.9, metalness: 0.0 });
  const wall = new THREE.Mesh(wallGeo, wallMat);
  wall.position.set(0, 4, -1.5);
  scene.add(wall);
}
createBackWall();

// ===== Props (Room Decorations) =====
let leaderboardPoster = null;
function createProps() {
  // --- Trash Can (right side) ---
  const trashGroup = new THREE.Group();
  const trashGeo = new THREE.CylinderGeometry(0.22, 0.25, 0.6, 16);
  const trashMat = new THREE.MeshStandardMaterial({ color: 0x5588ff, roughness: 0.6, metalness: 0.3 });
  const trashCan = new THREE.Mesh(trashGeo, trashMat);
  trashCan.position.y = 0.3;
  trashGroup.add(trashCan);
  // Rim
  const rimGeo = new THREE.TorusGeometry(0.22, 0.02, 8, 24);
  const rimMat = new THREE.MeshStandardMaterial({ color: 0x6699ff, roughness: 0.4, metalness: 0.5 });
  const rim = new THREE.Mesh(rimGeo, rimMat);
  rim.position.y = 0.6;
  rim.rotation.x = Math.PI / 2;
  trashGroup.add(rim);
  trashGroup.position.set(5.0, 0, 1.0);
  scene.add(trashGroup);

  // --- Round Table with Stools (left side) ---
  const tableGroup = new THREE.Group();
  // Table top
  const tableTopGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.06, 24);
  const tableMat = new THREE.MeshStandardMaterial({ color: 0xff8844, roughness: 0.5, metalness: 0.1 });
  const tableTop = new THREE.Mesh(tableTopGeo, tableMat);
  tableTop.position.y = 1.0;
  tableGroup.add(tableTop);
  // Table leg
  const legGeo = new THREE.CylinderGeometry(0.06, 0.08, 1.0, 12);
  const legMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.3, metalness: 0.7 });
  const leg = new THREE.Mesh(legGeo, legMat);
  leg.position.y = 0.5;
  tableGroup.add(leg);
  // Table base
  const tBaseGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.04, 24);
  const tBase = new THREE.Mesh(tBaseGeo, legMat);
  tBase.position.y = 0.02;
  tableGroup.add(tBase);
  // Stools
  [[-0.6, 0], [0.6, 0]].forEach(([sx, sz]) => {
    const seatGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.05, 16);
    const seatMat = new THREE.MeshStandardMaterial({ color: 0xff5555, roughness: 0.5, metalness: 0.1 });
    const seat = new THREE.Mesh(seatGeo, seatMat);
    seat.position.set(sx, 0.6, sz);
    tableGroup.add(seat);
    const sLeg = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.04, 0.6, 8),
      legMat
    );
    sLeg.position.set(sx, 0.3, sz);
    tableGroup.add(sLeg);
  });
  tableGroup.position.set(-5.0, 0, 1.5);
  scene.add(tableGroup);

  // --- Wall Posters/Frames ---
  const posterData = [
    { x: -5.2, y: 3.0, w: 1.2, h: 1.6, color: '#ff3333', text: 'GAME\nON!' },
    { x: 5.2, y: 3.0, w: 1.0, h: 1.0, color: '#00bbaa', text: 'HIGH\nSCORE' },
    { x: 5.2, y: 1.2, w: 0.9, h: 1.1, color: '#33cc66', text: 'PLAY!' },
  ];
  posterData.forEach((p) => {
    const pCanvas = document.createElement('canvas');
    pCanvas.width = 256;
    pCanvas.height = 256;
    const pCtx = pCanvas.getContext('2d');
    // Frame border
    pCtx.fillStyle = '#ffffff';
    pCtx.fillRect(0, 0, 256, 256);
    pCtx.fillStyle = p.color;
    pCtx.fillRect(10, 10, 236, 236);
    // Text
    pCtx.fillStyle = '#ffffff';
    pCtx.font = 'bold 48px "Press Start 2P", monospace';
    pCtx.textAlign = 'center';
    pCtx.textBaseline = 'middle';
    const lines = p.text.split('\n');
    lines.forEach((line, li) => {
      pCtx.fillText(line, 128, 100 + li * 60);
    });
    const pTex = new THREE.CanvasTexture(pCanvas);
    const pMat = new THREE.MeshBasicMaterial({ map: pTex });
    const pGeo = new THREE.PlaneGeometry(p.w, p.h);
    const poster = new THREE.Mesh(pGeo, pMat);
    poster.position.set(p.x, p.y, -1.45);
    // Make HIGH SCORE poster clickable
    if (p.text === 'HIGH\nSCORE') {
      poster.userData.type = 'leaderboard';
      leaderboardPoster = poster;
    }
    scene.add(poster);
  });


  // --- Gumball Machine (decorative, near left) ---
  const gumGroup = new THREE.Group();
  // Stand
  const standGeo = new THREE.CylinderGeometry(0.08, 0.12, 0.8, 12);
  const standMat = new THREE.MeshStandardMaterial({ color: 0xdd3333, roughness: 0.4, metalness: 0.4 });
  const stand = new THREE.Mesh(standGeo, standMat);
  stand.position.y = 0.4;
  gumGroup.add(stand);
  // Base
  const gBaseGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.06, 16);
  const gBase = new THREE.Mesh(gBaseGeo, standMat);
  gBase.position.y = 0.03;
  gumGroup.add(gBase);
  // Globe
  const globeGeo = new THREE.SphereGeometry(0.22, 16, 16);
  const globeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.1, metalness: 0.0, transparent: true, opacity: 0.5 });
  const globe = new THREE.Mesh(globeGeo, globeMat);
  globe.position.y = 1.05;
  gumGroup.add(globe);
  // Gumballs inside
  const gumColors = [0xff3333, 0x33ff33, 0x3333ff, 0xffff33, 0xff33ff, 0x33ffff, 0xff8833];
  for (let i = 0; i < 12; i++) {
    const gGeo = new THREE.SphereGeometry(0.04, 8, 8);
    const gMat = new THREE.MeshStandardMaterial({ color: gumColors[i % gumColors.length], roughness: 0.3 });
    const gBall = new THREE.Mesh(gGeo, gMat);
    const angle = Math.random() * Math.PI * 2;
    const r = Math.random() * 0.12;
    gBall.position.set(Math.cos(angle) * r, 1.0 + Math.random() * 0.12, Math.sin(angle) * r);
    gumGroup.add(gBall);
  }
  // Top cap
  const capGeo = new THREE.CylinderGeometry(0.1, 0.12, 0.06, 16);
  const cap = new THREE.Mesh(capGeo, standMat);
  cap.position.y = 1.28;
  gumGroup.add(cap);
  gumGroup.position.set(-4.2, 0, 0.8);
  scene.add(gumGroup);

  // --- Kirby ---
  const kirbyGroup = new THREE.Group();
  const pinkMat = new THREE.MeshStandardMaterial({ color: 0xFF69B4, roughness: 0.6, metalness: 0.0 });
  // Body
  const bodyGeo = new THREE.SphereGeometry(0.35, 20, 20);
  const body = new THREE.Mesh(bodyGeo, pinkMat);
  body.position.y = 0.35;
  kirbyGroup.add(body);
  // Left foot
  const footMat = new THREE.MeshStandardMaterial({ color: 0xCC1144, roughness: 0.5 });
  const footGeo = new THREE.SphereGeometry(0.12, 12, 12);
  const leftFoot = new THREE.Mesh(footGeo, footMat);
  leftFoot.position.set(-0.15, 0.08, 0.18);
  leftFoot.scale.set(1.3, 0.7, 1.5);
  kirbyGroup.add(leftFoot);
  // Right foot
  const rightFoot = new THREE.Mesh(footGeo, footMat);
  rightFoot.position.set(0.15, 0.08, 0.18);
  rightFoot.scale.set(1.3, 0.7, 1.5);
  kirbyGroup.add(rightFoot);
  // Left arm
  const armGeo = new THREE.SphereGeometry(0.1, 10, 10);
  const leftArm = new THREE.Mesh(armGeo, pinkMat);
  leftArm.position.set(-0.35, 0.3, 0.05);
  leftArm.scale.set(1.0, 1.3, 0.8);
  kirbyGroup.add(leftArm);
  // Right arm (waving up)
  const rightArm = new THREE.Mesh(armGeo, pinkMat);
  rightArm.position.set(0.35, 0.45, 0.05);
  rightArm.scale.set(1.0, 1.3, 0.8);
  kirbyGroup.add(rightArm);
  // Left eye
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0x1111AA });
  const eyeGeo = new THREE.SphereGeometry(0.06, 10, 10);
  const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
  leftEye.position.set(-0.1, 0.45, 0.30);
  leftEye.scale.set(0.8, 1.2, 0.5);
  kirbyGroup.add(leftEye);
  // Right eye
  const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
  rightEye.position.set(0.1, 0.45, 0.30);
  rightEye.scale.set(0.8, 1.2, 0.5);
  kirbyGroup.add(rightEye);
  // Eye highlights
  const highlightMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const hlGeo = new THREE.SphereGeometry(0.025, 8, 8);
  const leftHL = new THREE.Mesh(hlGeo, highlightMat);
  leftHL.position.set(-0.08, 0.48, 0.33);
  kirbyGroup.add(leftHL);
  const rightHL = new THREE.Mesh(hlGeo, highlightMat);
  rightHL.position.set(0.12, 0.48, 0.33);
  kirbyGroup.add(rightHL);
  // Mouth (happy smile)
  const mouthGeo = new THREE.SphereGeometry(0.04, 10, 10);
  const mouthMat = new THREE.MeshBasicMaterial({ color: 0xCC1144 });
  const mouth = new THREE.Mesh(mouthGeo, mouthMat);
  mouth.position.set(0, 0.35, 0.33);
  mouth.scale.set(1.5, 0.8, 0.5);
  kirbyGroup.add(mouth);
  // Cheeks (blush)
  const cheekMat = new THREE.MeshStandardMaterial({ color: 0xFF3366, roughness: 0.8, emissive: 0xFF3366, emissiveIntensity: 0.2 });
  const cheekGeo = new THREE.SphereGeometry(0.05, 10, 10);
  const leftCheek = new THREE.Mesh(cheekGeo, cheekMat);
  leftCheek.position.set(-0.2, 0.35, 0.28);
  leftCheek.scale.set(1.0, 0.7, 0.3);
  kirbyGroup.add(leftCheek);
  const rightCheek = new THREE.Mesh(cheekGeo, cheekMat);
  rightCheek.position.set(0.2, 0.35, 0.28);
  rightCheek.scale.set(1.0, 0.7, 0.3);
  kirbyGroup.add(rightCheek);

  kirbyGroup.position.set(4.2, 0, 0.5);
  kirbyGroup.rotation.y = -0.3;
  scene.add(kirbyGroup);

  // Add shadows to all prop meshes
  [trashGroup, tableGroup, gumGroup, kirbyGroup].forEach((g) => {
    g.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  });
}
createProps();

// ===== Neon Sign =====
function createNeonSign() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'rgba(0,0,0,0)';
  ctx.fillRect(0, 0, 512, 128);
  ctx.font = '42px "Press Start 2P", monospace';
  ctx.fillStyle = '#ff77cc';
  ctx.shadowColor = '#ff77cc';
  ctx.shadowBlur = 20;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  // Draw multiple times for glow
  ctx.fillText('고고 오락실', 256, 64);
  ctx.fillText('고고 오락실', 256, 64);

  const tex = new THREE.CanvasTexture(canvas);
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true });
  const sprite = new THREE.Sprite(mat);
  sprite.position.set(0, 4.2, 2.0);
  sprite.scale.set(4, 1, 1);
  scene.add(sprite);
  return sprite;
}
const neonSign = createNeonSign();

// ===== Create Cabinets =====
const cabinetGroups = [];
const cabinetPositions = [-2.5, 0, 2.5];

GAMES.forEach((game, i) => {
  const cabinet = createArcadeCabinet(game);
  cabinet.position.x = cabinetPositions[i];
  cabinet.position.y = 0;
  // Add shadows to all cabinet meshes
  cabinet.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
  scene.add(cabinet);
  cabinetGroups.push(cabinet);

  // Per-cabinet marquee point light
  const mLight = new THREE.PointLight(new THREE.Color(game.color), 0.4, 3);
  mLight.position.set(cabinetPositions[i], 3.5, 1.0);
  scene.add(mLight);
});

// ===== Raycasting =====
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function getInteractableObjects() {
  const objects = [];
  cabinetGroups.forEach((group) => {
    group.traverse((child) => {
      if (child.userData.type === 'coinSlot' || child.userData.type === 'screen') {
        objects.push(child);
      }
    });
  });
  if (leaderboardPoster) objects.push(leaderboardPoster);
  return objects;
}

function findCabinetByGameId(gameId) {
  return cabinetGroups.find((g) => g.userData.gameId === gameId);
}

// Click handler
renderer.domElement.addEventListener('click', (e) => {
  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(getInteractableObjects());

  if (intersects.length > 0) {
    const hit = intersects[0].object;
    if (hit.userData.type === 'coinSlot') {
      const cabinet = findCabinetByGameId(hit.userData.gameId);
      const game = cabinet.userData.game;
      handleCoinInsert3D(game, cabinet);
    } else if (hit.userData.type === 'screen') {
      const cabinet = findCabinetByGameId(hit.userData.gameId);
      if (cabinet.userData.isReady) {
        cabinet.userData.isReady = false;
        cabinet.userData.pressStartSprite.visible = false;
        launchGame(cabinet.userData.game, cabinet);
      }
    } else if (hit.userData.type === 'leaderboard') {
      openLeaderboard();
    }
  }
});

// Hover cursor change
renderer.domElement.addEventListener('mousemove', (e) => {
  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(getInteractableObjects());

  if (coins > 0) {
    renderer.domElement.style.cursor = 'none';
  } else if (intersects.length > 0) {
    const hit = intersects[0].object;
    if (hit.userData.type === 'coinSlot' || hit.userData.type === 'leaderboard' || (hit.userData.type === 'screen' && findCabinetByGameId(hit.userData.gameId).userData.isReady)) {
      renderer.domElement.style.cursor = 'pointer';
    } else {
      renderer.domElement.style.cursor = 'default';
    }
  } else {
    renderer.domElement.style.cursor = 'default';
  }
});

// ===== Mouse Hover Scale =====
let hoveredCabinetId = null;
let posterHovered = false;
const POSTER_BASE_SCALE = 1.0;
const POSTER_HOVER_SCALE = 1.15;

renderer.domElement.addEventListener('mousemove', (e) => {
  const rect = renderer.domElement.getBoundingClientRect();
  const mx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  const my = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  const hoverRay = new THREE.Raycaster();
  hoverRay.setFromCamera(new THREE.Vector2(mx, my), camera);

  // Check poster hover
  if (leaderboardPoster) {
    const posterHits = hoverRay.intersectObject(leaderboardPoster);
    posterHovered = posterHits.length > 0;
  }

  const allMeshes = [];
  cabinetGroups.forEach((g) => g.traverse((c) => { if (c.isMesh) allMeshes.push(c); }));
  const hits = hoverRay.intersectObjects(allMeshes);
  if (hits.length > 0) {
    let obj = hits[0].object;
    while (obj.parent && !obj.userData.gameId) obj = obj.parent;
    hoveredCabinetId = obj.userData.gameId || null;
  } else {
    hoveredCabinetId = null;
  }
});

// ===== Coin Insert 3D Animation =====
const activeCoins = [];

function handleCoinInsert3D(game, cabinet) {
  if (cabinet.userData.isReady) return;

  if (coins <= 0) {
    playErrorSound();
    // Shake animation
    const origX = cabinet.position.x;
    const shakeStart = performance.now();
    cabinet.userData.shakeUntil = shakeStart + 500;
    cabinet.userData.shakeOrigX = origX;
    return;
  }

  // Deduct coin
  updateCoins(coins - 1);
  playCoinSound();

  // Create coin mesh and animate
  const coinMesh = createCoinMesh();
  const slotY = 0.9;
  const startY = slotY + 0.5;
  coinMesh.position.set(cabinet.position.x, startY, 0.55);
  scene.add(coinMesh);

  activeCoins.push({
    mesh: coinMesh,
    cabinet: cabinet,
    startY: startY,
    targetY: slotY,
    startTime: performance.now(),
    duration: 500,
  });
}

// ===== Launch Game =====
function launchGame(game, cabinet) {
  // Find screen mesh world position and project to screen coords
  let screenMesh = null;
  cabinet.traverse((child) => {
    if (child.userData.type === 'screen') screenMesh = child;
  });

  if (!screenMesh) {
    // Fallback: center of screen
    launchGameFullscreen(game);
    return;
  }

  // Get screen bounding box in screen coordinates
  const worldPos = new THREE.Vector3();
  screenMesh.getWorldPosition(worldPos);

  // Project corners to get a rect
  const halfW = 0.6;
  const halfH = 0.45;
  const topLeft = new THREE.Vector3(worldPos.x - halfW, worldPos.y + halfH, worldPos.z);
  const bottomRight = new THREE.Vector3(worldPos.x + halfW, worldPos.y - halfH, worldPos.z);

  topLeft.project(camera);
  bottomRight.project(camera);

  const rect = renderer.domElement.getBoundingClientRect();
  const x1 = (topLeft.x * 0.5 + 0.5) * rect.width + rect.left;
  const y1 = (-topLeft.y * 0.5 + 0.5) * rect.height + rect.top;
  const x2 = (bottomRight.x * 0.5 + 0.5) * rect.width + rect.left;
  const y2 = (-bottomRight.y * 0.5 + 0.5) * rect.height + rect.top;

  gameViewport.classList.remove('hidden', 'zoom-to');
  gameViewport.classList.add('zoom-from');
  gameViewport.style.top = y1 + 'px';
  gameViewport.style.left = x1 + 'px';
  gameViewport.style.width = (x2 - x1) + 'px';
  gameViewport.style.height = (y2 - y1) + 'px';

  gameLoading.classList.remove('hidden');
  gameIframe.src = '';

  // Force reflow then zoom to fullscreen
  gameViewport.offsetHeight;
  gameViewport.classList.remove('zoom-from');
  gameViewport.classList.add('zoom-to');

  // Load game after zoom animation
  setTimeout(() => {
    const gamePath = encodeURI(game.path);
    gameIframe.src = gamePath;
    gameIframe.onload = () => {
      gameLoading.classList.add('hidden');
      gameIframe.focus();
    };
  }, 800);
}

function launchGameFullscreen(game) {
  stopArcadeBGM();
  gameViewport.classList.remove('hidden', 'zoom-from');
  gameViewport.classList.add('zoom-to');
  gameLoading.classList.remove('hidden');
  gameIframe.src = '';
  setTimeout(() => {
    gameIframe.src = encodeURI(game.path);
    gameIframe.onload = () => {
      gameLoading.classList.add('hidden');
      gameIframe.focus();
    };
  }, 300);
}

// ===== Exit Game =====
function exitGame() {
  gameIframe.src = '';
  gameViewport.classList.add('hidden');
  gameViewport.classList.remove('zoom-to', 'zoom-from');
  gameLoading.classList.remove('hidden');
  startArcadeBGM();
}

exitBtn.addEventListener('click', exitGame);

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !gameViewport.classList.contains('hidden')) {
    exitGame();
  }
});

gameIframe.addEventListener('load', () => {
  try {
    gameIframe.contentWindow.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') exitGame();
    });
  } catch (_) {
    // cross-origin: ignore
  }
});

// ===== Password Setup (first time) =====
let savedPin = localStorage.getItem('arcade-pin');
const setupModal = document.getElementById('setup-modal');
const setupInputs = setupModal.querySelectorAll('.pin-input');
const setupStep = document.getElementById('setup-step');
const setupHint = document.getElementById('setup-hint');

let setupFirstPin = '';

function showSetupModal() {
  setupFirstPin = '';
  setupStep.textContent = '1 / 2';
  setupHint.textContent = '비밀번호 입력';
  setupModal.classList.remove('hidden');
  setupInputs.forEach((i) => (i.value = ''));
  setupInputs[0].focus();
}

setupInputs.forEach((input, idx) => {
  input.addEventListener('input', () => {
    if (input.value.length === 1 && idx < 3) {
      setupInputs[idx + 1].focus();
    }
    if (idx === 3 && input.value.length === 1) {
      const pin = Array.from(setupInputs).map((i) => i.value).join('');
      if (!setupFirstPin) {
        setupFirstPin = pin;
        setupStep.textContent = '2 / 2';
        setupHint.textContent = '한번 더 입력';
        setupInputs.forEach((i) => (i.value = ''));
        setupInputs[0].focus();
      } else {
        if (pin === setupFirstPin) {
          playCoinSound();
          localStorage.setItem('arcade-pin', pin);
          savedPin = pin;
          setupModal.classList.add('hidden');
        } else {
          playErrorSound();
          setupHint.textContent = '불일치! 다시 입력';
          const content = setupModal.querySelector('.modal-content');
          content.classList.add('shake');
          setTimeout(() => {
            content.classList.remove('shake');
            setupFirstPin = '';
            setupStep.textContent = '1 / 2';
            setupHint.textContent = '비밀번호 입력';
            setupInputs.forEach((i) => (i.value = ''));
            setupInputs[0].focus();
          }, 400);
        }
      }
    }
  });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Backspace' && input.value === '' && idx > 0) {
      setupInputs[idx - 1].focus();
    }
  });
});

if (!savedPin) {
  showSetupModal();
}

// ===== Password Modal =====
let coinQty = 1;
const qtyValueEl = document.getElementById('qty-value');
const qtyMinus = document.getElementById('qty-minus');
const qtyPlus = document.getElementById('qty-plus');

qtyMinus.addEventListener('click', () => {
  if (coinQty > 1) {
    coinQty--;
    qtyValueEl.textContent = coinQty;
  }
});

qtyPlus.addEventListener('click', () => {
  coinQty++;
  qtyValueEl.textContent = coinQty;
});

addCoinBtn.addEventListener('click', () => {
  coinQty = 1;
  qtyValueEl.textContent = coinQty;
  passwordModal.classList.remove('hidden');
  pinError.classList.add('hidden');
  pinInputs.forEach((input) => (input.value = ''));
  pinInputs[0].focus();
});

pinInputs.forEach((input, idx) => {
  input.addEventListener('input', () => {
    if (input.value.length === 1 && idx < 3) {
      pinInputs[idx + 1].focus();
    }
    if (idx === 3 && input.value.length === 1) {
      const pin = Array.from(pinInputs).map((i) => i.value).join('');
      if (pin === savedPin) {
        playCoinSound();
        updateCoins(coins + coinQty);
        passwordModal.classList.add('hidden');
      } else {
        playErrorSound();
        pinError.classList.remove('hidden');
        const content = passwordModal.querySelector('.modal-content');
        content.classList.add('shake');
        setTimeout(() => {
          content.classList.remove('shake');
          pinInputs.forEach((i) => (i.value = ''));
          pinInputs[0].focus();
        }, 400);
      }
    }
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Backspace' && input.value === '' && idx > 0) {
      pinInputs[idx - 1].focus();
    }
    if (e.key === 'Escape') {
      passwordModal.classList.add('hidden');
    }
  });
});

pinCancel.addEventListener('click', () => {
  passwordModal.classList.add('hidden');
});

// ===== 3D Coin Cursor =====
const coinCursor = new THREE.Group();
// Outer rim (slightly larger, darker cylinder)
const coinCursorRimGeo = new THREE.CylinderGeometry(0.135, 0.135, 0.03, 32);
const coinCursorRimMat = new THREE.MeshBasicMaterial({
  color: 0xB8860B,
  depthTest: false,
});
const cursorRim = new THREE.Mesh(coinCursorRimGeo, coinCursorRimMat);
cursorRim.rotation.x = Math.PI / 2;
coinCursor.add(cursorRim);
// Inner face (gold)
const coinCursorGeo = new THREE.CylinderGeometry(0.11, 0.11, 0.032, 32);
const coinCursorMat = new THREE.MeshBasicMaterial({
  color: 0xFFD700,
  depthTest: false,
});
const cursorFace = new THREE.Mesh(coinCursorGeo, coinCursorMat);
cursorFace.rotation.x = Math.PI / 2;
coinCursor.add(cursorFace);
coinCursor.renderOrder = 999;
coinCursor.visible = false;
scene.add(coinCursor);

let cursorMouseX = 0;
let cursorMouseY = 0;
let cursorOnCanvas = false;

renderer.domElement.addEventListener('mousemove', (e) => {
  const rect = renderer.domElement.getBoundingClientRect();
  cursorMouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  cursorMouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  cursorOnCanvas = true;
});

renderer.domElement.addEventListener('mouseleave', () => {
  cursorOnCanvas = false;
});

function updateCoinCursor() {
  if (typeof renderer !== 'undefined') {
    renderer.domElement.style.cursor = coins > 0 ? 'none' : 'default';
  }
}

// ===== Animation Loop =====
let lastBlinkTime = 0;
let blinkVisible = true;

function animate(time) {
  requestAnimationFrame(animate);

  // Hover scale lerp
  cabinetGroups.forEach((group) => {
    // Shake animation
    if (group.userData.shakeUntil && time < group.userData.shakeUntil) {
      const elapsed = time - (group.userData.shakeUntil - 500);
      const shake = Math.sin(elapsed * 0.05) * 0.05 * (1 - elapsed / 500);
      group.position.x = group.userData.shakeOrigX + shake;
    } else if (group.userData.shakeUntil) {
      group.position.x = group.userData.shakeOrigX;
      group.userData.shakeUntil = null;
    }

    // Scale up on hover
    const targetScale = group.userData.gameId === hoveredCabinetId ? 1.05 : 1.0;
    const s = group.scale.x + (targetScale - group.scale.x) * 0.08;
    group.scale.set(s, s, s);
  });

  // Poster hover scale
  if (leaderboardPoster) {
    const targetS = posterHovered ? POSTER_HOVER_SCALE : POSTER_BASE_SCALE;
    const cs = leaderboardPoster.scale.x + (targetS - leaderboardPoster.scale.x) * 0.1;
    leaderboardPoster.scale.set(cs, cs, 1);
  }

  // PRESS START blink
  if (time - lastBlinkTime > 500) {
    blinkVisible = !blinkVisible;
    lastBlinkTime = time;
  }
  cabinetGroups.forEach((group) => {
    if (group.userData.isReady && group.userData.pressStartSprite) {
      group.userData.pressStartSprite.visible = blinkVisible;
    }
  });

  // Neon light gentle pulse (no scary flicker)
  const pulse = Math.sin(time * 0.002) * 0.15 + 0.85;
  neonLight.intensity = pulse;

  // Animate coins
  for (let i = activeCoins.length - 1; i >= 0; i--) {
    const c = activeCoins[i];
    const elapsed = time - c.startTime;
    const t = Math.min(elapsed / c.duration, 1);

    // Ease in (gravity-like)
    const eased = t * t;
    c.mesh.position.y = c.startY + (c.targetY - c.startY) * eased;
    c.mesh.rotation.y += 0.15;

    if (t >= 1) {
      // Coin arrived
      scene.remove(c.mesh);
      activeCoins.splice(i, 1);

      // Mark cabinet as ready
      c.cabinet.userData.isReady = true;

      // Make screen glow
      c.cabinet.traverse((child) => {
        if (child.userData.type === 'screen') {
          child.material.emissiveIntensity = 1.0;
          child.material.emissive = new THREE.Color(c.cabinet.userData.game.color);
        }
      });
    }
  }

  // 3D coin cursor
  if (coins > 0 && cursorOnCanvas) {
    coinCursor.visible = true;
    // Position coin near the camera, following mouse
    const cursorVec = new THREE.Vector3(cursorMouseX, cursorMouseY, 0.97);
    cursorVec.unproject(camera);
    coinCursor.position.copy(cursorVec);
    coinCursor.rotation.x = 0;
    coinCursor.rotation.y += 0.08;
    coinCursor.rotation.z = 0;
  } else {
    coinCursor.visible = false;
  }

  renderer.render(scene, camera);
}

requestAnimationFrame(animate);

// ===== Resize Handler =====
window.addEventListener('resize', () => {
  const w = canvasContainer.clientWidth;
  const h = canvasContainer.clientHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
});

// ===== Leaderboard =====
function openLeaderboard() {
  const modal = document.getElementById('leaderboard-modal');
  const list = document.getElementById('leaderboard-list');
  let rankings = [];
  try { rankings = JSON.parse(localStorage.getItem('gogo_arcade_leaderboard') || '[]'); } catch(e) {}

  const ordinals = ['1ST','2ND','3RD','4TH','5TH','6TH','7TH','8TH','9TH','10TH',
                     '11TH','12TH','13TH','14TH','15TH','16TH','17TH','18TH','19TH','20TH'];
  let html = '<div class="lb-row header"><span class="lb-pos">RANK</span><span class="lb-name">NAME</span><span class="lb-score">SCORE</span><span class="lb-game">GAME</span></div>';

  const display = rankings.slice(0, 20);
  if (display.length === 0) {
    html += '<div style="text-align:center;color:#666;padding:20px;font-size:11px;">기록 없음</div>';
  }
  display.forEach((r, i) => {
    html += '<div class="lb-row">';
    html += '<span class="lb-pos">' + (ordinals[i] || (i+1)+'TH') + '</span>';
    html += '<span class="lb-name">' + (r.name || '???') + '</span>';
    html += '<span class="lb-score">' + (r.score || 0).toLocaleString() + '</span>';
    html += '<span class="lb-game">' + (r.game || '') + '</span>';
    html += '</div>';
  });

  list.innerHTML = html;
  modal.classList.remove('hidden');
}

function closeLeaderboard() {
  document.getElementById('leaderboard-modal').classList.add('hidden');
}
window.closeLeaderboard = closeLeaderboard;
