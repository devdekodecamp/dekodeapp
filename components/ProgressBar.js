"use client";

export default function ProgressBar({ progress = 0, total = 6 }) {
  const percentage = Math.round((progress / total) * 100);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-gray-700">Progress</span>
        <span className="text-sm font-semibold text-indigo-600">
          {progress} / {total} weeks ({percentage}%)
        </span>
      </div>
      <div
        className="flex items-center w-full relative"
        style={{ height: "56px" }}
      >
        {Array.from({ length: total }, (_, index) => {
          const isCompleted = index < progress;
          const chevronSize = 20; // Width of the arrow point
          const isFirst = index === 0;
          const isLast = index === total - 1;
          const w = 200; // Viewbox width
          const h = 56; // Viewbox height
          const r = 28; // Radius for the outer ends

          // PATH LOGIC:
          // M = Move to, L = Line to, A = Arc (for rounding)
          let path = "";

          if (isFirst) {
            // Left side is rounded, Right side is a protruding arrow
            path = `M ${r} 0 
                    L ${w - chevronSize} 0 
                    L ${w} ${h / 2} 
                    L ${w - chevronSize} ${h} 
                    L ${r} ${h} 
                    A ${r} ${r} 0 0 1 ${r} 0 Z`;
          } else if (isLast) {
            // Left side is an indent, Right side is rounded
            path = `M 0 0 
                    L ${w - r} 0 
                    A ${r} ${r} 0 0 1 ${w - r} ${h} 
                    L 0 ${h} 
                    L ${chevronSize} ${h / 2} Z`;
          } else {
            // Left side is an indent, Right side is a protruding arrow
            path = `M 0 0 
                    L ${w - chevronSize} 0 
                    L ${w} ${h / 2} 
                    L ${w - chevronSize} ${h} 
                    L 0 ${h} 
                    L ${chevronSize} ${h / 2} Z`;
          }

          return (
            <div
              key={index}
              className="relative flex-1"
              style={{
                marginLeft: index > 0 ? `-${chevronSize}px` : "0",
                zIndex: total - index, // Ensures the arrow point overlaps the next segment
              }}
            >
              <svg
                className="w-full h-full"
                viewBox={`0 0 ${w} ${h}`}
                preserveAspectRatio="none"
                style={{ height: "56px", display: "block" }}
              >
                <defs>
                  <linearGradient
                    id={`progressGradient-${index}`}
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="0%"
                  >
                    <stop offset="0%" stopColor="#e01414" />
                    <stop offset="50%" stopColor="#760da3" />
                    <stop offset="100%" stopColor="#008cff" />
                  </linearGradient>
                </defs>
                {/* Chevron path */}
                <path
                  d={path}
                  fill={
                    isCompleted ? `url(#progressGradient-${index})` : "#f3f4f6"
                  }
                  stroke={isCompleted ? "none" : "#d1d5db"}
                  strokeWidth="1"
                  className="transition-all duration-500"
                />
                {/* Checkmark for completed */}
                {isCompleted && (
                  <>
                    <circle
                      cx="100"
                      cy="28"
                      r="12"
                      fill="rgba(255,255,255,0.2)"
                    />
                    <path
                      d="M 92 28 L 98 34 L 108 22"
                      stroke="white"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      fill="none"
                    />
                  </>
                )}
                {/* Week number for incomplete */}
                {!isCompleted && (
                  <text
                    x="100"
                    y="32"
                    textAnchor="middle"
                    className="text-sm font-medium fill-gray-700"
                    style={{ fontSize: "14px" }}
                  >
                    Week {index + 1}
                  </text>
                )}
              </svg>
            </div>
          );
        })}
      </div>
    </div>
  );
}
