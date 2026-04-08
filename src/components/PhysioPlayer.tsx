import { useEffect } from "react"
import * as THREE from "three"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"

export default function PhysioPlayer(){

  useEffect(()=>{

    let mixer
    let actions = {}

    const scene = new THREE.Scene()
    scene.background = new THREE.Color("#f5f5f5")

    const container = document.getElementById("physio")
    if (!container) return;

    const camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 1000)
    camera.position.set(0, 1.6, 3)

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(container.clientWidth, container.clientHeight)
    container.appendChild(renderer.domElement)

    const controls = new OrbitControls(camera, renderer.domElement)

    const resizeObserver = new ResizeObserver(() => {
      const { clientWidth, clientHeight } = container;
      renderer.setSize(clientWidth, clientHeight);
      camera.aspect = clientWidth / clientHeight;
      camera.updateProjectionMatrix();
    });
    resizeObserver.observe(container);

    const light = new THREE.HemisphereLight(0xffffff,0x444444,1)
    scene.add(light)

    const loader = new GLTFLoader()

    loader.load("/physio_trainer.glb/stretch.glb",(gltf)=>{

      const model = gltf.scene
      scene.add(model)

      mixer = new THREE.AnimationMixer(model)

      gltf.animations.forEach((clip)=>{
        console.log("Animation Available:", clip.name)
        actions[clip.name] = mixer.clipAction(clip)
      })

      const first = Object.keys(actions)[0]
      if (first) {
        actions[first].play()
      }

      window.playExercise = function(name){
        for(let key in actions){
          actions[key].stop()
        }
        if (actions[name]) {
          actions[name].reset().play()
        } else {
          console.warn("Animation not found:", name)
        }
      }

    })

    const clock = new THREE.Clock()

    let animationId
    function animate(){
      animationId = requestAnimationFrame(animate)

      if(mixer){
        mixer.update(clock.getDelta())
      }

      renderer.render(scene,camera)
    }

    animate()

    return () => {
      cancelAnimationFrame(animationId)
      if (typeof resizeObserver !== 'undefined') resizeObserver.disconnect()
      const el = document.getElementById("physio")
      if (el && renderer.domElement) {
        el.removeChild(renderer.domElement)
      }
      renderer.dispose()
    }

  },[])

  return <div id="physio" className="w-full h-full" />
}