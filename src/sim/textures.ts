import * as THREE from 'three';

/**
 * Procedural Canvas Texture Generators for Superpower Warfare Simulator.
 * Realistic glass windows, metallic facades, helipads, ocean, and satellite map.
 */

export function createSkyscraperGlassTexture(baseColorHex: string, accentColorHex: string): THREE.CanvasTexture {
  const cv = document.createElement('canvas');
  cv.width = 256;
  cv.height = 512;
  const ctx = cv.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(cv);

  ctx.fillStyle = baseColorHex;
  ctx.fillRect(0, 0, 256, 512);

  // Structural metal framework
  ctx.fillStyle = '#0f172a';
  for (let x = 0; x < 256; x += 16) ctx.fillRect(x, 0, 2, 512);
  for (let y = 0; y < 512; y += 16) ctx.fillRect(0, y, 256, 2);

  // Office windows with varying illumination
  const winCols = ['#38bdf8', '#7dd3fc', '#bae6fd', '#0284c7', '#ffffff', accentColorHex];
  for (let y = 2; y < 512; y += 16) {
    for (let x = 2; x < 256; x += 16) {
      if (Math.random() > 0.28) {
        ctx.fillStyle = winCols[Math.floor(Math.random() * winCols.length)];
        ctx.globalAlpha = 0.5 + Math.random() * 0.5;
        ctx.fillRect(x + 1, y + 1, 13, 13);
      }
    }
  }
  ctx.globalAlpha = 1.0;

  const tex = new THREE.CanvasTexture(cv);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

export function createHelipadTexture(): THREE.CanvasTexture {
  const cv = document.createElement('canvas');
  cv.width = 128;
  cv.height = 128;
  const ctx = cv.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(cv);

  ctx.fillStyle = '#1e293b';
  ctx.fillRect(0, 0, 128, 128);

  // Outer yellow safety ring
  ctx.strokeStyle = '#facc15';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(64, 64, 52, 0, Math.PI * 2);
  ctx.stroke();

  // White 'H' emblem
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(46, 38);
  ctx.lineTo(46, 90);
  ctx.moveTo(82, 38);
  ctx.lineTo(82, 90);
  ctx.moveTo(46, 64);
  ctx.lineTo(82, 64);
  ctx.stroke();

  return new THREE.CanvasTexture(cv);
}

export function createOceanTexture(): THREE.CanvasTexture {
  const cv = document.createElement('canvas');
  cv.width = 256;
  cv.height = 256;
  const ctx = cv.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(cv);

  ctx.fillStyle = '#0284c7';
  ctx.fillRect(0, 0, 256, 256);
  ctx.fillStyle = '#38bdf8';
  ctx.globalAlpha = 0.25;
  for (let i = 0; i < 350; i++) {
    const x = Math.random() * 256;
    const y = Math.random() * 256;
    const r = 2 + Math.random() * 7;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(16, 16);
  return tex;
}

export function createSatelliteWarMapTexture(): THREE.CanvasTexture {
  const cv = document.createElement('canvas');
  cv.width = 1024;
  cv.height = 512;
  const ctx = cv.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(cv);

  ctx.fillStyle = '#040812';
  ctx.fillRect(0, 0, 1024, 512);

  // Satellite radar grid lines
  ctx.strokeStyle = 'rgba(0, 240, 255, 0.12)';
  ctx.lineWidth = 1;
  for (let x = 0; x < 1024; x += 32) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 512);
    ctx.stroke();
  }
  for (let y = 0; y < 512; y += 32) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(1024, y);
    ctx.stroke();
  }

  // Faction Alpha (Pacific Federation / US Aegis) - Sovereign Sector (West)
  ctx.fillStyle = 'rgba(0, 180, 255, 0.22)';
  ctx.beginPath();
  ctx.arc(280, 310, 210, 0, Math.PI * 2);
  ctx.fill();

  // Faction Beta (Eurasian Dragon Coalition / Celestial Rocket Force) - Hostile Sector (East)
  ctx.fillStyle = 'rgba(255, 30, 70, 0.26)';
  ctx.beginPath();
  ctx.arc(760, 200, 230, 0, Math.PI * 2);
  ctx.fill();

  // 4 Neutral Mediator Nation Buffer Zones (Geneva, Nordic, ASEAN, Swiss)
  const neutralZones = [
    { name: 'ZONE G-1: GENEVA ACCORD', x: 512, y: 120, r: 65 },
    { name: 'ZONE N-2: NORDIC SHIELD', x: 440, y: 380, r: 55 },
    { name: 'ZONE A-3: ASEAN MARITIME BUFFER', x: 580, y: 340, r: 60 },
    { name: 'ZONE S-4: SWISS PEACE FORUM', x: 512, y: 250, r: 50 },
  ];

  neutralZones.forEach((z) => {
    ctx.fillStyle = 'rgba(52, 211, 153, 0.25)'; // Emerald/Green buffer
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(z.x, z.y, z.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.font = 'bold 11px monospace';
    ctx.fillStyle = '#34d399';
    ctx.fillText(z.name, z.x - 70, z.y);
  });

  // Border demarcation line
  ctx.strokeStyle = '#ff3366';
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 6]);
  ctx.beginPath();
  ctx.moveTo(512, 0);
  ctx.lineTo(512, 512);
  ctx.stroke();
  ctx.setLineDash([]);

  // Geopolitical labels
  ctx.font = 'bold 22px monospace';
  ctx.fillStyle = '#00f0ff';
  ctx.fillText('PACIFIC FEDERATION [FACTION ALPHA - SOVEREIGN]', 40, 60);

  ctx.font = 'bold 22px monospace';
  ctx.fillStyle = '#ff3366';
  ctx.fillText('EURASIAN DRAGON COALITION [FACTION BETA - HOSTILE]', 460, 480);

  ctx.font = 'bold 14px monospace';
  ctx.fillStyle = '#34d399';
  ctx.fillText('DEMILITARIZED MEDIATOR CHANNELS (CEASEFIRE CORRIDORS)', 300, 20);

  return new THREE.CanvasTexture(cv);
}
