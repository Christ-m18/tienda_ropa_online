export interface Profile {
  id: string
  full_name?: string | null
  avatar_url?: string | null
  phone?: string | null
  email?: string | null
  is_admin: boolean
  is_blocked: boolean
  blocked_reason?: string | null
  blocked_at?: string | null
  blocked_by?: string | null
  created_at: string
}

export interface Category {
  id: string
  name: string
  slug: string
  image_url?: string | null
}

export interface Product {
  id: string
  category_id?: string | null
  slug?: string | null
  name: string
  description: string
  price: number
  discount_price?: number | null
  stock: number
  images: string[]
  is_featured: boolean
  rating: number
  sales_count: number
  materials?: string | null
  dimensions?: string | null
  care_instructions?: string | null
  created_at?: string
  category?: Category | null
}

export interface Review {
  id: string
  product_id: string
  user_id: string
  rating: number
  comment?: string | null
  verified: boolean
  created_at: string
  profiles?: {
    full_name?: string | null
    avatar_url?: string | null
  } | null
}

export interface Address {
  id: string
  user_id: string
  address_line1: string
  address_line2?: string | null
  city: string
  province: string
  zip_code?: string | null
  phone: string
  is_default: boolean
  created_at?: string
}

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
export type PaymentMethod = 'stripe' | 'paypal' | 'cod' | 'bank_transfer'
export type PaymentStatus = 'pending' | 'paid' | 'failed'

export interface Order {
  id: string
  user_id: string
  status: OrderStatus
  subtotal?: number | null
  discount: number
  shipping: number
  total: number
  payment_method: PaymentMethod
  payment_status: PaymentStatus
  address_id?: string | null
  coupon_id?: string | null
  tracking_number?: string | null
  created_at: string
  items?: OrderItem[]
  address?: Address | null
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  quantity: number
  unit_price: number
  product?: Pick<Product, 'name' | 'images' | 'slug'> | null
}

export interface Wishlist {
  id: string
  user_id: string
  product_id: string
  created_at: string
  product?: Product | null
}

export type CouponType = 'percentage' | 'fixed'

export interface Coupon {
  id: string
  code: string
  description?: string | null
  type: CouponType
  discount_value: number
  min_purchase: number
  max_uses?: number | null
  used_count: number
  valid_from: string
  valid_until?: string | null
  is_active: boolean
}

export type PaymentProofStatus = 'pending' | 'approved' | 'rejected'

export interface PaymentProof {
  id: string
  order_id: string
  user_id: string
  file_path: string
  bank_name?: string | null
  bank_account_id?: string | null
  reference_number?: string | null
  amount?: number | null
  notes?: string | null
  status: PaymentProofStatus
  reviewed_by?: string | null
  reviewed_at?: string | null
  rejection_reason?: string | null
  created_at: string
}

export type NotificationType = 'order' | 'promo' | 'system' | 'review'

export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: NotificationType
  link?: string | null
  read: boolean
  created_at: string
}

export interface BankAccount {
  id: string
  bank_name: string
  account_number: string
  account_holder?: string | null
  account_type?: string | null
  display_color: string
  is_active: boolean
  sort_order: number
  created_at: string
}
