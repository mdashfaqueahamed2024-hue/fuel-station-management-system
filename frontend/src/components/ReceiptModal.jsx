import React from 'react';
import { Modal } from './ui/Modal.jsx';
import { Button } from './ui/Button.jsx';
import { Printer, CheckCircle2 } from 'lucide-react';

export const ReceiptModal = ({ isOpen, onClose, sale, stationName }) => {
  if (!sale) return null;

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = new Date(sale.createdAt || Date.now()).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Fuel Dispenser Sale Receipt"
      subtitle="Official point-of-sale customer copy"
      maxWidth="max-w-md"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button variant="primary" onClick={handlePrint} className="no-print">
            <Printer className="w-4 h-4 mr-2" />
            Print Receipt
          </Button>
        </>
      }
    >
      <div className="bg-white p-6 rounded-lg border border-slate-200 font-mono text-xs text-slate-800 leading-relaxed shadow-inner">
        {/* Receipt Header */}
        <div className="text-center pb-4 border-b border-dashed border-slate-300">
          <div className="font-bold text-sm text-slate-900 tracking-wide uppercase">
            {stationName || 'PETROFLOW SUPERSTATION'}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Automated Petroleum Retail Network</div>
          <div className="text-[10px] text-slate-400 mt-0.5">GSTIN: 29AABCP9921E1Z4</div>
        </div>

        {/* Transaction Metadata */}
        <div className="py-3 border-b border-dashed border-slate-300 space-y-1">
          <div className="flex justify-between">
            <span className="text-slate-500">TXN NUMBER:</span>
            <span className="font-bold">{sale.transactionNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">DATE & TIME:</span>
            <span>{formattedDate}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">PUMP DISPENSER:</span>
            <span className="font-semibold">{sale.pump?.pumpNumber || 'PUMP-01'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">ATTENDANT:</span>
            <span>{sale.attendant?.fullName || 'Rahul Verma'}</span>
          </div>
          {sale.customer && (
            <div className="flex justify-between">
              <span className="text-slate-500">CUSTOMER:</span>
              <span>{sale.customer.name}</span>
            </div>
          )}
        </div>

        {/* Fuel Details */}
        <div className="py-4 border-b border-dashed border-slate-300 space-y-2">
          <div className="font-bold text-slate-900 text-sm">
            {sale.fuelProduct?.name || 'Regular Petrol (RON 91)'}
          </div>
          <div className="flex justify-between text-xs">
            <span>VOLUME DISPENSED:</span>
            <span className="font-bold">{Number(sale.quantityLiters).toFixed(2)} Liters</span>
          </div>
          <div className="flex justify-between text-xs">
            <span>UNIT RATE:</span>
            <span>₹{Number(sale.pricePerLiter).toFixed(2)} / Liter</span>
          </div>
          {Number(sale.discountAmount || 0) > 0 && (
            <div className="flex justify-between text-xs text-emerald-700">
              <span>DISCOUNT:</span>
              <span>-₹{Number(sale.discountAmount).toFixed(2)}</span>
            </div>
          )}
        </div>

        {/* Grand Total */}
        <div className="py-4 border-b-2 border-slate-900 space-y-2">
          <div className="flex justify-between items-baseline text-base font-bold text-slate-900">
            <span>TOTAL AMOUNT:</span>
            <span>₹{Number(sale.totalAmount).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-xs text-slate-600">
            <span>PAYMENT METHOD:</span>
            <span className="font-bold uppercase tracking-wider">{sale.paymentMethod || 'CASH'}</span>
          </div>
          <div className="flex justify-between text-xs text-slate-600">
            <span>STATUS:</span>
            <span className="font-semibold text-emerald-600 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {sale.paymentStatus || 'COMPLETED'}
            </span>
          </div>
        </div>

        {/* Barcode Mockup and Footer */}
        <div className="text-center pt-5 space-y-2">
          <div className="inline-block tracking-[0.25em] text-lg font-black text-slate-400 select-none">
            ||| | |||| | ||| |||| | ||
          </div>
          <div className="text-[10px] text-slate-500">
            Thank you for fueling with PetroFlow!
            <br />
            Drive Safely & Conserve Fuel
          </div>
        </div>
      </div>
    </Modal>
  );
};
