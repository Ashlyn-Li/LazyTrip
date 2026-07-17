"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { AppHeader } from "@/components/layout/app-header";
import { PageContainer } from "@/components/layout/page-container";
import { loadTripPreferences, loadTripSearchData } from "@/lib/storage/planning-session";

const planningSteps = [
  "Understanding your preferences",
  "Finding places that match your interests",
  "Grouping nearby activities",
  "Checking your schedule",
  "Building each day",
  "Finishing your itinerary"
];

export const GenerationProgress = () => {
  const router = useRouter();
  const [tripSearchData] = useState(() => loadTripSearchData());
  const [tripPreferences] = useState(() => loadTripPreferences());
  const [progress, setProgress] = useState(0);
  const hasNavigatedRef = useRef(false);
  const navigationTimeoutRef = useRef<number | null>(null);

  const destinationSummary = useMemo(() => {
    if (!tripSearchData) {
      return "";
    }

    return `${tripSearchData.origin} → ${tripSearchData.destination}`;
  }, [tripSearchData]);

  const stepIndex = Math.min(planningSteps.length - 1, Math.floor((progress / 100) * planningSteps.length));
  const currentStep = planningSteps[stepIndex];

  useEffect(() => {
    if (!tripSearchData || !tripPreferences) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setProgress((currentProgress) => {
        const nextProgress = Math.min(100, currentProgress + 4 + Math.floor(Math.random() * 5));

        if (nextProgress >= 100 && !hasNavigatedRef.current) {
          hasNavigatedRef.current = true;
          navigationTimeoutRef.current = window.setTimeout(() => router.push("/trip/demo"), 450);
        }

        return nextProgress;
      });
    }, 360);

    return () => {
      window.clearInterval(intervalId);

      if (navigationTimeoutRef.current !== null) {
        window.clearTimeout(navigationTimeoutRef.current);
      }
    };
  }, [router, tripPreferences, tripSearchData]);

  if (!tripSearchData || !tripPreferences) {
    return (
      <main className="min-h-screen bg-[#f8f4ee] text-ink">
        <AppHeader />
        <PageContainer>
          <section className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center text-center">
            <h1 className="text-4xl font-bold">Start your trip plan first</h1>
            <p className="mt-4 text-lg leading-8 text-slate-700">
              LazyTrip needs trip details and preferences before it can create the demo itinerary.
            </p>
            <Link className="mt-6 inline-flex min-h-12 items-center justify-center rounded-full bg-coast-700 px-6 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-coast-500 focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-coral-500" href="/">
              Enter trip details
            </Link>
          </section>
        </PageContainer>
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#f8f4ee] text-ink">
      <div className="absolute inset-x-[-6rem] top-[-4rem] h-[28rem] bg-[radial-gradient(circle_at_22%_28%,rgba(47,156,143,0.22),rgba(47,156,143,0.08)_34%,transparent_66%),radial-gradient(circle_at_78%_22%,rgba(244,124,86,0.16),rgba(244,124,86,0.06)_36%,transparent_68%)] blur-xl [mask-image:linear-gradient(to_bottom,black_0%,black_62%,transparent_100%)]" />
      <AppHeader />
      <PageContainer>
        <section className="relative mx-auto flex min-h-[calc(100vh-5rem)] max-w-2xl flex-col justify-center pb-12">
          <p className="mb-4 inline-flex w-fit rounded-full bg-white/80 px-4 py-2 text-sm font-semibold text-coast-700 shadow-sm">
            {destinationSummary}
          </p>
          <div className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-soft backdrop-blur sm:p-8">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-coast-700">LazyTrip</p>
            <h1 className="mt-4 text-4xl font-bold leading-tight text-ink">We&apos;re planning your trip</h1>
            <p className="mt-4 text-lg leading-8 text-slate-700">
              This may take a moment while we shape a balanced demo itinerary from your saved choices.
            </p>
            <div className="mt-8 space-y-3">
              <div className="flex items-center justify-between text-sm font-semibold text-slate-600">
                <span aria-live="polite">{currentStep}</span>
                <span>{progress}%</span>
              </div>
              <div className="h-4 overflow-hidden rounded-full bg-coast-100">
                <div
                  className="h-full rounded-full bg-coast-700 transition-[width] duration-500 motion-reduce:transition-none"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
            <div className="mt-8 grid grid-cols-3 gap-2" aria-hidden="true">
              <span className="h-2 rounded-full bg-coral-100 motion-safe:animate-pulse" />
              <span className="h-2 rounded-full bg-coast-100 motion-safe:animate-pulse" />
              <span className="h-2 rounded-full bg-coral-100 motion-safe:animate-pulse" />
            </div>
          </div>
        </section>
      </PageContainer>
    </main>
  );
};
