"use client";

import type { TourVisual } from "../tour-steps/types";
import { EventGlance } from "./EventGlance";
import { TaskChecklist } from "./TaskChecklist";
import { NotificationFlow } from "./NotificationFlow";
import { CommandSearch } from "./CommandSearch";
import { SettingsTeam } from "./SettingsTeam";
import { BriefingForm } from "./BriefingForm";
import { AssetUpload } from "./AssetUpload";
import { ApprovalFlow } from "./ApprovalFlow";
import { LiveDashboard } from "./LiveDashboard";
import { ReportCard } from "./ReportCard";
import { PipelineKanban } from "./PipelineKanban";
import { QaChecklist } from "./QaChecklist";
import { LogisticsTimeline } from "./LogisticsTimeline";
import { StudioBuilds } from "./StudioBuilds";
import { PartnerReferral, PartnerEarnings } from "./PartnerVisuals";

const VISUAL_MAP: Record<TourVisual, React.ComponentType> = {
  "event-glance": EventGlance,
  "task-checklist": TaskChecklist,
  notifications: NotificationFlow,
  "command-search": CommandSearch,
  "settings-team": SettingsTeam,
  "briefing-form": BriefingForm,
  "asset-upload": AssetUpload,
  "approval-flow": ApprovalFlow,
  "live-dashboard": LiveDashboard,
  "report-card": ReportCard,
  "pipeline-kanban": PipelineKanban,
  "qa-checklist": QaChecklist,
  "logistics-timeline": LogisticsTimeline,
  "studio-builds": StudioBuilds,
  "partner-referral": PartnerReferral,
  "partner-earnings": PartnerEarnings,
};

export function TourVisualRenderer({ visual }: { visual: TourVisual }) {
  const Component = VISUAL_MAP[visual];
  if (!Component) return null;
  return <Component />;
}
