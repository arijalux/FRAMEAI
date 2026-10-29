import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

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

// Roughly a webcam's vertical field of view; gives receding temples a natural perspective
const CAMERA_FOV = 50;

/**
 * Renders a glTF pair of glasses on top of the camera image, following the head pose.
 * The perspective camera is placed so one unit is one CSS pixel on the frame's plane, which
 * keeps the frame on the tracked eye positions while the temples recede toward the camera
 * axis. An invisible head-shaped occluder hides the temples behind the head, and a soft
 * shadow grounds the frame on the face.
 */
export class Glasses3DOverlay {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(CAMERA_FOV, 1, 1, 100000);
  private head = new THREE.Group(); // positioned and rotated with the head, in pixels
  private glasses = new THREE.Group(); // model and its occluder and shadow, scaled to fit
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

    this.head.add(this.glasses);
    this.head.visible = false;
    this.scene.add(this.head);
  }

  async load(url: string): Promise<void> {
    const loaded = await loadGlassesModel(url);
    const { width, lensSize, templeInner } = loaded;
    this.lensMaterials = loaded.lensMaterials;
    this.modelWidth = width;
    this.glasses.add(loaded.model);

    // Head stand-in that only writes depth: as wide as the space between the temples, with
    // its face just behind the frame front, so the temples vanish behind it past the hinges
    const headWidth = templeInner * 2 * 0.98;
    const headDepth = width * 1.3;
    const occluder = new THREE.Mesh(
      new RoundedBoxGeometry(headWidth, width * 1.25, headDepth, 4, width * 0.16),
      new THREE.MeshBasicMaterial({ colorWrite: false })
    );
    occluder.position.set(0, width * 0.1, -width * 0.06 - headDepth / 2);
    occluder.renderOrder = -1;
    this.glasses.add(occluder);

    // Soft shadow the rims cast on the face, just in front of the occluder
    const shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(lensSize.x * 1.3, lensSize.y * 1.9),
      new THREE.MeshBasicMaterial({ map: rimShadowTexture(), transparent: true, depthWrite: false, opacity: 0.45 })
    );
    shadow.position.set(0, -lensSize.y * 0.12, -width * 0.05);
    shadow.renderOrder = 1;
    this.glasses.add(shadow);
  }

  render(p: OverlayPose): void {
    const dpr = window.devicePixelRatio || 1;
    const size = this.renderer.getSize(new THREE.Vector2());
    if (size.x !== p.width || size.y !== p.height || this.renderer.getPixelRatio() !== dpr) {
      this.renderer.setPixelRatio(dpr);
      this.renderer.setSize(p.width, p.height, false);
    }
    // Look at the middle of the canvas from the distance where the z = 0 plane is exactly
    // one unit per CSS pixel, so screen coordinates map straight onto the scene
    const distance = p.height / 2 / Math.tan(THREE.MathUtils.degToRad(CAMERA_FOV / 2));
    this.camera.aspect = p.width / p.height;
    this.camera.position.set(p.width / 2, -p.height / 2, distance);
    this.camera.lookAt(p.width / 2, -p.height / 2, 0);
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

/** Two blurred rounded rims, the shape of the shadow a frame casts just below itself */
function rimShadowTexture(): THREE.CanvasTexture {
  const w = 512;
  const h = 256;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  // Draw the rims off-canvas and keep only their blurred shadow, which works in every browser
  ctx.shadowColor = 'rgba(0, 0, 0, 1)';
  ctx.shadowBlur = 18;
  ctx.shadowOffsetX = w;
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 14;
  const lensW = w * 0.34;
  const lensH = h * 0.5;
  for (const cx of [w * 0.3, w * 0.7]) {
    ctx.beginPath();
    ctx.roundRect(cx - lensW / 2 - w, h / 2 - lensH / 2, lensW, lensH, lensH * 0.35);
    ctx.stroke();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export interface LoadedGlasses {
  /** Model with its origin at the middle of the lenses, on the front face of the frame */
  model: THREE.Object3D;
  lensMaterials: THREE.MeshPhysicalMaterial[];
  width: number;
  /** Bounds of the positioned model */
  box: THREE.Box3;
  lensSize: THREE.Vector3;
  /** Distance from the centre to the inside of the temples */
  templeInner: number;
}

/**
 * Loads a glTF pair of glasses (meshopt + WebP supported). Lenses are the transparent
 * material; transmission needs the scene behind the glass, which here is a camera image
 * outside WebGL, so they become a thin tinted glass instead.
 */
export async function loadGlassesModel(url: string): Promise<LoadedGlasses> {
  const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  const gltf = await loader.loadAsync(url);
  const model = gltf.scene;
  model.updateMatrixWorld(true);

  const lensMaterials: THREE.MeshPhysicalMaterial[] = [];
  const lensBox = new THREE.Box3();
  const solids: THREE.Mesh[] = [];
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
        ...LENS_TINTS.clear,
      });
      mesh.material = glass;
      mesh.renderOrder = 2;
      lensMaterials.push(glass);
      lensBox.expandByObject(mesh);
    } else {
      solids.push(mesh);
    }
  });

  const box = new THREE.Box3().setFromObject(model);
  if (lensBox.isEmpty()) lensBox.copy(box);
  const width = box.max.x - box.min.x;
  const depth = box.max.z - box.min.z;

  // Inner edge of the temples: the narrowest |x| of the frame behind the front piece
  let templeInner = width / 2;
  const v = new THREE.Vector3();
  const behindFront = box.max.z - depth * 0.3;
  for (const mesh of solids) {
    const pos = mesh.geometry.getAttribute('position');
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i).applyMatrix4(mesh.matrixWorld);
      if (v.z < behindFront) templeInner = Math.min(templeInner, Math.abs(v.x));
    }
  }

  const lensCentre = lensBox.getCenter(new THREE.Vector3());
  const offset = new THREE.Vector3(-lensCentre.x, -lensCentre.y, -box.max.z);
  model.position.copy(offset);
  return {
    model,
    lensMaterials,
    width,
    box: box.clone().translate(offset),
    lensSize: lensBox.getSize(new THREE.Vector3()),
    templeInner,
  };
}
