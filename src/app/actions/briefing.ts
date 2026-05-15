"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { dispatchNotification } from "@/lib/notifications/dispatch";

export async function saveBriefingResponse(
  eventId: string,
  formType: string,
  responses: Record<string, unknown>,
  submit: boolean = false
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const updateData: Record<string, unknown> = {
    responses,
  };

  if (submit) {
    updateData.is_submitted = true;
    updateData.submitted_by = user.id;
    updateData.submitted_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from("briefing_responses")
    .upsert(
      {
        event_id: eventId,
        form_type: formType,
        ...updateData,
      },
      { onConflict: "event_id,form_type" }
    );

  if (error) throw new Error(`Save failed: ${error.message}`);

  if (submit) {
    await supabase.from("audit_entries").insert({
      event_id: eventId,
      actor_id: user.id,
      action: "briefing_submitted",
      entity_type: "briefing_response",
      entity_id: eventId,
      metadata: { form_type: formType },
    });

    const [{ data: eventRow }, { data: profile }] = await Promise.all([
      supabase.from("events").select("name").eq("id", eventId).single(),
      supabase.from("profiles").select("name").eq("id", user.id).single(),
    ]);

    await dispatchNotification("briefing.submitted", {
      eventId,
      actorId: user.id,
      briefingFormType: formType,
      eventName: eventRow?.name ?? "your event",
      contactName: profile?.name ?? "The customer",
      entityType: "briefing_response",
      entityId: eventId,
    });
  }

  revalidatePath(`/events/${eventId}/briefing`);
  revalidatePath(`/events/${eventId}/actions`);
}
