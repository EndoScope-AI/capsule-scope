import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload as UploadIcon, FileVideo, Image } from "lucide-react";
import { toast } from "sonner";

const Upload = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [patientId, setPatientId] = useState("");
  const [regionOfInterest, setRegionOfInterest] = useState("");
  const [deviceModel, setDeviceModel] = useState("");
  const [notes, setNotes] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      toast.error("Please select a file to upload");
      return;
    }

    setUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('endoscopy-uploads')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('endoscopy-uploads')
        .getPublicUrl(fileName);

      // Create analysis record
      const { data: analysis, error: dbError } = await supabase
        .from('analyses')
        .insert({
          user_id: user.id,
          patient_id: patientId || null,
          file_name: file.name,
          file_url: publicUrl,
          file_type: file.type,
          region_of_interest: regionOfInterest || null,
          device_model: deviceModel || null,
          notes: notes || null,
          status: 'pending'
        })
        .select()
        .single();

      if (dbError) throw dbError;

      toast.success("File uploaded successfully");
      navigate(`/analysis/${analysis.id}`);
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Upload Analysis</h1>
        <p className="text-muted-foreground mt-1">Upload endoscopy video or image for AI analysis</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>File Upload</CardTitle>
            <CardDescription>Select video (.mp4, .avi) or image (.jpg, .png) file</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
              <div className="flex flex-col items-center gap-4">
                {file ? (
                  <>
                    {file.type.startsWith('video/') ? (
                      <FileVideo className="h-12 w-12 text-primary" />
                    ) : (
                      <Image className="h-12 w-12 text-primary" />
                    )}
                    <div>
                      <p className="font-medium">{file.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <UploadIcon className="h-12 w-12 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Drop file here or click to browse</p>
                      <p className="text-sm text-muted-foreground">
                        Supports MP4, AVI, JPG, PNG (max 500MB)
                      </p>
                    </div>
                  </>
                )}
                <Input
                  type="file"
                  accept="video/mp4,video/avi,video/quicktime,image/jpeg,image/png,image/webp"
                  onChange={handleFileChange}
                  className="cursor-pointer"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Analysis Metadata</CardTitle>
            <CardDescription>Optional information for better analysis tracking</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="patientId">Patient ID (Anonymized)</Label>
                <Input
                  id="patientId"
                  value={patientId}
                  onChange={(e) => setPatientId(e.target.value)}
                  placeholder="PT-2025-001"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="region">Region of Interest</Label>
                <Select value={regionOfInterest} onValueChange={setRegionOfInterest}>
                  <SelectTrigger id="region">
                    <SelectValue placeholder="Select region" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gastrointestinal">Gastrointestinal</SelectItem>
                    <SelectItem value="colon">Colon</SelectItem>
                    <SelectItem value="esophagus">Esophagus</SelectItem>
                    <SelectItem value="stomach">Stomach</SelectItem>
                    <SelectItem value="small_intestine">Small Intestine</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="device">Device Model</Label>
              <Input
                id="device"
                value={deviceModel}
                onChange={(e) => setDeviceModel(e.target.value)}
                placeholder="e.g., PillCam SB 3, Olympus CV-290"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional information about the case..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button type="submit" size="lg" disabled={!file || uploading} className="flex-1">
            {uploading ? "Processing..." : "Run AI Analysis"}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={() => navigate('/dashboard')}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
};

export default Upload;
