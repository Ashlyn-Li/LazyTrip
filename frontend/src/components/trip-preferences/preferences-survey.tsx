"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { AppHeader } from "@/components/layout/app-header";
import { PageContainer } from "@/components/layout/page-container";
import { GuidedExperienceOptions } from "@/components/trip-preferences/guided-experience-options";
import { PreferenceOptions } from "@/components/trip-preferences/preference-options";
import { SurveyProgress } from "@/components/trip-preferences/survey-progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { loadTripPreferences, loadTripSearchData, saveTripPreferences } from "@/lib/storage/planning-session";
import { hasTripPreferencesErrors, validateTripPreferences } from "@/lib/validation/trip-preferences";
import type {
  AccommodationStyle,
  ExplorationStyle,
  FreeTimeLevel,
  GuidedActivityType,
  GuidePreference,
  TransportMode,
  TravelPace,
  TripInterest,
  TripPreferences
} from "@/types/trip";

const totalSlides = 5;

const defaultPreferences: TripPreferences = {
  pace: "balanced",
  interests: [],
  explorationStyle: "independent-with-guides",
  transportModes: ["walking", "public-transport"],
  accommodationStyle: null,
  preferredStartTime: "10:00",
  freeTimeLevel: "some",
  guidePreference: "no-preference",
  guidedActivityTypes: [],
  dietaryRequirements: "",
  accessibilityRequirements: "",
  mustSeePlaces: "",
  thingsToAvoid: "",
  additionalComments: ""
};

const paceOptions: { value: TravelPace; label: string }[] = [
  { value: "relaxed", label: "Relaxed" },
  { value: "balanced", label: "Balanced" },
  { value: "packed", label: "Packed" }
];

const interestOptions: { value: TripInterest; label: string }[] = [
  { value: "food", label: "Food" },
  { value: "local-culture", label: "Local culture" },
  { value: "history", label: "History" },
  { value: "art", label: "Art" },
  { value: "nature", label: "Nature" },
  { value: "shopping", label: "Shopping" },
  { value: "nightlife", label: "Nightlife" },
  { value: "beaches", label: "Beaches" },
  { value: "photography", label: "Photography" },
  { value: "wellness", label: "Wellness" }
];

const explorationOptions: { value: ExplorationStyle; label: string }[] = [
  { value: "mostly-independent", label: "Mostly independent" },
  { value: "independent-with-guides", label: "Independent with guided experiences" },
  { value: "balanced-mixture", label: "Balanced mixture" },
  { value: "mostly-guided", label: "Mostly guided" }
];

const transportOptions: { value: TransportMode; label: string }[] = [
  { value: "walking", label: "Walking" },
  { value: "public-transport", label: "Public transport" },
  { value: "taxi", label: "Taxi" },
  { value: "rental-car", label: "Rental car" }
];

const accommodationOptions: { value: AccommodationStyle; label: string }[] = [
  { value: "budget", label: "Budget" },
  { value: "mid-range", label: "Mid-range" },
  { value: "boutique", label: "Boutique" },
  { value: "luxury", label: "Luxury" }
];

const freeTimeOptions: { value: FreeTimeLevel; label: string }[] = [
  { value: "very-little", label: "Very little" },
  { value: "some", label: "Some free time" },
  { value: "plenty", label: "Plenty of free time" }
];

const textareaClass =
  "min-h-24 w-full resize-none rounded-2xl border border-coast-100 bg-white px-4 py-3 text-base text-ink shadow-sm transition placeholder:text-slate-400 focus:border-coast-500 focus:outline-none focus:ring-4 focus:ring-coast-100";

const usesGuides = (explorationStyle: ExplorationStyle) => explorationStyle !== "mostly-independent";

const loadNormalizedPreferences = (): TripPreferences => ({
  ...defaultPreferences,
  ...loadTripPreferences()
});

