import type { ProductFilters } from '../domain/marketplace.model'

// Query keys for the product catalog. Every product list sits under `products()`, so a
// favourite change can refresh all of them whatever their filters.
export const marketplaceKeys = {
  all: () => ['marketplace'] as const,
  categories: () => ['marketplace', 'categories'] as const,
  products: () => ['marketplace', 'products'] as const,
  productList: (filters: ProductFilters) => ['marketplace', 'products', filters] as const,
  product: (productId: string) => ['marketplace', 'product', productId] as const,
}
