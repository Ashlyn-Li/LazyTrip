"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { AppHeader } from "@/components/layout/app-header";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { ComfortSlide } from "@/components/trip-preferences/slides/comfort-slide";
import { ExplorationSlide, needsGuidePreference } from "@/components/trip-preferences/slides/exploration-slide";
import { InterestsSlide } from "@/components/trip-preferences/slides/interests-slide";
import { PaceSlide } from "@/components/trip-preferences/slides/pace-slide";
import { RequirementsSlide } from "@/components/trip-preferences/slides/requirements-slide";
import { SurveyProgress } from "@/components/trip-preferences/survey-progress";
import {
  loadTripPreferences,
  loadTripPreferencesProgress,
  loadTripSearchData,
  clearTripPreferencesProgress,
  saveTripPreferences,
  saveTripPreferencesProgress
} from "@/lib/storage/trip-storage";
import type { TripInterest, TripPreferences, TripSearchData, TransportMode } from "@/types/trip";

const totalSlides = 5;

const defaultPreferences: TripPreferences = {
  pace: "balanced",
  interests: [],
  explorationStyle: "independent-with-guides",
  guidePreference: "no-preference",
  accommodationStyle: "mid-range",
  transportModes: ["walking", "public-transport"],
  preferredStartPeriod: "standard",
  mustSeePlaces: "",
  requirements: "",
  fixedPlansAndComments: ""
};

