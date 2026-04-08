import { motion } from "framer-motion";

interface SparklineChartProps {
  data: number[];
  color?: string;
  width?: number;
  height?: number;
}

const SparklineChart = ({ data, color = "hsl(217 91% 60%)", width = 80, height = 32 }: SparklineChartProps) => {
  if (!data.length) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  }).join(" ");

  const pathD = `M ${points.split(" ").join(" L ")}`;

  return (
    <svg width={width} height={height} className="overflow-visible">
      <motion.path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
      />
    </svg>
  );
};

export default SparklineChart;
