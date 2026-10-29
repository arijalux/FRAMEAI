import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

export type LensTint = 'clear' | 'sun' | 'blue_light';

export interface OverlayPose {
  width: number; // canvas size in CSS pixels
  height: number;
  center: { x: number; y: number }; // midpoint between the pupils, CSS pixels
  angle: number; // roll from the eye line, used when there is no head pose
  pose?: number[]; // column-major 4×4 head pose
  frameWidthPx: number; // on-screen width the frame front should have
  lensTint: LensTint;
}

const LENS_TINTS: Record<LensTint, { color: number; opacity: number }> = {
  clear: { color: 0xffffff, opacity: 0.08 },
  blue_light: { color: 0xcfe0ff, opacity: 0.16 },
  sun: { color: 0x2a2a26, opacity: 0.72 },
};

/**
 * Renders a glTF pair of glasses on top of the camera image, following the head pose.
 * Uses an orthographic camera in screen pixels so the frame lines up with the tracked
 * eye positions, and an invisible head-shaped occluder so the temples disappear
 * behind the head the way real ones do.
 */
export class Glasses3DOverlay {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.OrthographicCamera(0, 1, 0, -1, -10000, 10000);
  private head = new THREE.Group(); // positioned and rotated with the head, in pixels
  private glasses = new THREE.Group(); // model, centred on the lenses and scaled to fit
  private occluder: THREE.Mesh;
  private lensMaterials: THREE.MeshPhysicalMaterial[] = [];
  private modelWidth = 1;
  private rotation = new THREE.Quaternion();
  private hasRotation = false;
  private tint: LensTint | null = null;

  constructor(private canvas: HTMLCanvasElement) {
    // preserveDrawingBuffer keeps the last frame readable for snapshots
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

    // Only writes depth: hides whatever of the glasses is behind the head
    this.occluder = new THREE.Mesh(
      new THREE.SphereGeometry(1, 32, 24),
      new THREE.MeshBasicMaterial({ colorWrite: false })
    );
    this.occluder.renderOrder = -1;

    this.head.add(this.glasses, this.occluder);
    this.head.visible = false;
    this.scene.add(this.head);
  }

  async load(url: string): Promise<void> {
    const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
    const gltf = await loader.loadAsync(url);
    const model = gltf.scene;

    // Lenses are the transparent material. Transmission needs the scene behind the glass,
    // which here is the camera image outside WebGL, so use a thin tinted glass instead.
    const lensBox = new THREE.Box3();
    model.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh) return;
      const material = mesh.material as THREE.MeshStandardMaterial;
      if (material.transparent) {
        const glass = new THREE.MeshPhysicalMaterial({
          transparent: true,
          roughness: 0.05,
          metalness: 0,
          envMapIntensity: 1.5,
          depthWrite: false,
        });
        mesh.material = glass;
        mesh.renderOrder = 2;
        this.lensMaterials.push(glass);
        lensBox.expandByObject(mesh);
      }
    });

    const box = new THREE.Box3().setFromObject(model);
    if (lensBox.isEmpty()) lensBox.copy(box);
    this.modelWidth = box.max.x - box.min.x;
    // Origin at the middle of the lenses, on the front face of the frame
    const lensCentre = lensBox.getCenter(new THREE.Vector3());
    model.position.set(-lensCentre.x, -lensCentre.y, -box.max.z);
    this.glasses.add(model);
  }

  render(p: OverlayPose): void {
    const dpr = window.devicePixelRatio || 1;
    const size = this.renderer.getSize(new THREE.Vector2());
    if (size.x !== p.width || size.y !== p.height || this.renderer.getPixelRatio() !== dpr) {
      this.renderer.setPixelRatio(dpr);
      this.renderer.setSize(p.width, p.height, false);
    }
    this.camera.left = 0;
    this.camera.right = p.width;
    this.camera.top = 0;
    this.camera.bottom = -p.height;
    this.camera.updateProjectionMatrix();

    if (this.tint !== p.lensTint) {
      this.tint = p.lensTint;
      const t = LENS_TINTS[p.lensTint];
      for (const m of this.lensMaterials) {
        m.color.setHex(t.color);
        m.opacity = t.opacity;
      }
    }

    // Rotation from the head pose (fall back to the eye line's roll), smoothed with slerp
    const target = new THREE.Quaternion();
    if (p.pose) {
      target.setFromRotationMatrix(new THREE.Matrix4().fromArray(p.pose));
    } else {
      // Screen y points down, scene y points up, so the roll flips sign
      target.setFromAxisAngle(new THREE.Vector3(0, 0, 1), -p.angle);
    }
    if (this.hasRotation) this.rotation.slerp(target, 0.5);
    else this.rotation.copy(target);
    this.hasRotation = true;

    this.head.position.set(p.center.x, -p.center.y, 0);
    this.head.quaternion.copy(this.rotation);
    this.glasses.scale.setScalar(p.frameWidthPx / this.modelWidth);

    // Head proportions relative to the frame width: a little narrower than the temples,
    // taller than wide, deep enough to cover the far temple when the head turns. Its front
    // sits just behind the frame front, at about the eyes.
    const w = p.frameWidthPx;
    const depth = w * 0.66;
    this.occluder.scale.set(w * 0.46, w * 0.62, depth);
    this.occluder.position.set(0, w * 0.08, -depth - w * 0.04);

    this.head.visible = true;
    this.renderer.render(this.scene, this.camera);
  }

  clear(): void {
    if (!this.head.visible) return;
    this.head.visible = false;
    this.hasRotation = false;
    this.renderer.clear();
  }

  dispose(): void {
    this.scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.geometry.dispose();
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      for (const m of materials) {
        for (const value of Object.values(m)) if (value instanceof THREE.Texture) value.dispose();
        m.dispose();
      }
    });
    this.scene.environment?.dispose();
    this.renderer.dispose();
  }
}
