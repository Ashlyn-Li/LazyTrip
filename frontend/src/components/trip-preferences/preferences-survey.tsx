"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { AppHeader } from "@/components/layout/app-header";
import { PageContainer } from "@/components/layout/page-container";
import { GuidedExperienceOptions } from "@/components/trip-preferences/guided-experience-options";
import { PreferenceOptions } from "@/components/trip-preferences/preference-options";
import { SurveyProgress } from "@/components/trip-preferences/survey-progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/api/client";
import { previewTripPreferences } from "@/lib/api/trips";
import {
  loadTripPreferences,
  loadTripSearchData,
  saveTripPreferences,
  tripPreferencesPreviewResponseToPreferences
} from "@/lib/storage/planning-session";
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

const backendFieldSlideMap: Record<string, number> = {
  pace: 0,
  interests: 1,
  explorationStyle: 2,
  exploration_style: 2,
  guidePreference: 2,
  guide_preference: 2,
  guidedActivityTypes: 2,
  guided_activity_types: 2,
  accommodationStyle: 3,
  accommodation_style: 3,
  transportModes: 3,
  transport_modes: 3,
  preferredStartTime: 3,
  preferred_start_time: 3,
  freeTimeLevel: 3,
  free_time_level: 3,
  dietaryRequirements: 4,
  dietary_requirements: 4,
  accessibilityRequirements: 4,
  accessibility_requirements: 4,
  mustSeePlaces: 4,
  must_see_places: 4,
  thingsToAvoid: 4,
  things_to_avoid: 4,
  additionalComments: 4,
  additional_comments: 4
};

const getBackendErrorFields = (details: unknown): string[] => {
  if (!details || typeof details !== "object" || !("detail" in details)) {
    return [];
  }

  const detail = (details as { detail: unknown }).detail;

  if (!Array.isArray(detail)) {
    return [];
  }

  return detail.flatMap((item) => {
    if (!item || typeof item !== "object" || !("loc" in item)) {
      return [];
    }

    const loc = (item as { loc: unknown }).loc;

    if (!Array.isArray(loc)) {
      return [];
    }

    return loc.filter((locPart): locPart is string => typeof locPart === "string");
  });
};

const getBackendValidationMessages = (details: unknown): string[] => {
  if (!details || typeof details !== "object" || !("detail" in details)) {
    return [];
  }

  const detail = (details as { detail: unknown }).detail;

  if (!Array.isArray(detail)) {
    return typeof detail === "string" ? [detail] : [];
  }

  return detail.flatMap((item) => {
    if (!item || typeof item !== "object" || !("msg" in item)) {
      return [];
    }

    const message = (item as { msg: unknown }).msg;

    return typeof message === "string" ? [message.replace(/^Value error,\s*/, "")] : [];
  });
};

const getEarliestErrorSlide = (fields: string[]) =>
  fields.reduce<number | null>((earliestSlide, field) => {
    const fieldSlide = backendFieldSlideMap[field];

    if (fieldSlide === undefined) {
      return earliestSlide;
    }

    return earliestSlide === null ? fieldSlide : Math.min(earliestSlide, fieldSlide);
  }, null);

const getEarliestLocalErrorSlide = (errors: ReturnType<typeof validateTripPreferences>) =>
  getEarliestErrorSlide(Object.keys(errors));

const getPreferencesApiErrorMessage = (error: unknown) => {
  if (!(error instanceof ApiError)) {
    return "LazyTrip could not check your preferences right now. Please try again.";
  }

  if (error.code === "network_error" || error.code === "missing_api_base_url") {
    return "We couldn't connect to LazyTrip. Check that the backend is running and try again.";
  }

  if (error.code === "request_timeout") {
    return "LazyTrip took too long to check your preferences. Please try again.";
  }

  if (error.status === 400 || error.status === 422) {
    const validationMessages = getBackendValidationMessages(error.details);

    return validationMessages[0] ?? "Please check your travel preferences.";
  }

  return "LazyTrip could not check your preferences right now. Please try again.";
};

