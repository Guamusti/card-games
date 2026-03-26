"use client";

import React, { useState, useRef, useCallback } from "react";

interface SparklineChartProps {
  data: number[];
  height?: number;
}

export default function SparklineChart({
  data,
  height = 160,
}: SparklineChartProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  if (data.length < 2) return null;

  const padX = 0;
  const padTop = 8;
  const padBottom = 8;
  const viewW = 400;
  const viewH = height;
  const chartW = viewW - padX * 2;
  const chartH = viewH - padTop - padBottom;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const startVal = data[0];
  const endVal = data[data.length - 1];
  const displayVal = hoverIndex !== null ? data[hoverIndex] : endVal;
  const displayPL = displayVal - startVal;

  const isUp = displayVal >= startVal;
  const lineColor = isUp ? "var(--color-correct)" : "var(--color-accent)";

  function x(i: number) {
    return padX + (i / (data.length - 1)) * chartW;
  }
  function y(val: number) {
    return padTop + chartH - ((val - min) / range) * chartH;
  }

  // Build smooth bezier path
  const points = data.map((v, i) => ({ x: x(i), y: y(v) }));

  let pathD = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const cpx = (prev.x + curr.x) / 2;
    pathD += ` C ${cpx} ${prev.y}, ${cpx} ${curr.y}, ${curr.x} ${curr.y}`;
  }

  // Area fill path
  const areaD = pathD + ` L ${points[points.length - 1].x} ${viewH} L ${points[0].x} ${viewH} Z`;

  // Crosshair position
  const crossX = hoverIndex !== null ? x(hoverIndex) : null;
  const crossY = hoverIndex !== null ? y(data[hoverIndex]) : null;

  const gradientId = "pnl-grad";

  const handlePointerMove = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const relX = (e.clientX - rect.left) / rect.width;
    const idx = Math.round(relX * (data.length - 1));
    setHoverIndex(Math.max(0, Math.min(data.length - 1, idx)));
  }, [data.length]);

  const handlePointerLeave = useCallback(() => {
    setHoverIndex(null);
  }, []);

  const pctChange = startVal > 0
    ? ((displayPL / startVal) * 100).toFixed(1)
    : "0.0";

  return (
    <div className="flex flex-col gap-1">
      {/* Balance hero */}
      <div className="flex flex-col px-1">
        <span className="text-2xl sm:text-3xl font-semibold tabular-nums tracking-tight">
          ${displayVal.toLocaleString()}
        </span>
        <div className="flex items-center gap-2 mt-0.5">
          <span
            className={`text-sm sm:text-base font-medium tabular-nums ${isUp ? "text-correct" : "text-accent"}`}
          >
            {displayPL >= 0 ? "+" : ""}${displayPL.toLocaleString()}
          </span>
          <span
            className={`text-xs px-1.5 py-0.5 rounded-full font-medium tabular-nums ${
              isUp ? "bg-correct/10 text-correct" : "bg-accent/10 text-accent"
            }`}
          >
            {displayPL >= 0 ? "+" : ""}{pctChange}%
          </span>
          {hoverIndex !== null && (
            <span className="text-[10px] text-muted">
              Hand #{hoverIndex + 1}
            </span>
          )}
        </div>
      </div>

      {/* Chart */}
      <svg
        ref={svgRef}
        viewBox={`0 0 ${viewW} ${viewH}`}
        width="100%"
        height={height}
        preserveAspectRatio="none"
        style={{ display: "block", touchAction: "none" }}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={lineColor} stopOpacity={0.20} />
            <stop offset="70%" stopColor={lineColor} stopOpacity={0.05} />
            <stop offset="100%" stopColor={lineColor} stopOpacity={0} />
          </linearGradient>
        </defs>

        {/* Area fill */}
        <path d={areaD} fill={`url(#${gradientId})`} />

        {/* Main line */}
        <path
          d={pathD}
          fill="none"
          stroke={lineColor}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />

        {/* Hover crosshair */}
        {crossX !== null && crossY !== null && (
          <>
            {/* Vertical line */}
            <line
              x1={crossX}
              y1={padTop}
              x2={crossX}
              y2={viewH - padBottom}
              stroke="var(--color-muted)"
              strokeWidth={0.8}
              strokeDasharray="3 2"
              opacity={0.5}
              vectorEffect="non-scaling-stroke"
            />
            {/* Dot */}
            <circle
              cx={crossX}
              cy={crossY}
              r={4}
              fill={lineColor}
              stroke="var(--color-background)"
              strokeWidth={2}
              vectorEffect="non-scaling-stroke"
            />
          </>
        )}

        {/* End dot (when not hovering) */}
        {hoverIndex === null && (
          <>
            <circle
              cx={points[points.length - 1].x}
              cy={points[points.length - 1].y}
              r={3}
              fill={lineColor}
              stroke="var(--color-background)"
              strokeWidth={1.5}
              vectorEffect="non-scaling-stroke"
            />
            {/* Pulse ring */}
            <circle
              cx={points[points.length - 1].x}
              cy={points[points.length - 1].y}
              r={6}
              fill="none"
              stroke={lineColor}
              strokeWidth={1}
              opacity={0.3}
              vectorEffect="non-scaling-stroke"
            >
              <animate attributeName="r" from="4" to="10" dur="2s" repeatCount="indefinite" />
              <animate attributeName="opacity" from="0.4" to="0" dur="2s" repeatCount="indefinite" />
            </circle>
          </>
        )}
      </svg>
    </div>
  );
}
