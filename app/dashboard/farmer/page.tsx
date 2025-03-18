'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PlusCircle, Users, Calendar, AlertCircle } from 'lucide-react'
import Link from 'next/link'

export default function FarmerDashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [stats, setStats] = useState({
    animals: 0,
    appointments: 0,
    alerts: 0,
  })
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        
        // Get user session
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session) return
        
        // Get user profile
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single()
        
        setUser(profile || session.user)
        
        // Get animal count
        const { count: animalCount } = await supabase
          .from('animals')
          .select('*', { count: 'exact', head: true })
          .eq('farmer_id', session.user.id)
        
        // Get appointment count
        const { count: appointmentCount } = await supabase
          .from('appointments')
          .select('*', { count: 'exact', head: true })
          .eq('farmer_id', session.user.id)
        
        // Get alert count
        const { count: alertCount } = await supabase
          .from('health_alerts')
          .select('*', { count: 'exact', head: true })
          .eq('farmer_id', session.user.id)
          .eq('status', 'active')
        
        setStats({
          animals: animalCount || 0,
          appointments: appointmentCount || 0,
          alerts: alertCount || 0,
        })
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [])
  
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading dashboard...</div>
  }
  
  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Farmer Dashboard</h1>
        <div className="mt-4 md:mt-0">
          <Button asChild>
            <Link href="/dashboard/farmer/animals/add">
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Animal
            </Link>
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Animals</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.animals}</div>
            <p className="text-xs text-muted-foreground">
              Registered animals in your farm
            </p>
          </CardContent>
          <CardFooter>
            <Button variant="ghost" asChild className="w-full">
              <Link href="/dashboard/farmer/animals">View all animals</Link>
           