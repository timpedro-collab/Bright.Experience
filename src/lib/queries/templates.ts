/** Supabase queries for event template management */

import { createClient } from "@/lib/supabase/server";

/** Fetch all active templates ordered by name */
export async function getTemplates() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("event_templates")
    .select("*")
    .eq("is_active", true)
    .order("name");

  if (error || !data) return [];
  return data;
}

/** Fetch a single template by ID */
export async function getTemplateById(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("event_templates")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return data;
}
