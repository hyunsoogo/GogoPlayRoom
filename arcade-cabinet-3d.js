// ===== Arcade Cabinet 3D Procedural Model =====

function createArcadeCabinet(game) {
  const group = new THREE.Group();
  group.userData.gameId = game.id;
  group.userData.game = game;
  group.userData.isReady = false;

  // Cabinet dimensions
  const W = 1.6;   // width
  const D = 0.8;   // depth
  const H = 4.0;   // total height

  // --- Cabinet Body (ExtrudeGeometry with side profile) ---
  const body = createCabinetBody(W, D, H, game);
  group.add(body);

  // --- Marquee ---
  const marquee = createMarquee(game, W);
  group.add(marquee);

  // --- Screen ---
  const screen = createScreen(game, W);
  group.add(screen);

  // --- Control Panel ---
  const controls = createControlPanel(W);
  group.add(controls);

  // --- Coin Slot ---
  const coinSlot = createCoinSlot(W, game);
  group.add(coinSlot);

  // --- Base ---
  const base = createBase(W, D);
  group.add(base);

  // --- PRESS START text sprite ---
  const pressStart = createPressStartSprite();
  pressStart.position.set(0, 2.15, 0.45);
  pressStart.visible = false;
  group.userData.pressStartSprite = pressStart;
  group.add(pressStart);


  return group;
}

// ===== Cabinet Body (multi-box construction) =====
function createCabinetBody(W, D) {
  const bodyGroup = new THREE.Group();

  // Create scratched metal bump map
  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = 256;
  bumpCanvas.height = 256;
  const bCtx = bumpCanvas.getContext('2d');
  bCtx.fillStyle = '#808080';
  bCtx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 200; i++) {
    const x = Math.random() * 256;
    const y = Math.random() * 256;
    const len = Math.random() * 30 + 5;
    const angle = Math.random() * Math.PI;
    bCtx.strokeStyle = `rgba(${Math.random() > 0.5 ? 160 : 100}, ${Math.random() > 0.5 ? 160 : 100}, ${Math.random() > 0.5 ? 160 : 100}, 0.3)`;
    bCtx.lineWidth = Math.random() * 2 + 0.5;
    bCtx.beginPath();
    bCtx.moveTo(x, y);
    bCtx.lineTo(x + Math.cos(angle) * len, y + Math.sin(angle) * len);
    bCtx.stroke();
  }
  const bumpTex = new THREE.CanvasTexture(bumpCanvas);

  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a2e,
    roughness: 0.8,
    metalness: 0.3,
    bumpMap: bumpTex,
    bumpScale: 0.02,
  });

  // Head section (marquee housing, slightly tilted back)
  const headGeo = new THREE.BoxGeometry(W, 0.7, D * 0.7);
  const head = new THREE.Mesh(headGeo, bodyMat);
  head.position.set(0, 3.15, -0.05);
  head.rotation.x = 0.08;
  head.castShadow = true;
  bodyGroup.add(head);

  // Upper back (connects head to screen, angled back)
  const upperBackGeo = new THREE.BoxGeometry(W, 0.4, D * 0.9);
  const upperBack = new THREE.Mesh(upperBackGeo, bodyMat);
  upperBack.position.set(0, 2.65, -0.1);
  upperBack.rotation.x = 0.15;
  upperBack.castShadow = true;
  bodyGroup.add(upperBack);

  // Screen housing (only covers screen area, not control panel)
  const screenHousingGeo = new THREE.BoxGeometry(W, 0.9, D * 0.6);
  const screenHousing = new THREE.Mesh(screenHousingGeo, bodyMat);
  screenHousing.position.set(0, 2.15, 0.05);
  screenHousing.castShadow = true;
  bodyGroup.add(screenHousing);

  // Control panel housing (connects screen housing to lower body)
  const ctrlGeo = new THREE.BoxGeometry(W, 0.6, D * 0.5);
  const ctrl = new THREE.Mesh(ctrlGeo, bodyMat);
  ctrl.position.set(0, 1.40, -0.02);
  ctrl.castShadow = true;
  bodyGroup.add(ctrl);

  // Lower body (coin area)
  const lowerGeo = new THREE.BoxGeometry(W, 0.5, D * 0.55);
  const lower = new THREE.Mesh(lowerGeo, bodyMat);
  lower.position.set(0, 0.85, -0.02);
  lower.castShadow = true;
  bodyGroup.add(lower);

  return bodyGroup;
}

