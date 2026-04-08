export interface Exercise {
  id: string;
  name: string;
  category: "Strength" | "Shoulder" | "Core / Back" | "Neck" | "Yoga";
  difficulty: "Beginner" | "Intermediate";
  description: string;
  steps: string[];
  reps: string;
  sets: string;
  image: string;
  duration?: string;
  targetMuscles: string[];
  objectPosition?: string;
}

export const exercises: Exercise[] = [
  // Neck
  { 
    id: "neck_rotation", 
    name: "Neck Rotation", 
    category: "Neck", 
    difficulty: "Beginner", 
    description: "Slowly rotate your head from side to side to improve cervical mobility.", 
    steps: ["Sit or stand tall", "Turn your head slowly to the right", "Hold briefly, then return to center", "Turn your head slowly to the left"], 
    reps: "10 per side", sets: "2", 
    image: "/assets/exercises/neck_rotation.png", 
    duration: "4 min", 
    targetMuscles: ["Sternocleidomastoid", "Scalenes"],
    objectPosition: "center 15%"
  },
  { 
    id: "neck_tilt", 
    name: "Neck Tilt", 
    category: "Neck", 
    difficulty: "Beginner", 
    description: "Tilt your ear toward your shoulder to stretch the lateral neck muscles.", 
    steps: ["Keep shoulders relaxed and level", "Lower right ear toward right shoulder", "Hold for 5 seconds", "Repeat for the left side"], 
    reps: "8 per side", sets: "2", 
    image: "/assets/exercises/neck_tilt.png", 
    duration: "5 min", 
    targetMuscles: ["Scalenes", "Trapezius"],
    objectPosition: "center 15%"
  },

  // Strength
  { 
    id: "squats", 
    name: "Squats", 
    category: "Strength", 
    difficulty: "Beginner", 
    description: "Lower your hips from a standing position and then stand back up.", 
    steps: ["Stand with feet shoulder-width apart", "Lower hips as if sitting in a chair", "Keep back straight and chest up", "Push through heels to return to start"], 
    reps: "12", sets: "3", 
    image: "/assets/exercises/squat.png", 
    duration: "5 min", 
    targetMuscles: ["Quadriceps", "Glutes", "Hamstrings"],
    objectPosition: "center 25%"
  },
  { 
    id: "pushups", 
    name: "Push-ups", 
    category: "Strength", 
    difficulty: "Intermediate", 
    description: "A classic upper body exercise performed by lowering and raising the body using the arms.", 
    steps: ["Place hands slightly wider than shoulders", "Keep body in a straight line from head to heels", "Lower chest toward the floor", "Push back up to starting position"], 
    reps: "10", sets: "3", 
    image: "/assets/exercises/pushup.png", 
    duration: "6 min", 
    targetMuscles: ["Chest", "Triceps", "Shoulders"],
    objectPosition: "center 75%"
  },
  { 
    id: "lunges", 
    name: "Lunges", 
    category: "Strength", 
    difficulty: "Beginner", 
    description: "Step forward with one leg while lowering your hips.", 
    steps: ["Step forward with one leg", "Lower hips until both knees are bent at 90 degrees", "Keep front knee aligned with ankle", "Push back to starting position"], 
    reps: "10 per leg", sets: "3", 
    image: "https://images.unsplash.com/photo-1601422407692-ec4eeec1d9b3?w=800&q=80", 
    duration: "7 min", 
    targetMuscles: ["Quads", "Glutes", "Hamstrings"] 
  },
  { 
    id: "plank", 
    name: "Plank", 
    category: "Strength", 
    difficulty: "Intermediate", 
    description: "Hold a position similar to a push-up for the maximum possible time.", 
    steps: ["Place forearms on the floor, elbows under shoulders", "Keep body in a straight line", "Engage core and glutes", "Hold position without dropping hips"], 
    reps: "45 sec", sets: "3", 
    image: "https://images.unsplash.com/photo-1566241440091-ec10de8db2e1?w=800&q=80", 
    duration: "5 min", 
    targetMuscles: ["Core", "Shoulders", "Glutes"] 
  },
  { 
    id: "glute_bridge", 
    name: "Glute Bridge", 
    category: "Strength", 
    difficulty: "Beginner", 
    description: "Lying on your back and lifting your hips toward the ceiling.", 
    steps: ["Lie on back with knees bent and feet flat", "Lift hips toward the ceiling", "Squeeze glutes at the top", "Lower back down slowly"], 
    reps: "15", sets: "3", 
    image: "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&q=80", 
    duration: "5 min", 
    targetMuscles: ["Glutes", "Lower Back", "Hamstrings"] 
  },

  // Shoulder
  { 
    id: "shoulder_press", 
    name: "Shoulder Press", 
    category: "Shoulder", 
    difficulty: "Intermediate", 
    description: "Lift weights overhead to strengthen the shoulders.", 
    steps: ["Hold weights at shoulder level", "Press weights upward until arms are straight", "Keep core engaged and back straight", "Lower slowly to shoulder level"], 
    reps: "12", sets: "3", 
    image: "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=800&q=80", 
    duration: "6 min", 
    targetMuscles: ["Deltoids", "Triceps", "Upper Back"] 
  },
  { 
    id: "lateral_raises", 
    name: "Lateral Raises", 
    category: "Shoulder", 
    difficulty: "Beginner", 
    description: "Raise arms out to the sides to target the lateral deltoids.", 
    steps: ["Stand with weights at your sides", "Raise arms out to the side until shoulder level", "Keep a slight bend in elbows", "Lower down slowly"], 
    reps: "12", sets: "3", 
    image: "https://images.unsplash.com/photo-1610423081191-2ca42bbcd4e9?w=800&q=80", 
    duration: "5 min", 
    targetMuscles: ["Lateral Deltoid", "Trapezius"] 
  },
  { 
    id: "arm_circles", 
    name: "Arm Circles", 
    category: "Shoulder", 
    difficulty: "Beginner", 
    description: "Move your arms in small circular motions to improve mobility.", 
    steps: ["Extend arms out to the sides", "Make small circular motions", "Keep shoulders relaxed", "Reverse direction after 30 seconds"], 
    reps: "60 sec", sets: "2", 
    image: "https://images.unsplash.com/photo-1562771242-a02d9090c90c?w=800&q=80", 
    duration: "4 min", 
    targetMuscles: ["Deltoids", "Rotator Cuff"] 
  },

  // Core / Back
  { 
    id: "bird_dog", 
    name: "Bird-Dog", 
    category: "Core / Back", 
    difficulty: "Beginner", 
    description: "Extend opposite arm and leg while on all fours for stability.", 
    steps: ["Start on all fours", "Extend opposite arm and leg simultaneously", "Keep hips square to the floor", "Switch sides after each rep"], 
    reps: "10 per side", sets: "3", 
    image: "https://images.unsplash.com/photo-1510894347713-fc3ed6fdf539?w=800&q=80", 
    duration: "6 min", 
    targetMuscles: ["Lower Back", "Core", "Glutes"] 
  },
  { 
    id: "cat_cow", 
    name: "Cat-Cow", 
    category: "Core / Back", 
    difficulty: "Beginner", 
    description: "Flow between arching and rounding your spine to release tension.", 
    steps: ["Start on all fours", "Inhale, drop belly, look up (Cow)", "Exhale, round back, look down (Cat)", "Repeat smoothly with breath"], 
    reps: "10", sets: "2", 
    image: "https://images.unsplash.com/photo-1599447421416-3414500d18a5?w=800&q=80", 
    duration: "5 min", 
    targetMuscles: ["Entire Spine", "Core"] 
  },
  { 
    id: "superman_hold", 
    name: "Superman Hold", 
    category: "Core / Back", 
    difficulty: "Intermediate", 
    description: "Lie face down and lift your limbs to strengthen the back.", 
    steps: ["Lie face down with arms and legs extended", "Lift arms, chest, and legs off the floor", "Squeeze lower back and glutes", "Hold briefly and lower slowly"], 
    reps: "10", sets: "3", 
    image: "https://images.unsplash.com/photo-1441924424398-3fec8ecdd774?w=800&q=80", 
    duration: "5 min", 
    targetMuscles: ["Lower Back", "Glutes", "Shoulders"] 
  },

  // Yoga
  { 
    id: "tadasana", 
    name: "Tadasana", 
    category: "Yoga", 
    difficulty: "Beginner", 
    description: "Mountain pose: stand tall with focus and balance.", 
    steps: ["Stand with feet together, weight even", "Engage quads and lift kneecaps", "Lengthen tailbone toward the floor", "Broaden collarbones, let arms hang"], 
    reps: "60 sec", sets: "2", 
    image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&q=80", 
    duration: "5 min", 
    targetMuscles: ["Postural Stabilizers", "Core"] 
  },
  { 
    id: "tree_pose", 
    name: "Tree Pose", 
    category: "Yoga", 
    difficulty: "Beginner", 
    description: "A balancing pose that strengthens the legs and core.", 
    steps: ["Stand on one leg", "Place other foot on inner thigh (avoid knee)", "Press foot into thigh and thigh into foot", "Hands at heart or overhead"], 
    reps: "30 sec per side", sets: "2", 
    image: "https://images.unsplash.com/photo-1575052814086-f385e2e2ad33?w=800&q=80", 
    duration: "6 min", 
    targetMuscles: ["Ankle", "Core", "Hip Abductors"] 
  },
  { 
    id: "warrior_i", 
    name: "Warrior I", 
    category: "Yoga", 
    difficulty: "Intermediate", 
    description: "A powerful standing pose that builds strength and focus.", 
    steps: ["Step one foot back, 45-degree angle", "Keep front knee bent at 90 degrees", "Hips squared forward", "Reach arms overhead, look up"], 
    reps: "30 sec per side", sets: "3", 
    image: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&q=80", 
    duration: "8 min", 
    targetMuscles: ["Quads", "Shoulders", "Psoas"] 
  },
  { 
    id: "downward_dog", 
    name: "Downward Dog", 
    category: "Yoga", 
    difficulty: "Beginner", 
    description: "An inverted V-pose that stretches the entire back body.", 
    steps: ["Start on hands and knees", "Lift hips high toward the ceiling", "Press heels toward the floor", "Keep fingers spread and spine long"], 
    reps: "45 sec", sets: "3", 
    image: "https://images.unsplash.com/photo-1588282322643-473605441d13?w=800&q=80", 
    duration: "6 min", 
    targetMuscles: ["Hamstrings", "Calves", "Shoulders"] 
  },
];
