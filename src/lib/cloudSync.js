import { supabase, CLOUD_ENABLED } from "./supabase";

const TABLE = "app_state";
const ROW_ID = 1;

// Load full state from Supabase. Returns null if unavailable.
export async function loadFromCloud() {
  if (!CLOUD_ENABLED) return null;
  try {
    const { data, error } = await supabase
      .from(TABLE)
      .select("data, updated_at")
      .eq("id", ROW_ID)
      .single();
    if (error || !data) return null;
    return data;
  } catch {
    return null;
  }
}

// Save full state to Supabase (upsert single row).
export async function saveToCloud(state) {
  if (!CLOUD_ENABLED) return;
  try {
    await supabase.from(TABLE).upsert({
      id: ROW_ID,
      data: state,
      updated_at: new Date().toISOString(),
    });
  } catch {
    // Fail silently — localStorage is the fallback
  }
}

// Debounce helper
let debounceTimer = null;
export function debouncedSave(state, delayMs = 2000) {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => saveToCloud(state), delayMs);
}
