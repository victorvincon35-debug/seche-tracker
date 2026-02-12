import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ---- localStorage helpers (extracted from App.jsx) ----

const STORAGE_KEY = "seche-tracker-v5";
const SYNC_META_KEY = "seche-tracker-sync-meta";

export const storage = {
  get(key) {
    try {
      const v = localStorage.getItem(key);
      return v ? JSON.parse(v) : null;
    } catch {
      return null;
    }
  },
  set(key, val) {
    try {
      localStorage.setItem(key, JSON.stringify(val));
      return true;
    } catch {
      return false;
    }
  },
};

// ---- Supabase sync functions ----

export async function pushToSupabase(data, userId) {
  const now = new Date().toISOString();
  const { error } = await supabase.from("user_data").upsert(
    {
      user_id: userId,
      data: data,
      updated_at: now,
    },
    { onConflict: "user_id" }
  );
  if (!error) {
    storage.set(SYNC_META_KEY, { updated_at: now, dirty: false });
  }
  return { error };
}

export async function pullFromSupabase(userId) {
  const { data: row, error } = await supabase
    .from("user_data")
    .select("data, updated_at")
    .eq("user_id", userId)
    .single();

  if (error && error.code === "PGRST116") {
    // No row exists yet (first time)
    return { data: null, updated_at: null };
  }
  return { data: row?.data, updated_at: row?.updated_at, error };
}

export async function syncOnLoad(localData, userId) {
  const meta = storage.get(SYNC_META_KEY) || {};
  const remote = await pullFromSupabase(userId);

  if (remote.error) return localData; // offline or error — use local

  if (!remote.data) {
    // No remote data — push local up (first time migration)
    if (localData) await pushToSupabase(localData, userId);
    return localData;
  }

  const localTime = meta.updated_at ? new Date(meta.updated_at) : new Date(0);
  const remoteTime = new Date(remote.updated_at);

  if (remoteTime > localTime) {
    // Remote is newer — use remote, save to localStorage
    storage.set(STORAGE_KEY, remote.data);
    storage.set(SYNC_META_KEY, {
      updated_at: remote.updated_at,
      dirty: false,
    });
    return remote.data;
  } else if (meta.dirty) {
    // Local has unsaved changes — push to remote
    await pushToSupabase(localData, userId);
    return localData;
  }

  return localData; // Both in sync
}

// ---- Debounced push ----

let pushTimer = null;

export function debouncedPush(data, userId, delayMs = 800) {
  const meta = storage.get(SYNC_META_KEY) || {};
  storage.set(SYNC_META_KEY, { ...meta, dirty: true });

  clearTimeout(pushTimer);
  pushTimer = setTimeout(() => {
    if (navigator.onLine && userId) {
      pushToSupabase(data, userId);
    }
  }, delayMs);
}
