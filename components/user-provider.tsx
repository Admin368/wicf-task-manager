"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { api } from "@/lib/trpc/client"
import { UserNameDialog } from "./user-name-dialog"

type UserContextType = {
  userId: string | null
  userName: string | null
  isLoading: boolean
}

const UserContext = createContext<UserContextType>({
  userId: null,
  userName: null,
  isLoading: true,
})

export const useUser = () => useContext(UserContext)

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null)
  const [userName, setUserName] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)

  const getOrCreateUser = api.users.getOrCreate.useMutation()

  useEffect(() => {
    // Check if user info is in localStorage
    const storedUserId = localStorage.getItem("userId")
    const storedUserName = localStorage.getItem("userName")

    if (storedUserId && storedUserName) {
      setUserId(storedUserId)
      setUserName(storedUserName)
      setIsLoading(false)
    } else {
      setShowDialog(true)
      setIsLoading(false)
    }
  }, [])

  const handleUserNameSubmit = async (name: string) => {
    try {
      const user = await getOrCreateUser.mutateAsync({ name })

      // Save to localStorage
      localStorage.setItem("userId", user.id)
      localStorage.setItem("userName", user.name)

      setUserId(user.id)
      setUserName(user.name)
      setShowDialog(false)
    } catch (error) {
      console.error("Failed to create user:", error)
    }
  }

  return (
    <UserContext.Provider value={{ userId, userName, isLoading }}>
      {showDialog && <UserNameDialog onSubmit={handleUserNameSubmit} />}
      {children}
    </UserContext.Provider>
  )
}

