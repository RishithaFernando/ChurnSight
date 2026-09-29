import React from 'react';
import { CheckCircle } from 'lucide-react';

export default function ThankYou() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center max-w-md animate-fadeIn">
        <div className="mx-auto w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-8 animate-scaleIn">
          <CheckCircle className="w-12 h-12 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-3">Thank You!</h1>
        <p className="text-gray-500 text-lg mb-2">
          Your feedback has been submitted successfully.
        </p>
        <p className="text-gray-400 text-sm">
          Our team will review your responses and reach out if needed.
        </p>
        <div className="mt-12 text-gray-300 text-sm font-medium tracking-wide">
          ChurnSight
        </div>
      </div>
    </div>
  );
}
