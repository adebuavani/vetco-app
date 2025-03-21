'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Upload, X } from 'lucide-react'

interface FileUploadProps {
  bucket: string
  folder: string
  onUploadComplete: (filePath: string) => void
  acceptedFileTypes?: string
  maxSizeMB?: number
}

export function FileUpload({
  bucket,
  folder,
  onUploadComplete,
  acceptedFileTypes = 'image/*',
  maxSizeMB = 5,
}: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      setFile(null)
      return
    }
    
    const selectedFile = e.target.files[0]
    
    // Check file size
    if (selectedFile.size > maxSizeMB * 1024 * 1024) {
      setError(`File size exceeds ${maxSizeMB}MB limit`)
      return
    }
    
    setFile(selectedFile)
    setError(null)
  }
  
  const handleUpload = async () => {
    if (!file) return
    
    try {
      setUploading(true)
      setProgress(0)
      
      // Create a unique file name
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`
      const filePath = `${folder}/${fileName}`
      
      // Upload file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
          onUploadProgress: (progress) => {
            const progressPercent = Math.round((progress.loaded / progress.total) * 100)
            setProgress(progressPercent)
          }
        })
      
      if (uploadError) throw uploadError
      
      // Get the public URL for the uploaded file
      const { data: publicURL } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath)
      
      onUploadComplete(filePath)
      setFile(null)
    } catch (error: any) {
      setError(error.message)
    } finally {
      setUploading(false)
    }
  }
  
  const handleClear = () => {
    setFile(null)
    setError(null)
  }
  
  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {!file ? (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <input
            type="file"
            id="file-upload"
            className="hidden"
            accept={acceptedFileTypes}
            onChange={handleFileChange}
            disabled={uploading}
          />
          <label
            htmlFor="file-upload"
            className="cursor-pointer flex flex-col items-center justify-center"
          >
            <Upload className="h-10 w-10 text-gray-400 mb-2" />
            <p className="text-sm text-gray-600">
              Click to upload or drag and drop
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {acceptedFileTypes.replace('*', '')} (Max: {maxSizeMB}MB)
            </p>
          </label>
        </div>
      ) : (
        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <div className="text-sm font-medium truncate max-w-[200px]">
                {file.name}
              </div>
              <div className="text-xs text-gray-500 ml-2">
                ({(file.size / (1024 * 1024)).toFixed(2)} MB)
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              disabled={uploading}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {uploading && (
            <Progress value={progress} className="h-2 mb-2" />
          )}
          
          <Button
            onClick={handleUpload}
            disabled={uploading}
            className="w-full"
          >
            {uploading ? `Uploading (${progress}%)` : 'Upload'}
          </Button>
        </div>
      )}
    </div>
  )
}