export const PreferencesSurvey = () => {
  const router = useRouter();
  const [tripSearchData] = useState(() => loadTripSearchData());
  const [preferences, setPreferences] = useState<TripPreferences>(() => loadNormalizedPreferences());
  const [slideIndex, setSlideIndex] = useState(0);
  const [errors, setErrors] = useState(() => validateTripPreferences(loadNormalizedPreferences()));
  const [savedMessage, setSavedMessage] = useState("");

  const summaryTitle = useMemo(() => {
    if (!tripSearchData) {
      return "";
    }

    return `${tripSearchData.origin} → ${tripSearchData.destination}`;
  }, [tripSearchData]);

  const updatePreferences = (nextPreferences: Partial<TripPreferences>) => {
    setPreferences((currentPreferences) => ({ ...currentPreferences, ...nextPreferences }));
    setErrors({});
    setSavedMessage("");
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

  const toggleGuidedActivity = (activityType: GuidedActivityType) => {
    updatePreferences({
      guidedActivityTypes: preferences.guidedActivityTypes.includes(activityType)
        ? preferences.guidedActivityTypes.filter((currentType) => currentType !== activityType)
        : [...preferences.guidedActivityTypes, activityType]
    });
  };

  const validateCurrentSlide = () => {
    if (slideIndex !== 1) {
      return true;
    }

    const nextErrors = validateTripPreferences(preferences);
    setErrors(nextErrors);

    return !hasTripPreferencesErrors(nextErrors);
  };

  const goNext = () => {
    if (!validateCurrentSlide()) {
      return;
    }

    setSlideIndex((currentSlide) => Math.min(totalSlides - 1, currentSlide + 1));
  };

  const goBack = () => {
    setErrors({});
    setSavedMessage("");
    setSlideIndex((currentSlide) => Math.max(0, currentSlide - 1));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors = validateTripPreferences(preferences);
    setErrors(nextErrors);

    if (hasTripPreferencesErrors(nextErrors)) {
      setSlideIndex(1);
      setSavedMessage("");
      return;
    }

    const finalPreferences: TripPreferences = {
      ...preferences,
      guidePreference: usesGuides(preferences.explorationStyle) ? preferences.guidePreference : null,
      guidedActivityTypes: usesGuides(preferences.explorationStyle) ? preferences.guidedActivityTypes : []
    };

    saveTripPreferences(finalPreferences);
    console.log("TripPreferences", finalPreferences);
    setPreferences(finalPreferences);
    setSavedMessage("");
    router.push("/plan/generating");
  };

  if (!tripSearchData) {
    return (
      <main className="min-h-screen bg-[#fbf6fb] text-ink">
        <AppHeader />
        <PageContainer>
          <section className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center text-center">
            <h1 className="text-4xl font-bold">Start with your trip details</h1>
            <p className="mt-4 text-lg leading-8 text-slate-700">
              Basic trip details are required before LazyTrip can save your travel preferences.
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
    <main className="min-h-screen overflow-hidden bg-[#fbf6fb] text-ink">
      <div className="absolute inset-x-[-6rem] top-[-4rem] h-[24rem] bg-[radial-gradient(circle_at_22%_28%,rgba(238,127,168,0.24),rgba(238,127,168,0.10)_34%,transparent_66%),radial-gradient(circle_at_78%_22%,rgba(140,110,232,0.16),rgba(140,110,232,0.06)_36%,transparent_68%)] blur-xl [mask-image:linear-gradient(to_bottom,black_0%,black_62%,transparent_100%)]" />
      <AppHeader />
      <PageContainer>
        <section className="relative mx-auto grid min-h-[calc(100vh-5rem)] max-w-4xl content-center gap-5 pb-10 pt-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link className="rounded-full bg-white/80 px-4 py-2 text-sm font-bold text-ink shadow-sm focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-coral-500" href="/">
              Back
            </Link>
            <p className="rounded-full bg-white/80 px-4 py-2 text-sm font-semibold text-coast-700 shadow-sm">
              {summaryTitle}
            </p>
          </div>

          <SurveyProgress currentStep={slideIndex + 1} totalSteps={totalSlides} />

          <form
            className="rounded-[2rem] border border-white/70 bg-white/90 p-5 shadow-soft backdrop-blur sm:p-7"
            onSubmit={handleSubmit}
          >
            <div className="mb-6">
              <h1 className="text-3xl font-bold leading-tight text-ink sm:text-4xl">How do you like to travel?</h1>
              <p className="mt-3 text-base leading-7 text-slate-700">
                A few quick choices help LazyTrip personalize the trip without making this feel like homework.
              </p>
            </div>

            <div className="transition-opacity duration-200 motion-reduce:transition-none">
              {slideIndex === 0 ? (
                <section>
                  <h2 className="mb-3 text-xl font-bold text-ink">What pace feels right?</h2>
                  <PreferenceOptions options={paceOptions} selectedValues={[preferences.pace]} onToggle={(pace) => updatePreferences({ pace })} />
                </section>
              ) : null}

              {slideIndex === 1 ? (
                <section>
                  <h2 className="mb-2 text-xl font-bold text-ink">What are you most interested in?</h2>
                  <p className="mb-4 text-sm font-medium text-slate-600">Choose as many as you like.</p>
                  <PreferenceOptions options={interestOptions} selectedValues={preferences.interests} onToggle={toggleInterest} />
                  <p className="mt-2 min-h-5 text-sm font-semibold text-coral-700" aria-live="polite">
                    {errors.interests}
                  </p>
                </section>
              ) : null}

              {slideIndex === 2 ? (
                <div className="space-y-5">
                  <section>
                    <h2 className="mb-3 text-xl font-bold text-ink">How would you like to explore?</h2>
                    <PreferenceOptions
                      options={explorationOptions}
                      selectedValues={[preferences.explorationStyle]}
                      onToggle={(explorationStyle) =>
                        updatePreferences({
                          explorationStyle,
                          guidePreference: usesGuides(explorationStyle) ? preferences.guidePreference ?? "no-preference" : null,
                          guidedActivityTypes: usesGuides(explorationStyle) ? preferences.guidedActivityTypes : []
                        })
                      }
                      columns="two"
                    />
                  </section>
                  {usesGuides(preferences.explorationStyle) ? (
                    <GuidedExperienceOptions
                      guidePreference={preferences.guidePreference}
                      guidedActivityTypes={preferences.guidedActivityTypes}
                      onGuidePreferenceChange={(guidePreference: GuidePreference) => updatePreferences({ guidePreference })}
                      onActivityToggle={toggleGuidedActivity}
                    />
                  ) : null}
                </div>
              ) : null}

              {slideIndex === 3 ? (
                <div className="space-y-5">
                  <section>
                    <h2 className="mb-3 text-xl font-bold text-ink">What makes the trip comfortable?</h2>
                    <PreferenceOptions
                      options={accommodationOptions}
                      selectedValues={preferences.accommodationStyle ? [preferences.accommodationStyle] : []}
                      onToggle={(accommodationStyle) => updatePreferences({ accommodationStyle })}
                      columns="four"
                    />
                  </section>
                  <section>
                    <h2 className="mb-3 text-lg font-bold text-ink">Transport preference</h2>
                    <PreferenceOptions options={transportOptions} selectedValues={preferences.transportModes} onToggle={toggleTransport} columns="four" />
                  </section>
                  <section className="grid gap-4 sm:grid-cols-2">
                    <label className="space-y-2 text-sm font-bold text-ink">
                      <span>Preferred daily start time</span>
                      <Input
                        type="time"
                        value={preferences.preferredStartTime}
                        onChange={(event) => updatePreferences({ preferredStartTime: event.target.value })}
                      />
                    </label>
                    <div>
                      <h2 className="mb-3 text-sm font-bold text-ink">Free time</h2>
                      <PreferenceOptions
                        options={freeTimeOptions}
                        selectedValues={[preferences.freeTimeLevel]}
                        onToggle={(freeTimeLevel) => updatePreferences({ freeTimeLevel })}
                        columns="three"
                      />
                    </div>
                  </section>
                </div>
              ) : null}

              {slideIndex === 4 ? (
                <section className="grid gap-4">
                  <h2 className="text-xl font-bold text-ink">Anything we should plan around?</h2>
                  <label className="space-y-2 text-sm font-bold text-ink">
                    <span>Food or dietary requirements</span>
                    <textarea className={textareaClass} value={preferences.dietaryRequirements} onChange={(event) => updatePreferences({ dietaryRequirements: event.target.value })} />
                  </label>
                  <label className="space-y-2 text-sm font-bold text-ink">
                    <span>Accessibility or mobility requirements</span>
                    <textarea className={textareaClass} value={preferences.accessibilityRequirements} onChange={(event) => updatePreferences({ accessibilityRequirements: event.target.value })} />
                  </label>
                  <label className="space-y-2 text-sm font-bold text-ink">
                    <span>Must-see places</span>
                    <textarea className={textareaClass} value={preferences.mustSeePlaces} onChange={(event) => updatePreferences({ mustSeePlaces: event.target.value })} />
                  </label>
                  <label className="space-y-2 text-sm font-bold text-ink">
                    <span>Things to avoid</span>
                    <textarea className={textareaClass} value={preferences.thingsToAvoid} onChange={(event) => updatePreferences({ thingsToAvoid: event.target.value })} />
                  </label>
                  <label className="space-y-2 text-sm font-bold text-ink">
                    <span>Additional comments or fixed plans</span>
                    <textarea
                      className={textareaClass}
                      placeholder="We already booked a museum for Friday at 1 PM. Please keep that time fixed."
                      value={preferences.additionalComments}
                      onChange={(event) => updatePreferences({ additionalComments: event.target.value })}
                    />
                  </label>
                </section>
              ) : null}
            </div>

            <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
              {slideIndex > 0 ? (
                <Button
                  className="border border-coast-100 bg-pink-400 text-coast-700 hover:bg-coast-50"
                  type="button"
                  onClick={goBack}
                >
                  Previous question
                </Button>
              ) : (
                <span aria-hidden="true" />
              )}
              {slideIndex === totalSlides - 1 ? (
                <Button type="submit">Create my trip</Button>
              ) : (
                <Button type="button" onClick={goNext}>
                  Continue
                </Button>
              )}
            </div>

            {savedMessage ? (
              <p className="mt-5 rounded-2xl bg-coast-50 px-4 py-3 text-sm font-semibold text-coast-700" aria-live="polite">
                {savedMessage}
              </p>
            ) : null}
          </form>
        </section>
      </PageContainer>
    </main>
  );
};
