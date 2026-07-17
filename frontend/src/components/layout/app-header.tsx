import Link from "next/link";

export const AppHeader = () => (
  <header className="relative z-10 px-5 py-6 sm:px-8 lg:px-12">
    <Link
      href="/"
      className="inline-flex items-center rounded-full text-xl font-bold tracking-normal text-ink focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-coral-500"
    >
      LazyTrip
    </Link>
  </header>
);
