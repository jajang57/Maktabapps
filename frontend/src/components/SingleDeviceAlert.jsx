import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export default function SingleDeviceAlert() {
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const { logout } = useAuth();

  useEffect(() => {
    // Listen for single device violation events
    const handleSingleDeviceViolation = (event) => {
      if (event.detail && event.detail.type === 'SINGLE_DEVICE_VIOLATION') {
        setAlertMessage(event.detail.message || 'Akun Anda sedang digunakan di device lain.');
        setShowAlert(true);
      }
    };

    window.addEventListener('singleDeviceViolation', handleSingleDeviceViolation);

    return () => {
      window.removeEventListener('singleDeviceViolation', handleSingleDeviceViolation);
    };
  }, []);

  const handleConfirm = () => {
    setShowAlert(false);
    logout();
  };

  if (!showAlert) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
        <div className="flex items-center mb-4">
          <div className="flex-shrink-0">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 15.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-medium text-gray-900">
              Session Berakhir
            </h3>
          </div>
        </div>
        
        <div className="mb-4">
          <p className="text-sm text-gray-600">
            {alertMessage}
          </p>
          <p className="text-sm text-gray-600 mt-2">
            Untuk keamanan, hanya satu device yang dapat menggunakan akun yang sama pada satu waktu.
          </p>
        </div>
        
        <div className="flex justify-end">
          <button
            onClick={handleConfirm}
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            Mengerti
          </button>
        </div>
      </div>
    </div>
  );
}
