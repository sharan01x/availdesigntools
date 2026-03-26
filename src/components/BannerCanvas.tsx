'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

// Banner dimensions
const BANNER_WIDTH = 1200;
const BANNER_HEIGHT = 675;

// Brand colors
const AVAIL_BLUE = '#006BF4';
const AVAIL_BLUE_LIGHT = '#4D9CF7';
const AVAIL_BLUE_PALE = '#BFDAF9';
const WHITE = '#FFFFFF';

export type BackgroundStyle = 'blue' | 'white';

export interface BannerConfig {
  backgroundStyle: BackgroundStyle;
  heading: string;
  subheading: string;
  bodyCopy: string;
  ctaText: string;
  logos: string[]; // URLs or data URIs
  supportingImage: string | null; // URL or data URI
}

interface BannerCanvasProps {
  config: BannerConfig;
  onCanvasReady?: (canvas: HTMLCanvasElement) => void;
}

export default function BannerCanvas({ config, onCanvasReady }: BannerCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isRendering, setIsRendering] = useState(false);
  const [renderError, setRenderError] = useState<string | null>(null);

  const loadImage = useCallback((src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new window.Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
      img.src = src;
    });
  }, []);

  const wrapText = useCallback((
    ctx: CanvasRenderingContext2D,
    text: string,
    maxWidth: number,
    fontSize: number
  ): string[] => {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    ctx.font = `bold ${fontSize}px Inter, system-ui, sans-serif`;

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const metrics = ctx.measureText(testLine);
      
      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    
    if (currentLine) {
      lines.push(currentLine);
    }
    
    return lines;
  }, []);

  const renderBanner = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsRendering(true);
    setRenderError(null);

    try {
      // Set canvas size
      canvas.width = BANNER_WIDTH;
      canvas.height = BANNER_HEIGHT;

      // Load and draw background
      const bgFilename = config.backgroundStyle === 'blue' 
        ? '/assets/banners/background-blue.png' 
        : '/assets/banners/background-white.png';
      
      const bgImage = await loadImage(bgFilename);
      ctx.drawImage(bgImage, 0, 0, BANNER_WIDTH, BANNER_HEIGHT);

      // Define layout zones
      const isBlue = config.backgroundStyle === 'blue';
      const paddingX = 60;
      const paddingY = 50;
      const leftZoneWidth = BANNER_WIDTH * 0.45;
      const rightZoneX = BANNER_WIDTH * 0.55;
      const rightZoneWidth = BANNER_WIDTH - rightZoneX - paddingX;

      // Draw logos (top left)
      let logoY = paddingY;
      const logoHeight = 40;
      const logoGap = 20;
      
      for (let i = 0; i < config.logos.length; i++) {
        try {
          const logoImg = await loadImage(config.logos[i]);
          const scale = logoHeight / logoImg.height;
          const logoWidth = logoImg.width * scale;
          
          if (i === 0) {
            ctx.drawImage(logoImg, paddingX, logoY, logoWidth, logoHeight);
            logoY += logoHeight + logoGap;
          } else {
            // Draw subsequent logos to the right of the first one
            const prevLogoWidth = logoY > paddingY + logoHeight ? 0 : logoWidth;
            ctx.drawImage(logoImg, paddingX + prevLogoWidth + logoGap, paddingY, logoWidth, logoHeight);
          }
        } catch {
          console.warn('Failed to load logo:', config.logos[i]);
        }
      }

      // Adjust starting Y for text based on logos
      const textStartY = config.logos.length > 0 ? paddingY + logoHeight + 40 : paddingY + 20;

      // Set text colors based on background
      const textColor = isBlue ? WHITE : AVAIL_BLUE;
      const subheadingColor = isBlue ? AVAIL_BLUE_PALE : AVAIL_BLUE;
      const bodyColor = isBlue ? WHITE : AVAIL_BLUE;

      if (config.subheading) {
        ctx.font = '600 30px Delight';
        ctx.fillStyle = subheadingColor;
        ctx.textBaseline = 'top';
        ctx.fillText(config.subheading.toUpperCase(), paddingX, textStartY);
      }

      // Draw heading (larger, wrapped)
      if (config.heading) {
        const headingFontSize = 48;
        const headingMaxWidth = leftZoneWidth - paddingX * 2;
        const headingLines = wrapText(ctx, config.heading, headingMaxWidth, headingFontSize);
        
        ctx.font = '600 48px Inter';
        ctx.fillStyle = textColor;
        
        const subheadingOffset = config.subheading ? 45 : 0;
        headingLines.forEach((line, i) => {
          ctx.fillText(line, paddingX, textStartY + subheadingOffset + (i * (headingFontSize + 8)));
        });
        
        const headingBlockHeight = headingLines.length * (headingFontSize + 8);
        var bodyStartY = textStartY + subheadingOffset + headingBlockHeight + 16;
      } else {
        var bodyStartY = textStartY;
      }

      let bodyEndY = bodyStartY;
      if (config.bodyCopy) {
        const bodyFontSize = 28;
        const bodyMaxWidth = leftZoneWidth - paddingX * 2;
        const bodyLines = wrapText(ctx, config.bodyCopy, bodyMaxWidth, bodyFontSize);
        
        ctx.font = `${bodyFontSize}px Inter`;
        ctx.fillStyle = bodyColor;
        
        bodyLines.forEach((line, i) => {
          ctx.fillText(line, paddingX, bodyStartY + (i * (bodyFontSize + 8)));
        });
        
        bodyEndY = bodyStartY + (bodyLines.length * (bodyFontSize + 8));
      }

      if (config.ctaText) {
        const ctaBarHeight = 36;
        const ctaBarY = bodyEndY + 16;
        const ctaBarPadding = 16;
        
        ctx.font = '16px Inter';
        const ctaTextWidth = ctx.measureText(config.ctaText).width;
        const ctaBarWidth = ctaTextWidth + ctaBarPadding * 2;
        
        // Draw rounded rectangle for CTA bar
        const radius = 18;
        ctx.fillStyle = isBlue ? 'rgba(0, 0, 0, 0.7)' : AVAIL_BLUE;
        ctx.beginPath();
        ctx.roundRect(paddingX, ctaBarY, ctaBarWidth, ctaBarHeight, radius);
        ctx.fill();
        
        // Draw CTA text
        ctx.fillStyle = WHITE;
        ctx.textBaseline = 'middle';
        ctx.fillText(config.ctaText, paddingX + ctaBarPadding, ctaBarY + ctaBarHeight / 2);
      }

      const availLogoHeight = 32;
      const availLogoY = BANNER_HEIGHT - paddingY - availLogoHeight;
      const availLogoSrc = isBlue 
        ? '/images/AvailLogoWhite.png' 
        : '/images/AvailLogoBlue.png';
      
      try {
        const availLogoImg = await loadImage(availLogoSrc);
        const availLogoScale = availLogoHeight / availLogoImg.height;
        const availLogoWidth = availLogoImg.width * availLogoScale;
        ctx.drawImage(availLogoImg, paddingX, availLogoY, availLogoWidth, availLogoHeight);
      } catch {
        console.warn('Failed to load Avail logo');
      }

      // Draw supporting image (right side)
      if (config.supportingImage) {
        try {
          const supportingImg = await loadImage(config.supportingImage);
          
          if (isBlue) {
            // Full right side for blue background
            const imgX = rightZoneX;
            const imgY = 0;
            const imgW = rightZoneWidth;
            const imgH = BANNER_HEIGHT;
            
            // Calculate aspect-fit dimensions
            const imgAspect = supportingImg.width / supportingImg.height;
            const zoneAspect = imgW / imgH;
            
            let drawWidth, drawHeight, drawX, drawY;
            
            if (imgAspect > zoneAspect) {
              drawHeight = imgH;
              drawWidth = imgH * imgAspect;
              drawX = BANNER_WIDTH - drawWidth;
              drawY = imgY;
            } else {
              drawWidth = imgW;
              drawHeight = imgW / imgAspect;
              drawX = BANNER_WIDTH - drawWidth;
              drawY = imgY + (imgH - drawHeight) / 2;
            }
            
            ctx.drawImage(supportingImg, drawX, drawY, drawWidth, drawHeight);
          } else {
            const imgX = rightZoneX;
            const imgY = 0;
            const imgW = rightZoneWidth;
            const imgH = BANNER_HEIGHT;
            
            const imgAspect = supportingImg.width / supportingImg.height;
            const zoneAspect = imgW / imgH;
            
            let drawWidth, drawHeight, drawX, drawY;
            
            if (imgAspect > zoneAspect) {
              drawHeight = imgH;
              drawWidth = imgH * imgAspect;
              drawX = BANNER_WIDTH - drawWidth;
              drawY = imgY;
            } else {
              drawWidth = imgW;
              drawHeight = imgW / imgAspect;
              drawX = BANNER_WIDTH - drawWidth;
              drawY = imgY + (imgH - drawHeight) / 2;
            }
            
            ctx.drawImage(supportingImg, drawX, drawY, drawWidth, drawHeight);
          }
        } catch {
          console.warn('Failed to load supporting image');
        }
      }

      // Notify parent that canvas is ready
      if (onCanvasReady && canvas) {
        onCanvasReady(canvas);
      }
    } catch (error) {
      console.error('Error rendering banner:', error);
      setRenderError(error instanceof Error ? error.message : 'Failed to render banner');
    } finally {
      setIsRendering(false);
    }
  }, [config, loadImage, wrapText, onCanvasReady]);

  useEffect(() => {
    renderBanner();
  }, [renderBanner]);

  return (
    <div className="relative w-full">
      {isRendering && (
        <div className="absolute inset-0 bg-zinc-900/50 flex items-center justify-center rounded-lg z-10">
          <div className="flex flex-col items-center gap-2">
            <div className="brand-spinner w-8 h-8 border-3 rounded-full animate-spin" />
            <span className="text-sm text-white">Rendering banner...</span>
          </div>
        </div>
      )}
      
      {renderError && (
        <div className="absolute inset-0 bg-red-900/20 flex items-center justify-center rounded-lg z-10">
          <span className="text-sm text-red-400">{renderError}</span>
        </div>
      )}
      
      <canvas
        ref={canvasRef}
        className="w-full h-auto rounded-lg shadow-lg"
        style={{ aspectRatio: `${BANNER_WIDTH}/${BANNER_HEIGHT}` }}
      />
    </div>
  );
}
