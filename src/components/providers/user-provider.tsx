"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { PreferredUnit } from "@/lib/units";

type UserContextValue = {
  preferredUnit: PreferredUnit;
  userName: string;
  refresh: () => Promise<void>;
  setUnit: (unit: PreferredUnit) => Promise<void>;
};

const UserContext = createContext<UserContextValue | null>(null);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [preferredUnit, setPreferredUnit] = useState<PreferredUnit>("lbs");
  const [userName, setUserName] = useState("");

  const refresh = useCallback(async () => {
    const res = await fetch("/api/user");
    if (res.ok) {
      const data = await res.json();
      setPreferredUnit(data.preferredUnit);
      setUserName(data.name);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const setUnit = async (unit: PreferredUnit) => {
    await fetch("/api/user", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ preferredUnit: unit }),
    });
    setPreferredUnit(unit);
  };

  return (
    <UserContext.Provider value={{ preferredUnit, userName, refresh, setUnit }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be within UserProvider");
  return ctx;
}