// ===== Marquee =====
function createMarquee(game, W) {
  const marqueeGroup = new THREE.Group();

  // Marquee box
  const boxGeo = new THREE.BoxGeometry(W * 0.92, 0.45, 0.12);
  const boxMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.4,
    metalness: 0.1,
  });
  const box = new THREE.Mesh(boxGeo, boxMat);
  box.position.set(0, 3.05, 0.33);
  box.castShadow = true;
  marqueeGroup.add(box);

  // Marquee face with game title (CanvasTexture)
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  // Background gradient
  const grad = ctx.createLinearGradient(0, 0, 1024, 0);
  grad.addColorStop(0, '#1a0a2e');
  grad.addColorStop(0.5, game.color);
  grad.addColorStop(1, '#1a0a2e');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1024, 256);

  // Title text
  ctx.fillStyle = '#000000';
  ctx.font = 'bold 96px "Press Start 2P", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0,0,0,0)';
  ctx.shadowBlur = 0;
  ctx.fillText(game.title, 512, 105);

  // Description
  ctx.font = '28px "Press Start 2P", monospace';
  ctx.fillStyle = '#FFD700';
  ctx.shadowColor = game.color;
  ctx.shadowBlur = 10;
  ctx.fillText(game.description, 512, 200);

  const marqueeTex = new THREE.CanvasTexture(canvas);

  // Re-render after font loads
  document.fonts.ready.then(() => {
    ctx.clearRect(0, 0, 1024, 256);
    const grad2 = ctx.createLinearGradient(0, 0, 1024, 0);
    grad2.addColorStop(0, '#1a0a2e');
    grad2.addColorStop(0.5, game.color);
    grad2.addColorStop(1, '#1a0a2e');
    ctx.fillStyle = grad2;
    ctx.fillRect(0, 0, 1024, 256);
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 96px "Press Start 2P"';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0,0,0,0)';
    ctx.shadowBlur = 0;
    ctx.fillText(game.title, 512, 105);
    ctx.font = '28px "Press Start 2P"';
    ctx.fillStyle = '#FFD700';
    ctx.shadowColor = game.color;
    ctx.shadowBlur = 10;
    ctx.fillText(game.description, 512, 200);
    marqueeTex.needsUpdate = true;
  });
  const faceMat = new THREE.MeshStandardMaterial({
    map: marqueeTex,
    emissive: new THREE.Color(game.color),
    emissiveIntensity: 0.6,
  });

  const faceGeo = new THREE.PlaneGeometry(W * 0.9, 0.42);
  const face = new THREE.Mesh(faceGeo, faceMat);
  face.position.set(0, 3.05, 0.395);
  marqueeGroup.add(face);

  // Backlight
  const light = new THREE.PointLight(new THREE.Color(game.color), 0.8, 4);
  light.position.set(0, 3.3, 0.6);
  marqueeGroup.add(light);
  marqueeGroup.userData.marqueeLight = light;

  return marqueeGroup;
}

