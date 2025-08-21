'use client';

import { useState, useEffect } from 'react';
import { QrCode, Download, Share2 } from 'lucide-react';

export default function AppQRCode() {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(true);

  useEffect(() => {
    generateQRCode();
  }, []);

  const generateQRCode = async () => {
    try {
      setIsGenerating(true);
      
      // Get current URL
      const currentUrl = window.location.origin;
      
      // Create QR code using a simple API (you can also use a library like qrcode)
      const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(currentUrl)}`;
      
      setQrCodeUrl(qrApiUrl);
    } catch (error) {
      console.error('Error generating QR code:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadQR = () => {
    if (!qrCodeUrl) return;
    
    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.download = 'cadeala-app-qr.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShareQR = async () => {
    if (!qrCodeUrl) return;
    
    try {
      // Try to use native sharing
      if (navigator.share) {
        await navigator.share({
          title: 'CADeala App',
          text: 'Scan this QR code to access CADeala app',
          url: window.location.origin
        });
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(window.location.origin);
        alert('App URL copied to clipboard!');
      }
    } catch (error) {
      console.error('Error sharing:', error);
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(window.location.origin);
        alert('App URL copied to clipboard!');
      } catch (clipboardError) {
        console.error('Error copying to clipboard:', clipboardError);
      }
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="text-center">
        <div className="flex items-center justify-center mb-4">
          <QrCode className="h-6 w-6 text-orange mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">
            Scan to Install CADeala
          </h3>
        </div>
        
        <p className="text-sm text-gray-600 mb-4">
          Scan this QR code with your phone to open and install the CADeala app
        </p>
        
        <div className="flex justify-center mb-4">
          {isGenerating ? (
            <div className="w-48 h-48 bg-gray-100 rounded-lg flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange"></div>
            </div>
          ) : (
            <div className="relative">
              <img 
                src={qrCodeUrl} 
                alt="CADeala App QR Code" 
                className="w-48 h-48 rounded-lg border border-gray-200"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <img 
                  src="/CADEALA LOGO.png" 
                  alt="CADeala Logo" 
                  className="w-12 h-12 rounded-lg bg-white p-1 shadow-sm"
                />
              </div>
            </div>
          )}
        </div>
        
        <div className="space-y-2">
          <div className="flex space-x-2">
            <button
              onClick={handleDownloadQR}
              disabled={isGenerating}
              className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              <Download className="h-4 w-4 mr-2" />
              Download QR
            </button>
            
            <button
              onClick={handleShareQR}
              disabled={isGenerating}
              className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </button>
          </div>
          
          <div className="text-xs text-gray-500">
            Works on Android and iOS devices
          </div>
        </div>
      </div>
    </div>
  );
}
