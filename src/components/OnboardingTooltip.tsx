"use client";
import { useState, useEffect } from "react";
import { X, ChevronRight } from "lucide-react";

const ONBOARDING_STEPS = [
  {
    title: "Connect the Numbers",
    content:
      "Tap and drag to draw a path connecting the numbered dots in order (1 → 2 → 3 → …).",
    target: "grid",
  },
  {
    title: "Fill Every Cell",
    content:
      "The path must visit every cell in the grid exactly once. No skipping or revisiting cells.",
    target: "grid",
  },
  {
    title: "Use Undo & Hint",
    content: "Use Undo to step back, and Hint to see the game rules anytime.",
    target: "controls",
  },
];

interface OnboardingTooltipProps {
  isVisible: boolean;
  onComplete: () => void;
}

export function OnboardingTooltip({
  isVisible,
  onComplete,
}: OnboardingTooltipProps) {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (isVisible) {
      setCurrentStep(0);
    }
  }, [isVisible]);

  if (!isVisible) return null;

  const step = ONBOARDING_STEPS[currentStep];
  const isLastStep = currentStep === ONBOARDING_STEPS.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-neutral-800 border border-neutral-700 p-6 rounded-2xl max-w-sm mx-4 shadow-lg">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xl font-bold text-white">{step.title}</h3>
          <button
            onClick={handleSkip}
            className="text-neutral-400 hover:text-white transition-colors"
            aria-label="Skip onboarding"
          >
            <X size={20} />
          </button>
        </div>
        <p className="text-neutral-300 mb-6">{step.content}</p>
        <div className="flex justify-between items-center">
          <div className="flex gap-1">
            {ONBOARDING_STEPS.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full ${
                  index === currentStep ? "bg-blue-500" : "bg-neutral-600"
                }`}
              />
            ))}
          </div>
          <button
            onClick={handleNext}
            className="px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors flex items-center gap-2"
          >
            {isLastStep ? "Got it!" : "Next"}
            {!isLastStep && <ChevronRight size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
}