// ===== Screen =====
function createScreen(game, W) {
  const screenGroup = new THREE.Group();

  // Monitor bezel (black frame)
  const bezelGeo = new THREE.BoxGeometry(W * 0.85, 1.05, 0.08);
  const bezelMat = new THREE.MeshStandardMaterial({
    color: 0x111111,
    roughness: 0.9,
    metalness: 0.1,
  });
  const bezel = new THREE.Mesh(bezelGeo, bezelMat);
  bezel.position.set(0, 2.15, 0.33);
  screenGroup.add(bezel);

  // Screen plane (with screenshot texture)
  const screenW = W * 0.75;
  const screenH = 0.9;
  const screenGeo = new THREE.PlaneGeometry(screenW, screenH);

  // Load screenshot texture
  const loader = new THREE.TextureLoader();
  const screenshotTex = loader.load(game.screenshot);
  screenshotTex.minFilter = THREE.LinearFilter;

  const screenMat = new THREE.MeshStandardMaterial({
    map: screenshotTex,
    emissiveMap: screenshotTex,
    emissive: 0xffffff,
    emissiveIntensity: 0.6,
    roughness: 0.3,
    metalness: 0.0,
  });

  const screenMesh = new THREE.Mesh(screenGeo, screenMat);
  screenMesh.position.set(0, 2.15, 0.38);
  screenMesh.userData.type = 'screen';
  screenMesh.userData.gameId = game.id;
  screenGroup.add(screenMesh);
  screenGroup.userData.screenMesh = screenMesh;

  // CRT scanline overlay
  const scanCanvas = document.createElement('canvas');
  scanCanvas.width = 4;
  scanCanvas.height = 256;
  const sCtx = scanCanvas.getContext('2d');
  for (let y = 0; y < 256; y++) {
    sCtx.fillStyle = y % 3 === 0 ? 'rgba(0,0,0,0.12)' : 'rgba(0,0,0,0)';
    sCtx.fillRect(0, y, 4, 1);
  }
  const scanTex = new THREE.CanvasTexture(scanCanvas);
  scanTex.wrapS = THREE.RepeatWrapping;
  scanTex.wrapT = THREE.RepeatWrapping;
  scanTex.repeat.set(1, 4);

  const scanMat = new THREE.MeshBasicMaterial({
    map: scanTex,
    transparent: true,
    depthWrite: false,
  });
  const scanMesh = new THREE.Mesh(new THREE.PlaneGeometry(screenW, screenH), scanMat);
  scanMesh.position.set(0, 2.15, 0.385);
  screenGroup.add(scanMesh);

  // Glass reflection overlay
  const glassCanvas = document.createElement('canvas');
  glassCanvas.width = 128;
  glassCanvas.height = 128;
  const gCtx = glassCanvas.getContext('2d');
  const glassGrad = gCtx.createRadialGradient(35, 30, 5, 64, 64, 90);
  glassGrad.addColorStop(0, 'rgba(255,255,255,0.08)');
  glassGrad.addColorStop(1, 'rgba(255,255,255,0)');
  gCtx.fillStyle = glassGrad;
  gCtx.fillRect(0, 0, 128, 128);
  const glassTex = new THREE.CanvasTexture(glassCanvas);
  const glassMat = new THREE.MeshBasicMaterial({
    map: glassTex,
    transparent: true,
    depthWrite: false,
  });
  const glassMesh = new THREE.Mesh(new THREE.PlaneGeometry(screenW, screenH), glassMat);
  glassMesh.position.set(0, 2.15, 0.39);
  screenGroup.add(glassMesh);

  return screenGroup;
}

