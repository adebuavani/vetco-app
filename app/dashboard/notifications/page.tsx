'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Bell, Check, X } from 'lucide-react'

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: 'New message from Dr. Sarah',
      description: 'You have a new message regarding your cow\'s health.',
      time: '2 hours ago',
      read: false,
    },
    {
      id: 2,
      title: 'Vaccination reminder',
      description: 'Your cattle are due for vaccination next week.',
      time: '1 day ago',
      read: true,
    },
    {
      id: 3,
      title: 'New vet in your area',
      description: 'Dr. Michael has joined VETCO and is available in your area.',
      time: '3 days ago',
      read: false,
    },
  ])
  
  const markAsRead = (id: number) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, read: true } 
          : notification
      )
    )
  }
  
  const deleteNotification = (id: number) => {
    setNotifications(prev => 
      prev.filter(notification => notification.id !== id)
    )
  }
  
  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    )
  }
  
  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Notifications</h1>
        {notifications.some(n => !n.read) && (
          <Button variant="outline" onClick={markAllAsRead}>
            Mark all as read
          </Button>
        )}
      </div>
      
      {notifications.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-6">
            <Bell className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No notifications</p>
            <p className="text-muted-foreground">
              You don't have any notifications at the moment.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {notifications.map(notification => (
            <Card 
              key={notification.id} 
              className={notification.read ? 'bg-background' : 'bg-muted/20'}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-base font-medium">
                      {notification.title}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {notification.description}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {notification.time}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    {!notification.read && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => markAsRead(notification.id)}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => deleteNotification(notification.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}