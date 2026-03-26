'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Link from 'next/link';
import BannerCanvas, { type BannerConfig, type BackgroundStyle } from '@/components/BannerCanvas';

async function parseApiResponse(response: Response): Promise<Record<string, unknown>> {
  const rawBody = await response.text();

  if (!rawBody) {
    return {};
  }

  try {
    return JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    throw new Error(
      response.ok
        ? 'Received an unexpected response from the server. Please try again.'
        : rawBody
    );
  }
}

export default function BannerGeneratorPage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  const [backgroundStyle, setBackgroundStyle] = useState<BackgroundStyle>('blue');
  const [heading, setHeading] = useState('');
  const [subheading, setSubheading] = useState('');
  const [bodyCopy, setBodyCopy] = useState('');
  const [ctaText, setCtaText] = useState('');
  const [logos, setLogos] = useState<string[]>([]);
  const [supportingImage, setSupportingImage] = useState<string | null>(null);
  
  const [imagePrompt, setImagePrompt] = useState('');
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Image adjustment settings (applied directly to canvas)
  const [imageContrast, setImageContrast] = useState(0);
  const [imageBrightness, setImageBrightness] = useState(0);
  const [transparentColor, setTransparentColor] = useState<string | null>(null);
  const [enableTransparency, setEnableTransparency] = useState(false);
  
  // Debounced values for canvas rendering
  const [debouncedConfig, setDebouncedConfig] = useState<BannerConfig | null>(null);
  
  const bannerConfig: BannerConfig = {
    backgroundStyle,
    heading,
    subheading,
    bodyCopy,
    ctaText,
    logos,
    supportingImage,
    imageContrast,
    imageBrightness,
    transparentColor: enableTransparency ? transparentColor : null,
  };
  
  const handleLogoUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = () => {
      setLogos(prev => [...prev, reader.result as string]);
    };
    reader.readAsDataURL(file);
  }, []);
  
  const removeLogo = useCallback((index: number) => {
    setLogos(prev => prev.filter((_, i) => i !== index));
  }, []);
  
  const handleSupportingImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = () => {
      setSupportingImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  }, []);
  
  const handleGeneratePrompt = async () => {
    if ((!heading.trim() && !bodyCopy.trim()) || isGeneratingPrompt) {
      return;
    }
    
    setIsGeneratingPrompt(true);
    setError(null);
    
    try {
      const response = await fetch('/api/generate-banner-image-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          heading: heading.trim(),
          bodyCopy: bodyCopy.trim(),
        }),
      });
      
      const data = await parseApiResponse(response);
      
      if (!response.ok || !data.success) {
        throw new Error((data.error as string) || 'Failed to generate image prompt');
      }
      
      if (!data.prompt) {
        throw new Error('Missing prompt from generation response');
      }
      
      setImagePrompt(data.prompt as string);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsGeneratingPrompt(false);
    }
  };
  
  const handleGenerateImage = async () => {
    if (!imagePrompt.trim() || isGeneratingImage) {
      return;
    }
    
    setIsGeneratingImage(true);
    setError(null);
    
    try {
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: imagePrompt.trim(),
          branded: true,
          imageSize: 'square_min',
        }),
      });
      
      const data = await parseApiResponse(response);
      
      if (!response.ok || !data.success) {
        throw new Error((data.error as string) || 'Failed to generate image');
      }
      
      if (!data.imageUrl) {
        throw new Error('Missing image URL from generation response');
      }
      
      setSupportingImage(data.imageUrl as string);
      // Reset adjustments when new image is generated
      setImageContrast(0);
      setImageBrightness(0);
      setEnableTransparency(false);
      setTransparentColor(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsGeneratingImage(false);
    }
  };
  
  const handleCanvasReady = useCallback((canvas: HTMLCanvasElement) => {
    canvasRef.current = canvas;
  }, []);
  
  const handleDownload = useCallback(() => {
    if (!canvasRef.current) return;
    
    const link = document.createElement('a');
    link.download = `banner-${Date.now()}.png`;
    link.href = canvasRef.current.toDataURL('image/png');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);
  
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if ((heading.trim() || bodyCopy.trim()) && !imagePrompt) {
        handleGeneratePrompt();
      }
    }, 1000);
    
    return () => clearTimeout(debounceTimer);
  }, [heading, bodyCopy]);
  
  // Debounce canvas updates to prevent re-rendering on every keystroke
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      setDebouncedConfig({
        backgroundStyle,
        heading,
        subheading,
        bodyCopy,
        ctaText,
        logos,
        supportingImage,
        imageContrast,
        imageBrightness,
        transparentColor: enableTransparency ? transparentColor : null,
      });
    }, 1000);
    
    return () => clearTimeout(debounceTimer);
  }, [backgroundStyle, heading, subheading, bodyCopy, ctaText, logos, supportingImage, imageContrast, imageBrightness, transparentColor, enableTransparency]);
  
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <a href="https://availproject.org" target="_blank" rel="noopener noreferrer" aria-label="Visit Avail Project website">
            <img src="/images/AvailLogoWorkdmarkBlue.svg" alt="Avail Design Tools" className="h-8 w-auto" />
          </a>
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="brand-link"
            >
              All Tools
            </Link>
            <Link
              href="/gallery"
              className="brand-link"
            >
              View Gallery →
            </Link>
          </div>
        </div>
      </header>
      
      <main className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">Generate Banners for X</h2>
          <p className="text-zinc-600 dark:text-zinc-400 max-w-xl mx-auto">
            Create social media banners with custom text, logos, and AI-generated supporting images.
          </p>
        </div>
        
        <div className="mb-8">
          <BannerCanvas
            config={debouncedConfig || bannerConfig}
            onCanvasReady={handleCanvasReady}
          />
          
          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={handleDownload}
              disabled={!canvasRef.current}
              className="brand-button px-6 py-3 disabled:bg-zinc-400 disabled:cursor-not-allowed font-medium rounded-lg"
            >
              Download Banner
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Basic Elements</h3>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Background Style
              </label>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setBackgroundStyle('blue')}
                  className={`flex-1 py-3 px-4 rounded-lg border-2 transition-colors ${
                    backgroundStyle === 'blue'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                      : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800'
                  }`}
                >
                  <div className="w-full h-12 rounded bg-blue-500 mb-2" />
                  <span className="text-sm text-zinc-700 dark:text-zinc-300">Blue</span>
                </button>
                <button
                  type="button"
                  onClick={() => setBackgroundStyle('white')}
                  className={`flex-1 py-3 px-4 rounded-lg border-2 transition-colors ${
                    backgroundStyle === 'white'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                      : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800'
                  }`}
                >
                  <div className="w-full h-12 rounded bg-white border border-zinc-200 mb-2" />
                  <span className="text-sm text-zinc-700 dark:text-zinc-300">White</span>
                </button>
              </div>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="subheading" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Subheading (optional)
              </label>
              <input
                id="subheading"
                type="text"
                value={subheading}
                onChange={(e) => setSubheading(e.target.value)}
                placeholder="e.g., LIVE WORKSHOP:"
                maxLength={100}
                className="brand-focus w-full p-3 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400"
              />
            </div>
            
            {/* Heading */}
            <div className="space-y-2">
              <label htmlFor="heading" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Heading
              </label>
              <textarea
                id="heading"
                value={heading}
                onChange={(e) => setHeading(e.target.value)}
                placeholder="Main headline text..."
                maxLength={200}
                rows={2}
                className="brand-focus w-full p-3 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 resize-none"
              />
            </div>
            
            {/* Body copy */}
            <div className="space-y-2">
              <label htmlFor="bodyCopy" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Body Copy (optional)
              </label>
              <textarea
                id="bodyCopy"
                value={bodyCopy}
                onChange={(e) => setBodyCopy(e.target.value)}
                placeholder="Supporting description text..."
                maxLength={300}
                rows={2}
                className="brand-focus w-full p-3 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 resize-none"
              />
            </div>
            
            {/* CTA text */}
            <div className="space-y-2">
              <label htmlFor="ctaText" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                CTA/Footer Text (optional)
              </label>
              <input
                id="ctaText"
                type="text"
                value={ctaText}
                onChange={(e) => setCtaText(e.target.value)}
                placeholder="e.g., Live on X @ArbitrumDevs"
                maxLength={100}
                className="brand-focus w-full p-3 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400"
              />
            </div>
            
            {/* Logos */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Logos
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {logos.map((logo, i) => (
                  <div key={i} className="relative group">
                    <div className="w-16 h-10 bg-zinc-100 dark:bg-zinc-700 rounded flex items-center justify-center overflow-hidden">
                      <img src={logo} alt={`Logo ${i + 1}`} className="max-w-full max-h-full object-contain" />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeLogo(i)}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="text-sm text-zinc-700 dark:text-zinc-300">Add Logo</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
              </label>
            </div>
            
            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}
          </div>
          
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Supporting Image</h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label htmlFor="imagePrompt" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Image Prompt
                </label>
                <button
                  type="button"
                  onClick={handleGeneratePrompt}
                  disabled={(!heading.trim() && !bodyCopy.trim()) || isGeneratingPrompt}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline disabled:text-zinc-400 disabled:no-underline"
                  title="Auto-generate prompt from heading and body text"
                >
                  {isGeneratingPrompt ? 'Generating...' : '✨ Auto-generate from text'}
                </button>
              </div>
              <textarea
                id="imagePrompt"
                value={imagePrompt}
                onChange={(e) => setImagePrompt(e.target.value)}
                placeholder="Describe the supporting image you want to generate, or click 'Auto-generate from text'..."
                maxLength={500}
                rows={3}
                className="brand-focus w-full p-3 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 resize-none"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleGenerateImage}
                  disabled={!imagePrompt.trim() || isGeneratingImage}
                  className="brand-button px-4 py-2 disabled:bg-zinc-400 disabled:cursor-not-allowed text-sm rounded-lg"
                >
                  {isGeneratingImage ? 'Generating...' : 'Generate Image'}
                </button>
                <label className="px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors text-sm text-zinc-700 dark:text-zinc-300">
                  Upload Image
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleSupportingImageUpload}
                    className="hidden"
                  />
                </label>
                {supportingImage && (
                  <button
                    type="button"
                    onClick={() => setSupportingImage(null)}
                    className="px-4 py-2 rounded-lg border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 text-sm"
                  >
                    Remove Image
                  </button>
                )}
              </div>
            </div>
            
            {/* Image adjustment controls */}
            {supportingImage && (
              <div className="border-t border-zinc-200 dark:border-zinc-800 pt-6 space-y-4">
                <h4 className="text-md font-semibold text-zinc-900 dark:text-zinc-100">Image Adjustments</h4>
                
                <div className="grid gap-3">
                  <label className="text-xs text-zinc-600 dark:text-zinc-400">
                    Contrast ({imageContrast})
                    <input
                      type="range"
                      min={-100}
                      max={100}
                      value={imageContrast}
                      onChange={(e) => setImageContrast(Number(e.target.value))}
                      className="mt-2 w-full"
                    />
                  </label>
                  <label className="text-xs text-zinc-600 dark:text-zinc-400">
                    Brightness ({imageBrightness})
                    <input
                      type="range"
                      min={-100}
                      max={100}
                      value={imageBrightness}
                      onChange={(e) => setImageBrightness(Number(e.target.value))}
                      className="mt-2 w-full"
                    />
                  </label>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-600 dark:text-zinc-400">Make Background Transparent</span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={enableTransparency}
                      onClick={() => setEnableTransparency((prev) => !prev)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        enableTransparency ? 'brand-toggle-on' : 'bg-zinc-400 dark:bg-zinc-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          enableTransparency ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                  {enableTransparency && (
                    <div className="space-y-2">
                      <label className="text-xs text-zinc-600 dark:text-zinc-400">
                        Color to Make Transparent
                        <div className="flex items-center gap-2 mt-2">
                          <input
                            type="color"
                            value={transparentColor || '#FFFFFF'}
                            onChange={(e) => setTransparentColor(e.target.value)}
                            className="w-10 h-8 border border-zinc-300 rounded cursor-pointer"
                          />
                          <span className="text-xs text-zinc-500">Click to pick color</span>
                        </div>
                      </label>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
