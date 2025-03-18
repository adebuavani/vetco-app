'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/components/ui/use-toast'
import { Calendar, Clock, ArrowLeft, PlusCircle, Pencil, Trash2, AlertCircle } from 'lucide-react'
import { format, parseISO } from 'date-fns'

export default function AnimalDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const animalId = params.id as string
  
  const [animal, setAnimal] = useState<any>(null)
  const [healthRecords, setHealthRecords] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddRecordDialogOpen, setIsAddRecordDialogOpen] = useState(false)
  const [isDeleteRecordDialogOpen, setIsDeleteRecordDialogOpen] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<any>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    treatment: '',
    vet_name: '',
    cost: '',
  })
  
  useEffect(() => {
    const fetchAnimalDetails = async () => {
      setLoading(true)
      
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }
      
      // Fetch animal details
      const { data: animalData, error: animalError } = await supabase
        .from('animals')
        .select('*')
        .eq('id', animalId)
        .single()
      
      if (animalError) {
        console.error('Error fetching animal:', animalError)
        router.push('/dashboard/farmer/animals')
        return
      }
      
      setAnimal(animalData)
      
      // Check if health_records table exists, if not create it
      try {
        // First, check if the health_records table exists
        const { data: healthRecordsTable, error: tableError } = await supabase
          .from('health_records')
          .select('id')
          .limit(1)
        
        if (tableError && tableError.code === '42P01') {
          // Table doesn't exist, create it
          const createTableSQL = `
            CREATE TABLE IF NOT EXISTS public.health_records (
              id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
              animal_id UUID NOT NULL REFERENCES public.animals(id) ON DELETE CASCADE,
              title TEXT NOT NULL,
              description TEXT,
              treatment TEXT,
              vet_name TEXT,
              cost DECIMAL,
              record_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
            
            -- Enable Row Level Security
            ALTER TABLE public.health_records ENABLE ROW LEVEL SECURITY;
            
            -- Create policy to allow farmers to view health records for their animals
            CREATE POLICY "Farmers can view health records for their animals" 
            ON public.health_records 
            FOR SELECT 
            USING (
              EXISTS (
                SELECT 1 FROM animals
                WHERE animals.id = health_records.animal_id
                AND animals.farmer_id = auth.uid()
              )
            );
            
            -- Create policy to allow farmers to insert health records for their animals
            CREATE POLICY "Farmers can insert health records for their animals" 
            ON public.health_records 
            FOR INSERT 
            WITH CHECK (
              EXISTS (
                SELECT 1 FROM animals
                WHERE animals.id = health_records.animal_id
                AND animals.farmer_id = auth.uid()
              )
            );
            
            -- Create policy to allow farmers to update health records for their animals
            CREATE POLICY "Farmers can update health records for their animals" 
            ON public.health_records 
            FOR UPDATE 
            USING (
              EXISTS (
                SELECT 1 FROM animals
                WHERE animals.id = health_records.animal_id
                AND animals.farmer_id = auth.uid()
              )
            );
            
            -- Create policy to allow farmers to delete health records for their animals
            CREATE POLICY "Farmers can delete health records for their animals" 
            ON public.health_records 
            FOR DELETE 
            USING (
              EXISTS (
                SELECT 1 FROM animals
                WHERE animals.id = health_records.animal_id
                AND animals.farmer_id = auth.uid()
              )
            );
            
            -- Create policy to allow vets to view health records
            CREATE POLICY "Vets can view health records" 
            ON public.health_records 
            FOR SELECT 
            USING (
              EXISTS (
                SELECT 1 FROM users
                WHERE users.id = auth.uid() AND users.role = 'vet'
              )
            );
          `
          
          // Execute the SQL to create the table
          await supabase.rpc('exec_sql', { sql: createTableSQL })
        }
        
        // Fetch health records
        const { data: recordsData, error: recordsError } = await supabase
          .from('health_records')
          .select('*')
          .eq('animal_id', animalId)
          .order('record_date', { ascending: false })
        
        if (recordsError) {
          console.error('Error fetching health records:', recordsError)
        } else {
          setHealthRecords(recordsData || [])
        }
      } catch (error) {
        console.error('Error with health records table:', error)
      }
      
      setLoading(false)
    }
    
    if (animalId) {
      fetchAnimalDetails()
    }
  }, [animalId, router])
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }
  
  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      treatment: '',
      vet_name: '',
      cost: '',
    })
    setSelectedRecord(null)
  }
  
  const handleAddOrUpdateRecord = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const recordData = {
        ...formData,
        cost: formData.cost ? parseFloat(formData.cost) : null,
        animal_id: animalId,
        record_date: new Date().toISOString(),
      }
      
      let result
      
      if (selectedRecord) {
        // Update existing record
        result = await supabase
          .from('health_records')
          .update(recordData)
          .eq('id', selectedRecord.id)
          .select()
      } else {
        // Add new record
        result = await supabase
          .from('health_records')
          .insert(recordData)
          .select()
      }
      
      if (result.error) throw result.error
      
      toast({
        title: selectedRecord ? 'Record Updated' : 'Record Added',
        description: `Health record has been ${selectedRecord ? 'updated' : 'added'} successfully.`,
      })
      
      // Update local state
      if (selectedRecord) {
        setHealthRecords(prev => 
          prev.map(record => 
            record.id === selectedRecord.id ? result.data[0] : record
          )
        )
      } else {
        setHealthRecords(prev => [result.data[0], ...prev])
      }
      
      resetForm()
      setIsAddRecordDialogOpen(false)
    } catch (error: any) {
      console.error('Error adding/updating health record:', error)
      toast({
        title: 'Error',
        description: error.message || `Failed to ${selectedRecord ? 'update' : 'add'} health record`,
        variant: 'destructive',
      })
    }
  }
  
  const handleDeleteRecord = async () => {
    if (!selectedRecord) return
    
    try {
      const { error } = await supabase
        .from('health_records')
        .delete()
        .eq('id', selectedRecord.id)
      
      if (error) throw error
      
      toast({
        title: 'Record Deleted',
        description: 'Health record has been deleted successfully.',
      })
      
      // Update local state
      setHealthRecords(prev => prev.filter(record => record.id !== selectedRecord.id))
      
      setIsDeleteRecordDialogOpen(false)
      setSelectedRecord(null)
    } catch (error: any) {
      console.error('Error deleting health record:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete health record',
        variant: 'destructive',
      })
    }
  }
  
  const openEditDialog = (record: any) => {
    setSelectedRecord(record)
    setFormData({
      title: record.title,
      description: record.description || '',
      treatment: record.treatment || '',
      vet_name: record.vet_name || '',
      cost: record.cost ? record.cost.toString() : '',
    })
    setIsAddRecordDialogOpen(true)
  }
  
  const openDeleteDialog = (record: any) => {
    setSelectedRecord(record)
    setIsDeleteRecordDialogOpen(true)
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

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/dashboard/farmer/animals">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Animals
          </Link>
        </Button>
        
        {loading ? (
          <div className="text-center py-8">Loading animal details...</div>
        ) : animal ? (
          <>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold">{animal.name}</h1>
                <p className="text-muted-foreground capitalize">
                  {animal.type} {animal.breed ? `• ${animal.breed}` : ''}
                </p>
              </div>
              
              <div className="mt-4 md:mt-0">
                {getHealthStatusBadge(animal.health_status)}
              </div>
            </div>
            
            <Tabs defaultValue="overview" className="mb-6">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="health-records">Health Records</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Basic Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <dl className="grid grid-cols-2 gap-4">
                        <div>
                          <dt className="text-sm font-medium text-muted-foreground">Type</dt>
                          <dd className="capitalize">{animal.type}</dd>
                        </div>
                        
                        {animal.breed && (
                          <div>
                            <dt className="text-sm font-medium text-muted-foreground">Breed</dt>
                            <dd className="capitalize">{animal.breed}</dd>
                          </div>
                        )}
                        
                        {animal.age && (
                          <div>
                            <dt className="text-sm font-medium text-muted-foreground">Age</dt>
                            <dd>{animal.age} months</dd>
                          </div>
                        )}
                        
                        {animal.weight && (
                          <div>
                            <dt className="text-sm font-medium text-muted-foreground">Weight</dt>
                            <dd>{animal.weight} kg</dd>
                          </div>
                        )}
                        
                        {animal.gender && (
                          <div>
                            <dt className="text-sm font-medium text-muted-foreground">Gender</dt>
                            <dd className="capitalize">{animal.gender}</dd>
                          </div>
                        )}
                        
                        <div>
                          <dt className="text-sm font-medium text-muted-foreground">Added On</dt>
                          <dd>{format(parseISO(animal.created_at), 'PPP')}</dd>
                        </div>
                      </dl>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>Health Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <dl className="space-y-4">
                        <div>
                          <dt className="text-sm font-medium text-muted-foreground">Health Status</dt>
                          <dd className="mt-1">{getHealthStatusBadge(animal.health_status)}</dd>
                        </div>
                        
                        {animal.vaccination_status && (
                          <div>
                            <dt className="text-sm font-medium text-muted-foreground">Vaccination Status</dt>
                            <dd className="mt-1">{animal.vaccination_status}</dd>
                          </div>
                        )}
                        
                        {animal.last_checkup_date && (
                          <div>
                            <dt className="text-sm font-medium text-muted-foreground">Last Checkup</dt>
                            <dd className="mt-1 flex items-center">
                              <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                              {format(parseISO(animal.last_checkup_date), 'PPP')}
                            </dd>
                          </div>
                        )}
                      </dl>
                    </CardContent>
                  </Card>
                  
                  {animal.description && (
                    <Card className="md:col-span-2">
                      <CardHeader>
                        <CardTitle>Description</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p>{animal.description}</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="health-records" className="mt-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold">Health Records</h2>
                  
                  <Dialog open={isAddRecordDialogOpen} onOpenChange={setIsAddRecordDialogOpen}>
                    <DialogTrigger asChild>
                      <Button onClick={() => {
                        resetForm()
                        setIsAddRecordDialogOpen(true)
                      }}>
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Add Health Record
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                      <DialogHeader>
                        <DialogTitle>{selectedRecord ? 'Edit Health Record' : 'Add Health Record'}</DialogTitle>
                        <DialogDescription>
                          {selectedRecord 
                            ? 'Update the details of this health record.' 
                            : 'Enter the details of the health event or treatment.'}
                        </DialogDescription>
                      </DialogHeader>
                      
                      <form onSubmit={handleAddOrUpdateRecord}>
                        <div className="grid gap-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="title">Title</Label>
                            <Input
                              id="title"
                              name="title"
                              value={formData.title}
                              onChange={handleInputChange}
                              placeholder="e.g., Vaccination, Treatment, Check-up"
                              required
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                              id="description"
                              name="description"
                              value={formData.description}
                              onChange={handleInputChange}
                              placeholder="Describe the health issue or reason for treatment"
                              rows={3}
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="treatment">Treatment</Label>
                            <Textarea
                              id="treatment"
                              name="treatment"
                              value={formData.treatment}
                              onChange={handleInputChange}
                              placeholder="Describe the treatment provided"
                              rows={2}
                            />
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="vet_name">Veterinarian</Label>
                              <Input
                                id="vet_name"
                                name="vet_name"
                                value={formData.vet_name}
                                onChange={handleInputChange}
                                placeholder="Name of the veterinarian"
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor="cost">Cost (UGX)</Label>
                              <Input
                                id="cost"
                                name="cost"
                                type="number"
                                min="0"
                                step="1000"
                                value={formData.cost}
                                onChange={handleInputChange}
                                placeholder="Cost of treatment"
                              />
                            </div>
                          </div>
                        </div>
                        
                        <DialogFooter>
                          <Button type="button" variant="outline" onClick={() => {
                            resetForm()
                            setIsAddRecordDialogOpen(false)
                          }}>
                            Cancel
                          </Button>
                          <Button type="submit">
                            {selectedRecord ? 'Update Record' : 'Add Record'}
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                  
                  <Dialog open={isDeleteRecordDialogOpen} onOpenChange={setIsDeleteRecordDialogOpen}>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>Confirm Deletion</DialogTitle>
                        <DialogDescription>
                          Are you sure you want to delete this health record? This action cannot be undone.
                        </DialogDescription>
                      </DialogHeader>
                      
                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsDeleteRecordDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button type="button" variant="destructive" onClick={handleDeleteRecord}>
                          Delete
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
                
                {healthRecords.length === 0 ? (
                  <div className="text-center py-12 bg-muted/30 rounded-lg border border-dashed">
                    <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h2 className="text-xl font-semibold mb-2">No Health Records</h2>
                    <p className="text-muted-foreground mb-6">
                      You haven't added any health records for this animal yet.
                    </p>
                    
                    <Button onClick={() => setIsAddRecordDialogOpen(true)}>
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Add First Health Record
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {healthRecords.map(record => (
                      <Card key={record.id}>
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-start">
                            <CardTitle className="text-lg">{record.title}</CardTitle>
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Calendar className="h-4 w-4 mr-1" />
                              {format(parseISO(record.record_date), 'PPP')}
                            </div>
                          </div>
                        </CardHeader>
                        
                        <CardContent className="pb-2">
                          {record.description && (
                            <div className="mb-4">
                              <h4 className="text-sm font-medium mb-1">Description</h4>
                              <p className="text-sm">{record.description}</p>
                            </div>
                          )}
                          
                          {record.treatment && (
                            <div className="mb-4">
                              <h4 className="text-sm font-medium mb-1">Treatment</h4>
                              <p className="text-sm">{record.treatment}</p>
                            </div>
                          )}
                          
                          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                            {record.vet_name && (
                              <div>
                                <span className="text-muted-foreground">Veterinarian: </span>
                                <span>{record.vet_name}</span>
                              </div>
                            )}
                            
                            {record.cost && (
                              <div>
                                <span className="text-muted-foreground">Cost: </span>
                                <span>UGX {record.cost.toLocaleString()}</span>
                              </div>
                            )}
                          </div>
                        </CardContent>
                        
                        <CardFooter className="flex justify-end space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => openEditDialog(record)}
                          >
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                          
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="text-red-500 hover:text-red-700"
                            onClick={() => openDeleteDialog(record)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </>
        ) : (
          <div className="text-center py-12 bg-muted/30 rounded-lg border border-dashed">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Animal Not Found</h2>
            <p className="text-muted-foreground mb-6">
              The animal you're looking for doesn't exist or you don't have permission to view it.
            </p>
            
            <Button asChild>
              <Link href="/dashboard/farmer/animals">
                Go Back to Animals
              </Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}