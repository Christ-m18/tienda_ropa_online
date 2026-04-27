'use client'

import { ShoppingCart, Trash2, Plus, Minus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCartStore } from '@/store/useCartStore'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import Image from 'next/image'
import Link from 'next/link'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from '@/components/ui/sheet'
import { formatRD } from '@/lib/format'

export default function CartSheet({ children }: { children: React.ReactNode }) {
  const { items, removeItem, updateQuantity, totalPrice, totalItems } = useCartStore()

  return (
    <Sheet>
      <SheetTrigger asChild>
        {children}
      </SheetTrigger>
      <SheetContent className="flex flex-col w-full sm:max-w-md">
        <SheetHeader className="px-1">
          <SheetTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Tu Carrito ({totalItems()})
          </SheetTitle>
          <SheetDescription className="sr-only">
            Productos en tu carrito de compras
          </SheetDescription>
        </SheetHeader>

        <Separator className="my-4" />

        <div className="flex-1 flex flex-col overflow-hidden">
          {items.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center space-y-4">
              <div className="bg-muted rounded-full p-6">
                <ShoppingCart className="h-10 w-10 text-muted-foreground" />
              </div>
              <p className="text-xl font-medium text-muted-foreground text-center">
                Tu carrito está vacío
              </p>
              <Link href="/productos">
                <Button>Explorar Productos</Button>
              </Link>
            </div>
          ) : (
            <ScrollArea className="flex-1 -mx-1 px-1">
              <div className="space-y-6">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-4">
                    <div className="relative h-24 w-20 flex-shrink-0 overflow-hidden rounded-md border">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    </div>

                    <div className="flex flex-1 flex-col justify-between py-1">
                      <div className="flex justify-between gap-2">
                        <h4 className="text-sm font-bold line-clamp-1">{item.name}</h4>
                        <p className="text-sm font-bold">RD${item.price}</p>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center border rounded-md">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-none"
                            onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center text-sm">{item.quantity}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-none"
                            onClick={() => updateQuantity(item.id, Math.min(item.stock, item.quantity + 1))}
                            disabled={item.quantity >= item.stock}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-red-500"
                          onClick={() => removeItem(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>

        {items.length > 0 && (
          <>
            <Separator className="my-4" />
            <div className="space-y-4">
              <div className="flex items-center justify-between text-base font-bold">
                <span>Subtotal</span>
                <span>{formatRD(totalPrice())}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Envío y descuentos se calculan en el checkout.
              </p>
              <SheetFooter className="flex-col gap-2">
                <Link href="/checkout" className="w-full">
                  <Button className="w-full bg-rd-red hover:bg-rd-red-dark text-white font-display tracking-wider">
                    Ir al checkout
                  </Button>
                </Link>
                <Link href="/productos" className="w-full">
                  <Button variant="outline" className="w-full">Seguir comprando</Button>
                </Link>
              </SheetFooter>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
