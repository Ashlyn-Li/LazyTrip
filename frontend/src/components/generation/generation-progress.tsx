"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { AppHeader } from "@/components/layout/app-header";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api/client";
import { getItineraryGeneration, startItineraryGeneration } from "@/lib/api/itinerary-generations";
import {
  clearActiveItineraryGenerationJob,
  clearGeneratedItinerary,
  loadActiveItineraryGenerationJob,
  loadTripPreferences,
  loadTripSearchData,
  saveActiveItineraryGenerationJob,
  saveGeneratedItinerary
} from "@/lib/storage/planning-session";
import type { ItineraryGenerationStatus } from "@/types/itinerary";
import type { TripPreferences, TripSearchData } from "@/types/trip";

const pollIntervalMs = 1400;
const overallTimeoutMs = 150000;

type GenerationUiState =
  | "loading-session"
  | "missing-session"
  | "starting"
  | "polling"
  | "completed"
  | "failed"
  | "backend-unavailable"
  | "timeout"
  | "expired";

const statusLabels: Record<ItineraryGenerationStatus, string> = {
  queued: "Preparing your request",
  validating: "Checking your trip details",
  collecting_data: "Preparing mock destination information",
  generating: "Building your daily itinerary",
  validating_output: "Checking your itinerary",
  completed: "Your itinerary is ready",
  failed: "LazyTrip couldn't generate this draft."
};

const getGenerationErrorMessage = (error: unknown) => {
  if (!(error instanceof ApiError)) {
    return "LazyTrip couldn't generate this draft. Please try again.";
  }

  if (error.status === 404) {
    return "This draft-generation job has expired. Start again to create a new one.";
  }

  if (error.code === "network_error" || error.code === "missing_api_base_url") {
    return "We couldn't connect to LazyTrip. Check that the backend is running and try again.";
  }

  if (error.code === "request_timeout") {
    return "LazyTrip took too long to respond. Please try again.";
  }

  return "LazyTrip couldn't generate this draft. Please try again.";
};

