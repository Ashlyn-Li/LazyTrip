"use client";

import dynamic from "next/dynamic";

const DemoItinerary = dynamic(
  () => import("@/components/itinerary/demo-itinerary").then((module) => module.DemoItinerary),
  {
    ssr: false,
    loading: () => (
      <main className="min-h-screen bg-[#f8f4ee] text-ink">
        <section className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center px-5 text-center">
          <h1 className="text-4xl font-bold">Loading your demo itinerary</h1>
        </section>
      </main>
    )
  }
);

export default function DemoTripPage() {
  return <DemoItinerary />;
}
