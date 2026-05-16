import { motion } from "framer-motion";


interface Orb {
  id: number;
  x: string;
  y: string;
  size: number;
  duration: number;
  delay: number;
  color: string;
}

const orbs: Orb[] = [
  { id: 1, x: "15%", y: "20%", size: 400, duration: 22, delay: 0, color: "rgba(0, 212, 195, 0.06)" },
  { id: 2, x: "75%", y: "15%", size: 350, duration: 26, delay: 2, color: "rgba(0, 212, 195, 0.04)" },
  { id: 3, x: "50%", y: "60%", size: 500, duration: 30, delay: 4, color: "rgba(0, 212, 195, 0.05)" },
  { id: 4, x: "85%", y: "70%", size: 300, duration: 20, delay: 1, color: "rgba(0, 168, 155, 0.04)" },
  { id: 5, x: "25%", y: "80%", size: 350, duration: 24, delay: 3, color: "rgba(0, 212, 195, 0.03)" },
];


const GRID_COLS = 24;
const GRID_ROWS = 16;

export default function AnimatedBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      
      {orbs.map((orb) => (
        <motion.div
          key={orb.id}
          className="absolute rounded-full"
          style={{
            left: orb.x,
            top: orb.y,
            width: orb.size,
            height: orb.size,
            background: `radial-gradient(circle, ${orb.color} 0%, transparent 70%)`,
            filter: "blur(60px)",
          }}
          animate={{
            x: [0, 30, -20, 15, 0],
            y: [0, -25, 15, -10, 0],
            scale: [1, 1.08, 0.95, 1.04, 1],
          }}
          transition={{
            duration: orb.duration,
            repeat: Infinity,
            ease: "easeInOut",
            delay: orb.delay,
          }}
        />
      ))}

      
      <svg
        className="absolute inset-0 h-full w-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="grid-fade-v" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="white" stopOpacity="0" />
            <stop offset="30%" stopColor="white" stopOpacity="1" />
            <stop offset="70%" stopColor="white" stopOpacity="1" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="grid-fade-h" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="white" stopOpacity="0" />
            <stop offset="30%" stopColor="white" stopOpacity="1" />
            <stop offset="70%" stopColor="white" stopOpacity="1" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </linearGradient>
          <mask id="grid-mask">
            <rect width="100%" height="100%" fill="url(#grid-fade-v)" />
          </mask>
          <mask id="grid-mask-h">
            <rect width="100%" height="100%" fill="url(#grid-fade-h)" />
          </mask>
        </defs>

        
        <g mask="url(#grid-mask)">
          {Array.from({ length: GRID_COLS + 1 }).map((_, i) => (
            <line
              key={`v-${i}`}
              x1={`${(i / GRID_COLS) * 100}%`}
              y1="0"
              x2={`${(i / GRID_COLS) * 100}%`}
              y2="100%"
              stroke="rgba(0, 212, 195, 0.04)"
              strokeWidth="1"
            />
          ))}
        </g>

        
        <g mask="url(#grid-mask-h)">
          {Array.from({ length: GRID_ROWS + 1 }).map((_, i) => (
            <line
              key={`h-${i}`}
              x1="0"
              y1={`${(i / GRID_ROWS) * 100}%`}
              x2="100%"
              y2={`${(i / GRID_ROWS) * 100}%`}
              stroke="rgba(0, 212, 195, 0.04)"
              strokeWidth="1"
            />
          ))}
        </g>
      </svg>

      
      <motion.div
        className="absolute left-0 h-px w-full"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, rgba(0,212,195,0.15) 30%, rgba(0,212,195,0.3) 50%, rgba(0,212,195,0.15) 70%, transparent 100%)",
          boxShadow: "0 0 20px 2px rgba(0,212,195,0.1)",
        }}
        animate={{ top: ["0%", "100%"] }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "linear",
        }}
      />

      
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 40%, #050505 85%)",
        }}
      />
    </div>
  );
}
