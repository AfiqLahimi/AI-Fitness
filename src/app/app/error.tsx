"use client";
import { Button } from "@/components/ui";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="grid min-h-[50vh] place-items-center text-center">
      <div>
        <h2 className="font-display text-2xl font-bold">Something went wrong</h2>
        <p className="mt-2 text-dim">{error.digest ? `Reference: ${error.digest}` : "Please try again."}</p>
        <Button className="mt-6" onClick={reset}>Try again</Button>
      </div>
    </div>
  );
}
