import PublicLayout from "@/components/layouts/PublicLayout";
import { useParams } from "wouter";
import { useEffect, useState } from "react";

export default function ContactPage() {
    const { hotelId } = useParams();
    const [contact, setContact] = useState<null | Record<string, string>>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchContact = async () => {
            // Try to retrieve from cache first
            const cachedContact = sessionStorage.getItem(`contact_${hotelId}`);
            if (cachedContact) {
                setContact(JSON.parse(cachedContact)); // If data is found in cache, use it
                setLoading(false);
                return; // Skip fetching from API
            }

            try {
                const response = await fetch(`/api/hotels/${hotelId}/contact`);
                if (!response.ok) {
                    throw new Error("Failed to fetch contact details");
                }
                const data = await response.json();
                console.log(data);
                
                // Cache the data in localStorage
                sessionStorage.setItem(`contact_${hotelId}`, JSON.stringify(data));

                setContact(data);
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

        fetchContact();
    }, [hotelId]);

    return (
<PublicLayout hotelId={hotelId!}>
    <div className="p-6 max-w-2xl mx-auto">
    <div className="mb-10 text-center">
    <h2 className="text-4xl font-bold text-gray-800 mb-2">
        Contact Us
    </h2>
    <p className="text-sm text-gray-500">We’d love to hear from you</p>
</div>

        {loading && <p className="text-gray-500">Loading contact details...</p>}
        {error && <p className="text-red-500">{error}</p>}

        {contact && (
            <div className="bg-white shadow-md rounded-2xl p-6 space-y-4 border border-gray-100">
                {Object.entries(contact).map(([key, value]) => (
                    <div
                        key={key}
                        className="flex justify-between items-center border-b border-gray-100 pb-2 last:border-b-0 last:pb-0"
                    >
                        <span className="text-gray-600 font-medium capitalize">{key.replace(/_/g, ' ')}</span>
                        <span className="text-gray-900">{value}</span>
                    </div>
                ))}
            </div>
        )}

        {!contact && !loading && !error && (
            <p className="text-gray-600">No contact details available.</p>
        )}
    </div>
</PublicLayout>
    );
}