export const PreferencesSurvey = () => {
  const [tripSearchData] = useState<TripSearchData | null>(() => loadTripSearchData());
  const [preferences, setPreferences] = useState<TripPreferences>(() => {
    const savedProgress = loadTripPreferencesProgress();
    const savedPreferences = loadTripPreferences();

    return savedProgress?.preferences ?? savedPreferences ?? defaultPreferences;
  });
  const [slideIndex, setSlideIndex] = useState(() => {
    const savedProgress = loadTripPreferencesProgress();

    return savedProgress ? Math.min(savedProgress.slideIndex, totalSlides - 1) : 0;
  });
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(() => Boolean(loadTripPreferences() && !loadTripPreferencesProgress()));

  useEffect(() => {
    if (!saved) {
      saveTripPreferencesProgress({ preferences, slideIndex });
    }
  }, [preferences, saved, slideIndex]);

  const destinationSummary = useMemo(() => {
    if (!tripSearchData) {
      return "";
    }

    return `${tripSearchData.origin} → ${tripSearchData.destination}`;
  }, [tripSearchData]);

  const updatePreferences = (nextPreferences: Partial<TripPreferences>) => {
    setPreferences((currentPreferences) => ({ ...currentPreferences, ...nextPreferences }));
    setError("");
  };

  const toggleInterest = (interest: TripInterest) => {
    updatePreferences({
      interests: preferences.interests.includes(interest)
        ? preferences.interests.filter((currentInterest) => currentInterest !== interest)
        : [...preferences.interests, interest]
    });
  };

  const toggleTransport = (transportMode: TransportMode) => {
    updatePreferences({
      transportModes: preferences.transportModes.includes(transportMode)
        ? preferences.transportModes.filter((currentMode) => currentMode !== transportMode)
        : [...preferences.transportModes, transportMode]
    });
  };

  const canContinue = () => {
    if (slideIndex === 1 && preferences.interests.length === 0) {
      setError("Choose at least one interest.");
      return false;
    }

    return true;
  };

  const goBack = () => {
    setError("");
    setSlideIndex((currentSlide) => Math.max(0, currentSlide - 1));
  };

  const goNext = () => {
    if (!canContinue()) {
      return;
    }

    setSlideIndex((currentSlide) => Math.min(totalSlides - 1, currentSlide + 1));
  };

  const savePreferences = () => {
    if (!canContinue()) {
      return;
    }

    const finalPreferences: TripPreferences = {
      ...preferences,
      guidePreference: needsGuidePreference(preferences.explorationStyle) ? preferences.guidePreference : undefined
    };

    saveTripPreferences(finalPreferences);
    clearTripPreferencesProgress();
    console.log("TripPreferences", finalPreferences);
    setPreferences(finalPreferences);
    setSaved(true);
  };

  if (!tripSearchData) {
    return (
      <main className="min-h-screen bg-[#f8f4ee] text-ink">
        <AppHeader />
        <PageContainer>
          <section className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center text-center">
            <h1 className="text-4xl font-bold">Start with your trip details</h1>
            <p className="mt-4 text-lg leading-8 text-slate-700">
              LazyTrip needs your destination and travel dates before preferences can be saved.
            </p>
            <Link className="mt-6 inline-flex min-h-12 items-center justify-center rounded-full bg-coast-700 px-6 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-coast-500 focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-coral-500" href="/">
              Enter trip details
            </Link>
          </section>
        </PageContainer>
      </main>
    );
  }

  if (saved) {
    return (
      <main className="min-h-screen bg-[#f8f4ee] text-ink">
        <AppHeader />
        <PageContainer>
          <section className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center text-center">
            <p className="mb-3 rounded-full bg-white/80 px-4 py-2 text-sm font-semibold text-coast-700">{destinationSummary}</p>
            <h1 className="text-4xl font-bold">Preferences saved</h1>
            <p className="mt-4 text-lg leading-8 text-slate-700">
              Next, LazyTrip will review your fixed plans and requirements.
            </p>
            <Button className="mt-6" onClick={() => setSaved(false)}>
              Edit preferences
            </Button>
          </section>
        </PageContainer>
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#f8f4ee] text-ink">
      <div className="absolute inset-x-[-6rem] top-[-4rem] h-[24rem] bg-[radial-gradient(circle_at_22%_28%,rgba(47,156,143,0.20),rgba(47,156,143,0.08)_34%,transparent_66%),radial-gradient(circle_at_78%_22%,rgba(244,124,86,0.16),rgba(244,124,86,0.06)_36%,transparent_68%)] blur-xl [mask-image:linear-gradient(to_bottom,black_0%,black_62%,transparent_100%)]" />
      <AppHeader />
      <PageContainer>
        <section className="relative mx-auto grid min-h-[calc(100vh-5rem)] max-w-3xl content-center gap-6 pb-10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button className="rounded-full bg-white/80 px-4 py-2 text-sm font-bold text-ink shadow-sm focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-coral-500" type="button" onClick={goBack}>
              Back
            </button>
            <p className="rounded-full bg-white/80 px-4 py-2 text-sm font-semibold text-coast-700 shadow-sm">
              {destinationSummary}
            </p>
          </div>
          <SurveyProgress currentStep={slideIndex + 1} totalSteps={totalSlides} />
          <form className="rounded-[2rem] border border-white/70 bg-white/90 p-5 shadow-soft backdrop-blur transition-opacity duration-200 motion-reduce:transition-none sm:p-7" onSubmit={(event) => event.preventDefault()}>
            {slideIndex === 0 ? (
              <PaceSlide value={preferences.pace} onChange={(pace) => updatePreferences({ pace })} />
            ) : null}
            {slideIndex === 1 ? (
              <InterestsSlide values={preferences.interests} error={error} onToggle={toggleInterest} />
            ) : null}
            {slideIndex === 2 ? (
              <ExplorationSlide
                explorationStyle={preferences.explorationStyle}
                guidePreference={preferences.guidePreference}
                onExplorationChange={(explorationStyle) =>
                  updatePreferences({
                    explorationStyle,
                    guidePreference: needsGuidePreference(explorationStyle) ? preferences.guidePreference ?? "no-preference" : undefined
                  })
                }
                onGuideChange={(guidePreference) => updatePreferences({ guidePreference })}
              />
            ) : null}
            {slideIndex === 3 ? (
              <ComfortSlide
                accommodationStyle={preferences.accommodationStyle}
                transportModes={preferences.transportModes}
                preferredStartPeriod={preferences.preferredStartPeriod}
                onAccommodationChange={(accommodationStyle) => updatePreferences({ accommodationStyle })}
                onTransportToggle={toggleTransport}
                onStartChange={(preferredStartPeriod) => updatePreferences({ preferredStartPeriod })}
              />
            ) : null}
            {slideIndex === 4 ? (
              <RequirementsSlide
                mustSeePlaces={preferences.mustSeePlaces}
                requirements={preferences.requirements}
                fixedPlansAndComments={preferences.fixedPlansAndComments}
                onChange={(name, value) => updatePreferences({ [name]: value })}
              />
            ) : null}
            <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
              <Button className="bg-white text-coast-700 hover:bg-coast-50" type="button" onClick={goBack} disabled={slideIndex === 0}>
                Back
              </Button>
              <Button type="button" onClick={slideIndex === totalSlides - 1 ? savePreferences : goNext}>
                {slideIndex === totalSlides - 1 ? "Save preferences" : "Continue"}
              </Button>
            </div>
          </form>
        </section>
      </PageContainer>
    </main>
  );
};
