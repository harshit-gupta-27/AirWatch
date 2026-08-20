import { useState, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { wardOptions } from '@/data/pollutionData';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { submitComplaint } from '@/services/api';
import { AlertTriangle, Camera, MapPin, X, Loader2, Video } from 'lucide-react';

const issueTypes = [
  'Waste Burning',
  'Industrial Emissions',
  'Construction Dust',
  'Vehicle Pollution',
  'Garbage Dumping',
  'Other',
];

const ReportIssueDialog = ({ children }) => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    ward: '',
    issueType: '',
    location: '',
    description: '',
    name: '',
    phone: '',
  });
  const [mediaFiles, setMediaFiles] = useState([]);
  const [gpsLocation, setGpsLocation] = useState(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);
  const queryClient = useQueryClient();

  const handleFileChange = (e) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles = [];
    Array.from(files).forEach((file) => {
      if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
        const preview = URL.createObjectURL(file);
        newFiles.push({
          file,
          preview,
          type: file.type.startsWith('image/') ? 'image' : 'video',
        });
      }
    });

    if (mediaFiles.length + newFiles.length > 5) {
      toast.error('Maximum 5 files allowed');
      return;
    }

    setMediaFiles([...mediaFiles, ...newFiles]);
  };

  const removeMedia = (index) => {
    const newFiles = [...mediaFiles];
    URL.revokeObjectURL(newFiles[index].preview);
    newFiles.splice(index, 1);
    setMediaFiles(newFiles);
  };

  const captureLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    setIsLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setGpsLocation({ latitude, longitude });
        setIsLoadingLocation(false);
        toast.success('Location captured successfully!');
      },
      (error) => {
        setIsLoadingLocation(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            toast.error('Location permission denied');
            break;
          case error.POSITION_UNAVAILABLE:
            toast.error('Location information unavailable');
            break;
          case error.TIMEOUT:
            toast.error('Location request timed out');
            break;
          default:
            toast.error('Failed to get location');
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.ward || !formData.issueType || !formData.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      await submitComplaint({
        wardName: formData.ward,
        type: formData.issueType,
        location: formData.location,
        description: formData.description,
        reportedBy: formData.name,
        phone: formData.phone,
        latitude: gpsLocation?.latitude,
        longitude: gpsLocation?.longitude,
      });

      toast.success('Issue reported', {
        description: `Saved against ${formData.ward}. Open that ward card to see it.`,
      });

      mediaFiles.forEach((m) => URL.revokeObjectURL(m.preview));
      setFormData({
        ward: '',
        issueType: '',
        location: '',
        description: '',
        name: '',
        phone: '',
      });
      setMediaFiles([]);
      setGpsLocation(null);
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    } catch (error) {
      toast.error(error.message || 'Could not save the report');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Report Pollution Issue
          </DialogTitle>
          <DialogDescription>
            Help us identify and address pollution sources in your area. Your report will be forwarded to the concerned authorities.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ward">Ward *</Label>
              <Select 
                value={formData.ward} 
                onValueChange={(value) => setFormData({ ...formData, ward: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select ward" />
                </SelectTrigger>
                <SelectContent>
                  {wardOptions.map((name) => (
                    <SelectItem key={name} value={name}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="issueType">Issue Type *</Label>
              <Select 
                value={formData.issueType} 
                onValueChange={(value) => setFormData({ ...formData, issueType: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {issueTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* GPS Location Capture */}
          <div className="space-y-2">
            <Label>GPS Location</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={captureLocation}
                disabled={isLoadingLocation}
                className="flex-1"
              >
                {isLoadingLocation ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <MapPin className="h-4 w-4 mr-2" />
                )}
                {gpsLocation ? 'Update Location' : 'Capture My Location'}
              </Button>
              {gpsLocation && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setGpsLocation(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            {gpsLocation && (
              <div className="text-sm text-muted-foreground bg-muted/50 p-2 rounded-md">
                📍 Lat: {gpsLocation.latitude.toFixed(6)}, Long: {gpsLocation.longitude.toFixed(6)}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Specific Location</Label>
            <Input
              id="location"
              placeholder="e.g., Near Connaught Place Metro Station"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              placeholder="Describe the pollution issue in detail..."
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          {/* Photo/Video Upload */}
          <div className="space-y-2">
            <Label>Photos / Videos (Max 5)</Label>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*,video/*"
              multiple
              className="hidden"
            />
            <div className="flex flex-wrap gap-2">
              {mediaFiles.map((media, index) => (
                <div key={index} className="relative w-20 h-20 rounded-lg overflow-hidden border border-border">
                  {media.type === 'image' ? (
                    <img src={media.preview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <Video className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => removeMedia(index)}
                    className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {mediaFiles.length < 5 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-20 h-20 rounded-lg border-2 border-dashed border-border hover:border-primary/50 flex flex-col items-center justify-center gap-1 transition-colors"
                >
                  <Camera className="h-5 w-5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Add</span>
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Your Name (Optional)</Label>
              <Input
                id="name"
                placeholder="Your name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone (Optional)</Label>
              <Input
                id="phone"
                placeholder="+91 XXXXX XXXXX"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving…' : 'Submit Report'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ReportIssueDialog;
