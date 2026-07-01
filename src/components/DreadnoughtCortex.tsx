import { useEffect, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { LEFT_EYE_ORACLE_START } from '../narrative/leftEyeOracleDialogue';
import { useGameStore } from '../store/gameStore';
import { DialogueOverlay } from './DialogueOverlay';

const PLAYER_HEIGHT = 1.7;
const MOVE_SPEED = 4.5;
const ROOM_LIMIT = 10.5;
const ORACLE_POSITION = new THREE.Vector3(4, 1.25, -1);
const INTERACTION_DISTANCE = 2.75;

interface FirstPersonControllerProps { onProximityChange: (isNear: boolean) => void; }

const FirstPersonController = ({ onProximityChange }: FirstPersonControllerProps): null => {
  const { camera, gl } = useThree();
  const activeDialogueNodeId = useGameStore((state) => state.activeDialogueNodeId);
  const setActiveDialogueNode = useGameStore((state) => state.setActiveDialogueNode);
  const keys = useRef<Set<string>>(new Set());
  const isNearOracle = useRef(false);
  const yaw = useRef(0);
  const pitch = useRef(0);

  useEffect(() => {
    const testPosition = new URLSearchParams(window.location.search).get('testPosition');
    camera.position.copy(testPosition === 'oracle'
      ? ORACLE_POSITION.clone().add(new THREE.Vector3(0, PLAYER_HEIGHT - ORACLE_POSITION.y, 2))
      : new THREE.Vector3(0, PLAYER_HEIGHT, 7));
    const handleKeyDown = (event: KeyboardEvent): void => {
      keys.current.add(event.code);
      if (event.code === 'KeyE' && isNearOracle.current && !activeDialogueNodeId) {
        document.exitPointerLock();
        keys.current.clear();
        setActiveDialogueNode(LEFT_EYE_ORACLE_START);
      }
    };
    const handleKeyUp = (event: KeyboardEvent): void => { keys.current.delete(event.code); };
    const handleClick = (): void => {
      if (!activeDialogueNodeId) gl.domElement.requestPointerLock();
    };
    const handleMouseMove = (event: MouseEvent): void => {
      if (document.pointerLockElement !== gl.domElement) return;
      yaw.current -= event.movementX * 0.002;
      pitch.current = THREE.MathUtils.clamp(pitch.current - event.movementY * 0.002, -1.45, 1.45);
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    document.addEventListener('mousemove', handleMouseMove);
    gl.domElement.addEventListener('click', handleClick);
    return (): void => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      document.removeEventListener('mousemove', handleMouseMove);
      gl.domElement.removeEventListener('click', handleClick);
    };
  }, [activeDialogueNodeId, camera, gl, setActiveDialogueNode]);

  useFrame((_, delta: number): void => {
    // Expose read-only coordinates for reliable movement QA without changing gameplay.
    gl.domElement.dataset.playerX = camera.position.x.toFixed(2);
    gl.domElement.dataset.playerZ = camera.position.z.toFixed(2);
    const nearOracle = camera.position.distanceTo(ORACLE_POSITION) <= INTERACTION_DISTANCE;
    if (nearOracle !== isNearOracle.current) {
      isNearOracle.current = nearOracle;
      onProximityChange(nearOracle);
    }
    if (activeDialogueNodeId) return;
    camera.rotation.set(pitch.current, yaw.current, 0, 'YXZ');
    const direction = new THREE.Vector3();
    if (keys.current.has('KeyW')) direction.z -= 1;
    if (keys.current.has('KeyS')) direction.z += 1;
    if (keys.current.has('KeyA')) direction.x -= 1;
    if (keys.current.has('KeyD')) direction.x += 1;
    if (direction.lengthSq() > 0) {
      direction.normalize().applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw.current);
      camera.position.addScaledVector(direction, MOVE_SPEED * Math.min(delta, 0.05));
      camera.position.x = THREE.MathUtils.clamp(camera.position.x, -ROOM_LIMIT, ROOM_LIMIT);
      camera.position.z = THREE.MathUtils.clamp(camera.position.z, -ROOM_LIMIT, ROOM_LIMIT);
      camera.position.y = PLAYER_HEIGHT;
    }
  });
  return null;
};

const CortexChamber = (): JSX.Element => (
  <group>
    <ambientLight intensity={0.3} color="#772f8f" />
    <pointLight position={[0, 5, 0]} intensity={35} distance={18} color="#ff5ca8" />
    <pointLight position={[-7, 2, -6]} intensity={18} distance={10} color="#4dd9ff" />
    <group position={ORACLE_POSITION}>
      <pointLight position={[0, 0.5, 0]} intensity={15} distance={5} color="#72ffde" />
      <mesh castShadow><sphereGeometry args={[0.9, 32, 20]} /><meshStandardMaterial color="#d6a3be" roughness={0.65} /></mesh>
      <mesh position={[0, 0, 0.78]}><sphereGeometry args={[0.5, 32, 20]} /><meshStandardMaterial color="#61e6c4" emissive="#126c62" emissiveIntensity={2} /></mesh>
      <mesh position={[0, 0, 1.2]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.13, 0.13, 0.12, 24]} /><meshStandardMaterial color="#08030b" /></mesh>
    </group>
    <mesh position={[0, -0.35, 0]} receiveShadow><cylinderGeometry args={[12, 12, 0.7, 64]} /><meshStandardMaterial color="#2a1729" roughness={0.8} /></mesh>
    <group position={[0, 4.2, -3]} scale={[1.8, 1.25, 1.2]}>
      {[-1.2, 0, 1.2].map((x: number) => <mesh key={x} position={[x, Math.abs(x) * 0.25, 0]} castShadow><sphereGeometry args={[1.8, 32, 24]} /><meshStandardMaterial color="#9e365f" emissive="#3b071f" roughness={0.55} /></mesh>)}
    </group>
    {Array.from({ length: 12 }, (_, index: number) => {
      const angle = (index / 12) * Math.PI * 2;
      return <mesh key={angle} position={[Math.cos(angle) * 10.8, 2.2, Math.sin(angle) * 10.8]}><cylinderGeometry args={[0.25, 0.6, 4.5, 10]} /><meshStandardMaterial color="#4c183f" emissive="#1b0618" /></mesh>;
    })}
    <mesh position={[0, 6.5, 0]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[12, 12, 0.7, 64, 1, true]} /><meshStandardMaterial color="#421d42" side={THREE.BackSide} roughness={0.9} /></mesh>
  </group>
);

export const DreadnoughtCortex = (): JSX.Element => {
  const [isNearOracle, setIsNearOracle] = useState(false);
  const dialogueOpen = useGameStore((state) => state.activeDialogueNodeId !== null);
  return (
    <div className="cortex-shell" data-testid="cortex-scene">
      <Canvas data-testid="cortex-canvas" shadows camera={{ fov: 70, near: 0.1, far: 100 }}>
        <color attach="background" args={['#09030d']} /><fog attach="fog" args={['#19091f', 12, 32]} />
        <CortexChamber /><FirstPersonController onProximityChange={setIsNearOracle} />
      </Canvas>
      {!dialogueOpen && <div className="crosshair" aria-hidden="true">+</div>}
      {isNearOracle && !dialogueOpen && <p className="interaction-prompt" data-testid="oracle-prompt">Press E to commune with the Left Eye Nerve Oracle</p>}
      {!dialogueOpen && <p className="controls-hint" data-testid="scene-controls">Click to look · WASD to move · E to interact</p>}
      <DialogueOverlay />
    </div>
  );
};