export const GenerationProgress = () => {
  const router = useRouter();
  const [tripSearchData, setTripSearchData] = useState<TripSearchData | null>(null);
  const [tripPreferences, setTripPreferences] = useState<TripPreferences | null>(null);
  const [uiState, setUiState] = useState<GenerationUiState>("loading-session");
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("Preparing your request");
  const [errorMessage, setErrorMessage] = useState("");
  const [retryNonce, setRetryNonce] = useState(0);
  const hasStartedRef = useRef(false);

  useEffect(() => {
    const loadSessionTimeout = window.setTimeout(() => {
      const loadedTripSearchData = loadTripSearchData();
      const loadedTripPreferences = loadTripPreferences();

      setTripSearchData(loadedTripSearchData);
      setTripPreferences(loadedTripPreferences);
      setUiState(loadedTripSearchData && loadedTripPreferences ? "starting" : "missing-session");
    }, 0);

    return () => window.clearTimeout(loadSessionTimeout);
  }, []);

  const destinationSummary = useMemo(() => {
    if (!tripSearchData) {
      return "";
    }

    return `${tripSearchData.origin} -> ${tripSearchData.destination}`;
  }, [tripSearchData]);

  useEffect(() => {
    if (!tripSearchData || !tripPreferences) {
      return;
    }

    let isCancelled = false;
    let timeoutId: number | null = null;
    let pollTimeoutId: number | null = null;
    hasStartedRef.current = false;

    const fail = (nextState: GenerationUiState, nextMessage: string) => {
      if (isCancelled) {
        return;
      }

      setUiState(nextState);
      setErrorMessage(nextMessage);
    };

    const pollJob = async (jobId: string) => {
      if (isCancelled) {
        return;
      }

      try {
        const statusResponse = await getItineraryGeneration(jobId);

        if (isCancelled) {
          return;
        }

        setProgress(statusResponse.progress);
        setMessage(statusResponse.message || statusLabels[statusResponse.status]);

        if (statusResponse.status === "completed") {
          if (!statusResponse.itinerary) {
            fail("failed", "LazyTrip finished without returning an itinerary. Please try again.");
            return;
          }

          saveGeneratedItinerary(statusResponse.itinerary);
          clearActiveItineraryGenerationJob();
          setUiState("completed");
          router.push("/trip/demo");
          return;
        }

        if (statusResponse.status === "failed") {
          clearActiveItineraryGenerationJob();
          fail(
            "failed",
            statusResponse.error?.message ?? "LazyTrip couldn't generate this draft. Please try again."
          );
          return;
        }

        setUiState("polling");
        pollTimeoutId = window.setTimeout(() => void pollJob(jobId), pollIntervalMs);
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) {
          clearActiveItineraryGenerationJob();
          fail("expired", getGenerationErrorMessage(error));
          return;
        }

        fail("backend-unavailable", getGenerationErrorMessage(error));
      }
    };

    const startOrResumeJob = async () => {
      if (hasStartedRef.current) {
        return;
      }

      hasStartedRef.current = true;
      clearGeneratedItinerary();

      try {
        const existingJobId = loadActiveItineraryGenerationJob();

        if (existingJobId) {
          setUiState("polling");
          await pollJob(existingJobId);
          return;
        }

        setUiState("starting");
        const startResponse = await startItineraryGeneration({
          trip: tripSearchData,
          preferences: tripPreferences
        });

        saveActiveItineraryGenerationJob(startResponse.job_id);
        setProgress(0);
        setMessage(statusLabels[startResponse.status]);
        setUiState("polling");
        await pollJob(startResponse.job_id);
      } catch (error) {
        fail("backend-unavailable", getGenerationErrorMessage(error));
      }
    };

    timeoutId = window.setTimeout(() => {
      clearActiveItineraryGenerationJob();
      fail("timeout", "LazyTrip took too long to generate this draft. Please try again.");
    }, overallTimeoutMs);

    void startOrResumeJob();

    return () => {
      isCancelled = true;

      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }

      if (pollTimeoutId !== null) {
        window.clearTimeout(pollTimeoutId);
      }
    };
  }, [retryNonce, router, tripPreferences, tripSearchData]);

  const retryGeneration = () => {
    clearActiveItineraryGenerationJob();
    clearGeneratedItinerary();
    setProgress(0);
    setMessage("Preparing your request");
    setErrorMessage("");
    setUiState("starting");
    setRetryNonce((currentNonce) => currentNonce + 1);
  };

  if (uiState === "loading-session") {
    return (
      <main className="min-h-screen bg-[#fbf6fb] text-ink">
        <AppHeader />
        <PageContainer>
          <section className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center text-center">
            <h1 className="text-4xl font-bold">Loading your planning session</h1>
          </section>
        </PageContainer>
      </main>
    );
  }

  if (uiState === "missing-session" || !tripSearchData || !tripPreferences) {
    return (
      <main className="min-h-screen bg-[#fbf6fb] text-ink">
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

  const canRetry = ["failed", "backend-unavailable", "timeout", "expired"].includes(uiState);

  return (
    <main className="min-h-screen overflow-hidden bg-[#fbf6fb] text-ink">
      <div className="absolute inset-x-[-6rem] top-[-4rem] h-[28rem] bg-[radial-gradient(circle_at_22%_28%,rgba(238,127,168,0.24),rgba(238,127,168,0.10)_34%,transparent_66%),radial-gradient(circle_at_78%_22%,rgba(140,110,232,0.16),rgba(140,110,232,0.06)_36%,transparent_68%)] blur-xl [mask-image:linear-gradient(to_bottom,black_0%,black_62%,transparent_100%)]" />
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
              LazyTrip is creating an itinerary from your saved trip details and preferences. Places,
              routes, availability, and prices may still require verification.
            </p>
            <div className="mt-8 space-y-3">
              <div className="flex items-center justify-between text-sm font-semibold text-slate-600">
                <span aria-live="polite">{message}</span>
                <span>{progress}%</span>
              </div>
              <div className="h-4 overflow-hidden rounded-full bg-coast-100">
                <div
                  className="h-full rounded-full bg-coast-700 transition-[width] duration-500 motion-reduce:transition-none"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
            {errorMessage ? (
              <div className="mt-6 rounded-2xl bg-coral-50 px-4 py-3 text-sm font-semibold text-coral-700">
                {errorMessage}
              </div>
            ) : null}
            {canRetry ? (
              <Button className="mt-6" type="button" onClick={retryGeneration}>
                Try again
              </Button>
            ) : null}
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
