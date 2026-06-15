"use client";

import { Button } from "@/components/ui/button";
import { Compass } from "lucide-react";
import { useTour } from "./TourProvider";
import { getTourForRole } from "./tour-steps";
import type { UserRole } from "@/types";

interface RestartTourButtonProps {
  role: UserRole;
}

export function RestartTourButton({ role }: RestartTourButtonProps) {
  const { start } = useTour();

  return (
    <Button
      variant="outline"
      size="lg"
      onClick={() => {
        const key = `bright_tour_completed_${role}`;
        localStorage.removeItem(key);
        start(getTourForRole(role), role);
      }}
    >
      <Compass className="size-4 mr-2" />
      Take the tour
    </Button>
  );
}
