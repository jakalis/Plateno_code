import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { QrCode } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { QRCodeSVG } from "qrcode.react";

interface QRCodeViewProps {
  hotelId: string;
  qrCodeUrl: string;
}

export default function QRCodeView({ hotelId, qrCodeUrl }: QRCodeViewProps) {
  const [open, setOpen] = useState(false);
  const fullUrl = `${window.location.origin}/menu/${hotelId}`;



  

  // Generate QR code SVG

  const generateQRCode = () => {
    return (
      <div className="flex flex-col items-center justify-center p-4 bg-white rounded-lg">
        <div className="w-[200px] h-[200px] border border-gray-200 rounded-lg flex items-center justify-center bg-white">
          <QRCodeSVG
            value={fullUrl} // this should be your unique menu URL
            size={180}
            level="H"
            includeMargin
          />
        </div>
  
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500 mt-1 break-all">{fullUrl}</p>
        </div>
  
        <div className="mt-4 flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigator.clipboard.writeText(fullUrl)}
          >
            Copy URL
          </Button>
          <Button
            size="sm"
            onClick={() => {
              const svg = document.querySelector('.qr-code-container svg');
              if (svg) {
                const svgData = new XMLSerializer().serializeToString(svg);
                const blob = new Blob([svgData], { type: 'image/svg+xml' });
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
    <Card className="max-w-md mx-auto mt-10 shadow-md">
      <CardHeader className="text-center">
        <CardTitle className="text-xl font-semibold text-gray-800">
          QR Code for Your Hotel Menu
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="qr-code-container flex justify-center py-4">
          {generateQRCode()}
        </div>
      </CardContent>
    </Card>
  );
}