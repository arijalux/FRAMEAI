import React from 'react';
import { Product } from '../../types';
import { ARMarkerTarget } from './ARMarkerTarget';
import { Printer, X, Download, QrCode, Smartphone, Sparkles, Box } from 'lucide-react';

interface ARPrintableStandeeProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
  mobileUrl: string;
}

export const ARPrintableStandee: React.FC<ARPrintableStandeeProps> = ({
  product,
  isOpen,
  onClose,
  mobileUrl,
}) => {
  if (!isOpen) return null;

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
    mobileUrl
  )}&format=svg&margin=4`;

  const frameWidthMm = product.frameWidthMm || product.dimensions?.frameWidth || 138;
  const lensWidthMm = product.lensWidthMm || product.dimensions?.lensWidth || 51;
  const bridgeWidthMm = product.bridgeWidthMm || product.dimensions?.bridgeWidth || 19;
  const templeLengthMm = product.templeLengthMm || product.dimensions?.templeLength || 145;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white text-neutral-900 rounded-3xl shadow-2xl overflow-hidden border border-neutral-200 my-8">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 bg-neutral-50 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
              <Printer size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-900">
                Official AR Product Display Standee
              </h3>
              <p className="text-[11px] text-neutral-500">
                Calibrated 100mm × 100mm Physical Target with Deep-Link QR
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-full text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              <Printer size={14} />
              <span>Print Standee Card</span>
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-neutral-200 hover:bg-neutral-300 text-neutral-700 flex items-center justify-center cursor-pointer transition-all"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Printable Standee Sheet Content */}
        <div className="p-8 sm:p-10 space-y-8 print:p-6" id="printable-standee-card">
          {/* Card Header Branding */}
          <div className="flex justify-between items-start border-b-2 border-neutral-900 pb-4">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-orange-600 block">
                BJ Homemade • Handcrafted Wooden Eyewear
              </span>
              <h2 className="text-2xl sm:text-3xl font-serif italic text-neutral-900 mt-0.5">
                {product.name}
              </h2>
              <p className="text-xs text-neutral-600 mt-1 font-sans">
                Crafted by <strong className="text-neutral-900">{product.sellerName}</strong> ({product.sellerLocation})
              </p>
            </div>

            <div className="text-right font-mono text-xs">
              <span className="inline-block px-2.5 py-1 bg-neutral-900 text-white rounded-md font-bold text-[10px] uppercase tracking-wider">
                1:1 AR SCALE CARD
              </span>
              <p className="text-[10px] text-neutral-500 mt-1">FRAME WIDTH: {frameWidthMm}mm</p>
            </div>
          </div>

          {/* Dual Elements: 1. QR CODE + 2. AR MARKER */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 items-center bg-neutral-50 p-6 rounded-2xl border border-neutral-200">
            {/* ELEMENT 1: QR CODE */}
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="relative p-3 bg-white rounded-2xl shadow-sm border border-neutral-200">
                <img
                  src={qrImageUrl}
                  alt="AR Product QR Code"
                  className="w-40 h-40 object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div>
                <span className="text-xs font-bold text-neutral-900 flex items-center justify-center gap-1">
                  <Smartphone size={13} className="text-orange-600" />
                  1. Scan with Phone
                </span>
                <p className="text-[11px] text-neutral-500 max-w-[200px] mt-0.5">
                  Opens the real-time AR product camera on your mobile browser.
                </p>
              </div>
            </div>

            {/* ELEMENT 2: 100mm AR TARGET MARKER */}
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="p-1 bg-white rounded-2xl shadow-sm border border-neutral-200">
                <ARMarkerTarget sizeMm={100} pixelSize={160} showRuler={true} />
              </div>
              <div>
                <span className="text-xs font-bold text-neutral-900 flex items-center justify-center gap-1">
                  <Box size={13} className="text-orange-600" />
                  2. 100mm Target Reference
                </span>
                <p className="text-[11px] text-neutral-500 max-w-[200px] mt-0.5">
                  Point phone camera at this marker to anchor the virtual frame in 1:1 scale.
                </p>
              </div>
            </div>
          </div>

          {/* Frame Optical Dimension Guide */}
          <div className="grid grid-cols-4 gap-3 text-center font-mono text-xs border border-neutral-200 rounded-xl p-3 bg-white">
            <div>
              <span className="text-[9px] uppercase text-neutral-400 block">Frame Width</span>
              <span className="font-bold text-orange-600 text-sm">{frameWidthMm} mm</span>
            </div>
            <div>
              <span className="text-[9px] uppercase text-neutral-400 block">Lens</span>
              <span className="font-bold text-neutral-800 text-sm">
                {lensWidthMm} mm
              </span>
            </div>
            <div>
              <span className="text-[9px] uppercase text-neutral-400 block">Bridge</span>
              <span className="font-bold text-neutral-800 text-sm">{bridgeWidthMm} mm</span>
            </div>
            <div>
              <span className="text-[9px] uppercase text-neutral-400 block">Temple</span>
              <span className="font-bold text-neutral-800 text-sm">{templeLengthMm} mm</span>
            </div>
          </div>

          {/* Footer Card Instructions */}
          <div className="flex justify-between items-center text-[10px] text-neutral-500 pt-2 border-t border-neutral-200">
            <span>© 2026 BJ Homemade Eyewear</span>
            <span>Scale Calibration Verified: 100mm Marker = 1:1 Ratio</span>
          </div>
        </div>
      </div>
    </div>
  );
};
