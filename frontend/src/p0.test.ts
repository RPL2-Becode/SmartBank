import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { API_BASE_URL } from "./api/client";
import {
  canAccess,
  clearSession,
  getStoredToken,
  storeSession,
} from "./utils";
import type { User, UserRole } from "./types";

// ---------------------------------------------------------------------------
// localStorage shim for the node-default test environment.
// vitest's default `node` environment doesn't ship with localStorage so we
// mount a tiny in-memory implementation that satisfies the Storage contract.
// ---------------------------------------------------------------------------
function installLocalStorageShim() {
  const store = new Map<string, string>();
  const shim: Storage = {
    getItem: (key: string) => (store.has(key) ? (store.get(key) as string) : null),
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => {
      store.clear();
    },
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    get length() {
      return store.size;
    },
  };
  (globalThis as unknown as { localStorage: Storage }).localStorage = shim;
}

beforeEach(() => {
  installLocalStorageShim();
});

afterEach(() => {
  clearSession();
});

// ---------------------------------------------------------------------------
// API base URL — env fallback
// ---------------------------------------------------------------------------

describe("api/client.ts — API_BASE_URL env fallback", () => {
  it("resolves to a non-empty HTTP(S) string", () => {
    expect(typeof API_BASE_URL).toBe("string");
    expect(API_BASE_URL.length).toBeGreaterThan(0);
    expect(/^https?:\/\//.test(API_BASE_URL)).toBe(true);
  });

  it("falls back to the documented localhost default when VITE_API_BASE_URL is unset", () => {
    // In `vitest` defaults VITE_API_BASE_URL is unset, so the constant
    // must resolve to the fallback declared in src/api/client.ts.
    if (!import.meta.env.VITE_API_BASE_URL) {
      expect(API_BASE_URL).toBe("http://127.0.0.1:5000/smartbank");
    } else {
      expect(API_BASE_URL).toBe(import.meta.env.VITE_API_BASE_URL);
    }
  });
});

// ---------------------------------------------------------------------------
// Token storage
// ---------------------------------------------------------------------------

describe("utils.getStoredToken — JWT round-trip", () => {
  const fakeUser: User = {
    id: "1",
    name: "Tester",
    email: "tester01",
    role: "nasabah",
    status: "active",
    createdAt: new Date().toISOString(),
  };

  it("returns null when there is no session", () => {
    expect(getStoredToken()).toBeNull();
  });

  it("returns the stored JWT after storeSession", () => {
    const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.payload.sig";
    storeSession(token, fakeUser);
    expect(getStoredToken()).toBe(token);
  });

  it("returns null after clearSession", () => {
    storeSession("token-123", fakeUser);
    clearSession();
    expect(getStoredToken()).toBeNull();
  });

  it("tolerates a malformed session payload", () => {
    localStorage.setItem("smartbank-session", "not-json");
    expect(getStoredToken()).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Role recognition — UserRole enum is exhaustive
// ---------------------------------------------------------------------------

describe("UserRole — frontend canonical roles", () => {
  const roles: UserRole[] = ["nasabah", "admin", "teller", "manager"];

  it.each(roles)("recognises %s as a valid role with at least one capability", (role) => {
    // Every canonical frontend role must have access to *something*.
    const capabilities = ["balance", "transfer", "paymentRequests", "ledger", "fees"];
    const granted = capabilities.some((capability) => canAccess(role, capability));
    expect(granted).toBe(true);
  });

  it("manager and admin have fee engine access; nasabah and teller do not", () => {
    expect(canAccess("admin", "fees")).toBe(true);
    expect(canAccess("manager", "fees")).toBe(true);
    expect(canAccess("nasabah", "fees")).toBe(false);
    expect(canAccess("teller", "fees")).toBe(false);
  });

  it("only nasabah can transfer", () => {
    expect(canAccess("nasabah", "transfer")).toBe(true);
    expect(canAccess("admin", "transfer")).toBe(false);
    expect(canAccess("teller", "transfer")).toBe(false);
    expect(canAccess("manager", "transfer")).toBe(false);
  });
});
