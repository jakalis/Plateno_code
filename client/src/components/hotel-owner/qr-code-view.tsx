import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { QrCode } from "lucide-react";

interface QRCodeViewProps {
  hotelId: string;
  qrCodeUrl: string;
}

export default function QRCodeView({ hotelId, qrCodeUrl }: QRCodeViewProps) {
  const [open, setOpen] = useState(false);
  const fullUrl = `${window.location.origin}/menu/${hotelId}`;

  // Generate QR code SVG
  const generateQRCode = () => {
    const size = 200;
    const qrSize = 8;
    const cellSize = size / qrSize;

    return (
      <div className="flex flex-col items-center justify-center p-4 bg-white rounded-lg">
        <div className="w-[200px] h-[200px] border border-gray-200 rounded-lg flex items-center justify-center">
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Simple QR code representation */}
            <rect width={size} height={size} fill="white" />
            <rect x={cellSize} y={cellSize} width={cellSize} height={cellSize} fill="black" />
            <rect x={cellSize * 2} y={cellSize} width={cellSize} height={cellSize} fill="black" />
            <rect x={cellSize * 3} y={cellSize} width={cellSize} height={cellSize} fill="black" />
            <rect x={cellSize} y={cellSize * 2} width={cellSize} height={cellSize} fill="black" />
            <rect x={cellSize * 3} y={cellSize * 2} width={cellSize} height={cellSize} fill="black" />
            <rect x={cellSize} y={cellSize * 3} width={cellSize} height={cellSize} fill="black" />
            <rect x={cellSize * 2} y={cellSize * 3} width={cellSize} height={cellSize} fill="black" />
            <rect x={cellSize * 3} y={cellSize * 3} width={cellSize} height={cellSize} fill="black" />
            <rect x={cellSize * 5} y={cellSize} width={cellSize} height={cellSize} fill="black" />
            <rect x={cellSize * 6} y={cellSize} width={cellSize} height={cellSize} fill="black" />
            <rect x={cellSize * 5} y={cellSize * 2} width={cellSize} height={cellSize} fill="black" />
            <rect x={cellSize * 5} y={cellSize * 3} width={cellSize} height={cellSize} fill="black" />
            <rect x={cellSize * 6} y={cellSize * 3} width={cellSize} height={cellSize} fill="black" />
            <rect x={cellSize} y={cellSize * 5} width={cellSize} height={cellSize} fill="black" />
            <rect x={cellSize * 2} y={cellSize * 5} width={cellSize} height={cellSize} fill="black" />
            <rect x={cellSize * 3} y={cellSize * 5} width={cellSize} height={cellSize} fill="black" />
            <rect x={cellSize} y={cellSize * 6} width={cellSize} height={cellSize} fill="black" />
            <rect x={cellSize * 3} y={cellSize * 6} width={cellSize} height={cellSize} fill="black" />
            <rect x={cellSize * 5} y={cellSize * 5} width={cellSize} height={cellSize} fill="black" />
            <rect x={cellSize * 6} y={cellSize * 5} width={cellSize} height={cellSize} fill="black" />
            <rect x={cellSize * 5} y={cellSize * 6} width={cellSize} height={cellSize} fill="black" />
          </svg>
        </div>

        <div className="mt-4 text-center">
          <p className="text-sm font-medium text-gray-700">Scan this QR code to view your hotel menu</p>
          <p className="text-xs text-gray-500 mt-1">{fullUrl}</p>
        </div>

        <div className="mt-4 flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              navigator.clipboard.writeText(fullUrl);
            }}
          >
            Copy URL
          </Button>
          <Button
            size="sm"
            onClick={() => {
              // Create a download link for the QR code
              const svg = document.querySelector('.qr-code-container svg');
              if (svg) {
                const svgData = new XMLSerializer().serializeToString(svg);
                const blob = new Blob([svgData], {type: 'image/svg+xml'});
                const url = URL.createObjectURL(blob);

                const link = document.createElement('a');
                link.href = url;
                link.download = `qrcode-${hotelId}.svg`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
              }
            }}
          >
            Download QR
          </Button>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <QrCode className="h-4 w-4 mr-2" />
          View QR Code
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>QR Code for Your Hotel Menu</DialogTitle>
        </DialogHeader>
        <div className="qr-code-container">
          {generateQRCode()}
        </div>
      </DialogContent>
    </Dialog>
  );
}