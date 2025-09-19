import PublicLayout from "@/components/layouts/PublicLayout";
import { useParams } from "wouter";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Hotel } from "@shared/schema";

export default function ServicePage() {
    const { hotelId } = useParams();
      const { data: hotel, isLoading: hotelLoading, error: hotelError } = useQuery<Hotel>({
        queryKey: [`/api/hotels/${hotelId}`],
      });
    const [service, setService] = useState<null | Record<string, string>>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchService = async () => {
            // Try to retrieve from cache first
            const cachedService = sessionStorage.getItem(`service_${hotelId}`);
            if (cachedService) {
                setService(JSON.parse(cachedService)); // If data is found in cache, use it
                setLoading(false);
                return; // Skip fetching from API
            }

            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL}/api/hotels/${hotelId}/Service`);
                if (!response.ok) {
                    throw new Error("Failed to fetch Service details");
                }
                const data = await response.json();
                console.log(data);

                // Cache the data in localStorage
                sessionStorage.setItem(`service_${hotelId}`, JSON.stringify(data));

                setService(data);
            } catch (err: unknown) {
                if (err instanceof Error) {
                    setError(err.message);
                } else {
                    setError("An unknown error occurred.");
                }
            } finally {
                setLoading(false);
            }
        };

        fetchService();
    }, [hotelId]);

    return (
<PublicLayout hotelId={hotelId!} hotelName={hotel!.name}>
  <div className="p-6 max-w-6xl mx-auto">
    <div className="mb-12 text-center">
      <h2 className="text-4xl font-extrabold text-gray-900 mb-3">Our Services</h2>
      <p className="text-base text-gray-500">Here for You, Always</p>
    </div>

    {loading && <p className="text-gray-500 text-center text-lg">Loading service details...</p>}
    {error && <p className="text-red-500 text-center text-lg">{error}</p>}

    {service && (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
  {Object.entries(service).map(([key, value]) => (
    <div
      key={key}
      className="relative bg-white bg-opacity-90 backdrop-blur-md shadow-lg rounded-2xl p-6 border border-gray-100 hover:shadow-xl transition duration-300 ease-in-out"
    >
      {/* Decorative lines like in original div */}
      <div className="absolute top-0 left-0 w-full h-px bg-gray-300" />
      <div className="absolute top-2 left-0 w-full h-px bg-gray-200" />
      <div className="absolute top-0 left-0 h-full w-px bg-gray-200" />
      <div className="absolute top-0 right-0 h-full w-px bg-gray-100" />

      {/* Title */}
      <h3 className="text-xl font-semibold text-gray-800 capitalize mb-3 tracking-tight text-center">
        {key.replace(/_/g, ' ')}
      </h3>

      {/* Description */}
      <p className="text-base text-gray-600 leading-relaxed">{value}</p>
    </div>
  ))}
</div>
    )}

    {!service && !loading && !error && (
      <p className="text-center text-gray-600 text-lg">No service details available.</p>
    )}
  </div>
</PublicLayout>


    );
}