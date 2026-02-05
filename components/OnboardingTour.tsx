import React, { useState, useEffect } from 'react';

const STEPS = [
  {
    target: 'header',
    title: 'Willkommen beim SaaSStack!',
    content: 'Hier behältst du den Überblick über alle Software-Lizenzen deines Teams.',
    position: 'bottom',
  },
  {
    target: 'add-button',
    title: 'Neues Tool hinzufügen',
    content:
      'Klicke hier, um eine neue Lizenz zu registrieren. Tipp: Nutze den KI-Vorschlag oder lade ein Foto der Rechnung hoch!',
    position: 'bottom-left',
  },
  {
    target: 'search-filter',
    title: 'Suchen & Filtern',
    content:
      'Finde Tools blitzschnell via Suche oder filtere nach Inhaber und Kategorie. Nutze CMD+K zum Suchen!',
    position: 'top',
  },
  {
    target: 'analytics',
    title: 'Analytics & Trends',
    content: 'Verstehe deine Ausgaben und sieh die Kostenentwicklung der nächsten 12 Monate.',
    position: 'top',
  },
];

export const OnboardingTour: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(-1);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    // Check if tour has been seen before
    const tourSeen = localStorage.getItem('saas-tracker-onboarding-seen');
    console.log('Onboarding check:', tourSeen ? 'Already seen' : 'First time - will show tour');

    if (!tourSeen) {
      setTimeout(() => setCurrentStep(0), 1000);
    }
  }, []);

  useEffect(() => {
    if (currentStep === -1) return;

    const updateRect = () => {
      const step = STEPS[currentStep];
      if (!step) return;
      const el = document.getElementById(step.target);
      if (el) {
        setTargetRect(el.getBoundingClientRect());
      }
    };

    // Initial scroll and update
    const step = STEPS[currentStep];
    const el = document.getElementById(step?.target);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // We need to wait a bit for the scroll to start/finish,
      // but the scroll listener will handle the intermediate frames.
      updateRect();
    }

    window.addEventListener('scroll', updateRect, { passive: true });
    window.addEventListener('resize', updateRect);

    // Also periodically check for a few seconds in case of layout shifts
    const interval = setInterval(updateRect, 100);

    return () => {
      window.removeEventListener('scroll', updateRect);
      window.removeEventListener('resize', updateRect);
      clearInterval(interval);
    };
  }, [currentStep]);

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = () => {
    setCurrentStep(-1);
    localStorage.setItem('saas-tracker-onboarding-seen', 'true');
    console.log('Onboarding tour completed and saved to localStorage');
  };

  if (currentStep === -1 || !targetRect) return null;

  const step = STEPS[currentStep];

  return (
    <div className="pointer-events-none fixed inset-0 z-[100]">
      {/* Dimmed Background */}
      <div className="absolute inset-0 bg-k5-deepBlue/40 backdrop-blur-[2px]" />

      {/* Spotlight */}
      <div
        className="absolute rounded-2xl shadow-[0_0_0_9999px_rgba(5,35,100,0.6)] transition-all duration-300"
        style={{
          top: targetRect.top - 8,
          left: targetRect.left - 8,
          width: targetRect.width + 16,
          height: targetRect.height + 16,
          pointerEvents: 'auto',
        }}
      />

      {/* Tooltip */}
      <div
        className="pointer-events-auto absolute w-80 rounded-3xl border border-k5-digitalBlue/20 bg-white p-6 shadow-2xl transition-all duration-300 dark:bg-k5-deepBlue"
        style={{
          top: step.position.includes('bottom') ? targetRect.bottom + 24 : targetRect.top - 220,
          left: step.position.includes('left')
            ? targetRect.left - 200
            : targetRect.left + targetRect.width / 2 - 160,
        }}
      >
        <div className="mb-4 flex items-start justify-between">
          <span className="text-[10px] font-black uppercase tracking-widest text-k5-digitalBlue">
            Step {currentStep + 1} of {STEPS.length}
          </span>
          <button
            onClick={handleComplete}
            className="text-xs font-bold text-k5-sand transition-all hover:text-k5-deepBlue dark:hover:text-white"
          >
            Überspringen
          </button>
        </div>
        <h4 className="mb-2 text-lg font-black text-k5-deepBlue dark:text-white">{step.title}</h4>
        <p className="mb-6 text-sm font-medium leading-relaxed text-k5-sand dark:text-k5-sand/80">
          {step.content}
        </p>

        <button
          onClick={handleNext}
          className="w-full rounded-xl bg-k5-digitalBlue py-3 text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-k5-digitalBlue/20 transition-all hover:brightness-110"
        >
          {currentStep === STEPS.length - 1 ? 'Tour beenden' : 'Weiter'}
        </button>
      </div>
    </div>
  );
};
