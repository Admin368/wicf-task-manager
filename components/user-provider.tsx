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
    const initUser = async () => {
      // Check if user info is in localStorage
      const storedUserId = localStorage.getItem("userId")
      const storedUserName = localStorage.getItem("userName")

      if (storedUserId && storedUserName) {
        setUserId(storedUserId)
        setUserName(storedUserName)
        setIsLoading(false)
        // window.location.reload()
      } else {
        // Create a temporary anonymous user if none exists
        // This ensures we always have a userId
        const tempName = `User-${Math.floor(Math.random() * 100000)}`
        try {
          const user = await getOrCreateUser.mutateAsync({ name: tempName })
          
          // Save to localStorage
          localStorage.setItem("userId", user.id)
          localStorage.setItem("userName", user.name)

          setUserId(user.id)
          setUserName(user.name)
          setShowDialog(true) // Still show dialog to let user set a real name
        } catch (error) {
          console.error("Failed to create anonymous user:", error)
        } finally {
          setIsLoading(false)
        }
      }
    }

    initUser()
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
      window.location.reload()
    } catch (error) {
      console.error("Failed to create user:", error)
    }
  }

  // Show loading indicator while initializing
  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Initializing user...</div>
  }

  return (
    <UserContext.Provider value={{ userId, userName, isLoading }}>
      {showDialog && <UserNameDialog onSubmit={handleUserNameSubmit} />}
      {children}
    </UserContext.Provider>
  )
}

