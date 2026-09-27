import * as THREE from 'three';

/**
 * Mobile-Optimized 360-Degree Touch Orbit & Pan Controls for Three.js.
 * Handles 1-finger rotate, 2-finger pinch zoom, 2-finger pan, and desktop mouse.
 * Guarantees zero stuck camera states with silky damping.
 */

export class MobileTouchOrbitControls {
  private camera: THREE.PerspectiveCamera;
  private domElement: HTMLElement;

  public target: THREE.Vector3 = new THREE.Vector3(0, 20, 0);
  public distance: number = 260;
  public minDistance: number = 25;
  public maxDistance: number = 550;

  // Spherical coordinates
  public theta: number = 0.0; // Azimuth angle around Y
  public phi: number = Math.PI / 4; // Polar angle from vertical (0 to PI/2)
  public minPhi: number = 0.08;
  public maxPhi: number = Math.PI / 2 - 0.05;

  // Damping
  public dampingFactor: number = 0.08;
  private currentTheta: number = 0.0;
  private currentPhi: number = Math.PI / 4;
  private currentDistance: number = 260;
  public currentTarget: THREE.Vector3 = new THREE.Vector3(0, 20, 0);

  // State
  private isInteracting: boolean = false;
  private prevTouchX: number = 0;
  private prevTouchY: number = 0;
  private prevPinchDist: number = 0;
  private prevMidX: number = 0;
  private prevMidY: number = 0;
  private isMouseDown: boolean = false;
  private isRightMouseDown: boolean = false;

  constructor(camera: THREE.PerspectiveCamera, domElement: HTMLElement) {
    this.camera = camera;
    this.domElement = domElement;

    this.currentTheta = this.theta;
    this.currentPhi = this.phi;
    this.currentDistance = this.distance;
    this.currentTarget.copy(this.target);

    this.bindEvents();
    this.updateCamera(1.0);
  }

  public setFocus(targetPos: THREE.Vector3, desiredDist: number = 180, desiredPhi: number = Math.PI / 4, desiredTheta?: number) {
    this.target.copy(targetPos);
    this.distance = Math.max(this.minDistance, Math.min(this.maxDistance, desiredDist));
    this.phi = Math.max(this.minPhi, Math.min(this.maxPhi, desiredPhi));
    if (desiredTheta !== undefined) {
      this.theta = desiredTheta;
    }
  }

