type SurveyProgressProps = {
  currentStep: number;
  totalSteps: number;
};

export const SurveyProgress = ({ currentStep, totalSteps }: SurveyProgressProps) => {
  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm font-semibold text-slate-600">
        <span>
          Question {currentStep} of {totalSteps}
        </span>
        <span>{Math.round(progress)}%</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-white/80">
        <div className="h-full rounded-full bg-coast-700 transition-[width] duration-300 motion-reduce:transition-none" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
};
