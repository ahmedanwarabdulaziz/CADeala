'use client';

import { useState, useEffect } from 'react';
import { Download, Smartphone, HelpCircle } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface InstallButtonProps {
  variant?: 'primary' | 'secondary' | 'icon';
  className?: string;
  showInstructions?: boolean;
}

export default function InstallButton({ 
  variant = 'primary', 
  className = '',
  showInstructions = true 
}: InstallButtonProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showInstructionsModal, setShowInstructionsModal] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Check if mobile device
    setIsMobile(/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // If no install prompt available, show instructions
      if (showInstructions) {
        setShowInstructionsModal(true);
      }
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }
    
    setDeferredPrompt(null);
  };

  // Don't show if app is already installed
  if (isInstalled) {
    return null;
  }

  const renderButton = () => {
    switch (variant) {
      case 'icon':
        return (
          <button
            onClick={handleInstallClick}
            className={`p-2 rounded-lg bg-orange hover:bg-orange-600 text-white transition-colors duration-200 ${className}`}
            title="Install CADeala App"
          >
            <Download className="h-5 w-5" />
          </button>
        );
      
      case 'secondary':
        return (
          <button
            onClick={handleInstallClick}
            className={`inline-flex items-center px-3 py-2 border border-orange text-orange hover:bg-orange hover:text-white rounded-md text-sm font-medium transition-colors duration-200 ${className}`}
          >
            <Download className="h-4 w-4 mr-2" />
            Install App
          </button>
        );
      
      default:
        return (
          <button
            onClick={handleInstallClick}
            className={`inline-flex items-center px-4 py-2 bg-orange hover:bg-orange-600 text-white rounded-md text-sm font-medium transition-colors duration-200 ${className}`}
          >
            <Download className="h-4 w-4 mr-2" />
            Install CADeala
          </button>
        );
    }
  };

  return (
    <>
      {renderButton()}
      
      {/* Installation Instructions Modal */}
      {showInstructionsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Smartphone className="h-5 w-5 mr-2 text-orange" />
                Install CADeala App
              </h3>
              <button
                onClick={() => setShowInstructionsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <HelpCircle className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              {isMobile ? (
                <>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">📱 Android (Chrome)</h4>
                    <ol className="text-sm text-blue-800 space-y-1">
                      <li>1. Tap the menu (⋮) in the top right</li>
                      <li>2. Select "Add to Home screen"</li>
                      <li>3. Tap "Add" to install</li>
                    </ol>
                  </div>
                  
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-medium text-green-900 mb-2">🍎 iOS (Safari)</h4>
                    <ol className="text-sm text-green-800 space-y-1">
                      <li>1. Tap the Share button (📤)</li>
                      <li>2. Select "Add to Home Screen"</li>
                      <li>3. Tap "Add" to install</li>
                    </ol>
                  </div>
                </>
              ) : (
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h4 className="font-medium text-purple-900 mb-2">💻 Desktop (Chrome/Edge)</h4>
                  <ol className="text-sm text-purple-800 space-y-1">
                    <li>1. Look for the install icon in the address bar</li>
                    <li>2. Click "Install" to add to desktop</li>
                    <li>3. Or use Ctrl+Shift+I to open install menu</li>
                  </ol>
                </div>
              )}
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">✨ Benefits</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• Faster access from home screen</li>
                  <li>• Full-screen experience</li>
                  <li>• Works like a native app</li>
                  <li>• Better performance</li>
                </ul>
              </div>
            </div>
            
            <div className="mt-6 flex space-x-3">
              <button
                onClick={() => setShowInstructionsModal(false)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-md text-sm font-medium transition-colors duration-200"
              >
                Got it
              </button>
              {deferredPrompt && (
                <button
                  onClick={handleInstallClick}
                  className="flex-1 bg-orange hover:bg-orange-600 text-white py-2 px-4 rounded-md text-sm font-medium transition-colors duration-200"
                >
                  Install Now
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
