import { MenuItem } from "@shared/schema";

interface MenuDisplayProps {
  categories: Record<string, MenuItem[]>;
  currentTime: string;
}

export default function MenuDisplay({ categories, currentTime }: MenuDisplayProps) {
  // If no menu items available
  if (Object.keys(categories).length === 0) {
    return (
      <div className="bg-white shadow-sm rounded-lg p-10 text-center">
        <p className="text-gray-500">No menu items available at the moment.</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-12">
      {Object.entries(categories).map(([category, items]) => (
        <div key={category}>
          <div className="mb-6">
            <h3 className="text-2xl font-bold text-gray-900 border-b-2 border-primary pb-2">{category}</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map(item => {
              // Check if item is available based on time
              const isAvailable = item.available_till >= currentTime;
              
              return (
                <div 
                  key={item.id} 
                  className={`bg-white rounded-xl shadow-lg overflow-hidden transform transition hover:scale-105 ${!isAvailable ? 'opacity-50' : ''}`}
                >
                  <div className="h-48 w-full bg-gray-200">
                    {item.photo_url ? (
                      <img 
                        src={item.photo_url} 
                        alt={item.name} 
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full flex items-center justify-center">
                        <span className="text-gray-400">No Image</span>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xl font-bold text-gray-900">{item.name}</h4>
                      <span className="text-lg font-semibold text-primary">₹{item.price}</span>
                    </div>
                    <p className="text-gray-600 mb-2">{item.description}</p>
                    {!isAvailable && (
                      <p className="text-sm text-red-500 font-medium">
                        Not available after {item.available_till}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