export const PreferencesSurvey = () => {
  const router = useRouter();
  const [hasLoadedClientState, setHasLoadedClientState] = useState(false);
  const [tripSearchData, setTripSearchData] = useState<ReturnType<typeof loadTripSearchData>>(null);
  const [preferences, setPreferences] = useState<TripPreferences>(defaultPreferences);
  const [slideIndex, setSlideIndex] = useState(0);
  const [errors, setErrors] = useState(() => validateTripPreferences(defaultPreferences));
  const [savedMessage, setSavedMessage] = useState("");
  const [apiError, setApiError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const apiErrorRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const loadClientStateTimeout = window.setTimeout(() => {
      const loadedPreferences = loadNormalizedPreferences();

      setTripSearchData(loadTripSearchData());
      setPreferences(loadedPreferences);
      setErrors(validateTripPreferences(loadedPreferences));
      setHasLoadedClientState(true);
    }, 0);

    return () => window.clearTimeout(loadClientStateTimeout);
  }, []);

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
    setApiError("");
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
    if (![1, 2, 3].includes(slideIndex)) {
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
    setApiError("");
    setSlideIndex((currentSlide) => Math.max(0, currentSlide - 1));
  };

  useEffect(() => {
    if (apiError) {
      apiErrorRef.current?.focus();
    }
  }, [apiError, slideIndex]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const nextErrors = validateTripPreferences(preferences);
    setErrors(nextErrors);
    setApiError("");

    if (hasTripPreferencesErrors(nextErrors)) {
      setSlideIndex(getEarliestLocalErrorSlide(nextErrors) ?? 1);
      setSavedMessage("");
      return;
    }

    const finalPreferences: TripPreferences = {
      ...preferences,
      guidePreference: usesGuides(preferences.explorationStyle) ? preferences.guidePreference : null,
      guidedActivityTypes: usesGuides(preferences.explorationStyle) ? preferences.guidedActivityTypes : []
    };

    setIsSubmitting(true);

    try {
      const previewResponse = await previewTripPreferences(finalPreferences);
      const normalizedPreferences =
        tripPreferencesPreviewResponseToPreferences(previewResponse);

      saveTripPreferences(normalizedPreferences);
      setPreferences(normalizedPreferences);
      setSavedMessage("");
      router.push("/plan/generating");
    } catch (error) {
      const backendFields = error instanceof ApiError ? getBackendErrorFields(error.details) : [];
      const earliestErrorSlide = getEarliestErrorSlide(backendFields);

      if (earliestErrorSlide !== null) {
        setSlideIndex(earliestErrorSlide);
      }

      setApiError(getPreferencesApiErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!hasLoadedClientState) {
    return (
      <main className="min-h-screen bg-[#fbf6fb] text-ink">
        <AppHeader />
        <PageContainer>
          <section className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center text-center">
            <h1 className="text-4xl font-bold">Loading your trip plan</h1>
          </section>
        </PageContainer>
      </main>
    );
  }

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
                    <div>
                      <GuidedExperienceOptions
                        guidePreference={preferences.guidePreference}
                        guidedActivityTypes={preferences.guidedActivityTypes}
                        onGuidePreferenceChange={(guidePreference: GuidePreference) => updatePreferences({ guidePreference })}
                        onActivityToggle={toggleGuidedActivity}
                      />
                      <p className="mt-2 min-h-5 text-sm font-semibold text-coral-700" aria-live="polite">
                        {errors.guidePreference}
                      </p>
                    </div>
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
                    <p className="mt-2 min-h-5 text-sm font-semibold text-coral-700" aria-live="polite">
                      {errors.transportModes}
                    </p>
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
                  disabled={isSubmitting}
                >
                  Previous question
                </Button>
              ) : (
                <span aria-hidden="true" />
              )}
              {slideIndex === totalSlides - 1 ? (
                <Button type="submit" disabled={isSubmitting} aria-busy={isSubmitting}>
                  {isSubmitting ? "Checking your preferences..." : "Create my trip"}
                </Button>
              ) : (
                <Button type="button" onClick={goNext} disabled={isSubmitting}>
                  Continue
                </Button>
              )}
            </div>

            <div className="mt-5" aria-live="polite">
              {isSubmitting ? (
                <p className="rounded-2xl bg-coast-50 px-4 py-3 text-sm font-semibold text-coast-700">
                  Checking your preferences before planning starts.
                </p>
              ) : null}

              {apiError ? (
                <p
                  ref={apiErrorRef}
                  className="rounded-2xl bg-coral-50 px-4 py-3 text-sm font-semibold text-coral-700"
                  tabIndex={-1}
                >
                  {apiError}
                </p>
              ) : null}
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