  private bindEvents() {
    const el = this.domElement;

    // TOUCH EVENTS
    el.addEventListener('touchstart', this.onTouchStart, { passive: false });
    el.addEventListener('touchmove', this.onTouchMove, { passive: false });
    el.addEventListener('touchend', this.onTouchEnd, { passive: false });
    el.addEventListener('touchcancel', this.onTouchEnd, { passive: false });

    // MOUSE EVENTS
    el.addEventListener('mousedown', this.onMouseDown);
    window.addEventListener('mousemove', this.onMouseMove);
    window.addEventListener('mouseup', this.onMouseUp);
    el.addEventListener('wheel', this.onWheel, { passive: false });
    el.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  public dispose() {
    const el = this.domElement;
    el.removeEventListener('touchstart', this.onTouchStart);
    el.removeEventListener('touchmove', this.onTouchMove);
    el.removeEventListener('touchend', this.onTouchEnd);
    el.removeEventListener('touchcancel', this.onTouchEnd);

    el.removeEventListener('mousedown', this.onMouseDown);
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('mouseup', this.onMouseUp);
    el.removeEventListener('wheel', this.onWheel);
  }

  private isUIElement(e: Event): boolean {
    const target = e.target as HTMLElement;
    return !!(
      target.closest('button') ||
      target.closest('.hud-panel') ||
      target.closest('.intel-card') ||
      target.closest('.diplomacy-drawer') ||
      target.closest('.deploy-drawer')
    );
  }

  private onTouchStart = (e: TouchEvent) => {
    if (this.isUIElement(e)) return;
    this.isInteracting = true;

    if (e.touches.length === 1) {
      this.prevTouchX = e.touches[0].clientX;
      this.prevTouchY = e.touches[0].clientY;
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      this.prevPinchDist = Math.sqrt(dx * dx + dy * dy);
      this.prevMidX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      this.prevMidY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
    }
  };

  private onTouchMove = (e: TouchEvent) => {
    if (!this.isInteracting || this.isUIElement(e)) return;
    e.preventDefault();

    if (e.touches.length === 1) {
      // 1 Finger = 360-degree Orbit rotation
      const clientX = e.touches[0].clientX;
      const clientY = e.touches[0].clientY;
      const deltaX = clientX - this.prevTouchX;
      const deltaY = clientY - this.prevTouchY;

      this.theta -= deltaX * 0.0075;
      this.phi -= deltaY * 0.0075;
      this.phi = Math.max(this.minPhi, Math.min(this.maxPhi, this.phi));

      this.prevTouchX = clientX;
      this.prevTouchY = clientY;
    } else if (e.touches.length === 2) {
      // 2 Fingers = Pinch Zoom + 2-Finger Pan
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const pinchDelta = dist - this.prevPinchDist;

      this.distance -= pinchDelta * 0.75;
      this.distance = Math.max(this.minDistance, Math.min(this.maxDistance, this.distance));
      this.prevPinchDist = dist;

      // Pan
      const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      const panDeltaX = midX - this.prevMidX;
      const panDeltaY = midY - this.prevMidY;

      const factor = (this.distance / 500) * 0.35;
      const forward = new THREE.Vector3(-Math.sin(this.theta), 0, -Math.cos(this.theta));
      const right = new THREE.Vector3(Math.cos(this.theta), 0, -Math.sin(this.theta));

      this.target.addScaledVector(right, -panDeltaX * factor);
      this.target.addScaledVector(forward, panDeltaY * factor);
      this.clampTarget();

      this.prevMidX = midX;
      this.prevMidY = midY;
    }
  };

  private onTouchEnd = () => {
    this.isInteracting = false;
  };

  private onMouseDown = (e: MouseEvent) => {
    if (this.isUIElement(e)) return;
    this.isMouseDown = true;
    this.isRightMouseDown = e.button === 2 || e.shiftKey;
    this.prevTouchX = e.clientX;
    this.prevTouchY = e.clientY;
  };

  private onMouseMove = (e: MouseEvent) => {
    if (!this.isMouseDown) return;
    const deltaX = e.clientX - this.prevTouchX;
    const deltaY = e.clientY - this.prevTouchY;

    if (this.isRightMouseDown) {
      // Mouse Pan
      const factor = (this.distance / 500) * 0.3;
      const forward = new THREE.Vector3(-Math.sin(this.theta), 0, -Math.cos(this.theta));
      const right = new THREE.Vector3(Math.cos(this.theta), 0, -Math.sin(this.theta));
      this.target.addScaledVector(right, -deltaX * factor);
      this.target.addScaledVector(forward, deltaY * factor);
      this.clampTarget();
    } else {
      // Mouse Rotate
      this.theta -= deltaX * 0.0055;
      this.phi -= deltaY * 0.0055;
      this.phi = Math.max(this.minPhi, Math.min(this.maxPhi, this.phi));
    }

    this.prevTouchX = e.clientX;
    this.prevTouchY = e.clientY;
  };

  private onMouseUp = () => {
    this.isMouseDown = false;
  };

  private onWheel = (e: WheelEvent) => {
    if (this.isUIElement(e)) return;
    e.preventDefault();
    this.distance += e.deltaY * 0.18;
    this.distance = Math.max(this.minDistance, Math.min(this.maxDistance, this.distance));
  };

  private clampTarget() {
    this.target.x = Math.max(-180, Math.min(180, this.target.x));
    this.target.z = Math.max(-180, Math.min(180, this.target.z));
    this.target.y = Math.max(0, Math.min(60, this.target.y));
  }

  public update(dt: number = 0.016) {
    const alpha = Math.min(1.0, this.dampingFactor * (dt / 0.016));

    this.currentTheta += (this.theta - this.currentTheta) * alpha;
    this.currentPhi += (this.phi - this.currentPhi) * alpha;
    this.currentDistance += (this.distance - this.currentDistance) * alpha;
    this.currentTarget.lerp(this.target, alpha);

    this.updateCamera();
  }

  private updateCamera(forceAlpha?: number) {
    const p = this.currentPhi;
    const t = this.currentTheta;
    const d = this.currentDistance;

    const x = this.currentTarget.x + d * Math.sin(p) * Math.sin(t);
    const y = this.currentTarget.y + d * Math.cos(p);
    const z = this.currentTarget.z + d * Math.sin(p) * Math.cos(t);

    if (forceAlpha === 1.0) {
      this.camera.position.set(x, y, z);
    } else {
      this.camera.position.lerp(new THREE.Vector3(x, y, z), 0.15);
    }
    this.camera.lookAt(this.currentTarget);
  }
}
