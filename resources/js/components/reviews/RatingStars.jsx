import { Star } from "lucide-react";

const sizeMap = {
  xs: "h-3 w-3",
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-6 w-6",
};

export default function RatingStars({
  value = 0,       // 0..5
  size = "sm",     // xs | sm | md | lg
  showValue = false,
  className = "",
}) {
  const rounded = Math.round(Number(value) || 0);
  const iconSize = sizeMap[size] || sizeMap.sm;

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {[1,2,3,4,5].map((i) => {
        const filled = i <= rounded;
        return (
          <Star
            key={i}
            className={`${iconSize} ${filled ? "text-yellow-500" : "text-muted-foreground/40"}`}
            fill={filled ? "currentColor" : "none"}
            strokeWidth={filled ? 0 : 2}
          />
        );
      })}
      {showValue && (
        <span className="text-xs text-muted-foreground ml-1">
          {Number(value).toFixed(1)}/5
        </span>
      )}
    </div>
  );
}
