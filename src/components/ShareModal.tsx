// Copyright (c) AemiliusXIV
// SPDX-License-Identifier: Apache-2.0
import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface ShareModalProps {
  url: string;
  onClose: () => void;
}

export function ShareModal({ url, onClose }: ShareModalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div
      className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-p5card border-l-4 border-p5red p-5 max-w-sm w-full"
        style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-bold text-p5white text-base uppercase tracking-widest">
            Share Fusion Chain
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-gray-500 hover:text-p5white transition-colors text-xl leading-none"
          >
            ×
          </button>
        </div>

        {/* QR code */}
        <div className="flex justify-center mb-4 bg-p5black border border-p5border p-4">
          <QRCodeSVG
            value={url}
            size={192}
            bgColor="#0d0d0d"
            fgColor="#f5f5f5"
            level="M"
          />
        </div>

        {/* URL row */}
        <div className="flex gap-2">
          <input
            type="text"
            readOnly
            value={url}
            onFocus={e => e.target.select()}
            className="input-p5 flex-1 text-xs font-mono min-w-0"
          />
          <button
            onClick={handleCopy}
            className={`shrink-0 px-3 py-1.5 text-xs font-display font-bold uppercase tracking-wider border transition-colors ${
              copied
                ? 'border-green-500 text-green-400 bg-green-950/30'
                : 'border-p5border text-gray-400 hover:border-p5red hover:text-p5red'
            }`}
          >
            {copied ? '✓ Copied' : 'Copy'}
          </button>
        </div>

        <p className="text-[10px] text-gray-600 font-display mt-2">
          Link encodes the full chain — recipes and ingredient choices at every level.
        </p>
      </div>
    </div>
  );
}
