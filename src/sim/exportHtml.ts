/**
 * Complete, Production-Ready Standalone 3D Strategic Military Warfare Simulator
 * Superpower conflict (US vs China theater) for Android mobile browsers & desktops.
 * Full 8-Layer Defensive Hierarchy, Electronic Warfare, ASAT/GPS Jamming, Directed Energy Beams,
 * Cyber Guidance Hijacking, Sonar Submarine Net, Rescue Drones, Procedural Audio & Shaders.
 */

export function generateStandaloneHTML(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Strategic Defense - Superpower Warfare & Integrated Air Defense Grid</title>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      user-select: none;
      -webkit-user-select: none;
      -webkit-tap-highlight-color: transparent;
    }
    html, body {
      width: 100%;
      height: 100%;
      overflow: hidden;
      background: #040812;
      font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif;
      color: #fff;
    }
    #canvas-container {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      cursor: crosshair;
    }
    .hud-layer {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 8px;
      z-index: 10;
    }
    .hud-panel {
      background: rgba(6, 12, 24, 0.92);
      border: 1px solid rgba(0, 240, 255, 0.35);
      border-radius: 10px;
      padding: 6px 10px;
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.75), inset 0 0 10px rgba(0, 240, 255, 0.08);
      pointer-events: auto;
    }
    .top-bar {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 6px;
      width: 100%;
    }
    .btn {
      background: rgba(0, 240, 255, 0.12);
      border: 1px solid #00f0ff;
      color: #00f0ff;
      padding: 5px 9px;
      border-radius: 6px;
      font-weight: 700;
      font-size: 10px;
      letter-spacing: 0.5px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
      pointer-events: auto;
      text-transform: uppercase;
      font-family: monospace;
      transition: background 0.15s ease, transform 0.1s ease;
    }
    .btn:active {
      transform: scale(0.96);
    }
    .btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
      border-color: #475569;
      color: #94a3b8;
    }
    .btn-primary {
      background: linear-gradient(135deg, #00f0ff, #0284c7);
      color: #040812;
      border: none;
      font-weight: 800;
      box-shadow: 0 0 12px rgba(0, 240, 255, 0.4);
    }
    .btn-danger {
      background: linear-gradient(135deg, #f43f5e, #e11d48);
      color: #fff;
      border: none;
      box-shadow: 0 0 12px rgba(244, 63, 94, 0.4);
    }
    .btn-warning {
      background: linear-gradient(135deg, #f59e0b, #d97706);
      color: #040812;
      border: none;
      box-shadow: 0 0 12px rgba(245, 158, 11, 0.4);
    }
    .btn-purple {
      background: linear-gradient(135deg, #a855f7, #7c3aed);
      color: #fff;
      border: none;
      box-shadow: 0 0 12px rgba(168, 85, 247, 0.4);
    }
    .btn-active {
      background: #00f0ff;
      color: #040812;
      box-shadow: 0 0 14px rgba(0, 240, 255, 0.6);
    }
    .health-bar-container {
      width: 110px;
      height: 6px;
      background: rgba(0, 0, 0, 0.6);
      border-radius: 3px;
      overflow: hidden;
      border: 1px solid rgba(255, 255, 255, 0.2);
      margin-top: 3px;
    }
    .health-bar {
      height: 100%;
      width: 100%;
      background: linear-gradient(90deg, #00f0ff, #38bdf8);
      transition: width 0.25s ease;
    }
    .bottom-bar {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 5px;
      flex-wrap: wrap;
      width: 100%;
      pointer-events: auto;
    }
    .layer-card {
      display: flex;
      flex-direction: column;
      gap: 3px;
      margin-top: 4px;
      font-size: 8px;
      font-family: monospace;
    }
    .layer-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 2px 5px;
      border-radius: 4px;
      background: rgba(15, 23, 42, 0.65);
      border-left: 2px solid #00f0ff;
    }
    .layer-item.active {
      border-left-color: #10b981;
      background: rgba(16, 185, 129, 0.15);
      color: #6ee7b7;
    }
    .layer-item.alert {
      border-left-color: #f43f5e;
      background: rgba(244, 63, 94, 0.15);
      color: #fda4af;
      animation: pulseAlert 1s infinite alternate;
    }
    @keyframes pulseAlert {
      from { opacity: 0.7; }
      to { opacity: 1.0; }
    }
    .cinematic-banner {
      position: absolute;
      top: 55px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(4, 8, 18, 0.95);
      border: 1px solid #f43f5e;
      border-radius: 6px;
      padding: 5px 14px;
      font-size: 10px;
      font-family: monospace;
      font-weight: 700;
      color: #fff;
      letter-spacing: 1px;
      box-shadow: 0 0 20px rgba(244, 63, 94, 0.4);
      z-index: 25;
      display: none;
      pointer-events: none;
      text-transform: uppercase;
      white-space: nowrap;
    }
    .flash-overlay {
      position: absolute;
      top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(255, 0, 50, 0.35);
      pointer-events: none;
      z-index: 20;
      opacity: 0;
      transition: opacity 0.15s ease;
    }
    .drawer {
      position: absolute;
      right: 8px;
      bottom: 74px;
      width: 310px;
      max-width: 90vw;
      background: rgba(8, 16, 32, 0.98);
      border: 1px solid #00f0ff;
      border-radius: 10px;
      padding: 10px;
      box-shadow: 0 10px 35px rgba(0, 0, 0, 0.85);
      z-index: 30;
      pointer-events: auto;
      display: none;
      backdrop-filter: blur(10px);
    }
    .modal-overlay {
      position: absolute;
      top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0, 0, 0, 0.85);
      z-index: 50;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 12px;
    }
    .quick-cams {
      display: flex;
      gap: 3px;
      margin-top: 4px;
    }
    .quick-cams button {
      padding: 2px 5px;
      font-size: 8px;
    }
  </style>
</head>
<body>
  <div id="canvas-container"></div>
  <div id="flash-overlay" class="flash-overlay"></div>
  <div id="cinematic-banner" class="cinematic-banner">MASTER EARLY DETECTOR ONLINE</div>

  <!-- INTEL / ASSET DRAWER (25-SYSTEM ENEMY SUPERPOWER ARSENAL) -->
  <div id="intel-drawer" class="drawer" style="max-height: 82vh; overflow-y: auto;">
    <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid rgba(0, 240, 255, 0.3); padding-bottom: 5px; margin-bottom: 6px;">
      <div>
        <span id="intel-badge" style="font-size: 8px; background: rgba(244,63,94,0.3); border: 1px solid rgba(244,63,94,0.6); color: #fda4af; padding: 1px 4px; border-radius: 3px; font-weight: bold; font-family: monospace;">SUPERPOWER BASTION</span>
        <div id="intel-name" style="font-size: 11px; font-weight: bold; color: #fff; margin-top: 2px;">TARGET SITE</div>
      </div>
      <button id="close-intel-btn" style="background: none; border: none; color: #94a3b8; font-size: 14px; cursor: pointer;">✕</button>
    </div>

    <!-- 5-Tier Filter Tabs -->
    <div style="display: flex; gap: 2px; overflow-x: auto; margin-bottom: 6px; padding-bottom: 2px;">
      <button class="tier-tab-btn btn btn-active" data-tier="ALL" style="font-size: 7px; padding: 2px 4px;">ALL (25)</button>
      <button class="tier-tab-btn btn" data-tier="DEFENSE" style="font-size: 7px; padding: 2px 4px;">DEF (5)</button>
      <button class="tier-tab-btn btn" data-tier="OFFENSE" style="font-size: 7px; padding: 2px 4px;">OFF (5)</button>
      <button class="tier-tab-btn btn" data-tier="CYBER" style="font-size: 7px; padding: 2px 4px;">EW (5)</button>
      <button class="tier-tab-btn btn" data-tier="FLEET" style="font-size: 7px; padding: 2px 4px;">FLEET (5)</button>
      <button class="tier-tab-btn btn" data-tier="LOGISTICS" style="font-size: 7px; padding: 2px 4px;">CMD (5)</button>
    </div>

    <!-- 25-System Quick Selector -->
    <select id="intel-system-select" style="width: 100%; background: #071224; border: 1px solid rgba(0, 240, 255, 0.4); color: #00f0ff; font-family: monospace; font-size: 8.5px; padding: 3px 5px; border-radius: 4px; margin-bottom: 6px;">
    </select>

    <div style="background: rgba(0,0,0,0.5); padding: 5px 7px; border-radius: 5px; border: 1px solid #334155; margin-bottom: 6px; font-family: monospace; font-size: 9px;">
      <div style="display: flex; justify-content: space-between;">
        <span style="color: #94a3b8;">INTERCEPTION PROBABILITY:</span>
        <span id="intel-prob-text" style="color: #f43f5e; font-weight: bold;">88% [ACTIVE]</span>
      </div>
      <div style="width: 100%; height: 4px; background: #040812; border-radius: 2px; overflow: hidden; margin-top: 3px;">
        <div id="intel-prob-bar" style="width: 88%; height: 100%; background: #f43f5e;"></div>
      </div>
    </div>
    <div style="font-size: 9px; font-family: monospace; color: #94a3b8; display: grid; grid-template-columns: 1fr 1fr; gap: 3px;">
      <div>COORDINATES: <span id="intel-coords" style="color: #00f0ff;">--</span></div>
      <div>THREAT RATING: <span id="intel-threat" style="color: #f43f5e; font-weight: bold;">--</span></div>
      <div>RADAR UMBRELLA: <span id="intel-radar" style="color: #f59e0b;">640km</span></div>
      <div>INTEGRITY: <span id="intel-health" style="color: #10b981;">100%</span></div>
    </div>
    <div id="intel-briefing" style="font-size: 8px; color: #cbd5e1; background: rgba(0,0,0,0.35); padding: 5px; border-radius: 4px; border-left: 2px solid #00f0ff; margin-top: 6px; font-family: monospace;">
      Superpower asset details.
    </div>
    <div style="display: flex; gap: 4px; margin-top: 8px;">
      <button id="intel-decoy-btn" class="btn btn-warning" style="flex: 1; padding: 6px 3px; font-size: 9px;">📡 LAUNCH DECOY</button>
      <button id="intel-sub-btn" class="btn btn-purple" style="flex: 1; padding: 6px 3px; font-size: 9px;">⚓ H-SUB STRIKE</button>
      <button id="intel-strike-btn" class="btn btn-danger" style="flex: 1; padding: 6px 3px; font-size: 9px;">🚀 EXECUTE STRIKE</button>
    </div>
  </div>

  <!-- DEPLOY DRAWER -->
  <div id="deploy-drawer" class="drawer" style="left: 50%; transform: translateX(-50%); right: auto; text-align: center;">
    <div style="font-size: 10px; font-family: monospace; color: #00f0ff; font-weight: bold; margin-bottom: 6px;">
      DEPLOY TACTICAL SITES (QUOTA: <span id="deploy-quota-text">12</span>)
    </div>
    <div style="display: flex; gap: 4px; justify-content: center;">
      <button id="deploy-silo-btn" class="btn btn-primary" style="font-size: 9px;">+ SILO (ICBM)</button>
      <button id="deploy-sam-btn" class="btn btn-warning" style="font-size: 9px;">+ S-20 SAM</button>
      <button id="deploy-beam-btn" class="btn btn-purple" style="font-size: 9px;">+ BEAM GUN</button>
      <button id="cancel-deploy-btn" class="btn" style="border-color: #64748b; color: #94a3b8; font-size: 9px;">CANCEL</button>
    </div>
  </div>

  <!-- DIPLOMACY DRAWER -->
  <div id="diplomacy-drawer" class="drawer">
    <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(0, 240, 255, 0.3); padding-bottom: 4px; margin-bottom: 6px;">
      <div style="font-size: 10px; font-family: monospace; font-weight: bold; color: #10b981;">NEUTRAL MEDIATORS CEASEFIRE</div>
      <button id="close-diplo-btn" style="background: none; border: none; color: #94a3b8; font-size: 14px; cursor: pointer;">✕</button>
    </div>
    <div style="font-size: 9px; font-family: monospace; color: #cbd5e1; margin-bottom: 6px;">
      SWISS CONFEDERATION / UN SECURITY COUNCIL DIPLOMATIC CHANNEL
    </div>
    <div style="background: rgba(0,0,0,0.4); padding: 5px; border-radius: 4px; font-size: 8px; font-family: monospace; color: #94a3b8; margin-bottom: 6px;">
      CEASEFIRE PROGRESS: <span id="ceasefire-pct" style="color: #10b981; font-weight: bold;">35%</span>
      <div style="width: 100%; height: 4px; background: #040812; border-radius: 2px; overflow: hidden; margin-top: 2px;">
        <div id="ceasefire-bar" style="width: 35%; height: 100%; background: #10b981;"></div>
      </div>
    </div>
    <button id="ratify-treaty-btn" class="btn btn-primary" style="width: 100%; font-size: 9px; padding: 6px;">🤝 RATIFY PEACE TREATY</button>
  </div>

  <!-- MULTI-LAYER DEFENSE HUD DRAWER (12-LAYER COMPLETE ARCHITECTURE) -->
  <div id="defense-drawer" class="drawer" style="left: 8px; right: auto; width: 290px; max-height: 80vh; overflow-y: auto;">
    <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(0, 240, 255, 0.3); padding-bottom: 4px; margin-bottom: 4px;">
      <div style="font-size: 10px; font-family: monospace; font-weight: bold; color: #00f0ff;">INTEGRATED 12-LAYER AIR DEFENSE</div>
      <button id="close-defense-btn" style="background: none; border: none; color: #94a3b8; font-size: 14px; cursor: pointer;">✕</button>
    </div>
    <div class="layer-card">
      <div class="layer-item active" id="layer-s25"><span>1. MULTI S-25 PREDICTING</span><span>VECTORS SCANNED</span></div>
      <div class="layer-item active" id="layer-s20"><span>2. THRILLER S-20 GRID</span><span>KINETIC INTERCEPT</span></div>
      <div class="layer-item active" id="layer-v70"><span>3. THRILLER V-70 TRACKING</span><span id="tti-display">TTI: READY</span></div>
      <div class="layer-item" id="layer-s90"><span>4. THRILLER S-90 ALARM V-2</span><span>CITY SIRENS</span></div>
      <div class="layer-item active" id="layer-cloud"><span>5. MULTI-CLOUD ARCHIVE</span><span>IMPACT COMPUTED</span></div>
      <div class="layer-item active" id="layer-beam"><span>6. PREDICTIVE BEAM GUNS</span><span id="beam-status">HEAT: 0%</span></div>
      <div class="layer-item active" id="layer-f90"><span>7. F-90 PRO STRATO-SAM</span><span>EXO-ATMOSPHERIC</span></div>
      <div class="layer-item active" id="layer-spear"><span>8. HIJACKING SPEAR SYSTEM</span><span>CYBER GUIDANCE HACK</span></div>
      <div class="layer-item alert" id="layer-master"><span>9. MASTER DETECTOR V7</span><span>AUTO DOOMSDAY ON</span></div>
      <div class="layer-item active" id="layer-sub"><span>10. HYDROGEN SUBMARINES</span><span id="sub-status-text">OFFSHORE ARMED</span></div>
      <div class="layer-item active" id="layer-recon"><span>11. TARGETED RECON DRONES</span><span id="drone-status-text">STANDBY / READY</span></div>
      <div class="layer-item active" id="layer-ew-bunker"><span>12. EW & CIVIL BUNKERS</span><span id="bunker-status-text">SHELTERS SEALED 100%</span></div>
    </div>
  </div>

  <!-- MAIN HUD -->
  <div class="hud-layer">
    <!-- Top Row -->
    <div class="top-bar">
      <!-- Left: City Integrity & Defense Status -->
      <div class="hud-panel" style="min-width: 140px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-size: 8px; color: #94a3b8; font-weight: bold;">METROPOLIS INTEGRITY</span>
          <span id="city-health-pct" style="color: #00f0ff; font-weight: bold; font-family: monospace; font-size: 10px;">100%</span>
        </div>
        <div class="health-bar-container">
          <div id="city-health-bar" class="health-bar"></div>
        </div>
        <div style="margin-top: 4px; display: flex; align-items: center; justify-content: space-between;">
          <button id="toggle-defense-btn" class="btn" style="padding: 2px 4px; font-size: 8px;">🛡️ 12-LAYER GRID</button>
          <span id="rescue-drones-badge" style="font-size: 8px; color: #10b981; font-family: monospace;">DRONES: ACTIVE</span>
        </div>
        <div class="quick-cams">
          <button id="cam-hq" class="btn">HQ</button>
          <button id="cam-silos" class="btn">SILOS</button>
          <button id="cam-target" class="btn">ENEMY</button>
          <button id="cam-reset" class="btn">RESET</button>
        </div>
      </div>

      <!-- Center: DEFCON & Wave Info -->
      <div class="hud-panel" style="text-align: center;">
        <div id="defcon-badge" style="font-size: 9px; font-weight: 800; color: #f43f5e; letter-spacing: 1px; font-family: monospace;">DEFCON 2: INTERCEPT ALERT</div>
        <div id="wave-title" style="font-size: 8px; color: #f59e0b; font-family: monospace; margin-top: 1px;">WAVE 1/5: RECON SORTIE</div>
        <div style="margin-top: 2px; font-size: 8px; color: #00f0ff; font-family: monospace;">
          COUNTDOWN: <span id="wave-timer-text" style="font-weight: bold;">35s</span>
        </div>
      </div>

      <!-- Right: Arsenal Stocks & Score -->
      <div class="hud-panel" style="text-align: right; min-width: 130px;">
        <div style="display: flex; justify-content: space-between; font-size: 8px; font-family: monospace;">
          <span style="color: #94a3b8;">S-20 / F-90 SAM:</span>
          <span id="sam-stock-text" style="font-weight: bold; color: #00f0ff;">28/36</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 8px; font-family: monospace; margin-top: 2px;">
          <span style="color: #94a3b8;">BEAM GUN HEAT:</span>
          <span id="beam-heat-text" style="font-weight: bold; color: #a855f7;">0% [READY]</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 8px; font-family: monospace; margin-top: 2px;">
          <span style="color: #94a3b8;">DECOYS / SILOS:</span>
          <span id="silo-stock-text" style="font-weight: bold; color: #f59e0b;">4 / 4</span>
        </div>
        <div style="margin-top: 3px; font-size: 9px; color: #cbd5e1; font-family: monospace;">
          SCORE: <span id="score-text" style="color: #10b981; font-weight: bold;">0</span>
        </div>
      </div>
    </div>

    <!-- Bottom Controls -->
    <div class="bottom-bar">
      <div class="hud-panel" style="display: flex; gap: 4px; flex-wrap: wrap; justify-content: center; align-items: center;">
        <button id="map-mode-btn" class="btn btn-primary">🗺️ SATELLITE INTEL (25)</button>
        <button id="diplo-btn" class="btn" style="border-color: #10b981; color: #10b981;">🤝 CEASEFIRE DIPLOMACY</button>
        <button id="deploy-mode-btn" class="btn">🏗️ DEPLOY BASE</button>
        <button id="recon-drone-btn" class="btn" style="border-color: #10b981; color: #10b981;">🛩️ RECON DRONE</button>
        <button id="sub-strike-btn" class="btn" style="border-color: #06b6d4; color: #06b6d4;">⚓ H-SUB STRIKE</button>
        <button id="launch-decoy-btn" class="btn btn-warning">📡 LAUNCH DECOY (<span id="decoy-count-btn">4</span>)</button>
        <button id="jamming-btn" class="btn btn-purple">⚡ JAM RADAR (EW)</button>
        <button id="asat-btn" class="btn" style="border-color: #ec4899; color: #ec4899;">🛰️ ASAT STRIKE</button>
        <button id="spear-btn" class="btn" style="border-color: #38bdf8; color: #38bdf8;">🗡️ HIJACK SPEAR</button>
        <button id="auto-defense-btn" class="btn btn-active">🛡️ AUTO-DEFENSE: ON</button>
        <button id="audio-toggle-btn" class="btn">🔊</button>
        <button id="launch-icbm-btn" class="btn btn-danger">🚀 EXECUTE BALLISTIC STRIKE</button>
      </div>
    </div>
  </div>

  <!-- GAME OVER / VICTORY MODAL -->
  <div id="end-modal" class="modal-overlay" style="display: none;">
    <div class="hud-panel" style="max-width: 340px; width: 100%; text-align: center; border-color: #f43f5e; padding: 18px 14px;">
      <div id="modal-title" style="font-size: 16px; font-weight: 800; color: #f43f5e; margin-bottom: 4px;">METROPOLIS DESTROYED</div>
      <div id="modal-desc" style="font-size: 10px; color: #cbd5e1; line-height: 1.5; margin-bottom: 12px;">
        Hostile saturation strike breached your air defense umbrella.
      </div>
      <div style="background: rgba(0,0,0,0.5); padding: 8px; border-radius: 6px; margin-bottom: 12px; font-family: monospace; font-size: 10px;">
        FINAL SCORE: <span id="modal-final-score" style="color: #f59e0b; font-weight: bold;">0</span><br>
        WARHEADS INTERCEPTED: <span id="modal-final-intercepts" style="color: #00f0ff; font-weight: bold;">0</span>
      </div>
      <button id="modal-restart-btn" class="btn btn-primary" style="width: 100%; padding: 8px;">RESTART WARFARE SIMULATION</button>
    </div>
  </div>

  <script>
    // --- PROCEDURAL WEB AUDIO SYNTHESIZER ---
    let audioCtx = null;
    let isMuted = false;

    function initAudio() {
      if (isMuted) return;
      try {
        if (!audioCtx) {
          const AudioCtx = window.AudioContext || window.webkitAudioContext;
          if (AudioCtx) audioCtx = new AudioCtx();
        }
        if (audioCtx && audioCtx.state === 'suspended') {
          audioCtx.resume().catch(() => {});
        }
      } catch (e) {}
    }

    ['click', 'touchstart', 'touchend', 'pointerdown', 'keydown'].forEach(evt => {
      window.addEventListener(evt, () => { initAudio(); }, { passive: true });
    });

    function playTone(freq, duration, type, rampTo) {
      if (!audioCtx || isMuted) return;
      try {
        if (audioCtx.state === 'suspended') { audioCtx.resume().catch(() => {}); }
        const now = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = type || 'sine';
        osc.frequency.setValueAtTime(Math.max(20, freq), now);
        if (rampTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20, rampTo), now + duration);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + duration);
      } catch (e) {}
    }

    function playExplosion(isHeavy) {
      if (!audioCtx || isMuted) return;
      try {
        if (audioCtx.state === 'suspended') { audioCtx.resume().catch(() => {}); }
        const now = audioCtx.currentTime;
        const dur = isHeavy ? 1.4 : 0.6;
        const bufSize = Math.floor(audioCtx.sampleRate * dur);
        const buffer = audioCtx.createBuffer(1, bufSize, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        const decay = audioCtx.sampleRate * (isHeavy ? 0.4 : 0.15);
        for (let i = 0; i < bufSize; i++) {
          data[i] = (Math.random() * 2 - 1) * Math.exp(-i / decay);
        }
        const noise = audioCtx.createBufferSource();
        noise.buffer = buffer;
        const filter = audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(isHeavy ? 600 : 1200, now);
        filter.frequency.exponentialRampToValueAtTime(30, now + dur);
        const gain = audioCtx.createGain();
        gain.gain.setValueAtTime(isHeavy ? 0.9 : 0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(audioCtx.destination);
        noise.start(now);
      } catch (e) {}
    }

    function playLaserBeam() {
      if (!audioCtx || isMuted) return;
      try {
        if (audioCtx.state === 'suspended') { audioCtx.resume().catch(() => {}); }
        const now = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(1400, now);
        osc.frequency.exponentialRampToValueAtTime(300, now + 0.3);
        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.35);
      } catch (e) {}
    }

    function playSiren() {
      if (!audioCtx || isMuted) return;
      try {
        if (audioCtx.state === 'suspended') { audioCtx.resume().catch(() => {}); }
        const now = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.linearRampToValueAtTime(880, now + 0.5);
        osc.frequency.linearRampToValueAtTime(440, now + 1.0);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 1.2);
      } catch (e) {}
    }

    // --- PROCEDURAL TEXTURES ---
    function createSkyscraperTexture(baseHex, winHex) {
      const cv = document.createElement('canvas');
      cv.width = 128; cv.height = 256;
      const ctx = cv.getContext('2d');
      ctx.fillStyle = baseHex;
      ctx.fillRect(0, 0, 128, 256);
      ctx.fillStyle = '#0f172a';
      for (let x = 0; x < 128; x += 16) ctx.fillRect(x, 0, 2, 256);
      for (let y = 0; y < 256; y += 16) ctx.fillRect(0, y, 128, 2);
      ctx.fillStyle = winHex;
      for (let y = 2; y < 256; y += 16) {
        for (let x = 2; x < 128; x += 16) {
          if (Math.random() > 0.35) {
            ctx.globalAlpha = 0.6 + Math.random() * 0.4;
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

    function createSatelliteMapTex() {
      const cv = document.createElement('canvas');
      cv.width = 512; cv.height = 256;
      const ctx = cv.getContext('2d');
      ctx.fillStyle = '#051020';
      ctx.fillRect(0, 0, 512, 256);
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.2;
      for (let x = 0; x < 512; x += 32) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 256); ctx.stroke();
      }
      for (let y = 0; y < 256; y += 32) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(512, y); ctx.stroke();
      }
      ctx.globalAlpha = 0.8;
      ctx.fillStyle = '#00f0ff';
      ctx.font = '10px monospace';
      ctx.fillText('GLOBAL SATELLITE EARLY WARNING & MULTI-CLOUD SURVEILLANCE', 14, 22);
      return new THREE.CanvasTexture(cv);
    }

    function createCraterTex() {
      const cv = document.createElement('canvas');
      cv.width = 64; cv.height = 64;
      const ctx = cv.getContext('2d');
      const grad = ctx.createRadialGradient(32, 32, 4, 32, 32, 30);
      grad.addColorStop(0, '#0a0a0a');
      grad.addColorStop(0.5, '#1e293b');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 64, 64);
      return new THREE.CanvasTexture(cv);
    }

    // --- THREE.JS SCENE SETUP ---
    const container = document.getElementById('canvas-container');
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x040914);
    scene.fog = new THREE.FogExp2(0x0a1628, 0.0025);

    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.5, 3500);
    camera.position.set(0, 140, 220);
    camera.lookAt(0, 25, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // LIGHTS
    const ambientLight = new THREE.AmbientLight(0xbad7f2, 0.85);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfffaec, 1.8);
    sunLight.position.set(-160, 280, -160);
    sunLight.castShadow = true;
    scene.add(sunLight);

    // TERRAIN & OCEAN
    const groundGeo = new THREE.PlaneGeometry(420, 420);
    groundGeo.rotateX(-Math.PI / 2);
    const groundMesh = new THREE.Mesh(
      groundGeo,
      new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.85, metalness: 0.2 })
    );
    groundMesh.receiveShadow = true;
    groundMesh.matrixAutoUpdate = false;
    groundMesh.updateMatrix();
    scene.add(groundMesh);

    const oceanGeo = new THREE.PlaneGeometry(1800, 1800);
    oceanGeo.rotateX(-Math.PI / 2);
    const oceanMesh = new THREE.Mesh(
      oceanGeo,
      new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.2, metalness: 0.7, transparent: true, opacity: 0.9 })
    );
    oceanMesh.position.y = -1.2;
    oceanMesh.receiveShadow = true;
    oceanMesh.matrixAutoUpdate = false;
    oceanMesh.updateMatrix();
    scene.add(oceanMesh);

    // INSTANCED SKYSCRAPERS CITYSCAPE
    const cyanGlass = createSkyscraperTexture('#091e3a', '#00f0ff');
    const goldGlass = createSkyscraperTexture('#261b0a', '#f59e0b');
    const cyanMat = new THREE.MeshStandardMaterial({ map: cyanGlass, roughness: 0.2, metalness: 0.8 });
    const goldMat = new THREE.MeshStandardMaterial({ map: goldGlass, roughness: 0.2, metalness: 0.8 });

    const cyanDefs = [];
    const goldDefs = [];
    for (let x = -130; x <= 130; x += 26) {
      for (let z = -130; z <= 130; z += 26) {
        if (Math.abs(x) < 38 && Math.abs(z) < 38) continue;
        const h = 35 + Math.random() * 85;
        const w = 11 + Math.random() * 8;
        const def = { x: x + (Math.random() - 0.5) * 5, y: h / 2, z: z + (Math.random() - 0.5) * 5, sx: w, sy: h, sz: w };
        if (Math.random() > 0.5) cyanDefs.push(def);
        else goldDefs.push(def);
      }
    }

    const unitBox = new THREE.BoxGeometry(1, 1, 1);
    const dummyObj = new THREE.Object3D();

    if (cyanDefs.length > 0) {
      const instCyan = new THREE.InstancedMesh(unitBox, cyanMat, cyanDefs.length);
      cyanDefs.forEach((b, i) => {
        dummyObj.position.set(b.x, b.y, b.z);
        dummyObj.scale.set(b.sx, b.sy, b.sz);
        dummyObj.updateMatrix();
        instCyan.setMatrixAt(i, dummyObj.matrix);
      });
      instCyan.instanceMatrix.needsUpdate = true;
      instCyan.matrixAutoUpdate = false;
      instCyan.updateMatrix();
      scene.add(instCyan);
    }
    if (goldDefs.length > 0) {
      const instGold = new THREE.InstancedMesh(unitBox, goldMat, goldDefs.length);
      goldDefs.forEach((b, i) => {
        dummyObj.position.set(b.x, b.y, b.z);
        dummyObj.scale.set(b.sx, b.sy, b.sz);
        dummyObj.updateMatrix();
        instGold.setMatrixAt(i, dummyObj.matrix);
      });
      instGold.instanceMatrix.needsUpdate = true;
      instGold.matrixAutoUpdate = false;
      instGold.updateMatrix();
      scene.add(instGold);
    }

    // Command HQ Citadel & Radome
    const commandDome = new THREE.Mesh(
      new THREE.SphereGeometry(18, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.5),
      new THREE.MeshStandardMaterial({ color: 0x00f0ff, roughness: 0.1, metalness: 0.9, transparent: true, opacity: 0.85, emissive: 0x003344, emissiveIntensity: 0.6 })
    );
    commandDome.position.set(0, 0, 0);
    commandDome.matrixAutoUpdate = false;
    commandDome.updateMatrix();
    scene.add(commandDome);

    // Directed Energy Beam Guns
    const beamGunTurrets = [
      { pos: new THREE.Vector3(-36, 0, -36), coolingTimer: 0 },
      { pos: new THREE.Vector3(36, 0, -36), coolingTimer: 0 },
      { pos: new THREE.Vector3(-36, 0, 36), coolingTimer: 0 },
      { pos: new THREE.Vector3(36, 0, 36), coolingTimer: 0 },
    ];
    beamGunTurrets.forEach(b => {
      const m = new THREE.Mesh(
        new THREE.CylinderGeometry(2.5, 3.2, 3, 8),
        new THREE.MeshStandardMaterial({ color: 0x6d28d9, metalness: 0.9 })
      );
      m.position.copy(b.pos).add(new THREE.Vector3(0, 1.5, 0));
      scene.add(m);
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(3.5, 0.4, 8, 16),
        new THREE.MeshBasicMaterial({ color: 0xa855f7 })
      );
      ring.position.copy(b.pos).add(new THREE.Vector3(0, 3.2, 0));
      ring.rotation.x = Math.PI / 2;
      scene.add(ring);
    });

    // ASW Sonar Coastal Submarines
    const aswSubs = [
      { pos: new THREE.Vector3(180, -0.6, -140) },
      { pos: new THREE.Vector3(-180, -0.6, 140) },
    ];
    aswSubs.forEach(s => {
      const hull = new THREE.Mesh(
        new THREE.CylinderGeometry(2, 2.5, 22, 10),
        new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.95 })
      );
      hull.rotation.z = Math.PI / 2;
      hull.position.copy(s.pos);
      scene.add(hull);
    });

    // Friendly Silos & SAMs
    const friendlyBases = [
      { id: 0, type: 'silo', pos: new THREE.Vector3(-18, 0, -18), ready: true },
      { id: 1, type: 'silo', pos: new THREE.Vector3(18, 0, -18), ready: true },
      { id: 2, type: 'silo', pos: new THREE.Vector3(-18, 0, 18), ready: true },
      { id: 3, type: 'silo', pos: new THREE.Vector3(18, 0, 18), ready: true },
      { id: 4, type: 'sam', pos: new THREE.Vector3(0, 0, -52), ready: true },
      { id: 5, type: 'sam', pos: new THREE.Vector3(-48, 0, 42), ready: true },
      { id: 6, type: 'sam', pos: new THREE.Vector3(48, 0, 42), ready: true },
    ];

    friendlyBases.forEach(base => {
      if (base.type === 'silo') {
        const pad = new THREE.Mesh(
          new THREE.CylinderGeometry(5.2, 5.8, 1.2, 16),
          new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.85 })
        );
        pad.position.copy(base.pos).add(new THREE.Vector3(0, 0.6, 0));
        scene.add(pad);

        const doorL = new THREE.Mesh(
          new THREE.BoxGeometry(4.6, 0.4, 2.2),
          new THREE.MeshStandardMaterial({ color: 0xf43f5e, metalness: 0.9 })
        );
        doorL.position.copy(base.pos).add(new THREE.Vector3(0, 1.3, -1.1));
        scene.add(doorL);
        base.doorLeft = doorL;

        const doorR = new THREE.Mesh(
          new THREE.BoxGeometry(4.6, 0.4, 2.2),
          new THREE.MeshStandardMaterial({ color: 0xf43f5e, metalness: 0.9 })
        );
        doorR.position.copy(base.pos).add(new THREE.Vector3(0, 1.3, 1.1));
        scene.add(doorR);
        base.doorRight = doorR;
      } else {
        const samGroup = new THREE.Group();
        const baseMesh = new THREE.Mesh(
          new THREE.CylinderGeometry(3.5, 4.0, 2, 8),
          new THREE.MeshStandardMaterial({ color: 0x0f172a })
        );
        baseMesh.position.y = 1;
        samGroup.add(baseMesh);

        const launcher = new THREE.Mesh(
          new THREE.BoxGeometry(2.8, 1.8, 4.2),
          new THREE.MeshStandardMaterial({ color: 0x00f0ff, metalness: 0.85 })
        );
        launcher.position.set(0, 2.8, 0);
        launcher.rotation.x = -Math.PI * 0.25;
        samGroup.add(launcher);
        samGroup.position.copy(base.pos);
        scene.add(samGroup);
      }
    });

    // ENEMY SUPERPOWER 25-SYSTEM ARSENAL & DEFENSE GRID
    const rawEnemyData = [
      // TIER 1: DEFENSE & INTERCEPTORS
      { name: 'AEGIS-X SKY SHIELD', tier: 'DEFENSE', category: 'MULTI-TIER INTERCEPTOR GRID', coords: "39°54'N, 116°23'E", prob: 92, height: 50, color: '#f43f5e', threat: 'CRITICAL', briefing: 'Layered phased-array anti-ballistic shield coordinating interception vectors.' },
      { name: 'TITANIUM DOME CIWS', tier: 'DEFENSE', category: 'CLOSE-IN WEAPONS SYSTEM', coords: "40°01'N, 116°15'E", prob: 88, height: 35, color: '#e11d48', threat: 'SEVERE', briefing: 'High-cadence rotary kinetic CIWS obliterating low-altitude strikes.' },
      { name: 'HYPERION BEAM CANNON', tier: 'DEFENSE', category: 'DIRECTED ENERGY CANNON', coords: "40°18'N, 116°42'E", prob: 95, height: 60, color: '#ec4899', threat: 'CRITICAL', briefing: 'Megawatt laser cannon neutralizing inbound warheads during terminal approach.' },
      { name: 'SPECTRE V-9 INTERCEPTOR', tier: 'DEFENSE', category: 'STRATOSPHERIC SAM ARRAY', coords: "40°32'N, 115°50'E", prob: 90, height: 55, color: '#e11d48', threat: 'EXTREME', briefing: 'Mach-7 vector-thrust interceptors engaging exo-atmospheric targets.' },
      { name: 'VALKYRIE POINT-DEFENSE', tier: 'DEFENSE', category: 'MOBILE DEFENSE ARRAY', coords: "39°42'N, 117°05'E", prob: 85, height: 40, color: '#fb7185', threat: 'HIGH', briefing: 'Mobile hypersonic kinetic interceptors defending perimeter silos.' },

      // TIER 2: OFFENSE & HYPERSONICS
      { name: 'VANGUARD HYPERSONIC GLIDE VEHICLE', tier: 'OFFENSE', category: 'HYPERSONIC GLIDER', coords: "37°15'N, 113°30'E", prob: 86, height: 42, color: '#f59e0b', threat: 'CRITICAL', briefing: 'Mach-15 skip-glide vehicle evading conventional radar detection arcs.' },
      { name: 'DREADNOUGHT MIRV ICBM', tier: 'OFFENSE', category: 'HEAVY MULTI-WARHEAD ICBM', coords: "36°55'N, 112°45'E", prob: 84, height: 65, color: '#d97706', threat: 'CRITICAL', briefing: 'Heavy intercontinental ballistic missile deploying multiple independent warheads.' },
      { name: 'SHADOW-STRIKE STEALTH CRUISE', tier: 'OFFENSE', category: 'TERRAIN-HUGGING CRUISE', coords: "38°40'N, 114°50'E", prob: 82, height: 32, color: '#a855f7', threat: 'SEVERE', briefing: 'Radar-absorbent subsonic cruise missile flying beneath radar horizons.' },
      { name: 'ORBITAL KINETIC PENETRATOR', tier: 'OFFENSE', category: 'RODS FROM GOD', coords: "ORBITAL 450KM", prob: 96, height: 75, color: '#ef4444', threat: 'CRITICAL', briefing: 'Tungsten kinetic rod orbital strikes delivering non-nuclear devastating shockwaves.' },
      { name: 'PLASMA-CORE BUNKER BUSTER', tier: 'OFFENSE', category: 'DEEP PENETRATION MUNITION', coords: "37°48'N, 113°10'E", prob: 87, height: 48, color: '#ea580c', threat: 'EXTREME', briefing: 'Thermobaric burrowing warhead designed to collapse underground bunkers.' },

      // TIER 3: ELECTRONIC & CYBER WARFARE
      { name: 'GHOST-NET SATELLITE ARRAY', tier: 'CYBER', category: 'ORBITAL SURVEILLANCE', coords: "GEO-SYNC 36,000KM", prob: 80, height: 70, color: '#00f0ff', threat: 'HIGH', briefing: 'Global constellations granting pinpoint friendly launch tracking. Vulnerable to ASAT.' },
      { name: 'BLACKOUT EMP EMITTER', tier: 'CYBER', category: 'HIGH-ALTITUDE EMP', coords: "39°12'N, 115°18'E", prob: 78, height: 50, color: '#38bdf8', threat: 'SEVERE', briefing: 'High-flux electromagnetic pulse generator blinding radar arrays.' },
      { name: 'KRAKEN CYBER HIJACKER', tier: 'CYBER', category: 'CYBER INTRUSION SUITE', coords: "39°50'N, 116°55'E", prob: 85, height: 45, color: '#6366f1', threat: 'SEVERE', briefing: 'Advanced malware transmitter attempting to corrupt friendly telemetry.' },
      { name: 'AURA JAMMING DOME', tier: 'CYBER', category: 'BROADBAND EW SHIELD', coords: "40°25'N, 116°10'E", prob: 89, height: 52, color: '#818cf8', threat: 'CRITICAL', briefing: 'Phased microwave dome jamming missile guidance sensors.' },
      { name: 'QUANTUM DECOY ARRAY', tier: 'CYBER', category: 'SIGNATURE REPLICATOR', coords: "38°15'N, 114°20'E", prob: 75, height: 38, color: '#c084fc', threat: 'HIGH', briefing: 'Holographic radar spoofing array generating phantom strike vectors.' },

      // TIER 4: NAVAL & AIR FLEET
      { name: 'PHANTOM STEALTH STRIKE JET', tier: 'FLEET', category: 'GEN-6 STEALTH JET', coords: "38°22'N, 115°05'E", prob: 85, height: 40, color: '#64748b', threat: 'SEVERE', briefing: 'Supercruising stealth air superiority and strike asset.' },
      { name: 'LEVIATHAN NUCLEAR ATTACK SUB', tier: 'FLEET', category: 'DEEP-DIVING SSN', coords: "18°12'N, 109°30'E", prob: 83, height: 30, color: '#06b6d4', threat: 'EXTREME', briefing: 'Silent nuclear attack submarine lurking offshore to launch surprise salvos.' },
      { name: 'POSEIDON SUPER-TORPEDO', tier: 'FLEET', category: 'COASTAL TSUNAMI WEAPON', coords: "18°35'N, 110°15'E", prob: 88, height: 32, color: '#0ea5e9', threat: 'CRITICAL', briefing: 'Autonomous nuclear drone torpedo capable of triggering seismic tidal surges.' },
      { name: 'SKY-FORTRESS AWACS RADAR', tier: 'FLEET', category: 'AIRBORNE EARLY WARNING', coords: "39°10'N, 117°40'E", prob: 86, height: 58, color: '#3b82f6', threat: 'HIGH', briefing: 'Airborne radar fortress providing 360-degree look-down shoot-down capability.' },
      { name: 'SWARM RECON DRONES', tier: 'FLEET', category: 'AUTONOMOUS DRONE SWARM', coords: "39°45'N, 116°00'E", prob: 70, height: 28, color: '#10b981', threat: 'MEDIUM', briefing: 'Networked micro-drones mapping city defense weak spots.' },

      // TIER 5: COMMAND & LOGISTICS
      { name: 'IRON-CITADEL BUNKERS', tier: 'LOGISTICS', category: 'HARDENED COMMAND HQ', coords: "36°50'N, 112°00'E", prob: 90, height: 45, color: '#e11d48', threat: 'CRITICAL', briefing: 'Reinforced subterranean command complex coordinating all 5 offensive waves.' },
      { name: 'AUTOMATED SILO RELOADERS', tier: 'LOGISTICS', category: 'RAPID MUNITIONS RELOADER', coords: "37°30'N, 112°50'E", prob: 82, height: 36, color: '#f59e0b', threat: 'SEVERE', briefing: 'Underground rail magazines replenishing missile silos in under 90 seconds.' },
      { name: 'ADAPTIVE RADAR SHIELDING', tier: 'LOGISTICS', category: 'METAMATERIAL CAMOUFLAGE', coords: "41°05'N, 117°10'E", prob: 88, height: 60, color: '#14b8a6', threat: 'HIGH', briefing: 'Active electronic cancellation shrouding base installations.' },
      { name: 'EARLY THREAT AI PREDICTOR', tier: 'LOGISTICS', category: 'NEURAL STRATEGY ENGINE', coords: "39°35'N, 116°30'E", prob: 85, height: 50, color: '#8b5cf6', threat: 'SEVERE', briefing: 'Quantum neural computing core anticipating friendly counter-battery fires.' },
      { name: 'COUNTER-STRIKE AUTO PROTOCOL', tier: 'LOGISTICS', category: 'AUTOMATED RETALIATION', coords: "36°20'N, 111°45'E", prob: 94, height: 52, color: '#f43f5e', threat: 'CRITICAL', briefing: 'Dead-hand failsafe triggering immediate retaliation upon facility destruction.' },
    ];

    const enemyAssets = rawEnemyData.map((d, i) => {
      const angle = (i / 25) * Math.PI * 2;
      const dist = 700 + (i % 4) * 45;
      const x = Math.round(Math.cos(angle) * dist);
      const z = Math.round(Math.sin(angle) * dist);
      return {
        id: i,
        name: d.name,
        tier: d.tier,
        category: d.category,
        coords: d.coords,
        health: 100,
        threatLevel: d.threat,
        briefing: d.briefing,
        height: d.height,
        color: d.color,
        destroyed: false,
        absPos: new THREE.Vector3(x, 0, z),
        topPos: new THREE.Vector3(x, d.height, z),
        interceptionProb: d.prob,
        interceptorStock: 8,
      };
    });

    const enemyGroup = new THREE.Group();
    enemyAssets.forEach(asset => {
      const g = new THREE.Group();
      const m = new THREE.Mesh(
        new THREE.BoxGeometry(18, asset.height, 18),
        new THREE.MeshStandardMaterial({ color: new THREE.Color(asset.color), emissive: new THREE.Color(asset.color), emissiveIntensity: 0.35, roughness: 0.3, metalness: 0.8 })
      );
      m.position.set(0, asset.height / 2, 0);
      m.castShadow = true;
      m.userData = asset;
      m.matrixAutoUpdate = false;
      m.updateMatrix();
      g.add(m);
      g.position.copy(asset.absPos);
      g.matrixAutoUpdate = false;
      g.updateMatrix();
      asset.mesh = m;
      enemyGroup.add(g);
    });
    scene.add(enemyGroup);

    // Target Selection Ring
    const targetRing = new THREE.Mesh(
      new THREE.RingGeometry(4.5, 6.0, 32),
      new THREE.MeshBasicMaterial({ color: 0xf43f5e, side: THREE.DoubleSide })
    );
    targetRing.rotateX(-Math.PI / 2);
    targetRing.position.set(0, -100, 0);
    scene.add(targetRing);

    // SATELLITE INTEL MAP PLANE
    const mapPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(130, 65),
      new THREE.MeshBasicMaterial({ map: createSatelliteMapTex(), side: THREE.DoubleSide })
    );
    mapPlane.rotateX(-Math.PI / 2);
    mapPlane.position.set(0, 1600, 0);
    mapPlane.matrixAutoUpdate = false;
    mapPlane.updateMatrix();
    scene.add(mapPlane);

    // POOLS FOR 60 FPS ZERO-ALLOCATION GAMELOOP
    const DEBRIS_SIZE = 80;
    const debrisPool = [];
    const debrisMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.8 });
    for (let i = 0; i < DEBRIS_SIZE; i++) {
      const d = new THREE.Mesh(unitBox, debrisMat);
      d.visible = false;
      scene.add(d);
      debrisPool.push({ mesh: d, active: false, vel: new THREE.Vector3(), rotVel: new THREE.Vector3(), life: 0 });
    }

    const SHOCKWAVE_SIZE = 20;
    const shockwavePool = [];
    const shockGeo = new THREE.RingGeometry(0.8, 2.0, 24);
    shockGeo.rotateX(-Math.PI / 2);
    for (let i = 0; i < SHOCKWAVE_SIZE; i++) {
      const s = new THREE.Mesh(shockGeo, new THREE.MeshBasicMaterial({ color: 0xffaa00, transparent: true, opacity: 0.95, side: THREE.DoubleSide }));
      s.visible = false;
      scene.add(s);
      shockwavePool.push({ mesh: s, active: false, scale: 1.0, opacity: 0.95 });
    }

    const CRATER_SIZE = 16;
    const craterPool = [];
    const craterMat = new THREE.MeshBasicMaterial({ map: createCraterTex(), transparent: true, opacity: 0.85 });
    let nextCrater = 0;
    for (let i = 0; i < CRATER_SIZE; i++) {
      const c = new THREE.Mesh(new THREE.PlaneGeometry(16, 16).rotateX(-Math.PI / 2), craterMat);
      c.position.set(0, -50, 0);
      c.visible = false;
      scene.add(c);
      craterPool.push(c);
    }

    const WARHEAD_SIZE = 16;
    const warheadPool = [];
    for (let i = 0; i < WARHEAD_SIZE; i++) {
      const g = new THREE.Group();
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.9, 4.5, 8), new THREE.MeshStandardMaterial({ color: 0xf43f5e, metalness: 0.85 }));
      body.rotation.x = Math.PI / 2;
      g.add(body);
      const light = new THREE.PointLight(0xf43f5e, 2.5, 20);
      g.add(light);
      g.visible = false;
      scene.add(g);
      warheadPool.push({ group: g, active: false, vel: new THREE.Vector3(), targetPos: new THREE.Vector3(), hijacked: false, life: 0 });
    }

    const SAM_SIZE = 16;
    const samPool = [];
    for (let i = 0; i < SAM_SIZE; i++) {
      const g = new THREE.Group();
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.45, 3.2, 8), new THREE.MeshStandardMaterial({ color: 0x00f0ff, metalness: 0.9 }));
      body.rotation.x = Math.PI / 2;
      g.add(body);
      const light = new THREE.PointLight(0x00f0ff, 2.0, 16);
      g.add(light);
      g.visible = false;
      scene.add(g);
      samPool.push({ group: g, active: false, dest: new THREE.Vector3(), speed: 180, life: 5.0 });
    }

    const BEAM_SIZE = 4;
    const beamPool = [];
    for (let i = 0; i < BEAM_SIZE; i++) {
      const beamGeo = new THREE.CylinderGeometry(0.4, 0.4, 1, 8);
      const beamMat = new THREE.MeshBasicMaterial({ color: 0xa855f7, transparent: true, opacity: 0.9 });
      const bMesh = new THREE.Mesh(beamGeo, beamMat);
      bMesh.visible = false;
      scene.add(bMesh);
      beamPool.push({ mesh: bMesh, active: false, life: 0 });
    }

    const ICBM_SIZE = 6;
    const icbmPool = [];
    for (let i = 0; i < ICBM_SIZE; i++) {
      const g = new THREE.Group();
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.15, 8.0, 10), new THREE.MeshStandardMaterial({ color: 0xf1f5f9, metalness: 0.9 }));
      body.position.y = 4.0;
      g.add(body);
      const cone = new THREE.Mesh(new THREE.ConeGeometry(0.9, 2.8, 10), new THREE.MeshStandardMaterial({ color: 0x00f0ff, emissive: 0x00f0ff }));
      cone.position.y = 9.4;
      g.add(cone);
      g.visible = false;
      scene.add(g);
      icbmPool.push({ group: g, silo: null, targetAsset: null, state: 'IGNITING', progress: 0, startPos: new THREE.Vector3(), active: false, isDecoy: false, interceptChecked: false });
    }

    const ENEMY_SAM_SIZE = 8;
    const enemySamPool = [];
    for (let i = 0; i < ENEMY_SAM_SIZE; i++) {
      const g = new THREE.Group();
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.45, 4.0, 8), new THREE.MeshStandardMaterial({ color: 0xe11d48, emissive: 0xe11d48 }));
      body.rotation.x = Math.PI / 2;
      g.add(body);
      g.visible = false;
      scene.add(g);
      enemySamPool.push({ group: g, targetICBM: null, startPos: new THREE.Vector3(), destPos: new THREE.Vector3(), progress: 0, duration: 1.1, active: false });
    }

    // STATE VARIABLES
    const waveConfigs = [
      { name: 'RECON SORTIE', warheadCount: 4, speed: 45 },
      { name: 'MIRV SATURATION', warheadCount: 6, speed: 55 },
      { name: 'STEALTH PENETRATION', warheadCount: 7, speed: 65 },
      { name: 'HYPERSONIC BLITZ', warheadCount: 9, speed: 75 },
      { name: 'TOTAL SUPERPOWER RETALIATION', warheadCount: 12, speed: 85 },
    ];

    let currentWaveIdx = 0;
    let combatPhase = 'PREPARATION';
    let waveCountdown = 35.0;
    let warheadsSpawnedInWave = 0;
    let spawnTimer = 1.0;

    let cityHealth = 100;
    let samStock = 28;
    const maxSamStock = 36;
    let decoyStock = 4;
    let beamHeat = 0;
    let isJammingActive = false;
    let jammingTimer = 0;
    let isReconActive = false;
    let reconTimer = 0;
    let subCooldown = 0;
    let ceasefirePct = 35;
    let deployQuota = 12;

    let score = 0;
    let intercepts = 0;
    let screenShake = 0;
    let autoDefense = true;
    let selectedAssetIdx = 0;
    let currentCamMode = 'METROPOLIS';
    let activeCinematicICBM = null;

    // SCRATCH VECTORS FOR ZERO-ALLOCATION MATH
    const _v1 = new THREE.Vector3();
    const _v2 = new THREE.Vector3();
    const _v3 = new THREE.Vector3();
    const _vCamPosTarget = new THREE.Vector3();
    const _vCamLookTarget = new THREE.Vector3();
    const _camCurrentLookAt = new THREE.Vector3(0, 15, 0);

    // TOUCH ORBIT CAMERA CONTROLS WITH SMOOTH LERP INTERPOLATION
    let isDragging = false;
    let prevTouchX = 0, prevTouchY = 0;
    const sphericalTarget = { radius: 240, theta: 0, phi: Math.PI / 4 };
    const sphericalCurrent = { radius: 240, theta: 0, phi: Math.PI / 4 };
    const cameraTarget = new THREE.Vector3(0, 15, 0);
    const cameraTargetLerp = new THREE.Vector3(0, 15, 0);

    function updateCameraPosInstant() {
      sphericalCurrent.phi = Math.max(0.1, Math.min(Math.PI / 2 - 0.05, sphericalTarget.phi));
      sphericalCurrent.theta = sphericalTarget.theta;
      sphericalCurrent.radius = sphericalTarget.radius;
      cameraTargetLerp.copy(cameraTarget);
      camera.position.x = cameraTargetLerp.x + sphericalCurrent.radius * Math.sin(sphericalCurrent.phi) * Math.sin(sphericalCurrent.theta);
      camera.position.y = cameraTargetLerp.y + sphericalCurrent.radius * Math.cos(sphericalCurrent.phi);
      camera.position.z = cameraTargetLerp.z + sphericalCurrent.radius * Math.sin(sphericalCurrent.phi) * Math.cos(sphericalCurrent.theta);
      camera.lookAt(cameraTargetLerp);
    }

    window.addEventListener('mousedown', e => {
      if (e.target.closest('.hud-panel') || e.target.closest('.drawer')) return;
      isDragging = true;
      prevTouchX = e.clientX;
      prevTouchY = e.clientY;
    });

    window.addEventListener('mousemove', e => {
      if (!isDragging) return;
      const dx = e.clientX - prevTouchX;
      const dy = e.clientY - prevTouchY;
      prevTouchX = e.clientX;
      prevTouchY = e.clientY;
      sphericalTarget.theta -= dx * 0.006;
      sphericalTarget.phi = Math.max(0.1, Math.min(Math.PI / 2 - 0.05, sphericalTarget.phi - dy * 0.006));
    });

    window.addEventListener('mouseup', () => { isDragging = false; });

    let initialPinchDist = null;
    window.addEventListener('touchstart', e => {
      if (e.target.closest('.hud-panel') || e.target.closest('.drawer')) return;
      if (e.touches.length === 1) {
        isDragging = true;
        prevTouchX = e.touches[0].clientX;
        prevTouchY = e.touches[0].clientY;
      } else if (e.touches.length === 2) {
        initialPinchDist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
      }
    }, { passive: false });

    window.addEventListener('touchmove', e => {
      if (e.target.closest('.hud-panel') || e.target.closest('.drawer')) return;
      if (e.touches.length === 1 && isDragging) {
        const dx = e.touches[0].clientX - prevTouchX;
        const dy = e.touches[0].clientY - prevTouchY;
        prevTouchX = e.touches[0].clientX;
        prevTouchY = e.touches[0].clientY;
        sphericalTarget.theta -= dx * 0.007;
        sphericalTarget.phi = Math.max(0.1, Math.min(Math.PI / 2 - 0.05, sphericalTarget.phi - dy * 0.007));
      } else if (e.touches.length === 2 && initialPinchDist) {
        const currentDist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
        const diff = initialPinchDist - currentDist;
        sphericalTarget.radius = Math.max(60, Math.min(500, sphericalTarget.radius + diff * 0.4));
        initialPinchDist = currentDist;
      }
    }, { passive: false });

    window.addEventListener('touchend', () => { isDragging = false; initialPinchDist = null; });

    window.addEventListener('wheel', e => {
      sphericalTarget.radius = Math.max(60, Math.min(500, sphericalTarget.radius + e.deltaY * 0.2));
    });

    // ZERO-ALLOCATION UI UPDATER
    let uiDirty = true;
    function markUIDirty() { uiDirty = true; }

    function updateUI() {
      const elHealthPct = document.getElementById('city-health-pct');
      if (elHealthPct) elHealthPct.innerText = Math.round(cityHealth) + '%';
      const elHealthBar = document.getElementById('city-health-bar');
      if (elHealthBar) elHealthBar.style.width = Math.round(cityHealth) + '%';
      const elSamStock = document.getElementById('sam-stock-text');
      if (elSamStock) elSamStock.innerText = samStock + '/' + maxSamStock;
      const elBeamHeat = document.getElementById('beam-heat-text');
      if (elBeamHeat) elBeamHeat.innerText = Math.round(beamHeat) + '% [' + (beamHeat >= 80 ? 'OVERHEATED' : 'READY') + ']';
      const elBeamStatus = document.getElementById('beam-status');
      if (elBeamStatus) elBeamStatus.innerText = 'HEAT: ' + Math.round(beamHeat) + '%';
      
      let readySiloCount = 0;
      for (let i = 0; i < friendlyBases.length; i++) {
        if (friendlyBases[i].type === 'silo' && friendlyBases[i].ready) readySiloCount++;
      }
      const elSiloStock = document.getElementById('silo-stock-text');
      if (elSiloStock) elSiloStock.innerText = decoyStock + ' / ' + readySiloCount;
      const elScore = document.getElementById('score-text');
      if (elScore) elScore.innerText = score;
      const elWaveTimer = document.getElementById('wave-timer-text');
      if (elWaveTimer) elWaveTimer.innerText = Math.round(waveCountdown) + 's';
      const elWaveTitle = document.getElementById('wave-title');
      if (elWaveTitle && waveConfigs[currentWaveIdx]) elWaveTitle.innerText = 'WAVE ' + (currentWaveIdx + 1) + '/5: ' + waveConfigs[currentWaveIdx].name;
      const elDecoyBtn = document.getElementById('decoy-count-btn');
      if (elDecoyBtn) elDecoyBtn.innerText = decoyStock;
      const elDeployQuotaBtn = document.getElementById('deploy-quota-btn');
      if (elDeployQuotaBtn) elDeployQuotaBtn.innerText = deployQuota;
      const elDeployQuota = document.getElementById('deploy-quota-text');
      if (elDeployQuota) elDeployQuota.innerText = deployQuota;
      const elCeasefirePct = document.getElementById('ceasefire-pct');
      if (elCeasefirePct) elCeasefirePct.innerText = ceasefirePct + '%';
      const elCeasefireBar = document.getElementById('ceasefire-bar');
      if (elCeasefireBar) elCeasefireBar.style.width = ceasefirePct + '%';

      // DEFCON status
      const defcon = document.getElementById('defcon-badge');
      if (defcon) {
        if (cityHealth < 30 || combatPhase === 'WAVE_ACTIVE') {
          defcon.innerText = 'DEFCON 1: MAXIMUM ALERT';
          defcon.style.color = '#f43f5e';
        } else if (combatPhase === 'PREPARATION') {
          defcon.innerText = 'DEFCON 3: STANDBY DEFENSE';
          defcon.style.color = '#f59e0b';
        }
      }
    }

    function showBanner(text) {
      const b = document.getElementById('cinematic-banner');
      b.innerText = text;
      b.style.display = 'block';
    }
    function hideBanner() {
      document.getElementById('cinematic-banner').style.display = 'none';
    }

    function triggerExplosion(pos, isHeavy, colorHex) {
      initAudio();
      playExplosion(isHeavy);
      screenShake = isHeavy ? 30 : 15;

      const sw = shockwavePool.find(s => !s.active);
      if (sw) {
        sw.active = true;
        sw.scale = 1.0;
        sw.opacity = 0.95;
        sw.mesh.position.copy(pos);
        sw.mesh.scale.set(1, 1, 1);
        sw.mesh.material.color.setHex(colorHex || 0xffaa00);
        sw.mesh.visible = true;
      }

      const cr = craterPool[nextCrater % CRATER_SIZE];
      nextCrater++;
      cr.position.set(pos.x, 0.05, pos.z);
      cr.visible = true;

      let activatedDebris = 0;
      for (let i = 0; i < debrisPool.length && activatedDebris < (isHeavy ? 35 : 15); i++) {
        const d = debrisPool[i];
        if (!d.active) {
          d.active = true;
          const s = 1.2 + Math.random() * 1.5;
          d.mesh.scale.set(s, s, s);
          d.mesh.position.set(pos.x + (Math.random() - 0.5) * 8, Math.random() * 15 + 2, pos.z + (Math.random() - 0.5) * 8);
          const spd = 20 + Math.random() * 40;
          const ang = Math.random() * Math.PI * 2;
          d.vel.set(Math.cos(ang) * spd, 15 + Math.random() * 25, Math.sin(ang) * spd);
          d.rotVel.set((Math.random() - 0.5) * 8, (Math.random() - 0.5) * 8, (Math.random() - 0.5) * 8);
          d.life = 3.0 + Math.random() * 2.0;
          d.mesh.visible = true;
          activatedDebris++;
        }
      }
    }

    // FIRE SAM INTERCEPTOR (Thriller S-20 / F-90 Pro)
    function fireSAM(dest) {
      if (samStock <= 0) return;
      const sam = samPool.find(s => !s.active);
      if (!sam) return;
      initAudio();
      playTone(400, 0.4, 'triangle', 180);
      samStock--;
      updateUI();

      const samBase = friendlyBases.find(b => b.type === 'sam') || { pos: new THREE.Vector3(0, 0, 0) };
      sam.active = true;
      sam.group.position.copy(samBase.pos).add(new THREE.Vector3(0, 2, 0));
      sam.dest.copy(dest);
      sam.life = 5.0;
      sam.group.visible = true;
    }

    // DIRECTED ENERGY BEAM WEAPON (Layer 6)
    function fireDirectedBeam(targetPos) {
      if (beamHeat >= 80) return;
      const turret = beamGunTurrets.find(t => t.coolingTimer <= 0) || beamGunTurrets[0];
      const beam = beamPool.find(b => !b.active);
      if (!beam) return;

      initAudio();
      playLaserBeam();
      beamHeat = Math.min(100, beamHeat + 25);
      turret.coolingTimer = 3.0;

      const start = turret.pos.clone().add(new THREE.Vector3(0, 3.5, 0));
      const end = targetPos;
      const dist = start.distanceTo(end);

      beam.active = true;
      beam.life = 0.25;
      beam.mesh.position.copy(start).add(end).multiplyScalar(0.5);
      beam.mesh.scale.set(1, dist, 1);
      beam.mesh.lookAt(end);
      beam.mesh.rotateX(Math.PI / 2);
      beam.mesh.visible = true;

      // Vaporize warhead if close
      warheadPool.forEach(w => {
        if (w.active && w.group.position.distanceTo(targetPos) < 18.0) {
          triggerExplosion(w.group.position, false, 0xa855f7);
          w.active = false;
          w.group.visible = false;
          score += 350;
          intercepts++;
          showBanner('DIRECTED BEAM INCINERATED HOSTILE WARHEAD');
        }
      });
      updateUI();
    }

    // CYBER HIJACKING SPEAR SYSTEM (Layer 8)
    function executeCyberHijack() {
      let activeThreatCount = 0;
      for (let i = 0; i < warheadPool.length; i++) {
        const w = warheadPool[i];
        if (w.active && !w.hijacked) {
          w.hijacked = true;
          activeThreatCount++;
          // Redirect towards open ocean safe zone using pre-allocated math
          const safeX = 260 + Math.random() * 80;
          const safeZ = 260 + Math.random() * 80;
          w.targetPos.set(safeX, 0, safeZ);
          _v1.subVectors(w.targetPos, w.group.position);
          const lenSq = _v1.lengthSq();
          if (lenSq > 0.0001) {
            _v1.multiplyScalar(1 / Math.sqrt(lenSq));
            w.vel.copy(_v1).multiplyScalar(w.vel.length() || 50);
          }
        }
      }
      if (activeThreatCount === 0) {
        showBanner('HIJACKING SPEAR: NO ACTIVE INBOUND VECTORS TO COMPROMISE');
        setTimeout(hideBanner, 2000);
        return;
      }
      initAudio();
      playTone(900, 0.5, 'sawtooth', 220);
      showBanner('CYBER SPEAR: HIJACKED GUIDANCE - DIVERTING TO OCEAN ZONE');
      setTimeout(hideBanner, 3000);
      markUIDirty();
    }

    // ASAT STRIKE (Destroys enemy radar satellite guidance)
    function executeASAT() {
      initAudio();
      playTone(1100, 0.7, 'triangle', 450);
      showBanner('ASAT INTERCEPTOR DESTROYED ENEMY GUIDANCE SATELLITE');
      setTimeout(hideBanner, 3000);
      for (let i = 0; i < warheadPool.length; i++) {
        const w = warheadPool[i];
        if (w.active) {
          w.vel.x += (Math.random() - 0.5) * 20;
          w.vel.z += (Math.random() - 0.5) * 20;
        }
      }
    }

    // ICBM / DECOY LAUNCH
    function launchICBM(isDecoy) {
      if (isDecoy && decoyStock <= 0) return;
      let readySilo = null;
      for (let i = 0; i < friendlyBases.length; i++) {
        if (friendlyBases[i].type === 'silo' && friendlyBases[i].ready) {
          readySilo = friendlyBases[i];
          break;
        }
      }
      if (!readySilo) {
        showBanner('ALL SILOS RELOADING OR EMPTY');
        setTimeout(hideBanner, 2000);
        return;
      }
      const target = enemyAssets[selectedAssetIdx];
      if (!target || target.destroyed) {
        showBanner('TARGET FACILITY ALREADY ELIMINATED');
        setTimeout(hideBanner, 2000);
        return;
      }
      let icbm = null;
      for (let i = 0; i < icbmPool.length; i++) {
        if (!icbmPool[i].active) { icbm = icbmPool[i]; break; }
      }
      if (!icbm) return;

      initAudio();
      playTone(isDecoy ? 600 : 140, 1.2, isDecoy ? 'sawtooth' : 'triangle', isDecoy ? 1200 : 35);
      readySilo.ready = false;
      if (isDecoy) decoyStock--;

      icbm.active = true;
      icbm.isDecoy = !!isDecoy;
      icbm.isSub = false;
      icbm.silo = readySilo;
      icbm.targetAsset = target;
      icbm.state = 'IGNITING';
      icbm.progress = 0;
      icbm.interceptChecked = false;
      icbm.startPos.copy(readySilo.pos);
      icbm.group.position.copy(readySilo.pos);
      icbm.group.visible = true;

      activeCinematicICBM = icbm;
      currentCamMode = 'SILO_LAUNCH';
      showBanner(isDecoy ? 'RADAR DECOY LAUNCHED' : 'BALLISTIC STRIKE EXECUTED');
      markUIDirty();
    }

    // RECON DRONES (Layer 11)
    function launchReconDrone() {
      if (isReconActive) {
        showBanner('RECON DRONE ALREADY PATROLLING SUPERPOWER AIRSPACE');
        setTimeout(hideBanner, 2000);
        return;
      }
      isReconActive = true;
      reconTimer = 25.0;
      initAudio();
      playTone(880, 0.5, 'sine', 1400);
      showBanner('TARGETED RECON DRONE AIRBORNE: ENEMY SAM ACCURACY DEGRADED (-35%)');
      const st = document.getElementById('drone-status-text');
      if (st) st.innerText = 'AIRBORNE / TRANSMITTING';
      const lr = document.getElementById('layer-recon');
      if (lr) lr.classList.add('alert');
      markUIDirty();
    }

    // AUTOMATED HYDROGEN SUBMARINES (Layer 10)
    function launchHydrogenSubStrike() {
      if (subCooldown > 0) {
        showBanner('H-SUB TORPEDO/SLBM TUBES FLOODING: RELOAD IN ' + Math.ceil(subCooldown) + 's');
        setTimeout(hideBanner, 2000);
        return;
      }
      const target = enemyAssets[selectedAssetIdx];
      if (!target || target.destroyed) {
        showBanner('SELECT ACTIVE HOSTILE TARGET FOR SUB-LAUNCH');
        setTimeout(hideBanner, 2000);
        return;
      }
      let icbm = null;
      for (let i = 0; i < icbmPool.length; i++) {
        if (!icbmPool[i].active) { icbm = icbmPool[i]; break; }
      }
      if (!icbm) return;

      subCooldown = 22.0;
      initAudio();
      playTone(160, 1.4, 'sawtooth', 40);
      const subPos = aswSubs[0] ? aswSubs[0].pos : _v3.set(250, 0, 250);

      icbm.active = true;
      icbm.isDecoy = false;
      icbm.isSub = true;
      icbm.silo = { pos: subPos };
      icbm.targetAsset = target;
      icbm.state = 'IGNITING';
      icbm.progress = 0;
      icbm.interceptChecked = false;
      icbm.startPos.copy(subPos);
      icbm.group.position.copy(subPos);
      icbm.group.visible = true;

      activeCinematicICBM = icbm;
      currentCamMode = 'MISSILE_FLIGHT';
      showBanner('HYDROGEN SUB: LOW-ALTITUDE SLBM CRUISE SALVO LAUNCHED UNDER RADAR HORIZON');
      const sst = document.getElementById('sub-status-text');
      if (sst) sst.innerText = 'SLBM SALVO IN-FLIGHT';
      const ls = document.getElementById('layer-sub');
      if (ls) ls.classList.add('alert');
      markUIDirty();
    }

    // MASTER AUTOMATED DOOMSDAY PROTOCOL (Layer 9 Emergency)
    function executeMasterDoomsday() {
      for (let i = 0; i < friendlyBases.length; i++) {
        const b = friendlyBases[i];
        if (b.type === 'silo' && b.ready) {
          for (let j = 0; j < enemyAssets.length; j++) {
            if (!enemyAssets[j].destroyed) {
              launchICBM(false);
              break;
            }
          }
        }
      }
      showBanner('MASTER DETECTOR V7: EMERGENCY DOOMSDAY PROTOCOL AUTHORIZED');
    }

    // EVENT LISTENERS & HUD INTERACTIONS
    document.getElementById('map-mode-btn').addEventListener('click', () => {
      currentCamMode = (currentCamMode === 'MAP') ? 'METROPOLIS' : 'MAP';
      document.getElementById('map-mode-btn').classList.toggle('btn-active');
    });

    document.getElementById('diplo-btn').addEventListener('click', () => {
      const d = document.getElementById('diplomacy-drawer');
      d.style.display = (d.style.display === 'block') ? 'none' : 'block';
    });
    document.getElementById('close-diplo-btn').addEventListener('click', () => {
      document.getElementById('diplomacy-drawer').style.display = 'none';
    });
    document.getElementById('ratify-treaty-btn').addEventListener('click', () => {
      ceasefirePct = Math.min(100, ceasefirePct + 25);
      if (ceasefirePct >= 100) {
        combatPhase = 'VICTORY';
        document.getElementById('modal-title').innerText = 'PERMANENT CEASEFIRE RATIFIED';
        document.getElementById('modal-desc').innerText = 'Neutral mediators negotiated a full sovereignty defense treaty.';
        document.getElementById('modal-final-score').innerText = score;
        document.getElementById('modal-final-intercepts').innerText = intercepts;
        document.getElementById('end-modal').style.display = 'flex';
      }
      updateUI();
    });

    document.getElementById('toggle-defense-btn').addEventListener('click', () => {
      const d = document.getElementById('defense-drawer');
      d.style.display = (d.style.display === 'block') ? 'none' : 'block';
    });
    document.getElementById('close-defense-btn').addEventListener('click', () => {
      document.getElementById('defense-drawer').style.display = 'none';
    });

    document.getElementById('deploy-mode-btn').addEventListener('click', () => {
      const d = document.getElementById('deploy-drawer');
      d.style.display = (d.style.display === 'block') ? 'none' : 'block';
    });
    document.getElementById('cancel-deploy-btn').addEventListener('click', () => {
      document.getElementById('deploy-drawer').style.display = 'none';
    });
    document.getElementById('deploy-silo-btn').addEventListener('click', () => {
      if (deployQuota <= 0) return;
      deployQuota--;
      const newPos = new THREE.Vector3((Math.random() - 0.5) * 60, 0, (Math.random() - 0.5) * 60);
      friendlyBases.push({ id: friendlyBases.length, type: 'silo', pos: newPos, ready: true });
      initAudio(); playTone(550, 0.3, 'sine');
      showBanner('NEW ARMORED SILO DEPLOYED');
      updateUI();
    });
    document.getElementById('deploy-sam-btn').addEventListener('click', () => {
      if (deployQuota <= 0) return;
      deployQuota--;
      samStock = Math.min(maxSamStock, samStock + 6);
      initAudio(); playTone(660, 0.3, 'sine');
      showBanner('NEW S-20 SAM BATTERY DEPLOYED');
      updateUI();
    });
    document.getElementById('deploy-beam-btn').addEventListener('click', () => {
      if (deployQuota <= 0) return;
      deployQuota--;
      beamGunTurrets.push({ pos: new THREE.Vector3((Math.random() - 0.5) * 80, 0, (Math.random() - 0.5) * 80), coolingTimer: 0 });
      initAudio(); playTone(770, 0.3, 'sine');
      showBanner('DIRECTED BEAM TURRET CONSTRUCTED');
      updateUI();
    });

    document.getElementById('launch-decoy-btn').addEventListener('click', () => launchICBM(true));
    document.getElementById('launch-icbm-btn').addEventListener('click', () => launchICBM(false));
    document.getElementById('intel-decoy-btn').addEventListener('click', () => launchICBM(true));
    document.getElementById('intel-strike-btn').addEventListener('click', () => launchICBM(false));
    document.getElementById('recon-drone-btn').addEventListener('click', launchReconDrone);
    document.getElementById('sub-strike-btn').addEventListener('click', launchHydrogenSubStrike);
    const intelSubBtn = document.getElementById('intel-sub-btn');
    if (intelSubBtn) intelSubBtn.addEventListener('click', launchHydrogenSubStrike);
    document.getElementById('spear-btn').addEventListener('click', executeCyberHijack);
    document.getElementById('asat-btn').addEventListener('click', executeASAT);

    document.getElementById('jamming-btn').addEventListener('click', () => {
      if (isJammingActive) return;
      isJammingActive = true;
      jammingTimer = 10.0;
      initAudio();
      playTone(120, 0.5, 'square');
      showBanner('ELECTRONIC WARFARE (EW) JAMMING ENGAGED: RADARS BLINDED');
    });

    document.getElementById('auto-defense-btn').addEventListener('click', () => {
      autoDefense = !autoDefense;
      document.getElementById('auto-defense-btn').classList.toggle('btn-active', autoDefense);
      document.getElementById('auto-defense-btn').innerText = '🛡️ AUTO-DEFENSE: ' + (autoDefense ? 'ON' : 'OFF');
    });

    document.getElementById('audio-toggle-btn').addEventListener('click', () => {
      isMuted = !isMuted;
      document.getElementById('audio-toggle-btn').innerText = isMuted ? '🔇' : '🔊';
    });

    // Quick Camera Snaps with smooth lerping targets
    document.getElementById('cam-hq').addEventListener('click', () => {
      currentCamMode = 'METROPOLIS';
      cameraTarget.set(0, 15, 0);
      sphericalTarget.radius = 140; sphericalTarget.theta = 0; sphericalTarget.phi = Math.PI / 4;
    });
    document.getElementById('cam-silos').addEventListener('click', () => {
      currentCamMode = 'METROPOLIS';
      cameraTarget.set(0, 5, 0);
      sphericalTarget.radius = 70; sphericalTarget.theta = Math.PI / 4; sphericalTarget.phi = Math.PI / 3;
    });
    document.getElementById('cam-target').addEventListener('click', () => {
      const a = enemyAssets[selectedAssetIdx];
      currentCamMode = 'METROPOLIS';
      cameraTarget.copy(a.absPos);
      sphericalTarget.radius = 180; sphericalTarget.theta = -Math.PI / 4; sphericalTarget.phi = Math.PI / 4;
    });
    document.getElementById('cam-reset').addEventListener('click', () => {
      currentCamMode = 'METROPOLIS';
      cameraTarget.set(0, 15, 0);
      sphericalTarget.radius = 240; sphericalTarget.theta = 0; sphericalTarget.phi = Math.PI / 4;
    });

    // 25-System Browser & Tier Filtering Logic
    let currentTierFilter = 'ALL';

    function populateSystems(tier) {
      currentTierFilter = tier;
      const sel = document.getElementById('intel-system-select');
      if (!sel) return;
      sel.innerHTML = '';
      const list = (tier === 'ALL') ? enemyAssets : enemyAssets.filter(a => a.tier === tier);
      list.forEach(a => {
        const opt = document.createElement('option');
        opt.value = a.id;
        opt.innerText = '[' + a.tier + '] ' + a.name + (a.destroyed ? ' (DESTROYED)' : '');
        if (a.id === selectedAssetIdx) opt.selected = true;
        sel.appendChild(opt);
      });
    }

    // Tier buttons
    document.querySelectorAll('.tier-tab-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        document.querySelectorAll('.tier-tab-btn').forEach(b => b.classList.remove('btn-active'));
        e.target.classList.add('btn-active');
        const tier = e.target.getAttribute('data-tier');
        populateSystems(tier);
        const sel = document.getElementById('intel-system-select');
        if (sel && sel.value) {
          const id = parseInt(sel.value);
          const asset = enemyAssets.find(a => a.id === id);
          if (asset) showIntelCard(asset);
        }
      });
    });

    const sysSelect = document.getElementById('intel-system-select');
    if (sysSelect) {
      sysSelect.addEventListener('change', e => {
        const id = parseInt(e.target.value);
        const asset = enemyAssets.find(a => a.id === id);
        if (asset) {
          showIntelCard(asset);
          targetRing.position.copy(asset.absPos);
          cameraTarget.copy(asset.absPos);
        }
      });
    }

    // Intel Drawer Display
    function showIntelCard(asset) {
      selectedAssetIdx = enemyAssets.findIndex(a => a.id === asset.id);
      document.getElementById('intel-name').innerText = asset.name;
      document.getElementById('intel-badge').innerText = '[' + asset.tier + '] ' + asset.category;
      document.getElementById('intel-coords').innerText = asset.coords;
      document.getElementById('intel-threat').innerText = asset.threatLevel;
      const effectiveProb = Math.max(10, asset.interceptionProb - (isReconActive ? 35 : 0));
      document.getElementById('intel-prob-text').innerText = effectiveProb + '% [' + (isReconActive ? 'RECON JAMMED' : 'ACTIVE') + ']';
      document.getElementById('intel-prob-bar').style.width = effectiveProb + '%';
      document.getElementById('intel-briefing').innerText = asset.briefing;
      document.getElementById('intel-health').innerText = asset.destroyed ? 'DESTROYED (0%)' : '100%';
      document.getElementById('intel-drawer').style.display = 'block';

      const sel = document.getElementById('intel-system-select');
      if (sel && sel.value != asset.id) {
        sel.value = asset.id;
      }
    }
    document.getElementById('close-intel-btn').addEventListener('click', () => {
      document.getElementById('intel-drawer').style.display = 'none';
    });

    populateSystems('ALL');

    // PRE-ALLOCATED RAYCASTING FOR TARGETING AND INTERCEPTION
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    const _skyPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -80);
    const _skyPt = new THREE.Vector3();

    window.addEventListener('click', e => {
      if (e.target.closest('.hud-panel') || e.target.closest('.drawer')) return;
      initAudio();
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);

      // Check click on enemy asset
      const intersects = raycaster.intersectObjects(enemyGroup.children, true);
      if (intersects.length > 0) {
        let hit = intersects[0].object;
        while (hit && !hit.userData?.category && hit.parent) hit = hit.parent;
        if (hit?.userData?.category) {
          showIntelCard(hit.userData);
          targetRing.position.copy(hit.userData.absPos);
          return;
        }
      }

      // Check click in sky for manual SAM or Beam Gun intercept
      raycaster.ray.intersectPlane(_skyPlane, _skyPt);
      if (_skyPt) {
        if (e.shiftKey) fireDirectedBeam(_skyPt);
        else fireSAM(_skyPt);
      }
    });

    // SIMULATION LOOP
    const clock = new THREE.Clock();

    function animate() {
      requestAnimationFrame(animate);
      const dt = Math.min(clock.getDelta(), 0.1);

      // Electronic Warfare Jamming countdown
      if (isJammingActive) {
        jammingTimer -= dt;
        if (jammingTimer <= 0) {
          isJammingActive = false;
          showBanner('EW JAMMING CEASED');
          setTimeout(hideBanner, 2000);
        }
      }

      // Recon Drone timer (Layer 11)
      if (isReconActive) {
        reconTimer -= dt;
        if (reconTimer <= 0) {
          isReconActive = false;
          const st = document.getElementById('drone-status-text');
          if (st) st.innerText = 'STANDBY / READY';
          const lr = document.getElementById('layer-recon');
          if (lr) lr.classList.remove('alert');
          showBanner('RECON DRONE MISSION COMPLETED: RTB');
          setTimeout(hideBanner, 2000);
        }
      }

      // Hydrogen Submarine reload cooldown (Layer 10)
      if (subCooldown > 0) {
        subCooldown -= dt;
        if (subCooldown <= 0) {
          const sst = document.getElementById('sub-status-text');
          if (sst) sst.innerText = 'OFFSHORE ARMED';
          const ls = document.getElementById('layer-sub');
          if (ls) ls.classList.remove('alert');
        }
      }

      // Cooling Beam Weapons
      beamGunTurrets.forEach(t => { if (t.coolingTimer > 0) t.coolingTimer -= dt; });
      if (beamHeat > 0) beamHeat = Math.max(0, beamHeat - dt * 12);

      // Autonomous Rescue Drone Fleet Repair
      if (cityHealth > 0 && cityHealth < 100) {
        cityHealth = Math.min(100, cityHealth + dt * 0.4);
        updateUI();
      }

      // 1. COMBAT WAVE ENGINE
      if (combatPhase === 'PREPARATION') {
        waveCountdown -= dt;
        if (waveCountdown <= 0) {
          combatPhase = 'WAVE_ACTIVE';
          warheadsSpawnedInWave = 0;
          spawnTimer = 0.5;
          playSiren();
          showBanner('HOSTILE SATURATION DETECTED: AIR RAID SIRENS ACTIVE');
          document.getElementById('layer-s90').classList.add('alert');
          setTimeout(hideBanner, 3000);
        }
        updateUI();
      } else if (combatPhase === 'WAVE_ACTIVE') {
        const curWave = waveConfigs[currentWaveIdx];
        spawnTimer -= dt;
        if (spawnTimer <= 0 && warheadsSpawnedInWave < curWave.warheadCount) {
          const w = warheadPool.find(item => !item.active);
          if (w) {
            const startX = (Math.random() - 0.5) * 220;
            const startZ = (Math.random() - 0.5) * 220;
            const startY = 320 + Math.random() * 50;
            const targetX = (Math.random() - 0.5) * 120;
            const targetZ = (Math.random() - 0.5) * 120;

            w.active = true;
            w.hijacked = false;
            w.life = 18;
            w.group.position.set(startX, startY, startZ);
            w.targetPos.set(targetX, 0, targetZ);
            const dir = new THREE.Vector3(targetX - startX, -startY, targetZ - startZ).normalize();
            w.vel.copy(dir).multiplyScalar(curWave.speed);
            w.group.visible = true;

            warheadsSpawnedInWave++;
            spawnTimer = 2.0 + Math.random() * 1.5;

            // Thriller V-70 Trajectory Tracking update
            const tti = Math.round(startY / curWave.speed);
            document.getElementById('tti-display').innerText = 'TTI: ' + tti + 's';
          }
        }

        // Wave End Check
        const activeWarheads = warheadPool.filter(w => w.active).length;
        if (warheadsSpawnedInWave >= curWave.warheadCount && activeWarheads === 0) {
          if (currentWaveIdx < waveConfigs.length - 1) {
            currentWaveIdx++;
            combatPhase = 'PREPARATION';
            waveCountdown = 35.0;
            samStock = Math.min(maxSamStock, samStock + 8);
            decoyStock = Math.min(4, decoyStock + 2);
            friendlyBases.forEach(b => { if (b.type === 'silo') b.ready = true; });
            showBanner('WAVE NEUTRALIZED: PREPARATION PHASE');
            document.getElementById('layer-s90').classList.remove('alert');
            setTimeout(hideBanner, 3000);
          } else {
            combatPhase = 'VICTORY';
            document.getElementById('modal-title').innerText = 'AIRSPACE PRESERVED - VICTORY';
            document.getElementById('modal-desc').innerText = 'All five strategic superpower offensives countered.';
            document.getElementById('modal-final-score').innerText = score;
            document.getElementById('modal-final-intercepts').innerText = intercepts;
            document.getElementById('end-modal').style.display = 'flex';
          }
          updateUI();
        }
      }

      // 2. AUTO-DEFENSE RADAR INTERCEPTION (Layers 2 & 6)
      if (autoDefense && Math.random() < 0.05) {
        const inRangeWarhead = warheadPool.find(w => w.active && !w.hijacked && w.group.position.y < 220);
        if (inRangeWarhead) {
          if (beamHeat < 60 && Math.random() < 0.4) {
            fireDirectedBeam(inRangeWarhead.group.position);
          } else if (samStock > 0) {
            fireSAM(inRangeWarhead.group.position);
          }
        }
      }

      // 3. WARHEADS FLIGHT & GROUND IMPACT
      warheadPool.forEach(w => {
        if (!w.active) return;
        w.group.position.addScaledVector(w.vel, dt);
        w.life -= dt;

        if (w.group.position.y <= 1.0 || w.life <= 0) {
          triggerExplosion(w.group.position, true, 0xf43f5e);
          w.active = false;
          w.group.visible = false;

          if (!w.hijacked) {
            const baseDmg = (10 + Math.random() * 8);
            const bunkerProtection = 0.6; // 40% blast attenuation by Layer 12 Civil Bunkers
            cityHealth = Math.max(0, cityHealth - baseDmg * bunkerProtection);
            document.getElementById('flash-overlay').style.opacity = '1';
            setTimeout(() => { document.getElementById('flash-overlay').style.opacity = '0'; }, 200);

            // Master Systematic Warfare Early Detector V7 Emergency Protocol
            if (cityHealth <= 25 && combatPhase !== 'DEFEAT') {
              executeMasterDoomsday();
            }

            if (cityHealth <= 0 && combatPhase !== 'DEFEAT') {
              combatPhase = 'DEFEAT';
              document.getElementById('modal-title').innerText = 'METROPOLIS DESTROYED';
              document.getElementById('modal-desc').innerText = 'Superpower saturation strike destroyed friendly urban infrastructure.';
              document.getElementById('modal-final-score').innerText = score;
              document.getElementById('modal-final-intercepts').innerText = intercepts;
              document.getElementById('end-modal').style.display = 'flex';
            }
          }
          updateUI();
        }
      });

      // 4. SAM INTERCEPTORS (Thriller S-20 / F-90 Pro)
      samPool.forEach(sam => {
        if (!sam.active) return;
        const toDest = sam.dest.clone().sub(sam.group.position);
        const dist = toDest.length();

        if (dist < 4.0 || sam.life <= 0) {
          triggerExplosion(sam.group.position, false, 0x00f0ff);
          warheadPool.forEach(w => {
            if (w.active && w.group.position.distanceTo(sam.group.position) < 26.0) {
              triggerExplosion(w.group.position, false, 0x00f0ff);
              w.active = false;
              w.group.visible = false;
              score += 250;
              intercepts++;
              updateUI();
            }
          });
          sam.active = false;
          sam.group.visible = false;
        } else {
          toDest.normalize();
          sam.group.position.addScaledVector(toDest, sam.speed * dt);
          sam.group.lookAt(sam.dest);
          sam.life -= dt;
        }
      });

      // 5. DIRECTED ENERGY BEAM LIFECYCLE
      beamPool.forEach(b => {
        if (!b.active) return;
        b.life -= dt;
        if (b.life <= 0) {
          b.active = false;
          b.mesh.visible = false;
        }
      });

      // 6. ICBM & DECOY FLIGHT
      icbmPool.forEach(m => {
        if (!m.active || !m.silo || !m.targetAsset) return;
        m.progress += dt;

        if (m.state === 'IGNITING') {
          if (m.progress >= 1.0) m.group.position.y += dt * 35;
          if (m.progress >= 2.5) {
            m.state = 'TRANSIT';
            if (activeCinematicICBM === m) currentCamMode = 'MISSILE_FLIGHT';
          }
        } else if (m.state === 'TRANSIT' || m.state === 'IMPACTING') {
          const t = Math.min(1.0, (m.progress - 2.5) / 3.0);
          const curPos = new THREE.Vector3().lerpVectors(m.startPos, m.targetAsset.topPos, t);
          curPos.y += Math.sin(t * Math.PI) * 220;
          m.group.position.copy(curPos);

          const nextPos = new THREE.Vector3().lerpVectors(m.startPos, m.targetAsset.topPos, Math.min(1.0, t + 0.05));
          nextPos.y += Math.sin((t + 0.05) * Math.PI) * 220;
          m.group.lookAt(nextPos);

          // Enemy Tier-1 Interception Check against Player ICBM/SLBM Strikes
          if (t >= 0.3 && !m.interceptChecked) {
            m.interceptChecked = true;
            if (!isJammingActive) {
              const defAsset = enemyAssets.find(a => a.tier === 'DEFENSE' && !a.destroyed);
              if (defAsset) {
                const eSam = enemySamPool.find(s => !s.active);
                if (eSam) {
                  eSam.active = true;
                  eSam.targetICBM = m;
                  eSam.startPos.copy(defAsset.absPos).add(new THREE.Vector3(0, defAsset.height + 4, 0));
                  eSam.group.position.copy(eSam.startPos);
                  eSam.progress = 0;
                  eSam.duration = 1.1;
                  eSam.group.visible = true;
                  playTone(750, 0.8, 'sawtooth', 180);
                  showBanner(m.isDecoy ? 'ENEMY AIR DEFENSE ENGAGING RADAR DECOY' : (m.isSub ? 'ENEMY RADARS ATTEMPTING LOW-ALTITUDE SLBM LOCK' : 'WARNING: ENEMY TIER-1 INTERCEPTOR LAUNCHED'));
                }
              }
            }
          }

          if (t >= 0.75 && currentCamMode !== 'TARGET_IMPACT' && activeCinematicICBM === m) {
            currentCamMode = 'TARGET_IMPACT';
          }

          if (t >= 1.0) {
            if (m.isDecoy) {
              triggerExplosion(m.targetAsset.absPos, false, 0xf59e0b);
              showBanner('RADAR DECOY IMPACTED');
            } else {
              m.targetAsset.destroyed = true;
              if (m.targetAsset.mesh) m.targetAsset.mesh.visible = false;
              triggerExplosion(m.targetAsset.absPos, true, 0xffaa00);
              score += 1500;
              showBanner('STRATEGIC SUPERPOWER ASSET ELIMINATED: ' + m.targetAsset.name);
            }
            updateUI();
            m.active = false;
            m.group.visible = false;
            if (activeCinematicICBM === m) {
              setTimeout(() => { currentCamMode = 'METROPOLIS'; activeCinematicICBM = null; hideBanner(); }, 2000);
            }
          }
        }
      });

      // 7. ENEMY AIR DEFENSE INTERCEPTOR FLIGHT
      enemySamPool.forEach(eSam => {
        if (!eSam.active || !eSam.targetICBM) return;
        eSam.progress += dt;
        const targetPos = eSam.targetICBM.group.position;
        const t = Math.min(1.0, eSam.progress / eSam.duration);
        eSam.group.position.lerpVectors(eSam.startPos, targetPos, t);
        eSam.group.lookAt(targetPos);

        if (t >= 1.0) {
          eSam.active = false;
          eSam.group.visible = false;
          const icbm = eSam.targetICBM;
          if (icbm.isDecoy) {
            triggerExplosion(icbm.group.position, false, 0xf59e0b);
            icbm.active = false;
            icbm.group.visible = false;
            showBanner('TACTICAL DECEPTION: ENEMY INTERCEPTOR ENGAGED DECOY!');
          } else {
            let prob = icbm.targetAsset?.interceptionProb || 88;
            if (isReconActive) prob = Math.max(15, prob - 35);
            if (icbm.isSub) prob = Math.max(10, prob - 40); // H-Sub SLBM flies under radar
            const roll = Math.random() * 100;
            if (roll < prob) {
              triggerExplosion(icbm.group.position, true, 0xf43f5e);
              icbm.active = false;
              icbm.group.visible = false;
              showBanner('WARHEAD INTERCEPTED BY ENEMY DEFENSE! USE DECOYS, DRONES, OR EW!');
            }
          }
        }
      });

      // 8. DEBRIS PHYSICS
      debrisPool.forEach(d => {
        if (!d.active) return;
        d.vel.y -= 70 * dt;
        d.mesh.position.addScaledVector(d.vel, dt);
        d.mesh.rotation.x += d.rotVel.x * dt;
        d.mesh.rotation.y += d.rotVel.y * dt;
        if (d.mesh.position.y <= 0.8) {
          d.mesh.position.y = 0.8;
          d.vel.y = -d.vel.y * 0.35;
          d.vel.x *= 0.7;
          d.vel.z *= 0.7;
        }
        d.life -= dt;
        if (d.life <= 0) {
          d.active = false;
          d.mesh.visible = false;
        }
      });

      // 9. SHOCKWAVES UPDATE
      shockwavePool.forEach(s => {
        if (!s.active) return;
        s.scale += dt * 40;
        s.opacity -= dt * 1.1;
        s.mesh.scale.set(s.scale, s.scale, s.scale);
        s.mesh.material.opacity = Math.max(0, s.opacity);
        if (s.scale >= 32 || s.opacity <= 0) {
          s.active = false;
          s.mesh.visible = false;
        }
      });

      // 10. DYNAMIC CAMERA
      if (currentCamMode === 'MAP') {
        camera.position.lerp(new THREE.Vector3(0, 1690, 0.1), 0.08);
        camera.lookAt(0, 1600, 0);
      } else if (currentCamMode === 'SILO_LAUNCH' && activeCinematicICBM) {
        const sPos = activeCinematicICBM.silo.pos;
        camera.position.lerp(sPos.clone().add(new THREE.Vector3(14, 8, 14)), 0.1);
        camera.lookAt(sPos.clone().add(new THREE.Vector3(0, 4, 0)));
      } else if (currentCamMode === 'MISSILE_FLIGHT' && activeCinematicICBM) {
        const mPos = activeCinematicICBM.group.position;
        camera.position.lerp(mPos.clone().add(new THREE.Vector3(25, 20, 25)), 0.1);
        camera.lookAt(mPos);
      } else if (currentCamMode === 'TARGET_IMPACT' && activeCinematicICBM) {
        const tPos = activeCinematicICBM.targetAsset.absPos;
        camera.position.lerp(tPos.clone().add(new THREE.Vector3(35, 30, 35)), 0.08);
        camera.lookAt(tPos);
      } else {
        updateCameraPos();
      }

      if (screenShake > 0) {
        camera.position.x += (Math.random() - 0.5) * screenShake * 0.25;
        camera.position.y += (Math.random() - 0.5) * screenShake * 0.25;
        screenShake = Math.max(0, screenShake - dt * 25);
      }

      renderer.render(scene, camera);
    }

    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });

    document.getElementById('modal-restart-btn').addEventListener('click', () => window.location.reload());

    updateUI();
    animate();
  </script>
</body>
</html>`;
}
