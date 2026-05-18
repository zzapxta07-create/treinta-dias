import { supabase, CLOUD_ENABLED } from "./supabase";

const TABLE = "app_state";
const ROW_ID = 1;

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

// Save with up to 3 retries on failure
export async function saveToCloud(state) {
  if (!CLOUD_ENABLED) return;
  const payload = { id: ROW_ID, data: state, updated_at: new Date().toISOString() };
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const { error } = await supabase.from(TABLE).upsert(payload);
      if (!error) return;
    } catch {}
    if (attempt < 3) await new Promise((r) => setTimeout(r, attempt * 1000));
  }
}

let debounceTimer = null;

// Debounced save — used for frequent state changes
export function debouncedSave(state, delayMs = 2000) {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => saveToCloud(state), delayMs);
}

// Immediate save — used for critical phase transitions (evidence submit, day close, etc.)
export function immediateSave(state) {
  clearTimeout(debounceTimer);
  saveToCloud(state);
}
