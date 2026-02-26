'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';

// Dither configuration (safe to tweak as needed)
const DITHER_PIXEL_SCALE = 1;
const DITHER_THRESHOLD = 0;
const DITHER_FOREGROUND_HEX = '#006BF4';
const DITHER_BACKGROUND_HEX = '#FFFFFF';
const DEFAULT_CONTRAST = 20;
const DEFAULT_BRIGHTNESS = 0;

interface ImagePreviewProps {
  imageUrl: string | null;
  isLoading: boolean;
  isBranded: boolean;
  onSaveToGallery?: (processedImageUrl: string, size: number) => Promise<void>;
  aspectRatioClass?: string;
}

function estimateDataUrlSize(dataUrl: string): number {
  const base64 = dataUrl.split(',')[1] || '';
  return Math.floor((base64.length * 3) / 4);
}

function hexToRgb(hex: string): [number, number, number] {
  const normalized = hex.replace('#', '');
  const safe = normalized.length === 3
    ? normalized.split('').map((char) => `${char}${char}`).join('')
    : normalized;
  const value = Number.parseInt(safe, 16);

  return [
    (value >> 16) & 255,
    (value >> 8) & 255,
    value & 255,
  ];
}

function floydSteinberg(gray: Float32Array, result: Uint8Array, width: number, height: number, threshold: number): void {
  const g = Float32Array.from(gray);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = (y * width) + x;
      const oldValue = g[i];
      const nextValue = oldValue < threshold ? 0 : 255;
      result[i] = nextValue > 0 ? 1 : 0;

      const err = oldValue - nextValue;
      if (x + 1 < width) g[i + 1] += err * (7 / 16);
      if (y + 1 < height && x - 1 >= 0) g[i + width - 1] += err * (3 / 16);
      if (y + 1 < height) g[i + width] += err * (5 / 16);
      if (y + 1 < height && x + 1 < width) g[i + width + 1] += err * (1 / 16);
    }
  }
}

