"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Trash2, Edit2, Plus, Filter, Bell, BellOff, Clock } from "lucide-react"
import { toast } from "sonner"

type Priority = "high" | "medium" | "low"

interface Task {
  id: string
  text: string
  priority: Priority
  completed: boolean
  createdAt: number
  reminderTime?: string // ISO string for reminder date/time
  reminderNotified?: boolean // Track if notification was already shown
}

export default function TaskFlow() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [newTaskText, setNewTaskText] = useState("")
  const [newTaskPriority, setNewTaskPriority] = useState<Priority>("medium")
  const [newTaskReminder, setNewTaskReminder] = useState("")
  const [filterPriority, setFilterPriority] = useState<Priority | "all">("all")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState("")
  const [editReminder, setEditReminder] = useState("")
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>("default")

  // Load tasks from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("taskflow-tasks")
    if (saved) {
      try {
        setTasks(JSON.parse(saved))
      } catch (e) {
        console.error("Failed to parse tasks from localStorage", e)
      }
    }
  }, [])

  // Save tasks to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("taskflow-tasks", JSON.stringify(tasks))
  }, [tasks])

  // Request notification permission on mount
  useEffect(() => {
    if ("Notification" in window) {
      setNotificationPermission(Notification.permission)
    }
  }, [])

  // Check for reminders every 30 seconds
  useEffect(() => {
    const checkReminders = () => {
      const now = new Date().getTime()
      
      tasks.forEach((task) => {
        if (task.reminderTime && !task.reminderNotified && !task.completed) {
          const reminderTime = new Date(task.reminderTime).getTime()
          
          // If reminder time has passed (within 1 minute window)
          if (reminderTime <= now && now - reminderTime < 60000) {
            // Show notification
            if (notificationPermission === "granted") {
              new Notification("TaskFlow Reminder", {
                body: `⏰ ${task.text}`,
                icon: "/favicon.ico",
                tag: task.id,
                requireInteraction: false
              })
            }
            
            // Show toast
            toast.info(`⏰ Reminder: ${task.text}`, {
              duration: 10000,
              action: {
                label: "Mark Complete",
                onClick: () => toggleComplete(task.id)
              }
            })
            
            // Mark as notified
            setTasks((prevTasks) =>
              prevTasks.map((t) =>
                t.id === task.id ? { ...t, reminderNotified: true } : t
              )
            )
          }
        }
      })
    }

    const interval = setInterval(checkReminders, 30000) // Check every 30 seconds
    checkReminders() // Check immediately on mount
    
    return () => clearInterval(interval)
  }, [tasks, notificationPermission])

  const requestNotificationPermission = async () => {
    if ("Notification" in window && Notification.permission === "default") {
      const permission = await Notification.requestPermission()
      setNotificationPermission(permission)
      if (permission === "granted") {
        toast.success("Notifications enabled! You'll receive reminders for your tasks.")
      } else {
        toast.error("Notifications blocked. You won't receive reminder alerts.")
      }
    }
  }

  const addTask = () => {
    if (!newTaskText.trim()) return
    
    // Validate reminder time is in the future
    if (newTaskReminder) {
      const reminderTime = new Date(newTaskReminder).getTime()
      const now = new Date().getTime()
      if (reminderTime < now) {
        toast.error("Reminder time must be in the future")
        return
      }
    }
    
    const newTask: Task = {
      id: Date.now().toString(),
      text: newTaskText.trim(),
      priority: newTaskPriority,
      completed: false,
      createdAt: Date.now(),
      reminderTime: newTaskReminder || undefined,
      reminderNotified: false
    }
    
    setTasks([...tasks, newTask])
    setNewTaskText("")
    setNewTaskPriority("medium")
    setNewTaskReminder("")
    
    if (newTaskReminder) {
      toast.success("Task added with reminder set!")
      if (notificationPermission === "default") {
        toast.info("Enable notifications to receive reminders", {
          action: {
            label: "Enable",
            onClick: requestNotificationPermission
          }
        })
      }
    }
  }

  const deleteTask = (id: string) => {
    setTasks(tasks.filter(task => task.id !== id))
  }

  const toggleComplete = (id: string) => {
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, completed: !task.completed } : task
    ))
  }

  const startEdit = (task: Task) => {
    setEditingId(task.id)
    setEditText(task.text)
    setEditReminder(task.reminderTime || "")
  }

  const saveEdit = () => {
    if (!editText.trim() || !editingId) return
    
    // Validate reminder time is in the future if set
    if (editReminder) {
      const reminderTime = new Date(editReminder).getTime()
      const now = new Date().getTime()
      if (reminderTime < now) {
        toast.error("Reminder time must be in the future")
        return
      }
    }
    
    setTasks(tasks.map(task => 
      task.id === editingId ? { 
        ...task, 
        text: editText.trim(),
        reminderTime: editReminder || undefined,
        reminderNotified: false // Reset notification flag when editing reminder
      } : task
    ))
    setEditingId(null)
    setEditText("")
    setEditReminder("")
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditText("")
    setEditReminder("")
  }

  const removeReminder = (taskId: string) => {
    setTasks(tasks.map(task =>
      task.id === taskId ? { ...task, reminderTime: undefined, reminderNotified: false } : task
    ))
    toast.success("Reminder removed")
  }

  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case "high":
        return "bg-red-500 hover:bg-red-600 text-white"
      case "medium":
        return "bg-yellow-500 hover:bg-yellow-600 text-white"
      case "low":
        return "bg-green-500 hover:bg-green-600 text-white"
    }
  }

  const getPriorityValue = (priority: Priority) => {
    switch (priority) {
      case "high": return 3
      case "medium": return 2
      case "low": return 1
    }
  }

  const formatReminderTime = (isoString: string) => {
    const date = new Date(isoString)
    const now = new Date()
    const isToday = date.toDateString() === now.toDateString()
    
    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    if (isToday) {
      return `Today at ${timeStr}`
    }
    
    const dateStr = date.toLocaleDateString([], { month: 'short', day: 'numeric' })
    return `${dateStr} at ${timeStr}`
  }

  // Filter and sort tasks
  const filteredTasks = tasks
    .filter(task => filterPriority === "all" || task.priority === filterPriority)
    .sort((a, b) => {
      // Sort by completion status first (incomplete first)
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1
      }
      // Then by priority (high to low)
      return getPriorityValue(b.priority) - getPriorityValue(a.priority)
    })

  const taskStats = {
    total: tasks.length,
    completed: tasks.filter(t => t.completed).length,
    high: tasks.filter(t => t.priority === "high" && !t.completed).length,
    medium: tasks.filter(t => t.priority === "medium" && !t.completed).length,
    low: tasks.filter(t => t.priority === "low" && !t.completed).length,
    withReminders: tasks.filter(t => t.reminderTime && !t.completed).length,
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-4 space-y-6">
      {/* Header with Stats */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">TaskFlow</h1>
        <p className="text-muted-foreground">Organize your tasks with priority scheduling</p>
        
        <div className="flex justify-center gap-4 flex-wrap">
          <Badge variant="outline" className="text-sm py-1.5 px-3">
            Total: {taskStats.total}
          </Badge>
          <Badge variant="outline" className="text-sm py-1.5 px-3">
            Completed: {taskStats.completed}
          </Badge>
          <Badge className="bg-red-500 hover:bg-red-600 text-sm py-1.5 px-3">
            High: {taskStats.high}
          </Badge>
          <Badge className="bg-yellow-500 hover:bg-yellow-600 text-sm py-1.5 px-3">
            Medium: {taskStats.medium}
          </Badge>
          <Badge className="bg-green-500 hover:bg-green-600 text-sm py-1.5 px-3">
            Low: {taskStats.low}
          </Badge>
          <Badge className="bg-blue-500 hover:bg-blue-600 text-sm py-1.5 px-3">
            <Bell className="w-3 h-3 mr-1" />
            Reminders: {taskStats.withReminders}
          </Badge>
        </div>
        
        {notificationPermission !== "granted" && (
          <div className="max-w-2xl mx-auto">
            <Card className="p-4 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-3">
                <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    Enable Notifications
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                    Get reminded when your tasks are due. You can set reminders for any task.
                  </p>
                </div>
                <Button 
                  size="sm" 
                  onClick={requestNotificationPermission}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Enable
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Add Task Form */}
      <Card className="p-6">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Add New Task</h2>
          <div className="flex gap-3 flex-col sm:flex-row">
            <Input
              placeholder="What needs to be done?"
              value={newTaskText}
              onChange={(e) => setNewTaskText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addTask()}
              className="flex-1"
            />
            <Select value={newTaskPriority} onValueChange={(value) => setNewTaskPriority(value as Priority)}>
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="high">High Priority</SelectItem>
                <SelectItem value="medium">Medium Priority</SelectItem>
                <SelectItem value="low">Low Priority</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={addTask} className="w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              Add Task
            </Button>
          </div>
          
          {/* Reminder Time Input */}
          <div className="flex items-center gap-3">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <Input
              type="datetime-local"
              value={newTaskReminder}
              onChange={(e) => setNewTaskReminder(e.target.value)}
              className="flex-1"
              placeholder="Set reminder time (optional)"
            />
            {newTaskReminder && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setNewTaskReminder("")}
              >
                Clear
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <Filter className="w-4 h-4 text-muted-foreground" />
        <Select value={filterPriority} onValueChange={(value) => setFilterPriority(value as Priority | "all")}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            <SelectItem value="high">High Priority</SelectItem>
            <SelectItem value="medium">Medium Priority</SelectItem>
            <SelectItem value="low">Low Priority</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Task List */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground text-lg">
              {tasks.length === 0 
                ? "No tasks yet. Add your first task above!" 
                : "No tasks match this filter."}
            </p>
          </Card>
        ) : (
          filteredTasks.map((task) => (
            <Card key={task.id} className={`p-4 transition-all ${task.completed ? "opacity-60" : ""}`}>
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={task.completed}
                  onCheckedChange={() => toggleComplete(task.id)}
                  className="mt-1"
                />
                
                <div className="flex-1 min-w-0">
                  {editingId === task.id ? (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Input
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveEdit()
                            if (e.key === "Escape") cancelEdit()
                          }}
                          autoFocus
                          className="flex-1"
                        />
                        <Button onClick={saveEdit} size="sm">Save</Button>
                        <Button onClick={cancelEdit} size="sm" variant="outline">Cancel</Button>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-3 h-3 text-muted-foreground" />
                        <Input
                          type="datetime-local"
                          value={editReminder}
                          onChange={(e) => setEditReminder(e.target.value)}
                          className="flex-1 text-sm"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <p className={`text-base ${task.completed ? "line-through" : ""}`}>
                        {task.text}
                      </p>
                      {task.reminderTime && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Bell className="w-3 h-3" />
                          <span>{formatReminderTime(task.reminderTime)}</span>
                          {task.reminderNotified && (
                            <Badge variant="outline" className="text-xs py-0 px-1">
                              Notified
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <Badge className={`${getPriorityColor(task.priority)} capitalize`}>
                  {task.priority}
                </Badge>

                <div className="flex gap-2">
                  {task.reminderTime && editingId !== task.id && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeReminder(task.id)}
                      title="Remove reminder"
                    >
                      <BellOff className="w-4 h-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => startEdit(task)}
                    disabled={editingId !== null}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteTask(task.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Quick Actions */}
      {tasks.length > 0 && (
        <div className="flex justify-center gap-3 pt-4">
          <Button
            variant="outline"
            onClick={() => {
              const completedTasks = tasks.filter(t => t.completed)
              if (completedTasks.length > 0) {
                setTasks(tasks.filter(t => !t.completed))
                toast.success(`Cleared ${completedTasks.length} completed task(s)`)
              }
            }}
          >
            Clear Completed ({taskStats.completed})
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setTasks([])
              toast.success("All tasks cleared")
            }}
          >
            Clear All
          </Button>
        </div>
      )}
    </div>
  )
}