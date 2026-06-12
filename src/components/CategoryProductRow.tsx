import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, ChevronRight, ChevronLeft } from 'lucide-react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from '@/components/ui/carousel';
import OptimizedImage from '@/components/OptimizedImage';
import { Button } from '@/components/ui/button';
import { productSlug } from '@/lib/productSlug';
import { useQuoteBasket } from '@/contexts/QuoteBasketContext';
import { toast } from 'sonner';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

export type CategoryRowProduct = {
  id: string;
  name_en: string;
  name_bn: string;
  image_url: string;
  product_code?: string | null;
  unit_price?: number | null;
  category_id?: string | null;
  description_en?: string | null;
  description_bn?: string | null;
};

interface CategoryProductRowProps {
  categoryId: string;
  categoryLabel: string;
  products: CategoryRowProduct[];
  lang: string;
  viewAllLabel: string;
  quoteLabel: string;
  getTitle: (p: CategoryRowProduct) => string;
}

const CategoryProductRow = ({
  categoryId,
  categoryLabel,
  products,
  lang,
  viewAllLabel,
  quoteLabel,
  getTitle,
}: CategoryProductRowProps) => {
  const navigate = useNavigate();
  const { addItem, setIsOpen } = useQuoteBasket();
  const [api, setApi] = useState<CarouselApi>();
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  useEffect(() => {
    if (!api) return;
    const onSelect = () => {
      setCanScrollPrev(api.canScrollPrev());
      setCanScrollNext(api.canScrollNext());
    };
    onSelect();
    api.on('reInit', onSelect);
    api.on('select', onSelect);
    return () => {
      api.off('reInit', onSelect);
      api.off('select', onSelect);
    };
  }, [api]);

  const slidesPerPage = () => {
    if (typeof window === 'undefined') return 4;
    if (window.innerWidth >= 1024) return 4;
    if (window.innerWidth >= 640) return 2;
    return 1;
  };

  const scrollPage = (direction: 'prev' | 'next') => {
    if (!api) return;
    const step = slidesPerPage();
    const current = api.selectedScrollSnap();
    const last = api.scrollSnapList().length - 1;
    const target =
      direction === 'next'
        ? Math.min(current + step, last)
        : Math.max(current - step, 0);
    api.scrollTo(target);
  };

  if (products.length === 0) return null;

  const handleAddQuote = (e: React.MouseEvent, p: CategoryRowProduct) => {
    e.stopPropagation();
    addItem({
      id: p.id,
      titleEn: p.name_en,
      titleBn: p.name_bn || '',
      src: p.image_url || '',
      category: p.category_id || '',
      unitPrice: Number(p.unit_price) || 0,
      productCode: p.product_code || '',
      quantity: 1,
    });
    setIsOpen(true);
    toast.success(
      lang === 'zh' ? '已加入询价篮' : lang === 'en' ? 'Added to quote basket' : 'কোটেশন বাস্কেটে যোগ হয়েছে'
    );
  };

  return (
    <div className="mb-12 last:mb-0">
      {/* Category header */}
      <div className="flex items-end justify-between gap-4 mb-5">
        <div>
          <h3 className="text-xl md:text-2xl font-bold text-foreground">{categoryLabel}</h3>
          <div className="mt-1.5 h-0.5 w-10 bg-[hsl(var(--sm-gold))] rounded-full" />
        </div>
        <Link
          to={categoryId === 'uncategorized' ? '/catalog' : `/catalog?category=${categoryId}`}
          className="inline-flex items-center gap-1 text-xs md:text-sm font-semibold text-[hsl(var(--sm-gold))] hover:underline shrink-0 uppercase tracking-wide"
        >
          {viewAllLabel}
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Horizontal product carousel */}
      <div className="relative group/row">
        {canScrollPrev && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="absolute left-0 top-[calc(50%-2rem)] -translate-y-1/2 z-10 h-9 w-9 rounded-full bg-background/95 shadow-md border-border/60 opacity-0 group-hover/row:opacity-100 transition-opacity hidden md:flex"
            onClick={() => scrollPage('prev')}
            aria-label="Previous products"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}
        {canScrollNext && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="absolute right-0 top-[calc(50%-2rem)] -translate-y-1/2 z-10 h-9 w-9 rounded-full bg-background/95 shadow-md border-border/60 opacity-0 group-hover/row:opacity-100 transition-opacity hidden md:flex"
            onClick={() => scrollPage('next')}
            aria-label="Next products"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}

        <Carousel
          setApi={setApi}
          opts={{
            align: 'start',
            containScroll: 'trimSnaps',
            dragFree: false,
            slidesToScroll: 1,
          }}
          className="w-full"
        >
          <CarouselContent className="-ml-3 md:-ml-4">
            {products.map(p => {
              const title = getTitle(p);
              const price = Number(p.unit_price) || 0;
              return (
                <CarouselItem
                  key={p.id}
                  className="pl-3 md:pl-4 basis-full sm:basis-1/2 lg:basis-1/4"
                >
                  <div
                    className="group/card flex flex-col h-full rounded-xl border border-border/40 bg-background overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer"
                    onClick={() => navigate(`/product/${productSlug(p)}`)}
                  >
                    <div className="aspect-square bg-white overflow-hidden relative">
                      {p.image_url ? (
                        <OptimizedImage
                          src={p.image_url}
                          alt={title}
                          className="w-full h-full object-contain p-3 group-hover/card:scale-105 transition-transform duration-500"
                          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                          wrapperClassName="w-full h-full"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs px-2 text-center">
                          {title}
                        </div>
                      )}
                    </div>

                    <div className="p-3 flex flex-col gap-2 flex-1 border-t border-border/20">
                      <h4 className="font-semibold text-sm text-foreground line-clamp-2 leading-snug min-h-[2.5rem]">
                        {title}
                      </h4>
                      {price > 0 && (
                        <p className="text-base font-bold text-[hsl(var(--sm-gold))]">
                          ৳{price.toLocaleString()}
                        </p>
                      )}
                      <button
                        type="button"
                        onClick={e => handleAddQuote(e, p)}
                        className={cn(
                          'mt-auto w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg',
                          'border-2 border-[hsl(var(--sm-gold))] text-[hsl(var(--sm-gold))]',
                          'text-xs font-semibold hover:bg-[hsl(var(--sm-gold))] hover:text-white transition-colors'
                        )}
                      >
                        <ShoppingBag className="h-3.5 w-3.5" />
                        {quoteLabel}
                      </button>
                    </div>
                  </div>
                </CarouselItem>
              );
            })}
          </CarouselContent>
        </Carousel>
      </div>
    </div>
  );
};

export default CategoryProductRow;
