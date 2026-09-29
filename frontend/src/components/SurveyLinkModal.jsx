import React, { useState } from 'react';
import { X, Copy, Check, Share2 } from 'lucide-react';

export default function SurveyLinkModal({ onClose, token = 'default', campaignName = '' }) {
  const [copied, setCopied] = useState(false);
  const surveyLink = `${window.location.origin}/survey/${token}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(surveyLink);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = surveyLink;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const title = campaignName
    ? `Share ${campaignName} Survey`
    : 'Share Survey with Customers';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 animate-scaleIn">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
            <Share2 className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {title}
            </h2>
            <p className="text-sm text-gray-500">
              Copy this link and share it with your customers
            </p>
          </div>
        </div>

        <div className="mt-5 flex items-center gap-2">
          <div className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 font-mono truncate select-all">
            {surveyLink}
          </div>
          <button
            onClick={handleCopy}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-medium text-sm whitespace-nowrap ${
              copied
                ? 'bg-green-600 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md'
            }`}
          >
            {copied ? (
              <Check className="w-4 h-4" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>
    </div>
  );
}
