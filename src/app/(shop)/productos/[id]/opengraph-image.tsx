import { ImageResponse } from 'next/og'
import { getProductByIdOrSlug } from '@/lib/queries/products'

export const alt = 'Cora Mely'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const RD_CHARCOAL = '#2e2a26'
const RD_YELLOW = '#9caf88'
const RD_RED = '#b5563a'
const RD_BONE = '#f4eee3'

function formatPrice(value: number) {
  return `RD$${new Intl.NumberFormat('en-US').format(Math.round(value))}`
}

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const product = await getProductByIdOrSlug(id).catch(() => null)

  if (!product) {
    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: RD_CHARCOAL,
            color: RD_BONE,
            fontSize: 120,
            fontWeight: 800,
            letterSpacing: '-0.04em',
          }}
        >
          Cora Mely
        </div>
      ),
      { ...size },
    )
  }

  const finalPrice = product.discount_price ?? product.price
  const heroImage = product.images?.[0]

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          background: RD_CHARCOAL,
          color: '#ffffff',
          padding: 60,
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 40,
            right: 60,
            background: RD_RED,
            color: '#ffffff',
            fontSize: 22,
            fontWeight: 800,
            letterSpacing: '0.2em',
            padding: '10px 20px',
            borderRadius: 6,
            display: 'flex',
          }}
        >
          Cora Mely
        </div>

        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            paddingRight: 40,
          }}
        >
          <div
            style={{
              fontSize: 24,
              fontWeight: 700,
              color: RD_YELLOW,
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              marginBottom: 20,
              display: 'flex',
            }}
          >
            {product.category?.name ?? 'Producto'}
          </div>
          <div
            style={{
              fontSize: 78,
              fontWeight: 800,
              lineHeight: 1.05,
              color: '#ffffff',
              letterSpacing: '-0.03em',
              marginBottom: 32,
              display: 'flex',
            }}
          >
            {product.name}
          </div>
          <div
            style={{
              fontSize: 92,
              fontWeight: 800,
              color: RD_YELLOW,
              letterSpacing: '-0.02em',
              display: 'flex',
            }}
          >
            {formatPrice(finalPrice)}
          </div>
        </div>

        {heroImage && (
          <div
            style={{
              width: 460,
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 24,
              overflow: 'hidden',
              background: '#000000',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={heroImage}
              alt={product.name}
              width={460}
              height={510}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
        )}
      </div>
    ),
    { ...size },
  )
}
