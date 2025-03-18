"use client";

import React, { createContext, useContext } from "react";
import { useSession } from "next-auth/react";

interface UserContextType {
  userId: string | null;
  userName: string | null;
  isLoading: boolean;
}

const UserContext = createContext<UserContextType>({
  userId: null,
  userName: null,
  isLoading: true,
});

export const useUser = () => useContext(UserContext);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();

  const userId = session?.user?.id || null;
  const userName = session?.user?.name || null;
  const isLoading = status === "loading";

  return (
    <UserContext.Provider value={{ userId, userName, isLoading }}>
      {children}
    </UserContext.Provider>
  );
}
