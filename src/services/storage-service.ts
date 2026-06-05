export default class StorageService {
  static get<T>(key: string, fallback: T | null = null): T | null {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  }

  static set<T>(key: string, value: T): void {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ }
  }

  static remove(key: string): void {
    try { localStorage.removeItem(key); } catch { /* ignore */ }
  }
}
