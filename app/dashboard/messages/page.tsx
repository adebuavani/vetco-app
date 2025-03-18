'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function MessagesPage() {
  const [user, setUser] = useState<any>(null)
  
  useEffect(() => {
    async function getUser() {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        setUser(session.user)
      }
    }
    
    getUser()
  }, [])
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Messages</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Your Messages</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Messaging functionality will be implemented soon. Check back later!
          </p>
        </CardContent>
      </Card>
    </div>
  )
}