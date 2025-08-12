import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import Cropper from "react-easy-crop";
import { v4 as uuidv4 } from "uuid";
import type { Area } from 'react-easy-crop';
import getCroppedImg from "@/lib/cropImage"; // We'll define this helper
import imageCompression from 'browser-image-compression';
import PhotoSearch from "@/pages/photo-search"
import axios from "axios";
import { Upload } from "lucide-react";


const schema = z.object({
  name: z.string().min(1, "Dish name is required"),
  price: z.string().min(1, "Price is required"),
  category: z.string().min(1, "Category is required"),
  meal_type: z.string().min(1, "Meal type is required"),
  available_till: z.string().min(1, "Available till time is required"),
  description: z.string().min(1, "Description is required"),
  photo_url: z.string().url("Please enter a valid URL").or(z.literal("")).optional(),
  spicy_level: z.enum(["sweet", "mild", "spicy"], {
    errorMap: () => ({ message: "Select spicy level" }),
  }),

  diet_type: z.enum(["veg", "non-veg", "vegan"], {
    errorMap: () => ({ message: "Select diet type" }),
  }),
});

type FormValues = z.infer<typeof schema>;

interface AddMenuItemProps {
  hotelId: string;
  onSuccess?: () => void;
}

export default function AddMenuItem({ hotelId, onSuccess }: AddMenuItemProps) {

  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [zoom, setZoom] = useState(1);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [showCropper, setShowCropper] = useState(false);
  const [croppedPreviewUrl, setCroppedPreviewUrl] = useState<string | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  


  const handlePhotoUrlChange = (url: string) => {
    setPhotoUrl(url);                 // for preview
    form.setValue("photo_url", url); // for form submission
  };

  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      price: "",
      category: "",
      meal_type: "",
      available_till: "23:00",
      description: "",
      photo_url: "",
      spicy_level: "mild",
      diet_type: "veg",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: FormValues) => {
      return apiRequest("POST", "/api/menu-update-requests", {
        requested_changes: data,
        hotel_id: hotelId,
      });
    },
    onSuccess: () => {
      toast({
        title: "Request submitted",
        description: "Your menu update request has been submitted for review",
      });
      form.reset();
      setIsSubmitting(false); // <-- reset after success
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: (error as Error).message || "Something went wrong",
        variant: "destructive",
      });
    },
  });


  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true); // <-- immediately disable the button
    try {
      const isLocalPreview = data.photo_url?.startsWith("blob:");
  
      if ((isLocalPreview || !data.photo_url) && croppedImageBlob) {
        setIsUploading(true);
        const formData = new FormData();
        formData.append("file", croppedImageBlob);
        formData.append("upload_preset", "menu_preset");
        formData.append("folder", "menu-photos");
  
        const uploadRes = await fetch("https://api.cloudinary.com/v1_1/dxnwguqtd/image/upload", {
          method: "POST",
          body: formData,
        });
  
        if (!uploadRes.ok) throw new Error("Image upload failed");
  
        const uploadData = await uploadRes.json();
        data.photo_url = uploadData.secure_url;
      }
  
      if (!data.photo_url) {
        data.photo_url = "https://placehold.co/600x400/orange/white?text=Menu+Item";
      }
  
      mutation.mutate(data);
    } catch (err) {
      console.error("Submission error:", err);
      alert("Submission failed: " + (err as Error).message);
    } finally {
      setIsUploading(false);
    }
  };

  
  


  const [isUploading, setIsUploading] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [dishNameForSearch, setDishNameForSearch] = useState("");
  const [croppedImageBlob, setCroppedImageBlob] = useState<Blob | null>(null);





  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
  
    try {
      let finalFile = file;
  
      if (file.size > 200 * 1024) {
        const options = {
          maxSizeMB: 0.2,
          maxWidthOrHeight: 400,
          useWebWorker: true,
        };
        const compressed = await imageCompression(file, options);
        finalFile = new File([compressed], file.name, {
          type: compressed.type,
          lastModified: Date.now(),
        });
      }
  
      setSelectedImage(finalFile);      // Will be passed to cropper
      setShowCropper(true);             // Open crop modal
    } catch (err) {
      console.error("Image compression error:", err);
      alert("Image compression failed");
    }
  };
  
  
  


  const handleCropConfirm = async () => {
    if (!selectedImage || !croppedAreaPixels) return;
  
    const blob = await getCroppedImg(
      URL.createObjectURL(selectedImage),
      croppedAreaPixels
    );
  
    setCroppedImageBlob(blob);
  
    const previewUrl = URL.createObjectURL(blob);
  
    // Replace last image if 3 already exist
    setDishImages((prev) => {
      if (prev.length >= 3) {
        const updated = [...prev];
        updated[prev.length - 1] = { secure_url: previewUrl };  // Replace last
        return updated;
      } else {
        return [...prev, { secure_url: previewUrl }];
      }
    });
  
    setPhotoUrl(previewUrl);
    form.setValue("photo_url", previewUrl);
  
    setShowCropper(false);
  };
  
  
  

  const [dishImages, setDishImages] = useState<{ secure_url: string }[]>([]);

  const handleDishNameBlur = async (name: string) => {
    if (!name.trim()) {
      setDishImages([]);
      setPhotoUrl("");
      form.setValue("photo_url", "");
      return;
    }


    try {
      const res = await axios.post("/api/search-image", { query: name });
      const images = res.data?.resources || [];
      setDishImages(images);

      if (images.length > 0) {
        // setPhotoUrl(images[0].secure_url);
        // form.setValue("photo_url", images[0].secure_url);
      } else {
        setPhotoUrl("");
        form.setValue("photo_url", "");
      }
    } catch (err) {
      console.error("Auto-search failed:", err);
      setDishImages([]);
      setPhotoUrl("");
      form.setValue("photo_url", "");
    }
  };




  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <h3
        className="text-xl sm:text-2xl md:text-3xl font-semibold text-gray-700 mb-6"
        style={{ fontFamily: "'Playfair Display', serif" }}
      >
        Add New Menu Item
      </h3>

      <div className="bg-white shadow-lg rounded-xl p-8 border border-gray-200">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-6 gap-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="sm:col-span-3">
                    <FormLabel>Dish Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Chicken Curry" {...field}
                        onBlur={(e) => {
                          field.onBlur(); // keep react-hook-form behavior
                          handleDishNameBlur(e.target.value); // trigger image search
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem className="sm:col-span-3">
                    <FormLabel>Price</FormLabel>
                    <FormControl>
                      <div className="relative rounded-md">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-gray-500 sm:text-sm">₹</span>
                        </div>
                        <Input placeholder="9.99" className="pl-7" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem className="sm:col-span-3">
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
<SelectContent>
  <SelectItem value="starters">Starters</SelectItem>
  <SelectItem value="soup">Soup</SelectItem>
  <SelectItem value="salad">Salad</SelectItem>
  <SelectItem value="mains">Mains</SelectItem>
  <SelectItem value="curry">Curry</SelectItem>
  <SelectItem value="bread">Bread</SelectItem>
  <SelectItem value="rice">Rice</SelectItem>
  <SelectItem value="noodles">Noodles</SelectItem>
  <SelectItem value="bbq">BBQ</SelectItem>
  <SelectItem value="pizza">Pizza</SelectItem>
  <SelectItem value="burger">Burger</SelectItem>
  <SelectItem value="seafood">Seafood</SelectItem>
  <SelectItem value="desserts">Desserts</SelectItem>
  <SelectItem value="drinks">Drinks</SelectItem>
  <SelectItem value="coffee">Coffee</SelectItem>
  <SelectItem value="sides">Sides</SelectItem>
  <SelectItem value="other">Other</SelectItem>
</SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="meal_type"
                render={({ field }) => (
                  <FormItem className="sm:col-span-3">
                    <FormLabel>Meal Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select meal type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Breakfast">Breakfast</SelectItem>
                        <SelectItem value="Lunch">Lunch</SelectItem>
                        <SelectItem value="Dinner">Dinner</SelectItem>
                        <SelectItem value="All Day">All Day</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="spicy_level"
                render={({ field }) => (
                  <FormItem className="sm:col-span-3">
                    <FormLabel>Spicy Level</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select spicy level" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="sweet">Sweet 🧊</SelectItem>
                        <SelectItem value="mild">Mild 🌶</SelectItem>
                        <SelectItem value="spicy">Spicy 🌶🌶</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="diet_type"
                render={({ field }) => (
                  <FormItem className="sm:col-span-3">
                    <FormLabel>Diet Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select diet type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="veg">Veg</SelectItem>
                        <SelectItem value="non-veg">Non-Veg</SelectItem>
                        <SelectItem value="vegan">Vegan</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="available_till"
                render={({ field }) => (
                  <FormItem className="sm:col-span-3">
                    <FormLabel>Available Till</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormItem className="sm:col-span-6 flex flex-col space-y-2">
                <FormLabel>Dish Photo</FormLabel>

                {/* Dish Photo Section */}
                <div className="space-y-2">

                  {/* Search component */}
                  <PhotoSearch
                    images={dishImages}
                    setPhotoUrl={handlePhotoUrlChange}
                    selectedUrl={photoUrl}
                  />


                  {/* Hidden input to submit in form if needed */}
                  <input type="hidden" name="photo_url" value={photoUrl ?? ""} />
                </div>





                <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-4">
                  <input
                    id="file-upload"
                    type="file"
                    accept="image/*"
                    capture="environment"
                    disabled={!!photoUrl}
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  <div className="flex flex-col space-y-2">
                    <label
                      htmlFor="file-upload"
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition duration-150 ease-in-out
        ${photoUrl
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-black cursor-pointer"
                        } shadow-sm border border-gray-300`}
                    >
                      <Upload size={16} className="stroke-current" />
                      Upload from device
                    </label>

                    {selectedImage && !photoUrl && (
                      <span className="text-sm text-gray-600 truncate max-w-[250px]">
                        📷 {selectedImage.name}
                      </span>
                    )}
                  </div>
                </div>









                {/* Preview */}
                {/* {croppedPreviewUrl && (
                  <img
                    src={croppedPreviewUrl}
                    alt="Cropped Preview"
                    className="mt-4 w-48 h-auto rounded border"
                  />
                )} */}
              </FormItem>




              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="sm:col-span-6">
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Brief description of the dish"
                        className="resize-none"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={() => form.reset()}
                disabled={mutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending || isSubmitting}>
                {mutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Request"
                )}
              </Button>
            </div>


          </form>
        </Form>






        {showCropper && selectedImage && (
          <div className="fixed inset-0 z-50 bg-black bg-opacity-70 flex justify-center items-center px-2">
            <div className="bg-white rounded-lg p-4 w-full max-w-5xl h-[80vh] flex flex-col gap-4 relative">

              {/* Cropper Container */}
              <div className="relative flex-1 min-h-[300px]">
                <Cropper
                  image={URL.createObjectURL(selectedImage)}
                  crop={crop}
                  zoom={zoom}
                  aspect={0.95}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={(_, croppedPixels) => {
                    setCroppedAreaPixels(croppedPixels);
                  }}
                />
              </div>

              {/* Zoom Slider */}
              <input
                type="range"
                min={1}
                max={3}
                step={0.1}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full accent-blue-500"
              />

              {/* Buttons */}
              <div className="flex justify-end gap-2 mt-4">
                <button
                  onClick={() => {
                    setShowCropper(false);
                    setSelectedImage(null);
                  }}
                  disabled={isUploading}
                  className="px-4 py-2 rounded-md border border-red-500 text-red-500 font-medium hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Cancel
                </button>


                <button
  onClick={handleCropConfirm}
  className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed"
  disabled={isUploading}
>
  Confirm
</button>


              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

