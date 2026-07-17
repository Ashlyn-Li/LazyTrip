"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { CostSummary } from "@/components/itinerary/cost-summary";
import { DaySelector } from "@/components/itinerary/day-selector";
import { DayTimeline } from "@/components/itinerary/day-timeline";
import { FeedbackSummary } from "@/components/itinerary/feedback-summary";
import { ItineraryHeader } from "@/components/itinerary/itinerary-header";
import { ItineraryNotes } from "@/components/itinerary/itinerary-notes";
import { OverallFeedbackBox } from "@/components/itinerary/overall-feedback-box";
import { AppHeader } from "@/components/layout/app-header";
import { PageContainer } from "@/components/layout/page-container";
import { mockItinerary } from "@/data/mock-itinerary";
import { loadTripPreferences, loadTripSearchData } from "@/lib/storage/planning-session";
import {
  cancelChangeRequest,
  findFeedbackForActivity,
  getItemState,
  loadItineraryFeedback,
  loadItineraryItemStates,
  loadOverallFeedback,
  saveItineraryFeedback,
  saveItineraryItemStates,
  saveOverallFeedback,
  upsertItemState
} from "@/lib/storage/itinerary-feedback";
import type {
  FeedbackAction,
  FeedbackReason,
  ItineraryActivity,
  ItineraryFeedback,
  ItineraryItemUserState
} from "@/types/itinerary";

