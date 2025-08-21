'use client';

import { useState } from 'react';
import InstallButton from '@/components/InstallButton';
import AppQRCode from '@/components/AppQRCode';
import { Smartphone, Download, QrCode, Share2, CheckCircle } from 'lucide-react';

export default function InstallPage() {
  const [activeTab, setActiveTab] = useState<'install' | 'qr' | 'instructions'>('install');

  const tabs = [
    { id: 'install', name: 'Install App', icon: Download },
    { id: 'qr', name: 'QR Code', icon: QrCode },
    { id: 'instructions', name: 'Instructions', icon: Smartphone },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img 
              src="/CADEALA LOGO.png" 
              alt="CADeala Logo" 
              className="h-16 w-auto"
            />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Install CADeala App
          </h1>
          <p className="text-lg text-gray-600">
            Get the best experience with our mobile app
          </p>
        </div>

        {/* Benefits */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 text-center">
            <div className="w-12 h-12 bg-orange rounded-lg flex items-center justify-center mx-auto mb-4">
              <Smartphone className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Native Experience</h3>
            <p className="text-gray-600">Full-screen app experience without browser UI</p>
          </div>
          
          <div className="bg-white rounded-lg p-6 text-center">
            <div className="w-12 h-12 bg-navy-blue rounded-lg flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Fast Access</h3>
            <p className="text-gray-600">Quick access from your home screen</p>
          </div>
          
          <div className="bg-white rounded-lg p-6 text-center">
            <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Share2 className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Better Performance</h3>
            <p className="text-gray-600">Optimized for mobile devices</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`
                      py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2
                      ${activeTab === tab.id
                        ? 'border-orange text-orange'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }
                    `}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-6">
            {/* Install Tab */}
            {activeTab === 'install' && (
              <div className="text-center">
                <div className="max-w-md mx-auto">
                  <div className="mb-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      Install CADeala App
                    </h3>
                    <p className="text-gray-600">
                      Click the button below to install the app on your device
                    </p>
                  </div>
                  
                  <div className="space-y-4">
                    <InstallButton variant="primary" className="w-full" />
                    
                    <div className="text-sm text-gray-500">
                      Available for Android, iOS, and Desktop
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* QR Code Tab */}
            {activeTab === 'qr' && (
              <div className="max-w-md mx-auto">
                <AppQRCode />
              </div>
            )}

            {/* Instructions Tab */}
            {activeTab === 'instructions' && (
              <div className="max-w-2xl mx-auto">
                <h3 className="text-xl font-semibold text-gray-900 mb-6 text-center">
                  Installation Instructions
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Android Instructions */}
                  <div className="bg-blue-50 rounded-lg p-6">
                    <h4 className="font-semibold text-blue-900 mb-4 flex items-center">
                      <span className="text-2xl mr-2">📱</span>
                      Android (Chrome)
                    </h4>
                    <ol className="text-blue-800 space-y-2 text-sm">
                      <li className="flex items-start">
                        <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3 mt-0.5">1</span>
                        Open CADeala in Chrome browser
                      </li>
                      <li className="flex items-start">
                        <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3 mt-0.5">2</span>
                        Tap the menu (⋮) in the top right corner
                      </li>
                      <li className="flex items-start">
                        <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3 mt-0.5">3</span>
                        Select "Add to Home screen"
                      </li>
                      <li className="flex items-start">
                        <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3 mt-0.5">4</span>
                        Tap "Add" to install the app
                      </li>
                    </ol>
                  </div>

                  {/* iOS Instructions */}
                  <div className="bg-green-50 rounded-lg p-6">
                    <h4 className="font-semibold text-green-900 mb-4 flex items-center">
                      <span className="text-2xl mr-2">🍎</span>
                      iOS (Safari)
                    </h4>
                    <ol className="text-green-800 space-y-2 text-sm">
                      <li className="flex items-start">
                        <span className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3 mt-0.5">1</span>
                        Open CADeala in Safari browser
                      </li>
                      <li className="flex items-start">
                        <span className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3 mt-0.5">2</span>
                        Tap the Share button (📤) at the bottom
                      </li>
                      <li className="flex items-start">
                        <span className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3 mt-0.5">3</span>
                        Select "Add to Home Screen"
                      </li>
                      <li className="flex items-start">
                        <span className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3 mt-0.5">4</span>
                        Tap "Add" to install the app
                      </li>
                    </ol>
                  </div>

                  {/* Desktop Instructions */}
                  <div className="bg-purple-50 rounded-lg p-6 md:col-span-2">
                    <h4 className="font-semibold text-purple-900 mb-4 flex items-center">
                      <span className="text-2xl mr-2">💻</span>
                      Desktop (Chrome/Edge)
                    </h4>
                    <ol className="text-purple-800 space-y-2 text-sm">
                      <li className="flex items-start">
                        <span className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3 mt-0.5">1</span>
                        Open CADeala in Chrome or Edge browser
                      </li>
                      <li className="flex items-start">
                        <span className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3 mt-0.5">2</span>
                        Look for the install icon (📱) in the address bar
                      </li>
                      <li className="flex items-start">
                        <span className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3 mt-0.5">3</span>
                        Click "Install" to add to your desktop
                      </li>
                      <li className="flex items-start">
                        <span className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3 mt-0.5">4</span>
                        Or use Ctrl+Shift+I (Windows) or Cmd+Shift+I (Mac) to open install menu
                      </li>
                    </ol>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
