import Countdown from "./components/Countdown";
import NotifyForm from "./components/NotifyForm";

// Launch date shown in the countdown. Update this to your real launch date.
const LAUNCH_DATE = "2027-01-01T00:00:00Z";

export default function Home() {
  return (
    <main className="relative flex flex-1 items-center justify-center overflow-hidden px-4 py-20">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-128 w-lg -translate-x-1/2 rounded-full bg-accent/20 blur-3xl"
      />

      <div className="relative w-full max-w-2xl text-center">
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.3em] text-accent">
          Prostyle Sports Wear
        </p>
        <h1 className="text-5xl font-black uppercase italic tracking-tight sm:text-7xl">
          Coming Soon
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-base text-foreground/70 sm:text-lg">
          Performance gear built for athletes who never settle. Leave your
          email and be the first to know when we launch.
        </p>

        <Countdown target={LAUNCH_DATE} />
        <div id="notify" className="scroll-mt-32">
          <NotifyForm />
        </div>
      </div>
    </main>
  );
}