export const DemoItinerary = () => {
  const [tripSearchData] = useState(() => loadTripSearchData());
  const [preferences] = useState(() => loadTripPreferences());
  const [selectedDay, setSelectedDay] = useState(1);
  const [itemStates, setItemStates] = useState<ItineraryItemUserState[]>(() => loadItineraryItemStates());
  const [feedbackRecords, setFeedbackRecords] = useState<ItineraryFeedback[]>(() => loadItineraryFeedback());
  const [overallFeedback, setOverallFeedback] = useState(() => loadOverallFeedback());
  const [activeChangeRequestId, setActiveChangeRequestId] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Record<string, string>>({});

  const selectedItineraryDay = useMemo(
    () => mockItinerary.days.find((day) => day.dayNumber === selectedDay) ?? mockItinerary.days[0],
    [selectedDay]
  );

  const setNotification = (itemId: string, message: string) => {
    setNotifications((currentNotifications) => ({ ...currentNotifications, [itemId]: message }));
  };

  const updateItemStates = (nextStates: ItineraryItemUserState[]) => {
    setItemStates(nextStates);
    saveItineraryItemStates(nextStates);
  };

  const updateFeedback = (nextFeedback: ItineraryFeedback[]) => {
    setFeedbackRecords(nextFeedback);
    saveItineraryFeedback(nextFeedback);
  };

  const getRenderedState = (itineraryItemId: string) => getItemState(itemStates, itineraryItemId);
  const getRenderedFeedback = (itineraryItemId: string) => findFeedbackForActivity(feedbackRecords, itineraryItemId);

  const handleToggleLock = (activity: ItineraryActivity) => {
    const currentState = getRenderedState(activity.id);
    const nextState: ItineraryItemUserState = {
      itineraryItemId: activity.id,
      isLocked: !currentState.isLocked,
      changeStatus: currentState.changeStatus
    };

    updateItemStates(upsertItemState(itemStates, nextState));
    setActiveChangeRequestId(null);
    setNotification(activity.id, nextState.isLocked ? "Activity locked for future regeneration." : "Activity unlocked.");
  };

  const handleStartChangeRequest = (activity: ItineraryActivity) => {
    const currentState = getRenderedState(activity.id);

    if (currentState.isLocked) {
      setNotification(activity.id, "Unlock this activity before requesting a change.");
      return;
    }

    setActiveChangeRequestId(activity.id);
  };

  const handleSaveChangeRequest = (
    activity: ItineraryActivity,
    input: { action: FeedbackAction; reasons: FeedbackReason[]; comment: string }
  ) => {
    const now = new Date().toISOString();
    const existingFeedback = getRenderedFeedback(activity.id);
    const nextFeedbackRecord: ItineraryFeedback = {
      id: existingFeedback?.id ?? `${activity.id}-${now}`,
      itineraryId: mockItinerary.id,
      itineraryItemId: activity.id,
      action: input.action,
      reasons: input.reasons,
      comment: input.comment,
      createdAt: existingFeedback?.createdAt ?? now,
      updatedAt: now,
      status: "pending"
    };
    const nextFeedback = existingFeedback
      ? feedbackRecords.map((record) => (record.id === existingFeedback.id ? nextFeedbackRecord : record))
      : [...feedbackRecords, nextFeedbackRecord];

    updateFeedback(nextFeedback);
    updateItemStates(
      upsertItemState(itemStates, {
        itineraryItemId: activity.id,
        isLocked: false,
        changeStatus: "change-requested"
      })
    );
    setActiveChangeRequestId(null);
    setNotification(activity.id, "Change request saved.");
  };

  const handleCancelChangeRequest = (activity: ItineraryActivity) => {
    updateFeedback(cancelChangeRequest(feedbackRecords, activity.id));
    updateItemStates(
      upsertItemState(itemStates, {
        itineraryItemId: activity.id,
        isLocked: false,
        changeStatus: "unchanged"
      })
    );
    setActiveChangeRequestId(null);
    setNotification(activity.id, "Change request cancelled.");
  };

  const handleRemove = (activity: ItineraryActivity) => {
    const currentState = getRenderedState(activity.id);

    if (currentState.isLocked) {
      setNotification(activity.id, "Unlock this activity before removing it.");
      return;
    }

    const confirmed = window.confirm("Remove this activity from your draft?");

    if (!confirmed) {
      return;
    }

    updateFeedback(cancelChangeRequest(feedbackRecords, activity.id));
    updateItemStates(
      upsertItemState(itemStates, {
        itineraryItemId: activity.id,
        isLocked: false,
        changeStatus: "removed"
      })
    );
    setActiveChangeRequestId(null);
    setNotification(activity.id, "Activity removed from your draft.");
  };

  const handleUndoRemove = (activity: ItineraryActivity) => {
    updateItemStates(
      upsertItemState(itemStates, {
        itineraryItemId: activity.id,
        isLocked: false,
        changeStatus: "unchanged"
      })
    );
    setNotification(activity.id, "Activity restored.");
  };

  const lockedCount = itemStates.filter((state) => state.isLocked).length;
  const changeRequestCount = itemStates.filter((state) => state.changeStatus === "change-requested").length;
  const removedCount = itemStates.filter((state) => state.changeStatus === "removed").length;

  const handleSaveOverallFeedback = (comment: string) => {
    const nextFeedback = {
      itineraryId: mockItinerary.id,
      comment,
      updatedAt: new Date().toISOString()
    };

    setOverallFeedback(nextFeedback);
    saveOverallFeedback(nextFeedback);
  };

  if (!tripSearchData || !preferences) {
    return (
      <main className="min-h-screen bg-[#f8f4ee] text-ink">
        <AppHeader />
        <PageContainer>
          <section className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center text-center">
            <h1 className="text-4xl font-bold">Create your plan first</h1>
            <p className="mt-4 text-lg leading-8 text-slate-700">
              The demo itinerary needs saved trip details and preferences from this planning session.
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
      <div className="absolute inset-x-[-6rem] top-[-4rem] h-[24rem] bg-[radial-gradient(circle_at_22%_28%,rgba(47,156,143,0.18),rgba(47,156,143,0.08)_34%,transparent_66%),radial-gradient(circle_at_78%_22%,rgba(244,124,86,0.14),rgba(244,124,86,0.05)_36%,transparent_68%)] blur-xl [mask-image:linear-gradient(to_bottom,black_0%,black_62%,transparent_100%)]" />
      <AppHeader />
      <PageContainer>
        <div className="relative space-y-6 pb-12 pt-4">
          <ItineraryHeader itinerary={mockItinerary} tripSearchData={tripSearchData} preferences={preferences} />
          <FeedbackSummary lockedCount={lockedCount} changeRequestCount={changeRequestCount} removedCount={removedCount} />
          <section className="rounded-[2rem] border border-white/70 bg-white/80 p-5 shadow-sm">
            <h2 className="text-2xl font-bold text-ink">Trip overview</h2>
            <p className="mt-3 text-base leading-7 text-slate-700">{mockItinerary.summary}</p>
            <p className="mt-3 rounded-2xl bg-coast-50 px-4 py-3 text-sm font-semibold text-coast-700">
              Hotel placeholder: {mockItinerary.hotelPlaceholder}
            </p>
          </section>
          <OverallFeedbackBox
            initialComment={overallFeedback?.comment ?? ""}
            onSave={handleSaveOverallFeedback}
          />
          <DaySelector days={mockItinerary.days} selectedDay={selectedDay} onSelectDay={setSelectedDay} />
          <DayTimeline
            day={selectedItineraryDay}
            activeChangeRequestId={activeChangeRequestId}
            notifications={notifications}
            getState={getRenderedState}
            getFeedback={getRenderedFeedback}
            onToggleLock={handleToggleLock}
            onStartChangeRequest={handleStartChangeRequest}
            onCancelPanel={() => setActiveChangeRequestId(null)}
            onSaveChangeRequest={handleSaveChangeRequest}
            onCancelChangeRequest={handleCancelChangeRequest}
            onRemove={handleRemove}
            onUndoRemove={handleUndoRemove}
          />
          <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
            <CostSummary costSummary={mockItinerary.costSummary} />
            <ItineraryNotes notes={mockItinerary.notes} />
          </div>
        </div>
      </PageContainer>
    </main>
  );
};
