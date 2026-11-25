import * as THREE from 'three';

// AETHERIA - lightweight starting world for mobile devices
// Usage in game.js:
// import { createWorld } from './world.js';
// const world = createWorld(scene);
// player.position.copy(world.spawn);
// world.crystal / world.crystalLight / world.interactables are available.

export function createWorld(scene) {
  const worldGroup = new THREE.Group();
  scene.add(worldGroup);
  const interactables = [];

  function terrainHeight(x, z) {
    const spawnFlat = Math.max(0, 1 - Math.hypot(x, z - 15) / 24);
    const hills = Math.sin(x * 0.055) * Math.cos(z * 0.045) * 2.2 +
      Math.sin(x * 0.09 + z * 0.06) * 0.8;
    const mountains = Math.max(0, Math.abs(x) - 48) * 0.32 +
      Math.max(0, -z - 48) * 0.25;
    return hills * (1 - spawnFlat) + mountains;
  }

  // Ground
  const groundGeo = new THREE.PlaneGeometry(180, 180, 64, 64);
  groundGeo.rotateX(-Math.PI / 2);
  const positions = groundGeo.attributes.position;
  const colors = new Float32Array(positions.count * 3);
  const grass = new THREE.Color(0x75b95c);
  const darkGrass = new THREE.Color(0x477b43);
  const dirt = new THREE.Color(0xb79566);

  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i), z = positions.getZ(i);
    positions.setY(i, terrainHeight(x, z));
    let c = grass;
    if (Math.abs(x) > 48 || z < -55) c = darkGrass;
    const pathX = Math.sin(z * 0.04) * 5;
    if (Math.abs(x - pathX) < 3 && z < 30 && z > -55) c = dirt;
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }
  groundGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  groundGeo.computeVertexNormals();
  const ground = new THREE.Mesh(groundGeo, new THREE.MeshLambertMaterial({ vertexColors: true }));
  ground.receiveShadow = true;
  worldGroup.add(ground);

  // River segments (simple lightweight blue surface)
  const waterMat = new THREE.MeshLambertMaterial({ color: 0x42b9e9, transparent: true, opacity: 0.88 });
  for (let z = -55; z <= 55; z += 15) {
    const riverX = Math.sin(z * 0.04) * 10;
    const water = new THREE.Mesh(new THREE.PlaneGeometry(7, 18), waterMat);
    water.rotation.x = -Math.PI / 2;
    water.position.set(riverX, 0.15, z);
    worldGroup.add(water);
  }

  // Wooden bridge
  const bridgeX = Math.sin(8 * 0.04) * 10;
  const bridge = new THREE.Group();
  const woodMat = new THREE.MeshLambertMaterial({ color: 0x946239 });
  for (let i = 0; i < 9; i++) {
    const plank = new THREE.Mesh(new THREE.BoxGeometry(11, 0.22, 0.9), woodMat);
    plank.position.set(bridgeX, 0.5, 5 + i * 0.9);
    bridge.add(plank);
  }
  for (const side of [-1, 1]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.8, 8), woodMat);
    rail.position.set(bridgeX + side * 5.2, 0.9, 9);
    bridge.add(rail);
  }
  worldGroup.add(bridge);

  // Trees - instanced for performance
  const treeCount = 85;
  const trunkGeo = new THREE.CylinderGeometry(0.22, 0.32, 2.5, 6);
  const leafGeo = new THREE.ConeGeometry(1.6, 4.5, 7);
  const trunkMat = new THREE.MeshLambertMaterial({ color: 0x76502f });
  const leafMat = new THREE.MeshLambertMaterial({ color: 0x31834b });
  const trunks = new THREE.InstancedMesh(trunkGeo, trunkMat, treeCount);
  const leaves = new THREE.InstancedMesh(leafGeo, leafMat, treeCount);
  const dummy = new THREE.Object3D();
  let placed = 0;
  for (let i = 0; i < treeCount * 3 && placed < treeCount; i++) {
    const x = (Math.random() - 0.5) * 145;
    const z = (Math.random() - 0.5) * 145;
    if (Math.hypot(x, z - 15) < 13) continue;
    const pathX = Math.sin(z * 0.04) * 5;
    if (Math.abs(x - pathX) < 5) continue;
    if (Math.hypot(x - 8, z + 40) < 12) continue;
    const y = terrainHeight(x, z), scale = 0.7 + Math.random() * 0.7;
    dummy.position.set(x, y + 1.25 * scale, z);
    dummy.scale.setScalar(scale);
    dummy.rotation.y = Math.random() * Math.PI * 2;
    dummy.updateMatrix();
    trunks.setMatrixAt(placed, dummy.matrix);
    dummy.position.y = y + 3.1 * scale;
    dummy.updateMatrix();
    leaves.setMatrixAt(placed, dummy.matrix);
    placed++;
  }
  trunks.count = placed;
  leaves.count = placed;
  worldGroup.add(trunks, leaves);

  // Rocks - instanced
  const rockCount = 45;
  const rockGeo = new THREE.DodecahedronGeometry(1, 0);
  const rockMat = new THREE.MeshLambertMaterial({ color: 0x818b91 });
  const rocks = new THREE.InstancedMesh(rockGeo, rockMat, rockCount);
  placed = 0;
  for (let i = 0; i < rockCount * 3 && placed < rockCount; i++) {
    const x = (Math.random() - 0.5) * 150;
    const z = (Math.random() - 0.5) * 150;
    if (Math.hypot(x, z - 15) < 12) continue;
    const pathX = Math.sin(z * 0.04) * 5;
    if (Math.abs(x - pathX) < 4) continue;
    const y = terrainHeight(x, z), scale = 0.4 + Math.random() * 1.4;
    dummy.position.set(x, y + scale * 0.5, z);
    dummy.scale.set(scale, scale * (0.6 + Math.random()), scale);
    dummy.rotation.set(Math.random(), Math.random(), Math.random());
    dummy.updateMatrix();
    rocks.setMatrixAt(placed, dummy.matrix);
    placed++;
  }
  rocks.count = placed;
  worldGroup.add(rocks);

  // Small ruins
  const ruinGroup = new THREE.Group();
  ruinGroup.position.set(8, terrainHeight(8, -40), -40);
  const stoneMat = new THREE.MeshLambertMaterial({ color: 0xaaa99a });
  const base = new THREE.Mesh(new THREE.BoxGeometry(12, 1, 10), stoneMat);
  base.position.y = 0.5;
  ruinGroup.add(base);
  for (const x of [-4, 4]) {
    for (const z of [-3, 3]) {
      const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.55, 5, 7), stoneMat);
      pillar.position.set(x, 3, z);
      ruinGroup.add(pillar);
    }
  }
  const archTop = new THREE.Mesh(new THREE.BoxGeometry(9, 1, 1), stoneMat);
  archTop.position.set(0, 5.7, -3);
  ruinGroup.add(archTop);
  worldGroup.add(ruinGroup);

  // Magic crystal
  const crystal = new THREE.Mesh(
    new THREE.OctahedronGeometry(1.3, 0),
    new THREE.MeshStandardMaterial({ color: 0x65e6ff, emissive: 0x087ca8, emissiveIntensity: 2 })
  );
  crystal.position.set(8, terrainHeight(8, -40) + 3.1, -40);
  worldGroup.add(crystal);
  const crystalLight = new THREE.PointLight(0x35dfff, 2.5, 12);
  crystalLight.position.copy(crystal.position);
  worldGroup.add(crystalLight);
  interactables.push({
    id: 'magic_stone',
    mesh: crystal,
    title: 'حجر إيثيريا',
    body: 'لقد وجدت أول أثر من آثار إيثيريا. الحجر يحمل طاقة غامضة، وهذه مجرد بداية رحلتك.'
  });

  // Flowers
  const flowerMat = new THREE.MeshBasicMaterial({ color: 0xfff3a5 });
  const flowerGeo = new THREE.SphereGeometry(0.12, 5, 5);
  for (let i = 0; i < 90; i++) {
    const x = (Math.random() - 0.5) * 100;
    const z = (Math.random() - 0.5) * 100;
    if (Math.hypot(x, z - 15) < 10) continue;
    const flower = new THREE.Mesh(flowerGeo, flowerMat);
    flower.position.set(x, terrainHeight(x, z) + 0.15, z);
    worldGroup.add(flower);
  }

  return {
    group: worldGroup,
    spawn: new THREE.Vector3(0, terrainHeight(0, 15) + 1, 15),
    crystal,
    crystalLight,
    interactables,
    terrainHeight
  };
}