// ===== Control Panel =====
function createControlPanel(W) {
  const panelGroup = new THREE.Group();

  // Angled panel
  const panelW = W * 0.92;
  const panelH = 0.1;
  const panelD = 0.825;
  const panelAngle = -0.1; // nearly flat, very slight tilt toward player

  const panelGeo = new THREE.BoxGeometry(panelW, panelH, panelD);
  const panelMat = new THREE.MeshStandardMaterial({
    color: 0x2a2a3a,
    roughness: 0.7,
    metalness: 0.2,
  });
  const panel = new THREE.Mesh(panelGeo, panelMat);
  panel.position.set(0, 1.30, 0.45);
  panel.rotation.x = panelAngle;
  panel.castShadow = true;
  panelGroup.add(panel);

  // All controls are children of the panel, placed on its top surface (local y = panelH/2)
  const surfaceY = panelH / 2 + 0.005;

  // Joystick (left side)
  const joy = createJoystick();
  joy.position.set(-0.45, surfaceY, 0.05);
  panel.add(joy);

  // 6 buttons (right side): 2 rows of 3
  const buttonColors = [0xff3333, 0xffcc00, 0x3388ff, 0xff3333, 0xffcc00, 0x3388ff];
  const btnOffsets = [
    [-0.08, -0.08], [0.10, -0.10], [0.28, -0.08],
    [-0.08,  0.10], [0.10,  0.08], [0.28,  0.10],
  ];
  btnOffsets.forEach((off, i) => {
    const btn = createButton(buttonColors[i]);
    btn.position.set(off[0], surfaceY, off[1]);
    panel.add(btn);
  });

  // Start button (small white)
  const startBtn = createButton(0xcccccc, 0.025);
  startBtn.position.set(0.50, surfaceY, 0.0);
  panel.add(startBtn);

  return panelGroup;
}

function createJoystick() {
  const joyGroup = new THREE.Group();

  // Base plate
  const baseGeo = new THREE.CylinderGeometry(0.08, 0.09, 0.025, 16);
  const baseMat = new THREE.MeshStandardMaterial({ color: 0x666666, roughness: 0.4, metalness: 0.6 });
  const base = new THREE.Mesh(baseGeo, baseMat);
  joyGroup.add(base);

  // Stick
  const stickGeo = new THREE.CylinderGeometry(0.025, 0.03, 0.12, 8);
  const stickMat = new THREE.MeshStandardMaterial({ color: 0xdddddd, roughness: 0.3, metalness: 0.8, emissive: 0x333333, emissiveIntensity: 0.3 });
  const stick = new THREE.Mesh(stickGeo, stickMat);
  stick.position.y = 0.07;
  joyGroup.add(stick);

  // Ball top
  const ballGeo = new THREE.SphereGeometry(0.07, 16, 16);
  const ballMat = new THREE.MeshStandardMaterial({
    color: 0xff1111,
    roughness: 0.2,
    metalness: 0.05,
    emissive: 0xff2222,
    emissiveIntensity: 0.5,
  });
  const ball = new THREE.Mesh(ballGeo, ballMat);
  ball.position.y = 0.14;
  joyGroup.add(ball);

  return joyGroup;
}

function createButton(color, radius) {
  radius = radius || 0.055;
  const btnGeo = new THREE.CylinderGeometry(radius, radius * 1.15, 0.035, 16);
  const btnMat = new THREE.MeshStandardMaterial({
    color: color,
    roughness: 0.3,
    metalness: 0.15,
    emissive: new THREE.Color(color),
    emissiveIntensity: 0.5,
  });
  const btn = new THREE.Mesh(btnGeo, btnMat);
  return btn;
}

