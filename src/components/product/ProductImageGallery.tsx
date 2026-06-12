import { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronLeft, ChevronRight, ZoomIn, Monitor, Square, Download } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ImageType = 'main' | 'front' | 'back' | 'left' | 'right' | 'gallery';

export interface TypedImage {
  id?: string;
  url: string;
  image_type?: ImageType;
  label?: string;
  variant_id?: string | null;
}

interface ProductImageGalleryProps {
  images: TypedImage[];
  selectedVariantId?: string | null;
  title: string;
  onZoomChange?: (zoomed: boolean) => void;
}

const TYPE_LABELS: Record<ImageType, string> = {
  main: 'Main',
  front: 'Front',
  back: 'Back',
  left: 'Left',
  right: 'Right',
  gallery: 'Gallery',
};

function thumbUrl(src: string, width = 160): string {
  if (!src) return src;
  try {
    const url = new URL(src);
    url.searchParams.set('width', String(width));
    url.searchParams.set('quality', '75');
    url.searchParams.set('format', 'webp');
    return url.toString();
  } catch {
    return src;
  }
}

const ProductImageGallery = ({
  images,
  selectedVariantId,
  title,
  onZoomChange,
}: ProductImageGalleryProps) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const [fade, setFade] = useState(true);
  const touchStart = useRef<number | null>(null);
  const imageBoxRef = useRef<HTMLDivElement>(null);
  const [boxSize, setBoxSize] = useState({ w: 0, h: 0 });

  // Amazon-style zoom config
  const ZOOM_LEVEL = 2.5;
  const LENS_SIZE = 160; // px square lens
  const PANEL_SIZE = 480; // px square external preview

  useEffect(() => {
    setFade(false);
    const timer = setTimeout(() => {
      if (selectedVariantId) {
        const variantIdx = images.findIndex(img => img.variant_id === selectedVariantId);
        setSelectedIndex(variantIdx >= 0 ? variantIdx : 0);
      } else {
        setSelectedIndex(0);
      }
      setFade(true);
    }, 120);
    return () => clearTimeout(timer);
  }, [selectedVariantId, images]);

  const selectIndex = useCallback((idx: number) => {
    if (idx === selectedIndex) return;
    setFade(false);
    setTimeout(() => {
      setSelectedIndex(idx);
      setFade(true);
    }, 100);
  }, [selectedIndex]);

  const goNext = useCallback(() => selectIndex((selectedIndex + 1) % images.length), [selectedIndex, images.length, selectIndex]);
  const goPrev = useCallback(() => selectIndex((selectedIndex - 1 + images.length) % images.length), [selectedIndex, images.length, selectIndex]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [goNext, goPrev]);

  useEffect(() => {
    onZoomChange?.(isZoomed);
  }, [isZoomed, onZoomChange]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setBoxSize({ w: rect.width, h: rect.height });
    setZoomPos({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStart.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart.current === null) return;
    const diff = touchStart.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) diff > 0 ? goNext() : goPrev();
    touchStart.current = null;
  };

  if (images.length === 0) {
    return (
      <div className="aspect-square rounded-lg bg-muted border border-border/30 flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <Monitor className="h-12 w-12 mx-auto mb-2 opacity-20" />
          <p className="text-sm">{title}</p>
        </div>
      </div>
    );
  }

  const safeIdx = selectedIndex >= images.length ? 0 : selectedIndex;
  const current = images[safeIdx];

  // Build thumbnail list
  const VIEW_SLOTS: ImageType[] = ['main', 'front', 'back', 'left', 'right'];
  const hasAnyView = images.some(img => VIEW_SLOTS.includes(img.image_type as ImageType));

  return (
    <div className="flex gap-3 select-none">
      {/* LEFT — Vertical thumbnail strip (Amazon-style) */}
      {images.length > 1 && (
        <div className="hidden sm:flex flex-col gap-2 w-[56px] shrink-0">
          {hasAnyView ? (
            VIEW_SLOTS.map(viewType => {
              const imgIdx = images.findIndex(img => img.image_type === viewType);
              const img = imgIdx >= 0 ? images[imgIdx] : null;
              if (!img) return null;
              const isActive = safeIdx === imgIdx;
              return (
                <button
                  key={viewType}
                  onClick={() => selectIndex(imgIdx)}
                  onMouseEnter={() => selectIndex(imgIdx)}
                  className={cn(
                    'w-[56px] h-[56px] rounded border-2 overflow-hidden bg-white flex items-center justify-center transition-all',
                    isActive
                      ? 'border-[hsl(var(--sm-gold))] shadow-sm'
                      : 'border-border/40 hover:border-[hsl(var(--sm-gold))]/60',
                  )}
                  title={TYPE_LABELS[viewType]}
                >
                  <img
                    src={thumbUrl(img.url)}
                    alt={TYPE_LABELS[viewType]}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </button>
              );
            })
          ) : (
            images.map((img, idx) => (
              <button
                key={`${img.url}-${idx}`}
                onClick={() => selectIndex(idx)}
                onMouseEnter={() => selectIndex(idx)}
                className={cn(
                  'w-[56px] h-[56px] rounded border-2 overflow-hidden bg-white flex items-center justify-center transition-all',
                  safeIdx === idx
                    ? 'border-[hsl(var(--sm-gold))] shadow-sm'
                    : 'border-border/40 hover:border-[hsl(var(--sm-gold))]/60',
                )}
              >
                <img
                  src={thumbUrl(img.url)}
                  alt={img.label || `View ${idx + 1}`}
                    className="w-full h-full object-cover"
                  loading="lazy"
                />
              </button>
            ))
          )}
        </div>
      )}

      {/* RIGHT — Main image */}
      <div className={cn('flex-1 relative', isZoomed && 'z-50')}>
        <div
          ref={imageBoxRef}
          className="relative group aspect-square rounded-lg overflow-hidden bg-white border border-border/20"
          style={{ cursor: isZoomed ? 'crosshair' : 'zoom-in' }}
          onMouseEnter={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            setBoxSize({ w: rect.width, h: rect.height });
            setIsZoomed(true);
          }}
          onMouseLeave={() => { setIsZoomed(false); setZoomPos({ x: 50, y: 50 }); }}
          onMouseMove={handleMouseMove}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {current.url ? (
            <>
              <img
                src={current.url}
                alt={current.label || title}
                className={cn(
                  'w-full h-full object-contain transition-opacity duration-200',
                  fade ? 'opacity-100' : 'opacity-0',
                )}
                loading="eager"
                decoding="async"
              />
              {/* Zoom lens overlay (Amazon-style) */}
              {isZoomed && boxSize.w > 0 && (
                <div
                  className="pointer-events-none absolute border border-[hsl(var(--sm-gold))]/70 bg-[hsl(var(--sm-gold))]/15 hidden md:block transition-[left,top] duration-75"
                  style={{
                    width: LENS_SIZE,
                    height: LENS_SIZE,
                    left: Math.max(0, Math.min(boxSize.w - LENS_SIZE, (zoomPos.x / 100) * boxSize.w - LENS_SIZE / 2)),
                    top: Math.max(0, Math.min(boxSize.h - LENS_SIZE, (zoomPos.y / 100) * boxSize.h - LENS_SIZE / 2)),
                  }}
                />
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              <Square className="h-16 w-16 opacity-10" />
            </div>
          )}

          {/* Prev / Next */}
          {images.length > 1 && (
            <>
              <button
                onClick={e => { e.stopPropagation(); goPrev(); }}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-background/80 backdrop-blur border border-border/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-background z-10"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={e => { e.stopPropagation(); goNext(); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-background/80 backdrop-blur border border-border/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-background z-10"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </>
          )}

          {/* Download button */}
          <a
            href={current.url}
            download
            onClick={e => e.stopPropagation()}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-background/80 backdrop-blur border border-border/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-background z-10"
            title="Download image"
          >
            <Download className="h-4 w-4" />
          </a>
        </div>

        {/* Amazon-style external zoom panel */}
        {isZoomed && current.url && boxSize.w > 0 && (
          <div
            className="hidden md:block absolute top-0 left-full ml-4 rounded-lg border border-border/30 bg-white shadow-2xl overflow-hidden z-50 pointer-events-none animate-fade-in"
            style={{
              width: PANEL_SIZE,
              height: PANEL_SIZE,
              backgroundImage: `url("${current.url}")`,
              backgroundRepeat: 'no-repeat',
              backgroundSize: `${boxSize.w * ZOOM_LEVEL}px ${boxSize.h * ZOOM_LEVEL}px`,
              backgroundPosition: `${zoomPos.x}% ${zoomPos.y}%`,
            }}
          />
        )}

        {/* Mobile horizontal thumbnails */}
        {images.length > 1 && (
          <div className="flex sm:hidden gap-2 mt-3 overflow-x-auto pb-1">
            {images.map((img, idx) => (
              <button
                key={`m-${img.url}-${idx}`}
                onClick={() => selectIndex(idx)}
                className={cn(
                  'shrink-0 w-14 h-14 rounded border-2 overflow-hidden bg-white',
                  safeIdx === idx
                    ? 'border-[hsl(var(--sm-gold))]'
                    : 'border-border/40',
                )}
              >
                <img
                  src={thumbUrl(img.url)}
                  alt={`View ${idx + 1}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </button>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};

export default ProductImageGallery;
