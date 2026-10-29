import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { loadGlassesModel } from '../ar/Glasses3DOverlay';
import type { MarkerPose } from './markerTracker';

/**
 * Draws a pair of glasses standing on the printed card, in millimetres. The camera uses the
 * same focal length as the pose estimate, so the frame keeps its real size relative to the
 * paper wherever the card is held.
 */
export class MarkerScene {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(50, 1, 1, 20000);
  private card = new THREE.Group(); // follows the marker: x right, y towards the card's top, z up off the paper
  private targetPosition = new THREE.Vector3();
  private targetRotation = new THREE.Quaternion();
  private tracked = false;
  private lastSeen = 0;

  constructor(canvas: HTMLCanvasElement) {
    // preserveDrawingBuffer keeps the frame readable for screenshots
    this.renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, preserveDrawingBuffer: true });
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();
    const key = new THREE.DirectionalLight(0xffffff, 1.2);
    key.position.set(0.3, 1, 1);
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.4), key);
    this.card.visible = false;
    this.scene.add(this.card);
  }

  /** Loads the model and scales it so its front is widthMm wide */
  async load(url: string, widthMm: number): Promise<void> {
    const { model, width, box } = await loadGlassesModel(url);
    const scale = widthMm / width;
    const depthMm = (box.max.z - box.min.z) * scale;

    // Stand the frame up: its up axis becomes the paper's normal and its front faces the
    // card's bottom edge (towards the viewer). Centre it over the marker, resting on the paper.
    const glasses = new THREE.Group();
    glasses.add(model);
    glasses.scale.setScalar(scale);
    glasses.rotation.x = Math.PI / 2;
    glasses.position.set(0, -depthMm / 2, -box.min.y * scale);
    this.card.add(glasses);

    // Soft contact shadow on the paper
    const shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(widthMm * 1.15, depthMm * 1.1),
      new THREE.MeshBasicMaterial({ map: blobShadowTexture(), transparent: true, depthWrite: false, opacity: 0.35 })
    );
    shadow.position.set(0, 0, 0.2);
    this.card.add(shadow);
  }

  /** Call every frame with the latest pose (or null when the marker is not visible) */
  render(width: number, height: number, pose: MarkerPose | null): boolean {
    const dpr = window.devicePixelRatio || 1;
    const size = this.renderer.getSize(new THREE.Vector2());
    if (size.x !== width || size.y !== height || this.renderer.getPixelRatio() !== dpr) {
      this.renderer.setPixelRatio(dpr);
      this.renderer.setSize(width, height, false);
    }

    const now = performance.now();
    if (pose) {
      // Same projection as the pose estimate: focal length in pixels of the analysed image
      this.camera.fov = THREE.MathUtils.radToDeg(2 * Math.atan(pose.height / 2 / pose.focalLength));
      this.camera.aspect = pose.width / pose.height;
      this.camera.updateProjectionMatrix();

      // POSIT's camera looks down +z; three.js looks down -z. Flipping z on both sides
      // (S·R·S with S = diag(1, 1, -1)) keeps it a proper rotation, with the card's z axis
      // pointing up off the paper towards the camera
      const r = pose.bestRotation;
      const t = pose.bestTranslation;
      const m = new THREE.Matrix4().set(
        r[0][0], r[0][1], -r[0][2], 0,
        r[1][0], r[1][1], -r[1][2], 0,
        -r[2][0], -r[2][1], r[2][2], 0,
        0, 0, 0, 1
      );
      this.targetRotation.setFromRotationMatrix(m);
      this.targetPosition.set(t[0], t[1], -t[2]);
      if (!this.tracked) {
        this.card.position.copy(this.targetPosition);
        this.card.quaternion.copy(this.targetRotation);
      }
      this.tracked = true;
      this.lastSeen = now;
    } else if (now - this.lastSeen > 500) {
      // Hold briefly through missed detections, then hide
      this.tracked = false;
    }

    if (this.tracked) {
      this.card.position.lerp(this.targetPosition, 0.5);
      this.card.quaternion.slerp(this.targetRotation, 0.5);
    }
    this.card.visible = this.tracked;
    this.renderer.render(this.scene, this.camera);
    return this.tracked;
  }

  dispose(): void {
    this.scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.geometry.dispose();
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      for (const mat of materials) {
        for (const value of Object.values(mat)) if (value instanceof THREE.Texture) value.dispose();
        mat.dispose();
      }
    });
    this.scene.environment?.dispose();
    this.renderer.dispose();
  }
}

function blobShadowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  const g = ctx.createRadialGradient(128, 128, 10, 128, 128, 128);
  g.addColorStop(0, 'rgba(0,0,0,0.9)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
