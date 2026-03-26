"use client";

import React from "react";

interface SparklineChartProps {
  data: number[];
  width?: number | string;
  height?: number;
  color?: string;
}

export default function SparklineChart({
  data,
  width = "100%",
  height = 120,
  color,
}: SparklineChartProps) {
  if (data.length < 2) return null;

  const padX = 36;
  const padTop = 14;
  const padBottom = 14;
  const viewW = 300;
  const viewH = height;
  const chartW = viewW - padX * 2;
  const chartH = viewH - padTop - padBottom;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const startVal = data[0];
  const endVal = data[data.length - 1];

  const isUp = endVal >= startVal;
  const lineColor = color || (isUp ? "var(--color-correct)" : "var(--color-accent)");

  function x(i: number) {
    return padX + (i / (data.length - 1)) * chartW;
  }
  function y(val: number) {
    return padTop + chartH - ((val - min) / range) * chartH;
  }

  // Build smooth path using cardinal spline approximation
  const points = data.map((v, i) => ({ x: x(i), y: y(v) }));

  let pathD = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const cpx = (prev.x + curr.x) / 2;
    pathD += ` C ${cpx} ${prev.y}, ${cpx} ${curr.y}, ${curr.x} ${curr.y}`;
  }

  // Area fill path (line + close to bottom)
  const areaD = pathD + ` L ${points[points.length - 1].x} ${viewH - padBottom} L ${points[0].x} ${viewH - padBottom} Z`;

  // Baseline
  const baseY = y(startVal);

  // Min/max label positions
  const minIdx = data.indexOf(min);
  const maxIdx = data.indexOf(max);

  const gradientId = "sparkline-gradient-" + Math.random().toString(36).slice(2, 8);

  return (
    <svg
      viewBox={`0 0 ${viewW} ${viewH}`}
      width={width}
      height={height}
      preserveAspectRatio="xMidYMid meet"
      style={{ display: "block" }}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={lineColor} stopOpacity={0.25} />
          <stop offset="100%" stopColor={lineColor} stopOpacity={0.02} />
        </linearGradient>
      </defs>

      {/* Area fill */}
      <path d={areaD} fill={`url(#${gradientId})`} />

      {/* Baseline dashed line */}
      <line
        x1={padX}
        y1={baseY}
        x2={viewW - padX}
        y2={baseY}
        stroke="var(--color-muted)"
        strokeWidth={0.5}
        strokeDasharray="4 3"
        opacity={0.5}
      />

      {/* Line */}
      <path d={pathD} fill="none" stroke={lineColor} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />

      {/* End dot */}
      <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r={2.5} fill={lineColor} />

      {/* Min label */}
      {min !== max && (
        <text
          x={x(minIdx)}
          y={y(min) + 11}
          textAnchor="middle"
          fill="var(--color-accent)"
          fontSize={8}
          fontFamily="Inter, sans-serif"
          fontWeight={600}
        >
          ${min.toLocaleString()}
        </text>
      )}

      {/* Max label */}
      {min !== max && (
        <text
          x={x(maxIdx)}
          y={y(max) - 4}
          textAnchor="middle"
          fill="var(--color-correct)"
          fontSize={8}
          fontFamily="Inter, sans-serif"
          fontWeight={600}
        >
          ${max.toLocaleString()}
        </text>
      )}
    </svg>
  );
}
