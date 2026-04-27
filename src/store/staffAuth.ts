"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type StaffSession = {
  id: string;
  name: string;
  role: "cashier" | "manager" | "admin" | "kitchen";
};

type AuthState = {
  staff: StaffSession | null;
  setStaff: (s: StaffSession | null) => void;
  logout: () => void;
};

export const useStaffAuth = create<AuthState>()(
  persist(
    (set) => ({
      staff: null,
      setStaff: (s) => set({ staff: s }),
      logout: () => set({ staff: null }),
    }),
    { name: "mm-staff-session" }
  )
);
