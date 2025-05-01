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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const schema = z.object({
  name: z.string().min(1),
  price: z.string().min(1),
  category: z.string().min(1),
  meal_type: z.string().min(1),
  available_till: z.string().min(1),
  description: z.string().min(1),
  photo_url: z.string().url().or(z.literal("")).optional(),
});

type FormValues = z.infer<typeof schema>;

interface EditMenuItemRequestProps {
  hotelId: string;
  itemId: string;
  open: boolean;
  onClose: () => void;
  initialValues: FormValues;
  onSuccess?: () => void;
}

export default function EditMenuItemRequest({
  hotelId,
  itemId,
  open,
  onClose,
  initialValues,
  onSuccess,
}: EditMenuItemRequestProps) {
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: initialValues,
  });

  const mutation = useMutation({
    mutationFn: async (data: FormValues) => {
      return apiRequest("POST", "/api/menu-update-requests", {
        requested_changes: data,
        hotel_id: hotelId,
        menu_item_id: itemId,
        type: "edit",
      });
    },
    onSuccess: () => {
      toast({
        title: "Update request sent",
        description: "Your changes will be reviewed by the admin",
      });
      form.reset();
      onClose();
      onSuccess?.();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: (error as Error).message || "Something went wrong",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormValues) => {
    if (!data.photo_url) {
      data.photo_url =
        "https://placehold.co/600x400/orange/white?text=Menu+Item";
    }
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Edit Menu Item</DialogTitle>
        </DialogHeader>

        <div className="pt-2">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                {[
                  {
                    name: "name",
                    label: "Dish Name",
                    placeholder: "Chicken Curry",
                    span: 3,
                  },
                  {
                    name: "price",
                    label: "Price",
                    placeholder: "9.99",
                    span: 3,
                    prefix: "₹",
                  },
                  {
                    name: "available_till",
                    label: "Available Till",
                    type: "time",
                    span: 3,
                  },
                  {
                    name: "photo_url",
                    label: "Photo URL",
                    placeholder: "https://...",
                    span: 3,
                  },
                  {
                    name: "description",
                    label: "Description",
                    type: "textarea",
                    span: 6,
                  },
                ].map((field, idx) => (
                  <FormField
                    key={idx}
                    control={form.control}
                    name={field.name as keyof FormValues}
                    render={({ field: f }) => (
                      <FormItem className={`sm:col-span-${field.span}`}>
                        <FormLabel>{field.label}</FormLabel>
                        <FormControl>
                          {field.type === "textarea" ? (
                            <Textarea {...f} className="resize-none" rows={3} />
                          ) : field.prefix ? (
                            <div className="relative rounded-md">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <span className="text-gray-500 sm:text-sm">
                                  {field.prefix}
                                </span>
                              </div>
                              <Input
                                placeholder={field.placeholder}
                                className="pl-7"
                                {...f}
                              />
                            </div>
                          ) : (
                            <Input
                              type={field.type || "text"}
                              placeholder={field.placeholder}
                              {...f}
                            />
                          )}
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-3">
                      <FormLabel>Category</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Drinks">Drinks</SelectItem>
                          <SelectItem value="Curry">Curry</SelectItem>
                          <SelectItem value="Bread">Bread</SelectItem>
                          <SelectItem value="Rice">Rice</SelectItem>
                          <SelectItem value="Dessert">Dessert</SelectItem>
                          <SelectItem value="Appetizer">Appetizer</SelectItem>
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
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
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
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    form.reset(initialValues);
                    onClose();
                  }}
                  disabled={mutation.isPending}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={mutation.isPending}>
                  {mutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Edit Request"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
