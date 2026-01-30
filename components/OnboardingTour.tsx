
import React, { useState, useEffect } from 'react';

const STEPS = [
    {
        target: 'header',
        title: 'Willkommen beim SaaSStack!',
        content: 'Hier behältst du den Überblick über alle Software-Lizenzen deines Teams.',
        position: 'bottom'
    },
    {
        target: 'add-button',
        title: 'Neues Tool hinzufügen',
        content: 'Klicke hier, um eine neue Lizenz zu registrieren. Tipp: Nutze den KI-Vorschlag oder lade ein Foto der Rechnung hoch!',
        position: 'bottom-left'
    },
    {
        target: 'search-filter',
        title: 'Suchen & Filtern',
        content: 'Finde Tools blitzschnell via Suche oder filtere nach Inhaber und Kategorie. Nutze CMD+K zum Suchen!',
        position: 'top'
    },
    {
        target: 'analytics',
        title: 'Analytics & Trends',
        content: 'Verstehe deine Ausgaben und sieh die Kostenentwicklung der nächsten 12 Monate.',
        position: 'top'
    }
];

export const OnboardingTour: React.FC = () => {
    const [currentStep, setCurrentStep] = useState(-1);
    const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

    useEffect(() => {
        const tourSeen = localStorage.getItem('onboarding_seen');
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
        localStorage.setItem('onboarding_seen', 'true');
    };

    if (currentStep === -1 || !targetRect) return null;

    const step = STEPS[currentStep];

    return (
        <div className="fixed inset-0 z-[100] pointer-events-none">
            {/* Dimmed Background */}
            <div className="absolute inset-0 bg-k5-deepBlue/40 backdrop-blur-[2px]" />

            {/* Spotlight */}
            <div
                className="absolute transition-all duration-300 rounded-2xl shadow-[0_0_0_9999px_rgba(5,35,100,0.6)]"
                style={{
                    top: targetRect.top - 8,
                    left: targetRect.left - 8,
                    width: targetRect.width + 16,
                    height: targetRect.height + 16,
                    pointerEvents: 'auto'
                }}
            />

            {/* Tooltip */}
            <div
                className="absolute bg-white dark:bg-k5-deepBlue p-6 rounded-3xl shadow-2xl w-80 pointer-events-auto border border-k5-digitalBlue/20 transition-all duration-300"
                style={{
                    top: step.position.includes('bottom') ? targetRect.bottom + 24 : targetRect.top - 220,
                    left: step.position.includes('left') ? targetRect.left - 200 : targetRect.left + (targetRect.width / 2) - 160
                }}
            >
                <div className="flex justify-between items-start mb-4">
                    <span className="text-[10px] font-black uppercase tracking-widest text-k5-digitalBlue">Step {currentStep + 1} of {STEPS.length}</span>
                    <button onClick={handleComplete} className="text-k5-sand hover:text-k5-deepBlue dark:hover:text-white transition-all text-xs font-bold">Überspringen</button>
                </div>
                <h4 className="text-lg font-black text-k5-deepBlue dark:text-white mb-2">{step.title}</h4>
                <p className="text-sm text-k5-sand dark:text-k5-sand/80 font-medium mb-6 leading-relaxed">{step.content}</p>

                <button
                    onClick={handleNext}
                    className="w-full py-3 bg-k5-digitalBlue text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:brightness-110 transition-all shadow-lg shadow-k5-digitalBlue/20"
                >
                    {currentStep === STEPS.length - 1 ? 'Tour beenden' : 'Weiter'}
                </button>
            </div>
        </div>
    );
};
