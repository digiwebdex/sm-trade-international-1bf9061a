import { useState, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { pickLocalized } from '@/hooks/useLocalized';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/apiClient';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import CategoryProductRow, { type CategoryRowProduct } from '@/components/CategoryProductRow';

const ProductsSection = () => {
  const { t, lang, tt } = useLanguage();
  const [search, setSearch] = useState('');

  const { data: dbProducts = [], isLoading: productsLoading } = useQuery({
    queryKey: ['public-products-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*, categories(name_en, name_bn, name_zh)')
        .eq('is_active', true)
        .order('sort_order');
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: dbCategories = [] } = useQuery({
    queryKey: ['public-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const filteredProducts = useMemo(() => {
    let result = dbProducts as CategoryRowProduct[];
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(p =>
        p.name_en.toLowerCase().includes(q) ||
        (p.name_bn || '').includes(q) ||
        (p.description_en || '').toLowerCase().includes(q) ||
        (p.description_bn || '').includes(q)
      );
    }
    return result;
  }, [dbProducts, search]);

  const productsByCategory = useMemo(() => {
    const groups: { categoryId: string; categoryLabel: string; products: CategoryRowProduct[] }[] = [];

    for (const cat of dbCategories) {
      const products = filteredProducts.filter(p => p.category_id === cat.id);
      if (products.length > 0) {
        groups.push({
          categoryId: cat.id,
          categoryLabel: pickLocalized(cat as any, 'name', lang),
          products,
        });
      }
    }

    const uncategorized = filteredProducts.filter(p => !p.category_id);
    if (uncategorized.length > 0) {
      groups.push({
        categoryId: 'uncategorized',
        categoryLabel: tt('Other Products', 'অন্যান্য পণ্য', '其他产品'),
        products: uncategorized,
      });
    }

    return groups;
  }, [filteredProducts, dbCategories, lang, tt]);

  const getTitle = (p: CategoryRowProduct) => pickLocalized(p as any, 'name', lang);

  const searchPlaceholder = tt('Search products...', 'পণ্য খুঁজুন...', '搜索产品...');
  const viewAllLabel = tt('View All Items', 'সব দেখুন', '查看全部');
  const quoteLabel = tt('Request Quote', 'কোটেশন চান', '请求报价');
  const noResults = tt('No products found.', 'কোনো পণ্য পাওয়া যায়নি।', '未找到产品。');

  return (
    <section id="products" className="py-24 bg-secondary relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.02]" style={{
        backgroundImage: 'radial-gradient(hsl(var(--sm-gold)) 1px, transparent 1px)',
        backgroundSize: '28px 28px',
      }} />
      <div className="container mx-auto px-4 relative">
        <div className="text-center mb-10">
          <span className="inline-block text-accent text-xs font-semibold tracking-widest uppercase mb-3" style={{ fontFamily: 'DM Sans, sans-serif' }}>
            {tt('Our Products', 'আমাদের পণ্য', '我们的产品')}
          </span>
          <h2 className="text-3xl md:text-5xl font-bold mb-5">{t('products.title')}</h2>
          <div className="flex items-center justify-center gap-3">
            <div className="h-px w-12 bg-accent/40" />
            <div className="w-2 h-2 rotate-45 bg-accent/70" />
            <div className="h-px w-12 bg-accent/40" />
          </div>
        </div>

        <div className="max-w-md mx-auto mb-10 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={searchPlaceholder}
            className="pl-10 rounded-full bg-background border-border"
          />
        </div>

        {productsLoading ? (
          <div className="space-y-10">
            {[...Array(3)].map((_, i) => (
              <div key={i}>
                <Skeleton className="h-7 w-48 mb-4" />
                <div className="flex gap-4 overflow-hidden">
                  {[...Array(5)].map((_, j) => (
                    <Skeleton key={j} className="shrink-0 w-[180px] aspect-[3/4] rounded-xl" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : productsByCategory.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">{noResults}</div>
        ) : (
          <div>
            {productsByCategory.map(group => (
              <CategoryProductRow
                key={group.categoryId}
                categoryId={group.categoryId}
                categoryLabel={group.categoryLabel}
                products={group.products}
                lang={lang}
                viewAllLabel={viewAllLabel}
                quoteLabel={quoteLabel}
                getTitle={getTitle}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default ProductsSection;