export default function ImagePreview({
  imageUrl,
  isLoading,
  isBranded,
  onSaveToGallery,
  aspectRatioClass = 'aspect-square',
}: ImagePreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [contrast, setContrast] = useState(DEFAULT_CONTRAST);
  const [brightness, setBrightness] = useState(DEFAULT_BRIGHTNESS);
  const [processedImageUrl, setProcessedImageUrl] = useState<string | null>(null);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const hasAdjustments = contrast !== DEFAULT_CONTRAST || brightness !== DEFAULT_BRIGHTNESS;
  const displayImageUrl = isBranded ? (processedImageUrl || imageUrl) : imageUrl;

  useEffect(() => {
    setContrast(DEFAULT_CONTRAST);
    setBrightness(DEFAULT_BRIGHTNESS);
    setRenderError(null);
    setProcessedImageUrl(null);
    setActionMessage(null);
    setIsLightboxOpen(false);
  }, [imageUrl]);

  useEffect(() => {
    if (!isBranded || !imageUrl || !canvasRef.current) {
      return;
    }

    const image = new window.Image();
    image.crossOrigin = 'anonymous';

    image.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const sourceWidth = image.naturalWidth;
      const sourceHeight = image.naturalHeight;

      if (!sourceWidth || !sourceHeight) {
        setRenderError('Could not read generated image dimensions.');
        return;
      }

      const scaledWidth = sourceWidth;
      const scaledHeight = sourceHeight;

      const workCanvas = document.createElement('canvas');
      workCanvas.width = scaledWidth;
      workCanvas.height = scaledHeight;
      const workCtx = workCanvas.getContext('2d', { willReadFrequently: true });

      if (!workCtx) {
        setRenderError('Could not initialize image processing context.');
        return;
      }

      workCtx.drawImage(image, 0, 0, scaledWidth, scaledHeight);

      let imageData: ImageData;
      try {
        imageData = workCtx.getImageData(0, 0, scaledWidth, scaledHeight);
      } catch {
        setRenderError('Unable to post-process this image due to browser security restrictions.');
        return;
      }

      const pixels = imageData.data;
      const gray = new Float32Array(scaledWidth * scaledHeight);
      const contrastFactor = (259 * (contrast + 255)) / (255 * (259 - contrast));

      for (let i = 0; i < scaledWidth * scaledHeight; i += 1) {
        const idx = i * 4;
        let value = (0.299 * pixels[idx]) + (0.587 * pixels[idx + 1]) + (0.114 * pixels[idx + 2]);
        value = contrastFactor * (value - 128) + 128 + brightness;
        gray[i] = Math.max(0, Math.min(255, value));
      }

      const ditheredBits = new Uint8Array(scaledWidth * scaledHeight);
      floydSteinberg(gray, ditheredBits, scaledWidth, scaledHeight, DITHER_THRESHOLD);

      const [fgR, fgG, fgB] = hexToRgb(DITHER_FOREGROUND_HEX);
      const [bgR, bgG, bgB] = hexToRgb(DITHER_BACKGROUND_HEX);

      canvas.width = scaledWidth * DITHER_PIXEL_SCALE;
      canvas.height = scaledHeight * DITHER_PIXEL_SCALE;

      const outputCtx = canvas.getContext('2d', { willReadFrequently: true });
      if (!outputCtx) {
        setRenderError('Could not initialize output canvas context.');
        return;
      }

      outputCtx.imageSmoothingEnabled = false;

      const outWidth = canvas.width;
      const outHeight = canvas.height;
      const outImageData = outputCtx.createImageData(outWidth, outHeight);
      const outputPixels = outImageData.data;

      for (let y = 0; y < scaledHeight; y += 1) {
        for (let x = 0; x < scaledWidth; x += 1) {
          const pixelIndex = (y * scaledWidth) + x;
          const isOn = ditheredBits[pixelIndex] === 1;
          const r = isOn ? bgR : fgR;
          const g = isOn ? bgG : fgG;
          const b = isOn ? bgB : fgB;

          for (let sy = 0; sy < DITHER_PIXEL_SCALE; sy += 1) {
            for (let sx = 0; sx < DITHER_PIXEL_SCALE; sx += 1) {
              const outIdx = ((((y * DITHER_PIXEL_SCALE) + sy) * outWidth) + ((x * DITHER_PIXEL_SCALE) + sx)) * 4;
              outputPixels[outIdx] = r;
              outputPixels[outIdx + 1] = g;
              outputPixels[outIdx + 2] = b;
              outputPixels[outIdx + 3] = 255;
            }
          }
        }
      }

      outputCtx.putImageData(outImageData, 0, 0);
      setProcessedImageUrl(canvas.toDataURL('image/webp', 0.95));
      setRenderError(null);
    };

    image.onerror = () => {
      setRenderError('Failed to load generated image for post-processing.');
    };

    image.src = imageUrl;
  }, [imageUrl, brightness, contrast, isBranded]);

  useEffect(() => {
    if (!isLightboxOpen) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsLightboxOpen(false);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isLightboxOpen]);

  const handleReset = () => {
    setContrast(DEFAULT_CONTRAST);
    setBrightness(DEFAULT_BRIGHTNESS);
    setActionMessage('Reset to initial generated state.');
  };

  const handleDownload = () => {
    if (!displayImageUrl) {
      return;
    }

    const link = document.createElement('a');
    link.href = displayImageUrl;
    link.download = `image-${Date.now()}.webp`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setActionMessage('Image downloaded.');
  };

  const handleSave = async () => {
    const imageToSave = isBranded ? processedImageUrl : imageUrl;

    if (!imageToSave || !onSaveToGallery || isSaving) {
      return;
    }

    setIsSaving(true);
    setActionMessage(null);

    try {
      const size = imageToSave.startsWith('data:') ? estimateDataUrlSize(imageToSave) : 0;
      await onSaveToGallery(imageToSave, size);
      setActionMessage('Saved to gallery.');
    } catch (error) {
      setActionMessage(error instanceof Error ? error.message : 'Failed to save image.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className={`w-full max-w-2xl mx-auto ${aspectRatioClass} bg-zinc-100 dark:bg-zinc-800 rounded-lg flex items-center justify-center`}>
        <div className="flex flex-col items-center gap-4">
          <div className="brand-spinner w-12 h-12 border-4 rounded-full animate-spin" />
          <p className="text-zinc-600 dark:text-zinc-400">Generating your image...</p>
          <p className="text-sm text-zinc-500">This may take a moment</p>
        </div>
      </div>
    );
  }

  if (!imageUrl) {
    return (
      <div className={`w-full max-w-2xl mx-auto ${aspectRatioClass} bg-zinc-100 dark:bg-zinc-800 rounded-lg flex items-center justify-center`}>
        <p className="text-zinc-500">Your generated image will appear here</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      {isBranded ? (
        <div className="mb-4 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-4">
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">Final Touches</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs text-zinc-600 dark:text-zinc-400">
              Contrast ({contrast})
              <input
                type="range"
                min={-100}
                max={100}
                value={contrast}
                onChange={(e) => setContrast(Number(e.target.value))}
                className="mt-2 w-full"
              />
            </label>
            <label className="text-xs text-zinc-600 dark:text-zinc-400">
              Brightness ({brightness})
              <input
                type="range"
                min={-100}
                max={100}
                value={brightness}
                onChange={(e) => setBrightness(Number(e.target.value))}
                className="mt-2 w-full"
              />
            </label>
          </div>
        </div>
      ) : null}

      {isBranded ? <canvas ref={canvasRef} className="hidden" aria-hidden="true" /> : null}

      <div className={`relative w-full ${aspectRatioClass} rounded-lg shadow-lg overflow-hidden bg-white`}>
        <Image
          src={displayImageUrl || imageUrl}
          alt="Generated result"
          fill
          unoptimized
          className="object-cover cursor-zoom-in"
          onClick={() => setIsLightboxOpen(true)}
        />
      </div>

      <div className="mt-4 flex flex-wrap justify-end gap-3">
        <button
          type="button"
          onClick={handleReset}
          disabled={!isBranded || !hasAdjustments}
          className="px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 text-sm text-zinc-700 dark:text-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Reset
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={!(isBranded ? processedImageUrl : imageUrl) || !onSaveToGallery || isSaving}
          className="px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 text-sm text-zinc-700 dark:text-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? 'Saving...' : 'Save'}
        </button>
        <button
          type="button"
          onClick={handleDownload}
          disabled={!displayImageUrl}
          className="px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 text-sm text-zinc-700 dark:text-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Download
        </button>
      </div>

      {isLightboxOpen && displayImageUrl ? (
        <div
          className="fixed inset-0 z-50 bg-black/85 p-4 flex items-center justify-center"
          onClick={() => setIsLightboxOpen(false)}
          role="presentation"
        >
          <button
            type="button"
            onClick={() => setIsLightboxOpen(false)}
            className="absolute top-4 right-4 text-white text-sm px-3 py-2 border border-white/40 rounded"
          >
            Close
          </button>
          <img
            src={displayImageUrl}
            alt="Generated image full resolution"
            className="max-w-full max-h-full object-contain"
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      ) : null}

      {actionMessage ? <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">{actionMessage}</p> : null}
      {renderError ? <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">{renderError}</p> : null}
    </div>
  );
}
