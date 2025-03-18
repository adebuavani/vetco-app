'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { FileUpload } from '@/components/file-upload'
import { toast } from '@/components/ui/use-toast'

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    location: '',
    bio: '',
    avatar_url: '',
  })

  useEffect(() => {
    async function getProfile() {
      try {
        setLoading(true)
        
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session) return
        
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single()
        
        if (error) throw error
        
        setUser(data)
        setFormData({
          full_name: data.full_name || '',
          email: data.email || '',
          phone: data.phone || '',
          location: data.location || '',
          bio: data.bio || '',
          avatar_url: data.avatar_url || '',
        })
      } catch (error) {
        console.error('Error loading profile:', error)
      } finally {
        setLoading(false)
      }
    }
    
    getProfile()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) return
    
    try {
      setSaving(true)
      
      const { error } = await supabase
        .from('users')
        .update({
          full_name: formData.full_name,
          phone: formData.phone,
          location: formData.location,
          bio: formData.bio,
        })
        .eq('id', user.id)
      
      if (error) throw error
      
      toast({
        title: 'Success',
        description: 'Profile updated successfully',
      })
    } catch (error: any) {
      console.error('Error updating profile:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to update profile',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarUpload = async (filePath: string) => {
    if (!user) return
    
    try {
      const { error } = await supabase
        .from('users')
        .update({
          avatar_url: filePath,
        })
        .eq('id', user.id)
      
      if (error) throw error
      
      setFormData(prev => ({ ...prev, avatar_url: filePath }))
      
      toast({
        title: 'Success',
        description: 'Profile picture updated successfully',
      })
    } catch (error: any) {
      console.error('Error updating avatar:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to update profile picture',
        variant: 'destructive',
      })
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading profile...</div>
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">My Profile</h1>
      
      <Tabs defaultValue="general">
        <TabsList className="mb-4">
          <TabsTrigger value="general">General Information</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle>Profile Picture</CardTitle>
                <CardDescription>
                  Upload a profile picture to personalize your account
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center">
                <Avatar className="h-32 w-32 mb-4">
                  <AvatarImage 
                    src={formData.avatar_url ? 
                      supabase.storage.from('avatars').getPublicUrl(formData.avatar_url).data.publicUrl 
                      : undefined
                    } 
                    alt={formData.full_name} 
                  />
                  <AvatarFallback className="text-4xl">
                    {formData.full_name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                
                <FileUpload
                  bucket="avatars"
                  folder={user.id}
                  onUploadComplete={handleAvatarUpload}
                  acceptedFileTypes="image/*"
                  maxSizeMB={2}
                />
              </CardContent>
            </Card>
            
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>
                  Update your personal information
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Full Name</Label>
                    <Input
                      id="full_name"
                      name="full_name"
                      value={formData.full_name}
                      onChange={handleChange}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      value={formData.email}
                      disabled
                    />
                    <p className="text-xs text-muted-foreground">
                      Email cannot be changed
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      name="bio"
                      value={formData.bio}
                      onChange={handleChange}
                      rows={4}
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" disabled={saving}>
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                Manage your password and security settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-2">Change Password</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  To change your password, click the button below to receive a password reset link via email.
                </p>
                <Button
                  onClick={async () => {
                    try {
                      const { error } = await supabase.auth.resetPasswordForEmail(
                        formData.email,
                        {
                          redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
                        }
                      )
                      
                      if (error) throw error
                      
                      toast({
                        title: 'Success',
                        description: 'Password reset link sent to your email',
                      })
                    } catch (error: any) {
                      toast({
                        title: 'Error',
                        description: error.message || 'Failed to send reset link',
                        variant: 'destructive',
                      })
                    }
                  }}
                >
                  Send Password Reset Link
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}