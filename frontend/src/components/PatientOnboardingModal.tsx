'use client';

import { useState, useEffect } from 'react';
import { CheckCircle2, Clock, Scan, Pill, ChevronRight, X } from 'lucide-react';

interface OnboardingStep {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  completed: boolean;
}

interface PatientOnboardingModalProps {
  isOpen: boolean;
  onComplete: () => void;
  onClose?: () => void;
  onboardingSteps?: {
    abha_verified?: boolean;
    routing_understood?: boolean;
    checkin_learned?: boolean;
    prescription_viewed?: boolean;
  };
}

export function PatientOnboardingModal({
  isOpen,
  onComplete,
  onClose,
  onboardingSteps = {}
}: PatientOnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState<OnboardingStep[]>([]);

  useEffect(() => {
    setSteps([
      {
        id: 1,
        title: 'Verify ABHA ID',
        description: 'Provide your government ABHA details to securely import your clinical history and start.',
        icon: <CheckCircle2 className="w-8 h-8 text-emerald-400" />,
        completed: onboardingSteps?.abha_verified || false
      },
      {
        id: 2,
        title: 'Smart Routing',
        description: 'Our AI engine forecasts queues and alerts you of transit/OPD delay spikes before you travel.',
        icon: <Clock className="w-8 h-8 text-cyan-400" />,
        completed: onboardingSteps?.routing_understood || false
      },
      {
        id: 3,
        title: 'Digital Check-in',
        description: 'Scan the counter barcode to automatically register with the triage nurse. No queues.',
        icon: <Scan className="w-8 h-8 text-blue-400" />,
        completed: onboardingSteps?.checkin_learned || false
      },
      {
        id: 4,
        title: 'Instant Prescription',
        description: 'View prescriptions on your mobile, pick up drugs, and head home comfortably.',
        icon: <Pill className="w-8 h-8 text-rose-400" />,
        completed: onboardingSteps?.prescription_viewed || false
      }
    ]);
  }, [onboardingSteps]);

  if (!isOpen || steps.length === 0) return null;

  const allCompleted = steps.every(step => step.completed);
  const currentStepData = steps[currentStep];

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget && onClose) onClose(); }}
    >
      <div className="bg-slate-900/95 border border-white/10 rounded-3xl max-w-2xl w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border-b border-white/10 px-8 py-6 relative">
          <h2 className="text-2xl font-bold text-white mb-2">Welcome to ArogyaMitra</h2>
          <p className="text-slate-300 text-sm">Complete these 4 simple steps to unlock all features</p>
          {onClose && (
            <button
              onClick={onClose}
              aria-label="Close onboarding"
              className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Progress Steps */}
        <div className="grid grid-cols-4 gap-2 px-8 py-4">
          {steps.map((step, idx) => (
            <button
              key={step.id}
              onClick={() => setCurrentStep(idx)}
              className={`relative p-3 rounded-xl border transition-all text-center ${
                idx <= currentStep
                  ? 'border-cyan-500/50 bg-cyan-500/10'
                  : 'border-white/10 bg-slate-800/50'
              }`}
            >
              <div className="text-xs font-bold mb-1">Step {step.id}</div>
              <div className="text-[10px] text-slate-400 line-clamp-1">{step.title}</div>
              {step.completed && (
                <div className="absolute top-1 right-1 w-3 h-3 bg-emerald-400 rounded-full" />
              )}
            </button>
          ))}
        </div>

        {/* Current Step Content */}
        <div className="px-8 py-8">
          <div className="flex items-start gap-6">
            <div className="p-4 rounded-2xl bg-slate-800/50 border border-white/5">
              {currentStepData.icon}
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-white mb-2">
                {currentStepData.id}. {currentStepData.title}
              </h3>
              <p className="text-slate-300 text-sm leading-relaxed mb-4">
                {currentStepData.description}
              </p>
              {currentStepData.completed && (
                <div className="flex items-center gap-2 text-emerald-400 text-sm font-semibold">
                  <CheckCircle2 className="w-4 h-4" />
                  Completed
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-8 pt-6 border-t border-white/5">
            <button
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
              className="px-4 py-2 text-sm font-bold text-slate-300 border border-white/10 rounded-lg hover:border-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Back
            </button>

            {!allCompleted ? (
              <button
                onClick={() => {
                  if (currentStep < steps.length - 1) {
                    setCurrentStep(currentStep + 1);
                  }
                }}
                className="flex-1 px-4 py-2 text-sm font-bold text-slate-900 bg-cyan-500 hover:bg-cyan-400 rounded-lg transition-all flex items-center justify-center gap-2"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={onComplete}
                className="flex-1 px-4 py-2 text-sm font-bold text-slate-900 bg-emerald-500 hover:bg-emerald-400 rounded-lg transition-all flex items-center justify-center gap-2"
              >
                Complete Setup <CheckCircle2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Step Indicators */}
        <div className="px-8 py-3 bg-slate-800/30 border-t border-white/5 flex gap-2">
          {steps.map((step, idx) => (
            <div key={step.id} className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${
                  idx <= currentStep ? 'bg-cyan-500' : 'bg-transparent'
                }`}
                style={{ width: idx < currentStep ? '100%' : idx === currentStep ? '50%' : '0%' }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Active: 2026-07-04

// --------------------------------------------------
// NOTE: Optimized for high-throughput public hospital workloads.
// TODO: Verify dynamic scaling constraints under peak queue loads.
// --------------------------------------------------
