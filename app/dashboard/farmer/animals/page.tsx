'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/components/ui/use-toast'
import { PlusCircle, Pencil, Trash2, Calendar, AlertCircle } from 'lucide-react'
import { format, parseISO } from 'date-fns'

export default function AnimalsPage() {
  const router = useRouter()
  const [animals, setAnimals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedAnimal, setSelectedAnimal] = useState<any>(null)
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    breed: '',
    age: '',
    weight: '',
    gender: '',
    description: '',
    health_status: 'healthy',
    vaccination_status: '',
  })
  
  useEffect(() => {
    const fetchAnimals = async () => {
      setLoading(true)
      
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }
      
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single()
      
      if (userError || userData.role !== 'farmer') {
        console.error('Error fetching user or user is not a farmer:', userError)
        router.push('/dashboard')
        return
      }
      
      const { data, error } = await supabase
        .from('animals')
        .select('*')
        .eq('farmer_id', session.user.id)
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('Error fetching animals:', error)
      } else {
        setAnimals(data || [])
      }
      
      setLoading(false)
    }
    
    fetchAnimals()
  }, [router])
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }
  
  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }))
  }
  
  const resetForm = () => {
    setFormData({
      name: '',
      type: '',
      breed: '',
      age: '',
      weight: '',
      gender: '',
      description: '',
      health_status: 'healthy',
      vaccination_status: '',
    })
    setSelectedAnimal(null)
  }
  
  const handleAddOrUpdateAnimal = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }
      
      const animalData = {
        ...formData,
        age: formData.age ? parseInt(formData.age) : null,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        farmer_id: session.user.id,
      }
      
      let result
      
      if (selectedAnimal) {
        // Update existing animal
        result = await supabase
          .from('animals')
          .update(animalData)
          .eq('id', selectedAnimal.id)
          .select()
      } else {
        // Add new animal
        result = await supabase
          .from('animals')
          .insert(animalData)
          .select()
      }
      
      if (result.error) throw result.error
      
      toast({
        title: selectedAnimal ? 'Animal Updated' : 'Animal Added',
        description: `${formData.name} has been ${selectedAnimal ? 'updated' : 'added'} successfully.`,
      })
      
      // Update local state
      if (selectedAnimal) {
        setAnimals(prev => 
          prev.map(animal => 
            animal.id === selectedAnimal.id ? result.data[0] : animal
          )
        )
      } else {
        setAnimals(prev => [result.data[0], ...prev])
      }
      
      resetForm()
      setIsAddDialogOpen(false)
    } catch (error: any) {
      console.error('Error adding/updating animal:', error)
      toast({
        title: 'Error',
        description: error.message || `Failed to ${selectedAnimal ? 'update' : 'add'} animal`,
        variant: 'destructive',
      })
    }
  }
  
  const handleDeleteAnimal = async () => {
    if (!selectedAnimal) return
    
    try {
      const { error } = await supabase
        .from('animals')
        .delete()
        .eq('id', selectedAnimal.id)
      
      if (error) throw error
      
      toast({
        title: 'Animal Deleted',
        description: `${selectedAnimal.name} has been deleted successfully.`,
      })
      
      // Update local state
      setAnimals(prev => prev.filter(animal => animal.id !== selectedAnimal.id))
      
      setIsDeleteDialogOpen(false)
      setSelectedAnimal(null)
    } catch (error: any) {
      console.error('Error deleting animal:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete animal',
        variant: 'destructive',
      })
    }
  }
  
  const openEditDialog = (animal: any) => {
    setSelectedAnimal(animal)
    setFormData({
      name: animal.name,
      type: animal.type,
      breed: animal.breed || '',
      age: animal.age ? animal.age.toString() : '',
      weight: animal.weight ? animal.weight.toString() : '',
      gender: animal.gender || '',
      description: animal.description || '',
      health_status: animal.health_status || 'healthy',
      vaccination_status: animal.vaccination_status || '',
    })
    setIsAddDialogOpen(true)
  }
  
  const openDeleteDialog = (animal: any) => {
    setSelectedAnimal(animal)
    setIsDeleteDialogOpen(true)
  }
  
  const getHealthStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Healthy</Badge>
      case 'sick':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-200">Sick</Badge>
      case 'recovering':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">Recovering</Badge>
      case 'pregnant':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">Pregnant</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }
  
  const animalTypes = [
    'Cow', 'Goat', 'Sheep', 'Chicken', 'Pig', 'Horse', 'Donkey', 'Rabbit', 'Other'
  ]
  
  const healthStatuses = [
    'healthy', 'sick', 'recovering', 'pregnant'
  ]

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">My Animals</h1>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              resetForm()
              setIsAddDialogOpen(true)
            }}>
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Animal
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{selectedAnimal ? 'Edit Animal' : 'Add New Animal'}</DialogTitle>
              <DialogDescription>
                {selectedAnimal 
                  ? 'Update the details of your animal below.' 
                  : 'Enter the details of your animal below.'}
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleAddOrUpdateAnimal}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="type">Type</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value) => handleSelectChange('type', value)}
                      required
                    >
                      <SelectTrigger id="type">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {animalTypes.map(type => (
                          <SelectItem key={type} value={type.toLowerCase()}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="breed">Breed (Optional)</Label>
                    <Input
                      id="breed"
                      name="breed"
                      value={formData.breed}
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender (Optional)</Label>
                    <Select
                      value={formData.gender}
                      onValueChange={(value) => handleSelectChange('gender', value)}
                    >
                      <SelectTrigger id="gender">
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="age">Age in Months (Optional)</Label>
                    <Input
                      id="age"
                      name="age"
                      type="number"
                      min="0"
                      value={formData.age}
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="weight">Weight in kg (Optional)</Label>
                    <Input
                      id="weight"
                      name="weight"
                      type="number"
                      step="0.1"
                      min="0"
                      value={formData.weight}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="health_status">Health Status</Label>
                  <Select
                    value={formData.health_status}
                    onValueChange={(value) => handleSelectChange('health_status', value)}
                  >
                    <SelectTrigger id="health_status">
                      <SelectValue placeholder="Select health status" />
                    </SelectTrigger>
                    <SelectContent>
                      {healthStatuses.map(status => (
                        <SelectItem key={status} value={status}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="vaccination_status">Vaccination Status (Optional)</Label>
                  <Input
                    id="vaccination_status"
                    name="vaccination_status"
                    value={formData.vaccination_status}
                    onChange={handleInputChange}
                    placeholder="e.g., Vaccinated against FMD on 12/05/2023"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Any additional information about your animal"
                    rows={3}
                  />
                </div>
              </div>
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => {
                  resetForm()
                  setIsAddDialogOpen(false)
                }}>
                  Cancel
                </Button>
                <Button type="submit">
                  {selectedAnimal ? 'Update Animal' : 'Add Animal'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Confirm Deletion</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete {selectedAnimal?.name}? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="button" variant="destructive" onClick={handleDeleteAnimal}>
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      {loading ? (
        <div className="text-center py-8">Loading animals...</div>
      ) : animals.length === 0 ? (
        <div className="text-center py-12 bg-muted/30 rounded-lg border border-dashed">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">No Animals Found</h2>
          <p className="text-muted-foreground mb-6">
            You haven't added any animals yet. Add your first animal to get started.
          </p>
          
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Add Your First Animal
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {animals.map(animal => (
            <Card key={animal.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-xl capitalize">
                    {animal.name}
                  </CardTitle>
                  {getHealthStatusBadge(animal.health_status)}
                </div>
              </CardHeader>
              
              <CardContent className="pb-2">
                <div className="flex items-center mb-4">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                    <span className="text-lg font-bold text-primary uppercase">
                      {animal.type.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium capitalize">{animal.type}</p>
                    {animal.breed && (
                      <p className="text-sm text-muted-foreground capitalize">
                        {animal.breed}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                  {animal.age && (
                    <div>
                      <span className="text-muted-foreground">Age: </span>
                      <span>{animal.age} months</span>
                    </div>
                  )}
                  
                  {animal.weight && (
                    <div>
                      <span className="text-muted-foreground">Weight: </span>
                      <span>{animal.weight} kg</span>
                    </div>
                  )}
                  
                  {animal.gender && (
                    <div>
                      <span className="text-muted-foreground">Gender: </span>
                      <span className="capitalize">{animal.gender}</span>
                    </div>
                  )}
                  
                  {animal.last_checkup_date && (
                    <div className="col-span-2 flex items-center">
                      <Calendar className="h-3 w-3 mr-1 text-muted-foreground" />
                      <span className="text-muted-foreground mr-1">Last checkup: </span>
                      <span>{format(parseISO(animal.last_checkup_date), 'PPP')}</span>
                    </div>
                  )}
                </div>
                
                {animal.description && (
                  <div className="text-sm mb-4">
                    <p className="text-muted-foreground mb-1">Description:</p>
                    <p>{animal.description}</p>
                  </div>
                )}
                
                {animal.vaccination_status && (
                  <div className="text-sm">
                    <p className="text-muted-foreground mb-1">Vaccination Status:</p>
                    <p>{animal.vaccination_status}</p>
                  </div>
                )}
              </CardContent>
              
              <CardFooter className="flex justify-between">
                <Button 
                  variant="outline" 
                  size="sm" 
                  asChild
                >
                  <Link href={`/dashboard/farmer/animals/${animal.id}`}>
                    View Details
                  </Link>
                </Button>
                
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={() => openEditDialog(animal)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="icon"
                    className="text-red-500 hover:text-red-700"
                    onClick={() => openDeleteDialog(animal)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}