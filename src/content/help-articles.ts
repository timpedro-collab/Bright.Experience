/** Help center articles — static content rendered on /help and /help/[slug]. */

export interface HelpArticle {
  slug: string;
  title: string;
  category: string;
  body: string;
}

export const HELP_CATEGORIES = [
  "Getting Started",
  "Events",
  "Assets & Creative",
  "Live Dashboards",
  "Reports & Exports",
  "Account & Team",
] as const;

export type HelpCategory = (typeof HELP_CATEGORIES)[number];

export const HELP_ARTICLES: HelpArticle[] = [
  {
    slug: "what-is-bright-experience",
    title: "What is Bright.Experience?",
    category: "Getting Started",
    body: `Bright.Experience is the end-to-end delivery platform for Bright.Blue interactive activations. It gives you a single place to manage your event from confirmation through to post-event reporting.\n\nYou can track milestones, upload brand assets, communicate with your delivery team, watch live telemetry on event day, and download proof-of-performance reports — all without leaving the portal.`,
  },
  {
    slug: "first-login",
    title: "I just received my login — what do I do first?",
    category: "Getting Started",
    body: `After logging in you'll land on the home screen showing your featured event. Start by:\n\n1. **Complete your briefing** — tell us about your brand, goals, and any special requirements.\n2. **Upload brand assets** — logos, colour palettes, and any imagery you'd like on the activation.\n3. **Review your timeline** — see every milestone between now and event day.\n\nYour account manager will also reach out to schedule a kick-off call.`,
  },
  {
    slug: "how-stages-work",
    title: "How do event stages work?",
    category: "Events",
    body: `Every event moves through ten stages: Confirmed → Kick-off Complete → Creative Assets → Approvals → Build Configuration → QA Readiness → Logistics Confirmed → Event Live → Reporting → Complete.\n\nYou'll see a progress bar on each event showing the current stage. Some stages need your input (uploading assets, approving designs); others are handled by the Bright.Blue team behind the scenes. Your task list will tell you exactly what's needed from you at each step.`,
  },
  {
    slug: "event-health-status",
    title: "What do the health status colours mean?",
    category: "Events",
    body: `Each event has a health indicator:\n\n- **Green (On track)** — everything is progressing as expected.\n- **Amber (At risk)** — a milestone is approaching or slightly overdue. Check your task list.\n- **Red (Blocked)** — something is preventing progress. Your account manager will flag the specific blocker.\n\nHealth is calculated automatically based on milestone dates and task completion.`,
  },
  {
    slug: "briefing-guide",
    title: "How do I complete my briefing?",
    category: "Events",
    body: `Navigate to your event and open the **Briefing** tab. Fill in the sections for brand overview, campaign goals, target audience, and any venue-specific requirements.\n\nYou can save a draft and come back later — progress is saved automatically. Once you're happy, submit the briefing and your account manager will review it within one working day.`,
  },
  {
    slug: "uploading-assets",
    title: "What file formats are supported for brand assets?",
    category: "Assets & Creative",
    body: `We accept:\n\n- **Images**: PNG, JPG, SVG, WebP (vector formats preferred for logos)\n- **Videos**: MP4, MOV (under 500 MB)\n- **Documents**: PDF, AI, PSD, EPS\n\nUpload assets via the **Assets** tab on your event. Each file is versioned — uploading a new version won't delete the old one. The creative team will pull the latest approved version when building your activation.`,
  },
  {
    slug: "studio-requests",
    title: "How do I request creative work from Bright.Studio?",
    category: "Assets & Creative",
    body: `Open the **Studio** tab on your event and click **New request**. Describe what you need (static graphics, motion content, custom screens, etc.), attach reference files, and set a priority.\n\nThe studio team will review your request and provide a timeline. You can track progress and leave feedback directly in the portal.`,
  },
  {
    slug: "approval-workflow",
    title: "How does the approval process work?",
    category: "Assets & Creative",
    body: `When the creative team finishes a deliverable, it's posted for your approval in the **Approvals** tab. You can:\n\n- **Approve** — the asset is locked and used in the build.\n- **Request changes** — leave specific feedback and the team will revise.\n\nApprovals have a deadline to keep the project on track. If the deadline passes without a response, your account manager will follow up.`,
  },
  {
    slug: "live-dashboard",
    title: "What does the live dashboard show?",
    category: "Live Dashboards",
    body: `On event day, your **Live** tab becomes a real-time dashboard showing:\n\n- **Total plays** — how many people have interacted with the activation.\n- **Leads captured** — opt-ins collected through the experience.\n- **Prizes won** — if your activation has a prize mechanic.\n- **Average dwell time** — how long each visitor engages.\n\nData refreshes every 10 seconds. You'll also see an hourly breakdown chart, a live activity feed, and machine status cards.`,
  },
  {
    slug: "no-data-live",
    title: "The live dashboard shows all zeros — is something wrong?",
    category: "Live Dashboards",
    body: `If your event hasn't started yet or the machines haven't been connected, the dashboard will show zeros. This is normal.\n\nOnce the machines are powered on and connected at the venue, metrics will appear automatically. If data still isn't showing during your event, contact your account manager — they can check the machine connection status.`,
  },
  {
    slug: "downloading-reports",
    title: "How do I download my post-event report?",
    category: "Reports & Exports",
    body: `After your event wraps, the **Reports** tab will show your proof-of-performance summary with headline metrics, predicted vs actual comparisons, and benchmark data.\n\nUse the **Export** menu in the top-right corner to download as PDF or CSV. You can also share a read-only link with stakeholders who don't have a portal login.`,
  },
  {
    slug: "lead-export",
    title: "How do I export my leads?",
    category: "Reports & Exports",
    body: `Go to your event's **Leads** tab. You'll see a table of all captured leads with name, email, and any custom fields. Click **Export** to download as CSV or Excel.\n\nLeads are available in real time during the event and remain accessible after it wraps. Data is retained for 12 months by default.`,
  },
  {
    slug: "report-not-ready",
    title: "My event ended but the report isn't ready yet — why?",
    category: "Reports & Exports",
    body: `Reports are generated after all post-event data has been collected and validated. This usually takes 1–3 working days after the event ends.\n\nYou'll receive a notification when your report is ready. If it's been longer than expected, your account manager can check the status.`,
  },
  {
    slug: "change-password",
    title: "How do I change my password?",
    category: "Account & Team",
    body: `Go to **Settings** from the sidebar. Under the **Security** section you can update your password. You'll need to enter your current password and then choose a new one.\n\nIf you've forgotten your current password, use the **Forgot password** link on the login page to receive a reset email.`,
  },
  {
    slug: "team-access",
    title: "Can I invite colleagues to the portal?",
    category: "Account & Team",
    body: `Account access is managed by your Bright.Blue account manager. If you need to add team members, let them know and they'll send invitations.\n\nEach team member gets their own login and can see the same events associated with your account. Permissions may vary depending on the role assigned.`,
  },
];

/** Find an article by slug. */
export function getArticleBySlug(slug: string): HelpArticle | undefined {
  return HELP_ARTICLES.find((a) => a.slug === slug);
}
