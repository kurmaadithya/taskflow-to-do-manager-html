"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { authClient, useSession } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import TaskFlow from "@/components/TaskFlow"

export default function Home() {
  const { data: session, isPending, refetch } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/login")
    }
  }, [session, isPending, router])

  const handleSignOut = async () => {
    const { error } = await authClient.signOut()
    if (error?.code) {
      toast.error(error.code)
    } else {
      localStorage.removeItem("bearer_token")
      refetch()
      router.push("/login")
    }
  }

  if (isPending) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!session?.user) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header with User Info */}
      <div className="border-b bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              TaskFlow
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm">
              <span className="text-muted-foreground">Welcome, </span>
              <span className="font-medium">{session.user.name}</span>
            </div>
            <Button onClick={handleSignOut} variant="outline" size="sm">
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12 space-y-4">
          <div className="inline-block">
            <p className="text-xl text-muted-foreground mt-2">
              Smart Priority-Based Task Management with Reminders
            </p>
          </div>
          
          <div className="max-w-2xl mx-auto">
            <p className="text-base text-muted-foreground leading-relaxed">
              Stay organized and focused with TaskFlow's intelligent priority scheduling. 
              Manage your tasks efficiently with automatic sorting, priority color coding, 
              reminder notifications, and persistent storage that keeps your tasks safe across sessions.
            </p>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mt-8">
            <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <div className="text-3xl mb-3">🎯</div>
              <h3 className="font-semibold text-lg mb-2">Priority Scheduling</h3>
              <p className="text-sm text-muted-foreground">
                Organize tasks by High, Medium, or Low priority with automatic sorting
              </p>
            </div>
            
            <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <div className="text-3xl mb-3">⏰</div>
              <h3 className="font-semibold text-lg mb-2">Smart Reminders</h3>
              <p className="text-sm text-muted-foreground">
                Set reminders for tasks and get notified at the right time
              </p>
            </div>
            
            <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <div className="text-3xl mb-3">💾</div>
              <h3 className="font-semibold text-lg mb-2">Auto-Save</h3>
              <p className="text-sm text-muted-foreground">
                Your tasks are automatically saved to local storage
              </p>
            </div>
          </div>
        </div>

        {/* TaskFlow Component */}
        <TaskFlow />

        {/* Footer Instructions */}
        <div className="mt-16 text-center text-sm text-muted-foreground">
          <p>💡 Tip: Tasks are sorted by completion status and priority automatically</p>
          <p className="mt-2">Press Enter to quickly add tasks • Set reminders for important deadlines • Use filters to focus</p>
        </div>
      </div>
    </div>
  )
}