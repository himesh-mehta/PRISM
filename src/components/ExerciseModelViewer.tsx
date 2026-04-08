import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, useAnimations, OrbitControls, ContactShadows, Html, Environment, Grid } from "@react-three/drei";
import * as THREE from "three";
import { Suspense, useEffect, useRef, useState } from "react";
import { Loader2, AlertCircle, Play, Pause, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ModelProps {
  url: string;
  actionName?: string;
  isPlaying?: boolean;
  onAnimationsLoaded?: (names: string[]) => void;
  controlsRef?: any;
}

// Subcomponent that loads the GLTF model and manages animations
const Model = ({ url, actionName, isPlaying = true, onAnimationsLoaded, controlsRef }: ModelProps) => {
  const group = useRef<any>();
  const { scene, animations } = useGLTF(url);
  const { actions, names } = useAnimations(animations, group);

  useEffect(() => {
    if (onAnimationsLoaded && names.length > 0) {
      console.log("Available 3D Animations of Plank Model:", names);
      onAnimationsLoaded(names);
    }
  }, [names, onAnimationsLoaded]);

  // Track body movements for camera targeting
  useFrame(() => {
    if (!scene || !controlsRef?.current) return;
    const hips = scene.getObjectByName("mixamorig:Hips");
    if (hips) {
      const pos = new THREE.Vector3();
      hips.getWorldPosition(pos);
      // Smoothen or anchor look position on height with slight offset
      controlsRef.current.target.set(pos.x, pos.y + 0.3, pos.z);
    }
  });


  useEffect(() => {
    if (!scene) return;
    scene.traverse((node: any) => {
      if (node.isMesh) {
         const nameLower = node.name.toLowerCase();
         if (nameLower.includes("body") || nameLower.includes("mesh") || nameLower.includes("ch44")) {
            if (node.material && !nameLower.includes("helmet") && !nameLower.includes("visor")) {
               node.material.color = new THREE.Color("#0d0d0d");
               node.material.roughness = 0.5;
               if (node.material.map) node.material.map = null; // Remove skin texture map
            }
         }
      }
    });
  }, [scene]);

  useEffect(() => {
    if (!actions) return;

    const availableActions = Object.values(actions);
    if (isPlaying) {
      availableActions.forEach((action) => {
        if (action) action.reset().fadeIn(0.3).play();
      });
    } else {
      availableActions.forEach((action) => {
        if (action) action.paused = true;
      });
    }

    return () => {
      availableActions.forEach((action) => action?.fadeOut(0.3).stop());
    };
  }, [isPlaying, actions]);

  return <primitive ref={group} object={scene} scale={1.2} dispose={null} />;
};

interface ExerciseModelViewerProps {
  actionName?: string;
  onActionChange?: (action: string) => void;
  models?: string[];
}

export default function ExerciseModelViewer({ actionName, onActionChange, models = ["/meshcharacters/idle.glb"] }: ExerciseModelViewerProps) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [availableAnimations, setAvailableAnimations] = useState<string[]>([]);
  const [isIdle, setIsIdle] = useState(true);
  const controlsRef = useRef<any>();
  
  const modelUrl = models.length > 0 ? models[0] : "/meshcharacters/idle.glb";
  const isFloor = modelUrl.includes("pushup") || modelUrl.includes("plank") || modelUrl.includes("jumppushup");
  const targetY = isFloor ? 0.35 : 1.1;

  // Auto-focus camera on mode/model changes
  useEffect(() => {
    if (!controlsRef.current) return;
    const cam = controlsRef.current.object;
    if (isFloor) {
      cam.position.set(0, 1.0, 2.7); 
    } else {
      cam.position.set(0, 1.4, 2.9); 
    }
    controlsRef.current.target.set(0, targetY, 0);
    controlsRef.current.update();
  }, [modelUrl, isFloor, targetY]);

  const handleReset = () => {
    setIsPlaying(false);
    setTimeout(() => setIsPlaying(true), 50);
  };

  return (
    <div className="w-full h-full relative group/viewer bg-gradient-to-b from-[#F7FAFF] to-[#ECF3FF] rounded-3xl border border-[rgba(59,130,246,0.12)] shadow-sm overflow-hidden">
      {/* Background Radial Glow behind model */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
         <div className="w-[400px] h-[400px] rounded-full bg-blue-500/[0.08] blur-[80px] translate-y-12" />
      </div>
      <Suspense fallback={
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-900/40">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-xs text-muted-foreground mt-2">Loading interactive 3D model...</p>
        </div>
      }>
        <Canvas 
          shadows 
          camera={{ position: [0, 1.4, 3], fov: 45 }}
          onPointerDown={() => setIsIdle(false)}
          onPointerUp={() => setIsIdle(true)}
          className="w-full h-full"
        >
          {/* Transparent Canvas lets div background gradient display */}

          {/* Ambient Lighting */}
          <ambientLight intensity={0.4} />
          
          {/* Main sunlight direction cast shadows */}
          <directionalLight 
            position={[5, 10, 5]} 
            intensity={1.2} 
            castShadow 
            shadow-mapSize={[1024, 1024]}
          />
          
          {/* Soft backlighting / Rim light */}
          <directionalLight position={[-5, 5, -5]} intensity={0.6} />

          {/* Model Scene */}
          <group position={[0, isFloor ? 0.4 : 0.0, 0]}>
            <Model 
              key={modelUrl}
              url={modelUrl} 
              actionName={actionName} 
              isPlaying={isPlaying} 
              onAnimationsLoaded={setAvailableAnimations}
              controlsRef={controlsRef}
            />
            {/* Pedestal Floor Base Disc */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.015, 0]} receiveShadow>
               <circleGeometry args={[2.0, 64]} />
               <meshStandardMaterial 
                 color="#ffffff" 
                 opacity={0.5} 
                 transparent 
                 roughness={0.1}
                 metalness={0.1}
               />
            </mesh>

            {/* Stylized visible grid floor base */}
            <Grid 
              position={[0, -0.01, 0]} 
              args={[10.5, 10.5]} 
              cellSize={0.4} 
              cellThickness={0.5} 
              cellColor="#C7D8FF" 
              sectionSize={1.6} 
              sectionThickness={0.8} 
              sectionColor="#C7D8FF" 
              fadeDistance={8} 
              infiniteGrid
            />

            {/* Soft Contact Shadow layer on footer base grid */}
            <ContactShadows 
              position={[0, 0, 0]} 
              opacity={0.6} 
              scale={8} 
              blur={2.5} 
              far={1.5} 
            />
          </group>

          <Environment preset="city" />

          {/* Interactive view controls bounds limits */}
          <OrbitControls 
            ref={controlsRef}
            makeDefault 
            enableDamping 
            dampingFactor={0.05}
            minDistance={1.4}
            maxDistance={4}
            target={[0, targetY, 0]}
            maxPolarAngle={Math.PI / 2 + 0.1}
            autoRotate={false}
            autoRotateSpeed={0.5}
          />
        </Canvas>


      </Suspense>
    </div>
  );
}

// Preload to useGLTF cash buffer
useGLTF.preload("/physio_trainer.glb/plank.glb");
export { ExerciseModelViewer };
