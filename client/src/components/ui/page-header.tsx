import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

interface PageHeaderProps {
  title: string;
  userEmail: string;
  onLogout: () => void;
}

export default function PageHeader({ title, userEmail, onLogout }: PageHeaderProps) {
  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <span className="text-lg font-semibold text-primary-600">{title}</span>
            </div>
          </div>
          <div className="flex items-center">
            <div className="flex items-center">
              <span className="text-sm font-medium text-gray-700 mr-4">{userEmail}</span>
              <Button variant="outline" size="sm" onClick={onLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
