import * as THREE from 'three';

const presets={
 low:{pixel:1,trees:110,rocks:48,segments:64,fog:135,shadows:false},
 medium:{pixel:1.25,trees:180,rocks:70,segments:80,fog:170,shadows:true},
 high:{pixel:1.5,trees:250,rocks:100,segments:96,fog:210,shadows:true}
};
let quality='low', preset=presets.low;
const canvas=document.querySelector('#game-canvas');
const renderer=new THREE.WebGLRenderer({canvas,antialias:false,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,preset.pixel));
renderer.setSize(innerWidth,innerHeight);
renderer.shadowMap.enabled=preset.shadows;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.05;
const scene=new THREE.Scene();scene.background=new THREE.Color(0x91cbe9);scene.fog=new THREE.Fog(0x9fd3ed,30,preset.fog);
const camera=new THREE.PerspectiveCamera(65,innerWidth/innerHeight,.1,260);
const hemi=new THREE.HemisphereLight(0xdbeafe,0x425c35,1.05);scene.add(hemi);
const sun=new THREE.DirectionalLight(0xfff1d0,2);sun.position.set(45,80,35);sun.castShadow=preset.shadows;sun.shadow.mapSize.set(512,512);sun.shadow.camera.left=-70;sun.shadow.camera.right=70;sun.shadow.camera.top=70;sun.shadow.camera.bottom=-70;scene.add(sun);
const sunball=new THREE.Mesh(new THREE.SphereGeometry(5,12,12),new THREE.MeshBasicMaterial({color:0xfff5c8}));sunball.position.copy(sun.position).multiplyScalar(1.7);scene.add(sunball);
const world=new THREE.Group();scene.add(world);
const interactables=[];
function riverX(z){return Math.sin(z*.045)*18-10}
function terrainH(x,z){let radial=Math.hypot(x,z),rim=Math.max(0,(radial-55)/55),mount=Math.pow(rim,2.1)*32;
let hills=Math.sin(x*.05)*Math.cos(z*.05)*2.5+Math.sin(x*.11+z*.08)*.8;
const t=THREE.MathUtils.smoothstep(Math.hypot(x-18,z+22),8,22),s=THREE.MathUtils.smoothstep(Math.hypot(x+6,z+48),6,18);
let h=(hills+mount)*t*s;let rd=Math.abs(x-riverX(z));if(rd<9)h-=Math.pow(1-rd/9,2)*3; if(z<-68)h+=Math.min(24,(-68-z)*1.2);return h}
function pathX(z){return Math.sin(z*.06)*8+(z<0?-z*.22:0)}
function addMesh(geo,mat,x,y,z,group=world){const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.castShadow=preset.shadows;m.receiveShadow=preset.shadows;group.add(m);return m}
function build(){
 while(world.children.length){let o=world.children.pop();o.geometry?.dispose();if(o.material?.dispose)o.material.dispose()}
 const geo=new THREE.PlaneGeometry(240,240,preset.segments,preset.segments);geo.rotateX(-Math.PI/2);let p=geo.attributes.position,col=[];
 const c=new THREE.Color();
 for(let i=0;i<p.count;i++){let x=p.getX(i),z=p.getZ(i),y=terrainH(x,z);p.setY(i,y);let rd=Math.abs(x-riverX(z)),pd=Math.abs(x-pathX(z));
 if(rd<7&&y<1)c.setHex(0xb9a27b);else if(pd<2&&z>-52&&z<35)c.setHex(0x9c8265);else if(y>14)c.setHex(0x77818b);else if(y>7)c.setHex(0x526c49);else c.setRGB(.22,.48,.2);
 col.push(c.r,c.g,c.b)}geo.setAttribute('color',new THREE.Float32BufferAttribute(col,3));geo.computeVertexNormals();addMesh(geo,new THREE.MeshLambertMaterial({vertexColors:true}),0,0,0);
 // river winding
 const waterMat=new THREE.MeshPhongMaterial({color:0x168ed5,emissive:0x062d49,shininess:75,transparent:true,opacity:.82,side:THREE.DoubleSide});
 for(let z=-105;z<75;z+=4){const x=riverX(z);addMesh(new THREE.BoxGeometry(13,.12,4.3),waterMat,x,-.45,z)}
 // waterfall sheet + spray
 const wf=addMesh(new THREE.PlaneGeometry(10,18),new THREE.MeshBasicMaterial({color:0xb8e8ff,transparent:true,opacity:.7,side:THREE.DoubleSide}),riverX(-69),7,-69);wf.rotation.y=.08;
 const sprayGeo=new THREE.BufferGeometry(),n=65,arr=new Float32Array(n*3);for(let i=0;i<n;i++){arr[i*3]=riverX(-69)+(Math.random()-.5)*9;arr[i*3+1]=Math.random()*16;arr[i*3+2]=-69+(Math.random()-.5)*2}sprayGeo.setAttribute('position',new THREE.BufferAttribute(arr,3));const spray=new THREE.Points(sprayGeo,new THREE.PointsMaterial({color:0xffffff,size:.45}));world.add(spray);spray.userData.spray=true;
 // bridge
 const bx=riverX(-10);addMesh(new THREE.BoxGeometry(14,.45,4),new THREE.MeshLambertMaterial({color:0x704b2a}),bx,terrainH(bx,-10)+.5,-10);
 // temple
 const temple=new THREE.Group();temple.position.set(18,terrainH(18,-22),-22);world.add(temple);
 const stone=new THREE.MeshLambertMaterial({color:0x9aa8b6}),dark=new THREE.MeshLambertMaterial({color:0x667585});
 function templeBox(g,m,x,y,z){let o=new THREE.Mesh(g,m);o.position.set(x,y,z);o.castShadow=preset.shadows;temple.add(o)}
 templeBox(new THREE.BoxGeometry(14,1,14),dark,0,.5,0);templeBox(new THREE.BoxGeometry(11,1,11),stone,0,1.2,0);
 for(let x of [-4,4])for(let z of [-4,4]){templeBox(new THREE.CylinderGeometry(.55,.65,5,8),stone,x,3.7,z);templeBox(new THREE.BoxGeometry(1.4,.5,1.4),dark,x,6.3,z)}
 templeBox(new THREE.BoxGeometry(10,.6,1),dark,0,6.5,-4.5);templeBox(new THREE.BoxGeometry(10,.6,1),dark,0,6.5,4.5);
 // crystal landmark
 const crystalGroup=new THREE.Group();crystalGroup.position.set(-6,terrainH(-6,-48)+1.2,-48);world.add(crystalGroup);
 const crystal=new THREE.Mesh(new THREE.OctahedronGeometry(2.1,0),new THREE.MeshStandardMaterial({color:0x49d9ff,emissive:0x087ba9,emissiveIntensity:1.5,metalness:.15,roughness:.2}));crystal.scale.y=1.6;crystalGroup.add(crystal);
 const ring=new THREE.Mesh(new THREE.TorusGeometry(3.2,.12,8,48),new THREE.MeshBasicMaterial({color:0x7cecff}));ring.rotation.x=Math.PI/2;crystalGroup.add(ring);
 const glow=new THREE.PointLight(0x44ccff,3,18);glow.position.y=2;crystalGroup.add(glow);crystalGroup.userData.crystal=true;
 interactables.push({object:crystalGroup,id:'magic_stone',title:'حجر إيثيريا',body:'وجدت حجر إيثيريا القديم. يقال إنه أول نور استيقظ في هذا الوادي.'});
 // trees, avoid path, river, spawn and landmark
 const treeMat=new THREE.MeshLambertMaterial({color:0x5c3c25}),leafMat=new THREE.MeshLambertMaterial({color:0x27613a});
 for(let i=0;i<preset.trees;i++){let x=(Math.random()-.5)*190,z=(Math.random()-.5)*190;if(Math.abs(x-riverX(z))<12||Math.abs(x-pathX(z))<4||Math.hypot(x,z-28)<12||Math.hypot(x-18,z+22)<12||Math.hypot(x+6,z+48)<10)continue;
 let y=terrainH(x,z),s=.65+Math.random()*.8;addMesh(new THREE.CylinderGeometry(.18*s,.28*s,2.3*s,5),treeMat,x,y+1.1*s,z);
 const crown=addMesh(new THREE.ConeGeometry(1.6*s,3.5*s,6),leafMat,x,y+3*s,z);crown.position.y=y+3*s;
 }
 // rocks
 const rockmat=new THREE.MeshLambertMaterial({color:0x737d88});
 for(let i=0;i<preset.rocks;i++){let x=(Math.random()-.5)*185,z=(Math.random()-.5)*180;if(Math.abs(x-pathX(z))<4||Math.abs(x-riverX(z))<10)continue;let y=terrainH(x,z),s=.5+Math.random()*1.4;let r=addMesh(new THREE.DodecahedronGeometry(s,0),rockmat,x,y+s*.5,z);r.rotation.set(Math.random(),Math.random(),Math.random());}
 // grass-like scatter not too heavy
}
build();
const player=new THREE.Group();scene.add(player);
const body=new THREE.Mesh(new THREE.CapsuleGeometry(.45,.9,3,6),new THREE.MeshStandardMaterial({color:0x285b9e,roughness:.8}));body.position.y=1;player.add(body);
const head=new THREE.Mesh(new THREE.SphereGeometry(.32,10,8),new THREE.MeshStandardMaterial({color:0xe6c6a5}));head.position.y=1.78;player.add(head);
const backpack=new THREE.Mesh(new THREE.BoxGeometry(.48,.55,.25),new THREE.MeshLambertMaterial({color:0x513c2c}));backpack.position.set(0,1.15,.38);player.add(backpack);
player.position.set(0,terrainH(0,28),28);
let yaw=0,pitch=.25,camDist=6,vy=0,onGround=true;
const input={x:0,y:0,jump:false};let joyId=null,camId=null,lastTouchX=0,lastTouchY=0;
const zone=document.querySelector('#joystick-zone'),stick=document.querySelector('#joystick-stick'),cameraZone=document.querySelector('#camera-touch-zone');
zone.addEventListener('touchstart',e=>{e.preventDefault();let t=e.changedTouches[0];joyId=t.identifier;joyMove(t)}, {passive:false});
zone.addEventListener('touchmove',e=>{e.preventDefault();for(let t of e.changedTouches)if(t.identifier===joyId)joyMove(t)}, {passive:false});
function joyMove(t){const r=zone.getBoundingClientRect(),cx=r.left+65,cy=r.top+65;let dx=t.clientX-cx,dy=t.clientY-cy;let max=42,l=Math.hypot(dx,dy);if(l>max){dx=dx/l*max;dy=dy/l*max}stick.style.transform=`translate(${dx}px,${dy}px)`;input.x=dx/max;input.y=dy/max}
function joyEnd(e){for(let t of e.changedTouches)if(t.identifier===joyId){joyId=null;input.x=0;input.y=0;stick.style.transform='translate(0,0)'}}zone.addEventListener('touchend',joyEnd);zone.addEventListener('touchcancel',joyEnd);
cameraZone.addEventListener('touchstart',e=>{let t=e.changedTouches[0];camId=t.identifier;lastTouchX=t.clientX;lastTouchY=t.clientY},{passive:true});
cameraZone.addEventListener('touchmove',e=>{for(let t of e.changedTouches)if(t.identifier===camId){yaw-=(t.clientX-lastTouchX)*.006;pitch=Math.max(-.15,Math.min(.85,pitch+(t.clientY-lastTouchY)*.004));lastTouchX=t.clientX;lastTouchY=t.clientY}},{passive:true});
cameraZone.addEventListener('touchend',e=>{for(let t of e.changedTouches)if(t.identifier===camId)camId=null});
document.querySelector('#jump-btn').addEventListener('touchstart',e=>{e.preventDefault();input.jump=true},{passive:false});document.querySelector('#jump-btn').addEventListener('click',()=>input.jump=true);
const loreModal=document.querySelector('#lore-modal'),loreTitle=document.querySelector('#lore-title'),loreBody=document.querySelector('#lore-body'),interactBtn=document.querySelector('#interact-btn');
document.querySelector('#close-lore-btn').onclick=()=>loreModal.classList.add('hidden');
function showLore(item){loreTitle.textContent=item.title;loreBody.textContent=item.body;loreModal.classList.remove('hidden');document.querySelector('#zone-hint').textContent='تم إيقاظ حجر إيثيريا السحري!'}
interactBtn.onclick=()=>{if(player.userData.nearItem)showLore(player.userData.nearItem)};
window.addEventListener('keydown',e=>{if(e.code==='Space')input.jump=true;if(e.code==='KeyE'&&player.userData.nearItem)showLore(player.userData.nearItem);if(e.code==='KeyW')input.y=-1;if(e.code==='KeyS')input.y=1;if(e.code==='KeyA')input.x=-1;if(e.code==='KeyD')input.x=1});
window.addEventListener('keyup',e=>{if(['KeyW','KeyS'].includes(e.code))input.y=0;if(['KeyA','KeyD'].includes(e.code))input.x=0});
document.querySelector('#quality-select').addEventListener('change',e=>{quality=e.target.value;preset=presets[quality];renderer.setPixelRatio(Math.min(devicePixelRatio,preset.pixel));renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=preset.shadows;scene.fog.far=preset.fog;build()});
window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,preset.pixel)});
let fpsFrames=0,fpsLast=performance.now(),clock=new THREE.Clock();
function animate(){requestAnimationFrame(animate);const dt=Math.min(clock.getDelta(),.05);fpsFrames++;let now=performance.now();if(now-fpsLast>1000){document.querySelector('#fps-counter').textContent=`FPS: ${Math.round(fpsFrames*1000/(now-fpsLast))}`;fpsFrames=0;fpsLast=now}
const forward=new THREE.Vector3(-Math.sin(yaw),0,-Math.cos(yaw)),right=new THREE.Vector3(Math.cos(yaw),0,-Math.sin(yaw));
let move=forward.multiply(-input.y).add(right.multiply(input.x));if(move.lengthSq()>1)move.normalize();
if(move.lengthSq()>.001){player.position.addScaledVector(move,5.3*dt);player.rotation.y=Math.atan2(move.x,move.z)}
const ground=terrainH(player.position.x,player.position.z);if(input.jump&&onGround){vy=7.4;onGround=false}input.jump=false;vy-=18*dt;player.position.y+=vy*dt;if(player.position.y<=ground){player.position.y=ground;vy=0;onGround=true}
player.position.x=THREE.MathUtils.clamp(player.position.x,-110,110);player.position.z=THREE.MathUtils.clamp(player.position.z,-110,110);
let near=null,dist=99;for(const item of interactables){let d=player.position.distanceTo(item.object.position);if(d<5&&d<dist){near=item;dist=d}}player.userData.nearItem=near;interactBtn.classList.toggle('hidden',!near);
const target=new THREE.Vector3(player.position.x,player.position.y+1.35,player.position.z);const camOffset=new THREE.Vector3(Math.sin(yaw)*camDist*Math.cos(pitch),camDist*Math.sin(pitch)+2,Math.cos(yaw)*camDist*Math.cos(pitch));camera.position.lerp(target.clone().add(camOffset),.12);camera.lookAt(target);
for(const o of world.children)if(o.userData.spray){let a=o.geometry.attributes.position;for(let i=0;i<a.count;i++){let y=a.getY(i)-7*dt;if(y<0)y=16; a.setY(i,y)}a.needsUpdate=true}
for(const o of world.children)if(o.userData.crystal){o.children[0].rotation.y+=dt*.7;o.children[0].rotation.x+=dt*.25;o.children[1].rotation.z+=dt*.4;o.children[2].intensity=2.4+Math.sin(now*.003)*1.2}
renderer.render(scene,camera)}
setTimeout(()=>document.querySelector('#loading-screen').classList.add('fade-out'),600);
animate();
