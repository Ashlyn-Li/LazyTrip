"use client";

import { useEffect } from "react";

import { AppHeader } from "@/components/layout/app-header";
import { PageContainer } from "@/components/layout/page-container";
import { TripSearchForm } from "@/components/trip-search/trip-search-form";
import { clearPlanningSession } from "@/lib/storage/planning-session";

export const HomePage = () => {
  useEffect(() => {
    clearPlanningSession();
  }, []);

  return (
    <main className="min-h-screen overflow-hidden bg-[#fbf6fb] text-ink">
      <div className="absolute inset-x-[-6rem] top-[-4rem] h-[28rem] bg-[radial-gradient(circle_at_22%_28%,rgba(238,127,168,0.28),rgba(238,127,168,0.12)_34%,transparent_66%),radial-gradient(circle_at_78%_22%,rgba(140,110,232,0.18),rgba(140,110,232,0.07)_36%,transparent_68%)] blur-xl [mask-image:linear-gradient(to_bottom,black_0%,black_62%,transparent_100%)]" />
      <AppHeader />
      <PageContainer>
        <div className="relative">
          <section className="grid min-h-[calc(100vh-5rem)] items-center gap-10 pb-12 pt-4 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16 lg:pb-16 xl:gap-24">
            <div className="max-w-xl">
              <p className="mb-4 inline-flex rounded-full bg-white/80 px-4 py-2 text-sm font-semibold text-coast-700 shadow-sm">
                International trips, calmly planned
              </p>
              <h1 className="text-5xl font-bold leading-tight tracking-normal text-ink sm:text-6xl">
                LazyTrip
              </h1>
              <p className="mt-5 text-2xl font-semibold leading-snug text-coast-700">
                Tell us where. We&apos;ll plan the rest.
              </p>
              <p className="mt-5 max-w-lg text-lg leading-8 text-slate-700">
                Create a personalized international trip without spending hours planning it.
              </p>
            </div>
            <TripSearchForm />
          </section>
        </div>
      </PageContainer>
    </main>
  );
};
