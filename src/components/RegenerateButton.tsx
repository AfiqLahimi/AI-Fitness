"use client";
import { useTransition } from "react";
import { Loader2, Shuffle } from "lucide-react";
import { regeneratePlanAction } from "@/lib/server/actions";
import { Button } from "./ui";

export function RegenerateButton() {
  const [pending, start] = useTransition();
  return (
    <Button variant="secondary" disabled={pending} onClick={() => { if (confirm("Generate a fresh plan? Your current customisations will be replaced.")) start(() => regeneratePlanAction()); }}>
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shuffle className="h-4 w-4" />} Regenerate plan
    </Button>
  );
}
