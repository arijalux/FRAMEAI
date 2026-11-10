import * as THREE from 'three';
import { CustomFrameParams, buildFrameGeometry } from '../../utils/frameGenerator';
import { LENS_TINTS, type LoadedGlasses } from './Glasses3DOverlay';

type Pt = [number, number];

// Wood thickness is not known yet from BJ Homemade; typical wooden frames are about this thick
export const FRONT_THICKNESS = 5;
const TEMPLE_WIDTH = 4; // how wide the temple is seen from above

// The cut outlines use SVG coordinates (y down); three.js has y up
const toShape = (pts: Pt[]) => new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, -y)));
const toPath = (pts: Pt[]) => new THREE.Path(pts.map(([x, y]) => new THREE.Vector2(x, -y)));

/**
 * A custom design as a 3D pair of glasses, built from the same outlines as its SVG/DXF cut
 * file and in millimetres: the front piece with its lens openings, given the wood's thickness,
 * clear lenses, and the two temples hinged at the outer edges and running back. Matches what
 * loadGlassesModel returns, so the AR overlay can use either.
 */
export function buildCustomGlassesModel(p: CustomFrameParams, woodColor: string): LoadedGlasses {
  const g = buildFrameGeometry(p);
  // Matte wood that keeps its colour under the overlay's studio lighting
  const wood = new THREE.MeshStandardMaterial({ color: woodColor, roughness: 0.8, metalness: 0, envMapIntensity: 0.35 });
  const model = new THREE.Group();

  // Front piece, extruded backwards so its face sits at z = 0
  const shape = toShape(g.outlines.front);
  shape.holes = g.outlines.lenses.map(toPath);
  const frontGeometry = new THREE.ExtrudeGeometry(shape, {
    depth: FRONT_THICKNESS,
    bevelEnabled: true,
    bevelThickness: 0.6,
    bevelSize: 0.5,
    bevelSegments: 2,
    curveSegments: 1,
  });
  frontGeometry.translate(0, 0, -FRONT_THICKNESS);
  model.add(new THREE.Mesh(frontGeometry, wood));

  // Lenses: thin clear glass in the openings
  const lensMaterials = g.outlines.lenses.map(
    () =>
      new THREE.MeshPhysicalMaterial({
        transparent: true,
        roughness: 0.05,
        metalness: 0,
        envMapIntensity: 1.5,
        depthWrite: false,
        side: THREE.DoubleSide,
        ...LENS_TINTS.clear,
      })
  );
  g.outlines.lenses.forEach((pts, i) => {
    const lens = new THREE.Mesh(new THREE.ShapeGeometry(toShape(pts)), lensMaterials[i]);
    lens.position.z = -FRONT_THICKNESS / 2;
    lens.renderOrder = 2;
    model.add(lens);
  });

  // Temples: the side profile (x along the arm, y down) turned so the arm runs back along -z,
  // set at the front's outer edge, at the hinge height
  const front = g.outlines.front;
  const outer = Math.max(...front.map(([x]) => x));
  const hingeY = (p.lensHeight / 2) * 0.55; // matches the hinge block in buildFrameGeometry
  const templeGeometry = new THREE.ExtrudeGeometry(toShape(g.outlines.temple), {
    depth: TEMPLE_WIDTH,
    bevelEnabled: false,
    curveSegments: 1,
  });
  for (const side of [-1, 1]) {
    const temple = new THREE.Mesh(templeGeometry, wood);
    // rotation y = +90°: shape x → -z (backwards), extrusion z → +x
    temple.rotation.y = Math.PI / 2;
    temple.position.set(side > 0 ? outer - TEMPLE_WIDTH : -outer, hingeY, -FRONT_THICKNESS);
    model.add(temple);
  }

  model.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(model);
  const lensBox = new THREE.Box3();
  model.children.filter((c) => (c as THREE.Mesh).renderOrder === 2).forEach((c) => lensBox.expandByObject(c));

  return {
    model,
    lensMaterials,
    width: g.width,
    box,
    lensSize: lensBox.getSize(new THREE.Vector3()),
    templeInner: outer - TEMPLE_WIDTH,
  };
}
