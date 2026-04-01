'use client';

import { cn } from '@/lib/utils';

interface ScoreGaugeProps {
  score: number;
  size?: number;
  label?: string;
  className?: string;
}

export function ScoreGauge({ score, size = 120, label, className }: ScoreGaugeProps) {
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const scoreColor =
    score >= 80
      ? 'var(--color-success)'
      : score >= 50
        ? 'var(--color-warning)'
        : 'var(--color-destructive)';

  return (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-glass-border)"
          strokeWidth={8}
        />
        {/* Score arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={scoreColor}
          strokeWidth={8}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      {/* Score number in center */}
      <div
        className="absolute inset-0 flex items-center justify-center"
      >
        <span
          className="font-bold"
          style={{ fontSize: size * 0.28, color: scoreColor }}
        >
          {score}
        </span>
      </div>
      </div>
      {label && (
        <span className="text-xs font-medium text-text-secondary text-center">
          {label}
        </span>
      )}
    </div>
  );
}
