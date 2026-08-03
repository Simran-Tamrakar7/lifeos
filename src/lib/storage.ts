/** Storage adapter — swap LocalStorageAdapter for SupabaseAdapter later without touching UI. */
export interface StorageAdapter {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

export class LocalStorageAdapter implements StorageAdapter {
  async getItem(key: string): Promise<string | null> {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(key);
  }
  async setItem(key: string, value: string): Promise<void> {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(key, value);
  }
  async removeItem(key: string): Promise<void> {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(key);
  }
}

/** Future: implement with supabase.from('lifeos_data') */
export class SupabaseAdapter implements StorageAdapter {
  async getItem(key: string): Promise<string | null> {
    void key;
    throw new Error("SupabaseAdapter not configured — set NEXT_PUBLIC_SUPABASE_URL");
  }
  async setItem(key: string, value: string): Promise<void> {
    void key;
    void value;
    throw new Error("SupabaseAdapter not configured");
  }
  async removeItem(key: string): Promise<void> {
    void key;
    throw new Error("SupabaseAdapter not configured");
  }
}

export const storage: StorageAdapter = new LocalStorageAdapter();
export const LIFEOS_STORAGE_KEY = "lifeos:v1";
