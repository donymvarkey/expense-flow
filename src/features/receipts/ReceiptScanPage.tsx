import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/toast';
import { createTransaction } from '@/services/transactions';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Camera, Upload, Loader2 } from 'lucide-react';
import { createWorker } from 'tesseract.js';

interface ExtractedData {
  amount: number | null;
  merchant: string | null;
  date: string | null;
  total: number | null;
}

export function ReceiptScanPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editMerchant, setEditMerchant] = useState('');
  const [editDate, setEditDate] = useState('');

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setImageUrl(url);
    processImage(url);
  };

  const processImage = async (url: string) => {
    setProcessing(true);
    setProgress(0);

    try {
      const worker = await createWorker('eng', undefined, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setProgress(Math.round(m.progress * 100));
          }
        },
      });

      const { data } = await worker.recognize(url);
      const extracted = extractReceiptData(data.text);
      setExtractedData(extracted);

      // Pre-fill edit fields
      setEditAmount(extracted.amount?.toString() || extracted.total?.toString() || '');
      setEditMerchant(extracted.merchant || '');
      setEditDate(extracted.date || new Date().toISOString().split('T')[0]!);

      await worker.terminate();
    } catch (error) {
      console.error('OCR failed:', error);
      toast({ title: 'Failed to scan receipt', variant: 'error' });
    } finally {
      setProcessing(false);
    }
  };

  const extractReceiptData = (text: string): ExtractedData => {
    const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);

    // Extract amount - look for total patterns
    let amount: number | null = null;
    let total: number | null = null;

    for (const line of lines) {
      const totalMatch = line.match(/(?:total|amount|due|balance)[:\s]*\$?([\d,]+\.?\d*)/i);
      if (totalMatch?.[1]) {
        const val = parseFloat(totalMatch[1].replace(',', ''));
        if (!isNaN(val)) total = val;
      }

      // General dollar amount
      const amountMatch = line.match(/\$\s*([\d,]+\.\d{2})/);
      if (amountMatch?.[1]) {
        const val = parseFloat(amountMatch[1].replace(',', ''));
        if (!isNaN(val) && val > (amount || 0)) amount = val;
      }
    }

    // Extract merchant (usually first meaningful line)
    const merchant = lines[0] || null;

    // Extract date
    let date: string | null = null;
    for (const line of lines) {
      const dateMatch = line.match(
        /(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})/
      );
      if (dateMatch) {
        const [, m, d, y] = dateMatch;
        const year = y!.length === 2 ? `20${y}` : y;
        date = `${year}-${m!.padStart(2, '0')}-${d!.padStart(2, '0')}`;
        break;
      }
    }

    return { amount: total || amount, merchant, date, total };
  };

  const handleSave = async () => {
    if (!user || !editAmount) {
      toast({ title: 'Amount is required', variant: 'error' });
      return;
    }

    try {
      await createTransaction(user.id, {
        amount: parseFloat(editAmount),
        type: 'expense',
        category_id: '', // Will need to select
        description: editMerchant || undefined,
        transaction_date: editDate || new Date().toISOString().split('T')[0]!,
      });

      toast({ title: 'Expense added from receipt', variant: 'success' });
      navigate('/transactions');
    } catch {
      toast({ title: 'Failed to save', variant: 'error' });
    }
  };

  return (
    <div className="transition-page min-h-screen px-4 pt-12 md:pt-6">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="rounded-full p-2 hover:bg-[hsl(var(--accent))]"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-bold">Scan Receipt</h1>
      </div>

      {!imageUrl ? (
        <div className="flex flex-col items-center gap-4 py-12">
          <div className="rounded-2xl border-2 border-dashed border-[hsl(var(--border))] p-12 text-center">
            <Camera className="mx-auto mb-4 h-12 w-12 text-[hsl(var(--muted-foreground))]" />
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              Take a photo or upload a receipt
            </p>
          </div>

          <div className="flex w-full gap-3">
            <Button
              className="flex-1"
              onClick={() => cameraInputRef.current?.click()}
            >
              <Camera className="mr-2 h-4 w-4" />
              Camera
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="mr-2 h-4 w-4" />
              Upload
            </Button>
          </div>

          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileSelect}
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Preview */}
          <div className="overflow-hidden rounded-xl border border-[hsl(var(--border))]">
            <img
              src={imageUrl}
              alt="Receipt"
              className="w-full max-h-48 object-cover"
            />
          </div>

          {/* Processing State */}
          {processing && (
            <div className="flex flex-col items-center gap-3 py-6">
              <Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--primary))]" />
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                Scanning receipt... {progress}%
              </p>
              <div className="h-2 w-48 rounded-full bg-[hsl(var(--muted))]">
                <div
                  className="h-full rounded-full bg-[hsl(var(--primary))] transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Extracted Data */}
          {extractedData && !processing && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">Extracted Information</h3>

              <div className="space-y-3 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
                <div>
                  <label className="text-xs text-[hsl(var(--muted-foreground))]">
                    Amount
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-[hsl(var(--border))] bg-transparent px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
                  />
                </div>
                <div>
                  <label className="text-xs text-[hsl(var(--muted-foreground))]">
                    Merchant
                  </label>
                  <input
                    type="text"
                    value={editMerchant}
                    onChange={(e) => setEditMerchant(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-[hsl(var(--border))] bg-transparent px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
                  />
                </div>
                <div>
                  <label className="text-xs text-[hsl(var(--muted-foreground))]">
                    Date
                  </label>
                  <input
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-[hsl(var(--border))] bg-transparent px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setImageUrl(null);
                    setExtractedData(null);
                  }}
                >
                  Retake
                </Button>
                <Button className="flex-1" onClick={handleSave}>
                  Save Expense
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
