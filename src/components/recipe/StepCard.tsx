interface StepCardProps {
  stepNumber: number;
  text: string;
  className?: string;
}

export function StepCard({ stepNumber, text, className = "" }: StepCardProps) {
  return (
    <div
      className={`flex gap-4 p-4 bg-surface-2 rounded-xl ${className}`}
    >
      {/* Step number badge */}
      <div className="flex-shrink-0">
        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold">
          {stepNumber}
        </div>
      </div>

      {/* Step text */}
      <div className="flex-1 min-w-0 pt-1">
        <p className="text-foreground leading-relaxed">{text}</p>
      </div>
    </div>
  );
}