// ===== Coin Slot =====
function createCoinSlot(W, game) {
  const slotGroup = new THREE.Group();

  // Metal plate (2x size)
  const plateGeo = new THREE.BoxGeometry(0.6, 0.3, 0.04);
  const plateMat = new THREE.MeshStandardMaterial({
    color: 0x888888,
    roughness: 0.5,
    metalness: 0.7,
  });
  const plate = new THREE.Mesh(plateGeo, plateMat);
  plate.position.set(0, 0.9, 0.44);
  plate.userData.type = 'coinSlot';
  plate.userData.gameId = game.id;
  slotGroup.add(plate);

  // Slot hole (2x size)
  const holeGeo = new THREE.BoxGeometry(0.24, 0.04, 0.05);
  const holeMat = new THREE.MeshStandardMaterial({ color: 0x000000, roughness: 1.0 });
  const hole = new THREE.Mesh(holeGeo, holeMat);
  hole.position.set(0, 0.9, 0.465);
  hole.userData.type = 'coinSlot';
  hole.userData.gameId = game.id;
  slotGroup.add(hole);

  // COIN label
  const labelCanvas = document.createElement('canvas');
  labelCanvas.width = 128;
  labelCanvas.height = 32;
  const lCtx = labelCanvas.getContext('2d');
  lCtx.fillStyle = 'rgba(0,0,0,0)';
  lCtx.fillRect(0, 0, 128, 32);
  lCtx.font = '14px "Press Start 2P", monospace';
  lCtx.fillStyle = '#888888';
  lCtx.textAlign = 'center';
  lCtx.fillText('COIN', 64, 22);
  const labelTex = new THREE.CanvasTexture(labelCanvas);
  const labelMat = new THREE.SpriteMaterial({ map: labelTex, transparent: true });
  const labelSprite = new THREE.Sprite(labelMat);
  labelSprite.position.set(0, 0.70, 0.46);
  labelSprite.scale.set(0.5, 0.13, 1);
  slotGroup.add(labelSprite);

  return slotGroup;
}

// ===== Base =====
function createBase(W, D) {
  const baseGeo = new THREE.BoxGeometry(W * 0.95, 0.8, D * 0.95);
  const baseMat = new THREE.MeshStandardMaterial({
    color: 0x111118,
    roughness: 0.9,
    metalness: 0.2,
  });
  const base = new THREE.Mesh(baseGeo, baseMat);
  base.position.set(0, 0.4, 0.02);
  base.castShadow = true;
  base.receiveShadow = true;

  // Door panel line
  const doorGeo = new THREE.PlaneGeometry(W * 0.6, 0.5);
  const doorMat = new THREE.MeshStandardMaterial({
    color: 0x161620,
    roughness: 0.85,
    metalness: 0.15,
  });
  const door = new THREE.Mesh(doorGeo, doorMat);
  door.position.set(0, 0.35, 0.41);
  const doorGroup = new THREE.Group();
  doorGroup.add(base);
  doorGroup.add(door);
  return doorGroup;
}

// ===== PRESS START Sprite =====
function createPressStartSprite() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'rgba(0,0,0,0.75)';
  ctx.fillRect(0, 0, 256, 64);
  ctx.font = '18px "Press Start 2P", monospace';
  ctx.fillStyle = '#FFD700';
  ctx.shadowColor = '#FFD700';
  ctx.shadowBlur = 10;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('PRESS START', 128, 32);

  const tex = new THREE.CanvasTexture(canvas);
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(0.8, 0.2, 1);
  return sprite;
}


// ===== 3D Coin for insertion animation =====
function createCoinMesh() {
  const coinGeo = new THREE.CylinderGeometry(0.11, 0.11, 0.032, 24);
  const coinMat = new THREE.MeshStandardMaterial({
    color: 0xFFD700,
    roughness: 0.3,
    metalness: 0.8,
    emissive: 0xFFD700,
    emissiveIntensity: 0.3,
  });
  const coinGroup = new THREE.Group();
  // Outer rim (darker, slightly larger)
  const rimGeo = new THREE.CylinderGeometry(0.135, 0.135, 0.03, 24);
  const rimMat = new THREE.MeshStandardMaterial({
    color: 0xB8860B,
    roughness: 0.4,
    metalness: 0.9,
    emissive: 0xB8860B,
    emissiveIntensity: 0.2,
  });
  const rimMesh = new THREE.Mesh(rimGeo, rimMat);
  rimMesh.rotation.x = Math.PI / 2;
  coinGroup.add(rimMesh);
  // Inner face (gold)
  const coin = new THREE.Mesh(coinGeo, coinMat);
  coin.rotation.x = Math.PI / 2;
  coinGroup.add(coin);
  return coinGroup;
}
