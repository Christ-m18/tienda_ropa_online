import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartItem {
  id: string
  name: string
  price: number
  image: string
  quantity: number
  stock: number
}

interface CartStore {
  items: CartItem[]
  hasHydrated: boolean
  setHasHydrated: (v: boolean) => void
  addItem: (product: CartItem) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void
  totalItems: () => number
  totalPrice: () => number
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      hasHydrated: false,
      setHasHydrated: (v) => set({ hasHydrated: v }),
      addItem: (product) => {
        const items = get().items
        const existing = items.find((it) => it.id === product.id)
        if (existing) {
          set({
            items: items.map((it) =>
              it.id === product.id
                ? { ...it, quantity: Math.min(it.quantity + product.quantity, it.stock) }
                : it
            ),
          })
        } else {
          set({ items: [...items, product] })
        }
      },
      removeItem: (id) => set({ items: get().items.filter((it) => it.id !== id) }),
      updateQuantity: (id, quantity) =>
        set({
          items: get().items.map((it) => (it.id === id ? { ...it, quantity } : it)),
        }),
      clearCart: () => set({ items: [] }),
      totalItems: () => get().items.reduce((acc, it) => acc + it.quantity, 0),
      totalPrice: () => get().items.reduce((acc, it) => acc + it.price * it.quantity, 0),
    }),
    {
      name: 'cart-storage',
      partialize: (state) => ({ items: state.items }),
      onRehydrateStorage: () => (state) => state?.setHasHydrated(true),
    }
  )
)

// Returns 0 until zustand storage hydrates to prevent SSR mismatch
export function useCartCount() {
  const hasHydrated = useCartStore((s) => s.hasHydrated)
  const total = useCartStore((s) => s.totalItems())
  return hasHydrated ? total : 0
}
