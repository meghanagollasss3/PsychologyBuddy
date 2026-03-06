'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from '@/components/ui/use-toast'

interface AdminNotification {
  id: string
  type: 'escalation' | 'system' | 'message'
  title: string
  message: string
  priority: 'critical' | 'high' | 'medium' | 'low'
  timestamp: string
  read: boolean
  actionUrl?: string
}

export function useAdminNotifications() {
  const [notifications, setNotifications] = useState<AdminNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  // Fetch initial notifications
  const fetchNotifications = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/notifications')
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications || [])
        setUnreadCount(data.unreadCount || 0)
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    }
  }, [])

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch('/api/admin/notifications/read', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationIds: [notificationId] })
      })

      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
        )
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }, [])

  // Clear all notifications
  const clearAll = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/notifications/clear?clearAll=true', {
        method: 'DELETE'
      })

      if (response.ok) {
        setNotifications([])
        setUnreadCount(0)
        toast({ title: "All notifications cleared" })
      }
    } catch (error) {
      console.error('Failed to clear notifications:', error)
      toast({ 
        title: "Failed to clear notifications", 
        variant: "destructive" 
      })
    }
  }, [])

  // Setup real-time notifications
  useEffect(() => {
    fetchNotifications()

    // Setup WebSocket or polling for real-time updates
    const eventSource = new EventSource('/api/admin/notifications/stream')
    
    eventSource.onmessage = (event) => {
      try {
        const newNotification = JSON.parse(event.data)
        
        // Skip heartbeat and connection messages
        if (newNotification.type === 'heartbeat' || newNotification.type === 'connected') {
          console.log('[AdminNotifications] Received system message:', newNotification.type)
          return
        }
        
        // Only show toast for critical/high priority escalations
        if (newNotification.type === 'escalation' && 
            (newNotification.priority === 'critical' || newNotification.priority === 'high')) {
          toast({
            title: "🚨 Escalation Alert",
            description: newNotification.message,
            variant: "destructive"
          })
        }
        
        setNotifications(prev => [newNotification, ...prev])
        setUnreadCount(prev => prev + 1)
      } catch (error) {
        console.error('Failed to parse notification:', error)
      }
    }

    return () => {
      eventSource.close()
    }
  }, [fetchNotifications])

  return {
    notifications,
    unreadCount,
    markAsRead,
    clearAll,
    refetch: fetchNotifications
  }
}