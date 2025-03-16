import { UserProvider } from "@/components/user-provider"
import { TaskList } from "@/components/task-list"

export default function Home() {
  return (
    <main>
      <UserProvider>
        <TaskList />
      </UserProvider>
    </main>
  )
}

