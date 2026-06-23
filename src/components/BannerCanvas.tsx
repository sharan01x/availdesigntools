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
  logos: string[];
  supportingImage: string | null;
  imageContrast?: number;
  imageBrightness?: number;
  transparentColor?: string | null;
}

interface BannerCanvasProps {
  config: BannerConfig;
  onCanvasReady?: (canvas: HTMLCanvasElement) => void;
}

// Helper: wrap text with a given font string, return lines and total height
interface WrappedTextResult {
  lines: string[];
  totalHeight: number;
}

function measureText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  font: string,
  lineHeight: number
): WrappedTextResult {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  ctx.font = font;

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

  return {
    lines,
    totalHeight: lines.length * lineHeight,
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export default function BannerCanvas({ config, onCanvasReady }: BannerCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isRendering, setIsRendering] = useState(false);
  const [renderError, setRenderError] = useState<string | null>(null);

  const loadImage = useCallback((src: string): Promise<HTMLImageElement | null> => {
    return new Promise((resolve) => {
      const img = new window.Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => {
        console.warn('Failed to load image:', src);
        resolve(null);
      };
      img.src = src;
    });
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

      // Layout constants
      const isBlue = config.backgroundStyle === 'blue';
      const paddingX = 60;
      const paddingY = 50;
      const leftZoneWidth = BANNER_WIDTH * 0.45;
      const rightZoneX = BANNER_WIDTH * 0.55;
      const rightZoneWidth = BANNER_WIDTH - rightZoneX - paddingX;

      // Text colors
      const textColor = isBlue ? WHITE : AVAIL_BLUE;
      const subheadingColor = isBlue ? AVAIL_BLUE_PALE : AVAIL_BLUE;
      const bodyColor = isBlue ? WHITE : AVAIL_BLUE;

      // --- Load all images in parallel ---
      const bgFilename = config.backgroundStyle === 'blue'
        ? '/assets/banners/background-blue.png'
        : '/assets/banners/background-white.png';

      const availLogoSrc = isBlue
        ? '/images/AvailLogoWhite.png'
        : '/images/AvailLogoBlue.png';

      const [bgImage, availLogoImg, ...logoImages] = await Promise.all([
        loadImage(bgFilename),
        loadImage(availLogoSrc),
        ...config.logos.map(src => loadImage(src)),
      ]);

      const supportingImg = config.supportingImage
        ? await loadImage(config.supportingImage)
        : null;

      // Draw background
      if (bgImage) {
        ctx.drawImage(bgImage, 0, 0, BANNER_WIDTH, BANNER_HEIGHT);
      }

      // --- Calculate layout ---
      const logoHeight = 40;
      const logoGap = 20;
      const logoAreaHeight = config.logos.length > 0 ? logoHeight + logoGap : 0;
      const logoAreaBottom = config.logos.length > 0
        ? paddingY + logoAreaHeight
        : paddingY + 20;

      const availLogoHeight = 32;
      const availLogoTop = BANNER_HEIGHT - paddingY - availLogoHeight;

      const ctaBarHeight = 36;
      const ctaAreaHeight = config.ctaText ? ctaBarHeight : 0;

      // Total vertical space available for text content between logo area and Avail logo
      const containerHeight = availLogoTop - logoAreaBottom;

      const subheadingFontSize = 30;
      const subheadingLineGap = 8;
      const bodyFontSize = 28;
      const lineGap = 8;
      const headingBodyGap = 16;
      const headingMaxWidth = leftZoneWidth - paddingX * 2;

      const MAX_HEADING_FONT = 72;
      const MIN_HEADING_FONT = 28;

      // Gap constants
      const MIN_TOP_GAP = 10;
      const MIN_CTA_GAP = 20;
      const MAX_CTA_GAP = 100;
      const MAX_TOP_GAP = 100;

      // Determine heading font size and dynamic gaps
      let headingFontSize = MIN_HEADING_FONT;
      let topGap = MIN_TOP_GAP;
      let ctaGap = MIN_CTA_GAP;

      // Measure subheading once (doesn't change with heading font size)
      const subheadingResult = config.subheading
        ? measureText(
            ctx,
            config.subheading.toUpperCase(),
            headingMaxWidth,
            '600 30px Delight',
            subheadingFontSize + subheadingLineGap
          )
        : null;
      const subheadingBlockHeight = subheadingResult
        ? subheadingResult.totalHeight + 12
        : 0;

      // Measure body once (doesn't change with heading font size)
      const bodyResult = config.bodyCopy
        ? measureText(
            ctx,
            config.bodyCopy,
            headingMaxWidth,
            `${bodyFontSize}px Inter, system-ui, sans-serif`,
            bodyFontSize + lineGap
          )
        : null;
      const bodyBlockHeight = bodyResult ? bodyResult.totalHeight : 0;

      // Helper: compute gaps for a given textBlockHeight
      function computeGaps(textBlockHeight: number): { topGap: number; ctaGap: number } {
        if (config.ctaText) {
          // Fit check: textBlock + ctaAreaHeight + MIN_TOP_GAP + 2*MIN_CTA_GAP <= containerHeight
          const minRequired = textBlockHeight + ctaAreaHeight + MIN_TOP_GAP + 2 * MIN_CTA_GAP;
          if (minRequired <= containerHeight) {
            const remainingForGaps = containerHeight - textBlockHeight - ctaAreaHeight;
            let computedCtaGap = clamp((remainingForGaps - MIN_TOP_GAP) / 2, MIN_CTA_GAP, MAX_CTA_GAP);
            let computedTopGap = remainingForGaps - 2 * computedCtaGap;

            // Cap topGap at MAX_TOP_GAP, redistribute excess to ctaGap
            if (computedTopGap > MAX_TOP_GAP) {
              const excess = computedTopGap - MAX_TOP_GAP;
              computedTopGap = MAX_TOP_GAP;
              computedCtaGap = clamp(computedCtaGap + excess / 2, MIN_CTA_GAP, MAX_CTA_GAP);
              // Recalculate topGap in case ctaGap hit its max
              computedTopGap = remainingForGaps - 2 * computedCtaGap;
              computedTopGap = Math.min(computedTopGap, MAX_TOP_GAP);
            }

            return { topGap: computedTopGap, ctaGap: computedCtaGap };
          } else {
            // Doesn't fit with minimum gaps, use minimums anyway (best effort)
            return { topGap: MIN_TOP_GAP, ctaGap: MIN_CTA_GAP };
          }
        } else {
          // No CTA: simpler logic, no ctaGap needed
          const remaining = containerHeight - textBlockHeight;
          return { topGap: clamp(remaining, MIN_TOP_GAP, MAX_TOP_GAP), ctaGap: 0 };
        }
      }

      if (config.heading) {
        const isLongHeading = config.heading.length > 50;
        const hasBody = !!config.bodyCopy;
        const startFontSize = (isLongHeading && hasBody) ? 48 : MAX_HEADING_FONT;

        for (let fs = startFontSize; fs >= MIN_HEADING_FONT; fs -= 2) {
          const headingResult = measureText(
            ctx,
            config.heading,
            headingMaxWidth,
            `600 ${fs}px Inter, system-ui, sans-serif`,
            fs + lineGap
          );

          const textBlockHeight = subheadingBlockHeight + headingResult.totalHeight + headingBodyGap + bodyBlockHeight;

          // Fit check
          const minRequired = textBlockHeight + ctaAreaHeight + MIN_TOP_GAP + 2 * MIN_CTA_GAP;
          if (minRequired <= containerHeight) {
            headingFontSize = fs;
            const gaps = computeGaps(textBlockHeight);
            topGap = gaps.topGap;
            ctaGap = gaps.ctaGap;
            break;
          }

          headingFontSize = MIN_HEADING_FONT;
        }

        // If no font size fit, use minimum and still compute best-effort gaps
        if (headingFontSize === MIN_HEADING_FONT) {
          const headingResult = measureText(
            ctx,
            config.heading,
            headingMaxWidth,
            `600 ${MIN_HEADING_FONT}px Inter, system-ui, sans-serif`,
            MIN_HEADING_FONT + lineGap
          );
          const textBlockHeight = subheadingBlockHeight + headingResult.totalHeight + headingBodyGap + bodyBlockHeight;
          const gaps = computeGaps(textBlockHeight);
          topGap = gaps.topGap;
          ctaGap = gaps.ctaGap;
        }
      } else if (config.subheading || config.bodyCopy) {
        // No heading, but subheading or body present
        const textBlockHeight = subheadingBlockHeight + bodyBlockHeight;
        const gaps = computeGaps(textBlockHeight);
        topGap = gaps.topGap;
        ctaGap = gaps.ctaGap;
      }

      // --- Draw logos ---
      let logoX = paddingX;
      let logoY = paddingY;

      for (let i = 0; i < config.logos.length; i++) {
        const logoImg = logoImages[i];
        if (logoImg) {
          const scale = logoHeight / logoImg.height;
          const logoWidth = logoImg.width * scale;
          if (i === 0) {
            ctx.drawImage(logoImg, paddingX, logoY, logoWidth, logoHeight);
            logoY += logoHeight + logoGap;
            logoX = paddingX + logoWidth + logoGap;
          } else {
            ctx.drawImage(logoImg, logoX, paddingY, logoWidth, logoHeight);
            logoX += logoWidth + logoGap;
          }
        }
      }

      // --- Draw text from top to bottom ---
      let currentY = logoAreaBottom + topGap;

      if (config.subheading && subheadingResult) {
        ctx.font = '600 30px Delight';
        ctx.fillStyle = subheadingColor;
        ctx.textBaseline = 'top';
        subheadingResult.lines.forEach((line, i) => {
          ctx.fillText(line, paddingX, currentY + i * (subheadingFontSize + subheadingLineGap));
        });
        currentY += subheadingResult.totalHeight + 12;
      }

      if (config.heading) {
        const headingResult = measureText(
          ctx,
          config.heading,
          headingMaxWidth,
          `600 ${headingFontSize}px Inter, system-ui, sans-serif`,
          headingFontSize + lineGap
        );
        ctx.font = `600 ${headingFontSize}px Inter`;
        ctx.fillStyle = textColor;
        ctx.textBaseline = 'top';
        headingResult.lines.forEach((line, i) => {
          ctx.fillText(line, paddingX, currentY + i * (headingFontSize + lineGap));
        });
        currentY += headingResult.totalHeight + headingBodyGap;
      }

      if (config.bodyCopy && bodyResult) {
        ctx.font = `${bodyFontSize}px Inter`;
        ctx.fillStyle = bodyColor;
        ctx.textBaseline = 'top';
        bodyResult.lines.forEach((line, i) => {
          ctx.fillText(line, paddingX, currentY + i * (bodyFontSize + lineGap));
        });
        currentY += bodyResult.totalHeight;
      }

      // --- Draw CTA ---
      if (config.ctaText) {
        // ctaGap is the gap above and below the CTA bar
        const ctaBarY = currentY + ctaGap;
        const ctaBarPadding = 16;
        const radius = 18;

        ctx.font = '16px Inter';
        const ctaTextWidth = ctx.measureText(config.ctaText).width;
        const ctaBarWidth = ctaTextWidth + ctaBarPadding * 2;

        ctx.fillStyle = isBlue ? 'rgba(0, 0, 0, 0.7)' : AVAIL_BLUE;
        ctx.beginPath();
        ctx.roundRect(paddingX, ctaBarY, ctaBarWidth, ctaBarHeight, radius);
        ctx.fill();

        ctx.fillStyle = WHITE;
        ctx.textBaseline = 'middle';
        ctx.fillText(config.ctaText, paddingX + ctaBarPadding, ctaBarY + ctaBarHeight / 2);
      }

      // --- Draw Avail logo at bottom ---
      if (availLogoImg) {
        const availLogoY = BANNER_HEIGHT - paddingY - availLogoHeight;
        const availLogoScale = availLogoHeight / availLogoImg.height;
        const availLogoWidth = availLogoImg.width * availLogoScale;
        ctx.drawImage(availLogoImg, paddingX, availLogoY, availLogoWidth, availLogoHeight);
      }

      // --- Draw supporting image (right side) ---
      if (config.supportingImage && supportingImg) {
        const imgX = rightZoneX;
        const imgY = 0;
        const imgW = rightZoneWidth;
        const imgH = BANNER_HEIGHT;

        const imgAspect = supportingImg.width / supportingImg.height;
        const zoneAspect = imgW / imgH;

        let drawWidth: number, drawHeight: number, drawX: number, drawY: number;

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

        // Apply image adjustments if needed
        const hasContrast = config.imageContrast !== undefined && config.imageContrast !== 0;
        const hasBrightness = config.imageBrightness !== undefined && config.imageBrightness !== 0;
        const hasTransparency = config.transparentColor && config.transparentColor !== null;

        if (hasContrast || hasBrightness || hasTransparency) {
          const processCanvas = document.createElement('canvas');
          processCanvas.width = drawWidth;
          processCanvas.height = drawHeight;
          const processCtx = processCanvas.getContext('2d', { willReadFrequently: true });

          if (processCtx) {
            processCtx.drawImage(supportingImg, 0, 0, drawWidth, drawHeight);
            const imageData = processCtx.getImageData(0, 0, drawWidth, drawHeight);
            const data = imageData.data;

            const contrastFactor = hasContrast ? (259 * (config.imageContrast! + 255)) / (255 * (259 - config.imageContrast!)) : 1;
            const brightnessAdjust = hasBrightness ? config.imageBrightness! : 0;

            let transparentR = 255, transparentG = 255, transparentB = 255;
            if (hasTransparency && config.transparentColor) {
              const hex = config.transparentColor.replace('#', '');
              transparentR = Number.parseInt(hex.substring(0, 2), 16);
              transparentG = Number.parseInt(hex.substring(2, 4), 16);
              transparentB = Number.parseInt(hex.substring(4, 6), 16);
            }

            const colorTolerance = 30;

            for (let i = 0; i < data.length; i += 4) {
              if (hasContrast || hasBrightness) {
                data[i] = Math.max(0, Math.min(255, contrastFactor * (data[i] - 128) + 128 + brightnessAdjust));
                data[i + 1] = Math.max(0, Math.min(255, contrastFactor * (data[i + 1] - 128) + 128 + brightnessAdjust));
                data[i + 2] = Math.max(0, Math.min(255, contrastFactor * (data[i + 2] - 128) + 128 + brightnessAdjust));
              }

              if (hasTransparency) {
                const colorDistance = Math.sqrt(
                  Math.pow(data[i] - transparentR, 2) +
                  Math.pow(data[i + 1] - transparentG, 2) +
                  Math.pow(data[i + 2] - transparentB, 2)
                );
                if (colorDistance < colorTolerance) {
                  data[i + 3] = 0;
                }
              }
            }

            processCtx.putImageData(imageData, 0, 0);
            ctx.drawImage(processCanvas, drawX, drawY);
          } else {
            ctx.drawImage(supportingImg, drawX, drawY, drawWidth, drawHeight);
          }
        } else {
          ctx.drawImage(supportingImg, drawX, drawY, drawWidth, drawHeight);
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
  }, [config, loadImage, onCanvasReady]);

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