'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'

export default function ProductGallery({
  images,
  alt,
  discountLabel,
}: {
  images: string[]
  alt: string
  discountLabel?: string
}) {
  const [active, setActive] = useState(0)
  if (!images.length) return null

  return (
    <div className="space-y-3">
      <div className="relative aspect-[4/5] rounded-3xl overflow-hidden bg-zinc-100">
        <Image
          src={images[active]}
          alt={alt}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-cover"
        />
        {discountLabel && (
          <Badge className="absolute top-4 left-4 bg-rd-red text-white text-base px-3 py-1.5 font-display tracking-wider">
            {discountLabel}
          </Badge>
        )}
      </div>
      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-3">
          {images.map((img, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Ver imagen ${i + 1}`}
              aria-pressed={i === active}
              className={`relative aspect-square rounded-xl overflow-hidden bg-zinc-100 border transition focus:outline-none focus-visible:ring-2 focus-visible:ring-rd-red focus-visible:ring-offset-2 ${
                i === active ? 'border-rd-red ring-2 ring-rd-red/30' : 'border-zinc-200 hover:border-zinc-300'
              }`}
            >
              <Image src={img} alt={`${alt} ${i + 1}`} fill sizes="120px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
