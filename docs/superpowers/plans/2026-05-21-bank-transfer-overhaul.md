# Bank Transfer Checkout Overhaul — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite the bank transfer checkout flow to be mobile-first, secure (server-generated reference/amount), backed by Supabase bank accounts, with proper pending-approval state management and a downloadable invoice after admin approval.

**Architecture:** A new `bank_accounts` Supabase table replaces the hardcoded BANKS array; `payment_proofs` gets a `bank_account_id` FK column. `uploadVoucher` is hardened to generate reference/amount server-side. A new `/api/orders/[id]/invoice` route serves a printable HTML invoice gated on `payment_status = paid`.

**Tech Stack:** Next.js 16.2.4 App Router, React 19, Supabase (RLS, Storage), Zod v4, Tailwind v4, TypeScript 5.

---

## File Map

| File | Status | Responsibility |
|------|--------|---------------|
| `supabase/migration-bank-accounts.sql` | **Create** | `bank_accounts` table + `payment_proofs.bank_account_id` column + RLS + seed |
| `src/types/index.ts` | **Modify** | Add `BankAccount` interface; add `bank_account_id` to `PaymentProof` |
| `src/lib/queries/user.ts` | **Modify** | Add `getActiveBankAccounts`, `getOrderPaymentProofs` |
| `src/components/checkout/BankTransferInstructions.tsx` | **Rewrite** | Remove hardcoded BANKS; accept `bankAccounts`+`orderTotal` props; fix mobile layout; remove reference/amount inputs |
| `src/app/(shop)/checkout/exito/[id]/page.tsx` | **Modify** | Fetch bank accounts; pass to component; fix mobile padding; fix messaging (no green "confirmed" for transfers) |
| `src/lib/actions/voucher.ts` | **Modify** | Validate `bank_account_id`; generate reference/amount server-side; check order status; prevent duplicate proofs |
| `src/app/(shop)/perfil/pedidos/[id]/page.tsx` | **Modify** | Fetch payment proofs; show transfer status; show invoice button when paid |
| `src/components/admin/VoucherReview.tsx` | **Modify** | Accept `orderTotal` prop; show expected vs reported amount comparison |
| `src/app/(shop)/admin/ordenes/[id]/page.tsx` | **Modify** | Pass `total` to VoucherReview |
| `src/app/api/orders/[id]/invoice/route.ts` | **Create** | Auth-gated HTML invoice; only when `payment_status = paid` |

---

## Task 1: Supabase Migration — bank_accounts + payment_proofs.bank_account_id

**Files:**
- Create: `supabase/migration-bank-accounts.sql`

- [ ] **Step 1: Create the migration file**

```sql
-- supabase/migration-bank-accounts.sql
-- Idempotente: ejecuta sin errores en una base ya existente.

-- 1. Tabla bank_accounts
create table if not exists public.bank_accounts (
  id              uuid primary key default uuid_generate_v4(),
  bank_name       text not null,
  account_number  text not null,
  account_holder  text,
  account_type    text,
  display_color   text not null default '#1e40af',
  is_active       boolean not null default true,
  sort_order      integer not null default 0,
  created_at      timestamptz not null default now()
);

create unique index if not exists bank_accounts_bank_name_idx on public.bank_accounts(bank_name);
create index        if not exists bank_accounts_active_sort_idx on public.bank_accounts(is_active, sort_order);

alter table public.bank_accounts enable row level security;

drop policy if exists "bank_accounts_select_active" on public.bank_accounts;
create policy "bank_accounts_select_active" on public.bank_accounts
  for select using (is_active = true or public.is_admin_user());

drop policy if exists "bank_accounts_admin_all" on public.bank_accounts;
create policy "bank_accounts_admin_all" on public.bank_accounts
  for all using (public.is_admin_user());

-- 2. FK en payment_proofs
alter table public.payment_proofs
  add column if not exists bank_account_id uuid references public.bank_accounts(id) on delete set null;

create index if not exists payment_proofs_bank_account_id_idx
  on public.payment_proofs(bank_account_id);

-- 3. Seed (idempotente via ON CONFLICT DO NOTHING con unique en bank_name)
insert into public.bank_accounts
  (bank_name, account_number, account_holder, account_type, display_color, sort_order)
values
  ('Banco de Reservas', '9601750827',     'Tienda RD', 'Corriente', '#16a34a', 1),
  ('Banco BHD',         '38675820016',    'Tienda RD', 'Ahorro',    '#1d4ed8', 2),
  ('Banco Santa Cruz',  '11145000018017', 'Tienda RD', 'Corriente', '#b91c1c', 3)
on conflict (bank_name) do nothing;
```

- [ ] **Step 2: Apply in Supabase SQL editor**

Open the Supabase dashboard → SQL Editor → paste the contents of `supabase/migration-bank-accounts.sql` → Run.

Verify success:
```sql
select id, bank_name, account_number, is_active from public.bank_accounts order by sort_order;
-- Should return 3 rows.
select column_name from information_schema.columns
  where table_name = 'payment_proofs' and column_name = 'bank_account_id';
-- Should return 1 row.
```

- [ ] **Step 3: Commit the migration file**

```bash
git add supabase/migration-bank-accounts.sql
git commit -m "feat: add bank_accounts table and payment_proofs.bank_account_id migration"
```

---

## Task 2: TypeScript Types

**Files:**
- Modify: `src/types/index.ts`

- [ ] **Step 1: Add `BankAccount` interface and update `PaymentProof`**

In `src/types/index.ts`, after the `Notification` interface at the bottom, add:

```typescript
export interface BankAccount {
  id: string
  bank_name: string
  account_number: string
  account_holder?: string | null
  account_type?: string | null
  display_color?: string | null
  is_active: boolean
  sort_order: number
  created_at: string
}
```

Also update `PaymentProof` — add `bank_account_id` field after `bank_name`:

```typescript
export interface PaymentProof {
  id: string
  order_id: string
  user_id: string
  file_path: string
  bank_name?: string | null
  bank_account_id?: string | null   // ← add this line
  reference_number?: string | null
  amount?: number | null
  notes?: string | null
  status: PaymentProofStatus
  reviewed_by?: string | null
  reviewed_at?: string | null
  rejection_reason?: string | null
  created_at: string
}
```

- [ ] **Step 2: Verify types compile**

```bash
cd SOFTWARE_DEVELOPMENT_PROJECTS/tienda-ropa-online
npx tsc --noEmit 2>&1 | head -30
```

Expected: No errors about `BankAccount` or `PaymentProof`.

- [ ] **Step 3: Commit**

```bash
git add src/types/index.ts
git commit -m "feat: add BankAccount type and bank_account_id to PaymentProof"
```

---

## Task 3: Query Helpers

**Files:**
- Modify: `src/lib/queries/user.ts`

- [ ] **Step 1: Add `getActiveBankAccounts` and `getOrderPaymentProofs`**

Open `src/lib/queries/user.ts`. At the top, the `import type` line already imports from `@/types`. Add `BankAccount` and `PaymentProof` to that import:

```typescript
import type { Address, BankAccount, Notification, Order, PaymentProof, Profile, Wishlist } from '@/types'
```

Then at the end of the file, append:

```typescript
export async function getActiveBankAccounts(): Promise<BankAccount[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('bank_accounts')
    .select('id, bank_name, account_number, account_holder, account_type, display_color, sort_order')
    .eq('is_active', true)
    .order('sort_order')
  return (data ?? []) as BankAccount[]
}

export async function getOrderPaymentProofs(orderId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []
  const { data } = await supabase
    .from('payment_proofs')
    .select('id, status, bank_name, reference_number, amount, notes, created_at, rejection_reason, reviewed_at')
    .eq('order_id', orderId)
    .order('created_at', { ascending: false })
  return (data ?? []) as Pick<PaymentProof, 'id' | 'status' | 'bank_name' | 'reference_number' | 'amount' | 'notes' | 'created_at' | 'rejection_reason' | 'reviewed_at'>[]
}
```

- [ ] **Step 2: Typecheck**

```bash
npx tsc --noEmit 2>&1 | head -30
```

Expected: No new errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/queries/user.ts
git commit -m "feat: add getActiveBankAccounts and getOrderPaymentProofs queries"
```

---

## Task 4: Rewrite BankTransferInstructions

**Files:**
- Modify: `src/components/checkout/BankTransferInstructions.tsx`

**Changes:**
- Remove hardcoded `BANKS` array
- Accept `bankAccounts: BankAccount[]` and `orderTotal: number` props
- Fix mobile layout: account number uses `break-all min-w-0`, copy button uses `shrink-0`
- Remove reference_number and amount inputs — show them as read-only computed values
- Form only sends: `order_id`, `bank_account_id`, `file`, optional `notes`
- Add a step-2 info box showing monto + referencia when a bank is selected

- [ ] **Step 1: Rewrite the file**

Replace the entire contents of `src/components/checkout/BankTransferInstructions.tsx`:

```tsx
'use client'

import { useState, useTransition } from 'react'
import { Building2, Copy, Check, CheckCircle2, Upload, FileText, Truck, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { uploadVoucher } from '@/lib/actions/voucher'
import { formatRD } from '@/lib/format'
import { toast } from 'sonner'
import type { BankAccount } from '@/types'

interface Props {
  orderId: string
  orderTotal: number
  bankAccounts: BankAccount[]
}

function buildDisplayRef(orderId: string, bankName: string): string {
  const suffix = bankName.split(' ').pop()?.slice(0, 3).toUpperCase() ?? 'BNK'
  return `${orderId.slice(0, 8).toUpperCase()}-${suffix}`
}

export default function BankTransferInstructions({ orderId, orderTotal, bankAccounts }: Props) {
  const [pending, startTransition] = useTransition()
  const [submitted, setSubmitted] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [notes, setNotes] = useState('')

  const selected = bankAccounts.find((b) => b.id === selectedId)
  const displayRef = selected ? buildDisplayRef(orderId, selected.bank_name) : null

  function copyAccount(bankId: string, account: string) {
    navigator.clipboard.writeText(account)
    setCopiedId(bankId)
    toast.success('Número de cuenta copiado')
    setTimeout(() => setCopiedId(null), 2000)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selected) return toast.error('Selecciona un banco')
    if (!file) return toast.error('Sube el comprobante')

    startTransition(async () => {
      const fd = new FormData()
      fd.set('order_id', orderId)
      fd.set('bank_account_id', selected.id)
      fd.set('file', file)
      if (notes.trim()) fd.set('notes', notes)
      const r = await uploadVoucher(fd)
      if (!r.ok) toast.error(r.message)
      else {
        toast.success('Comprobante enviado. Lo revisaremos pronto.')
        setSubmitted(true)
      }
    })
  }

  if (submitted) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center">
        <CheckCircle2 className="h-10 w-10 text-emerald-600 mx-auto mb-3" />
        <p className="font-display text-xl tracking-wider">Comprobante recibido</p>
        <p className="text-sm text-emerald-700 mt-1">
          Estamos revisando tu comprobante. Te notificaremos cuando tu pago sea aprobado.
        </p>
        <div className="mt-3 flex items-center justify-center gap-2 text-xs text-emerald-600 font-bold">
          <Truck className="h-4 w-4" />
          Tu pedido tiene entrega preferencial
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Preferential delivery badge */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-3">
        <div className="h-9 w-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
          <Zap className="h-5 w-5" />
        </div>
        <div>
          <p className="font-bold text-sm text-emerald-800">Entrega preferencial</p>
          <p className="text-xs text-emerald-700">Los pedidos por transferencia tienen prioridad de envío.</p>
        </div>
      </div>

      {/* Step 1: Select bank */}
      <div className="bg-rd-blue/5 border border-rd-blue/20 rounded-2xl p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-1">
          <Building2 className="h-5 w-5 text-rd-blue shrink-0" />
          <p className="font-display text-lg tracking-wider">1. Elige tu banco</p>
        </div>
        <p className="text-xs text-zinc-500 mb-4">
          Selecciona el banco al que harás la transferencia para ver el número de cuenta.
        </p>

        <div className="grid gap-2">
          {bankAccounts.map((bank) => {
            const isSelected = selectedId === bank.id
            const isCopied = copiedId === bank.id
            return (
              <button
                key={bank.id}
                type="button"
                onClick={() => setSelectedId(bank.id)}
                className={`w-full text-left rounded-xl p-3 sm:p-4 border-2 transition-all ${
                  isSelected
                    ? 'border-rd-blue bg-white shadow-sm'
                    : 'border-zinc-200 bg-white hover:border-zinc-300'
                }`}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className="h-9 w-9 rounded-lg text-white flex items-center justify-center font-display text-sm shrink-0"
                    style={{ backgroundColor: bank.display_color ?? '#1e40af' }}
                  >
                    {bank.bank_name.split(' ').pop()?.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm">{bank.bank_name}</p>
                    {isSelected && (
                      <div className="flex items-center gap-2 flex-wrap mt-1">
                        <p className="font-mono text-sm text-zinc-800 break-all min-w-0">
                          {bank.account_number}
                        </p>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            copyAccount(bank.id, bank.account_number)
                          }}
                          className={`shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                            isCopied
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-rd-blue/10 text-rd-blue hover:bg-rd-blue/20'
                          }`}
                        >
                          {isCopied ? (
                            <><Check className="h-3.5 w-3.5" />Copiado</>
                          ) : (
                            <><Copy className="h-3.5 w-3.5" />Copiar</>
                          )}
                        </button>
                      </div>
                    )}
                    {isSelected && bank.account_holder && (
                      <p className="text-xs text-zinc-500 mt-0.5">Titular: {bank.account_holder}</p>
                    )}
                    {isSelected && bank.account_type && (
                      <p className="text-xs text-zinc-400">Tipo: {bank.account_type}</p>
                    )}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Transfer info box — shown once a bank is selected */}
      {selected && displayRef && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
          <p className="text-xs font-bold text-amber-800 uppercase tracking-wider">
            Datos para la transferencia
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-amber-700 mb-0.5">Monto exacto a transferir</p>
              <p className="font-display text-xl text-amber-900">{formatRD(orderTotal)}</p>
            </div>
            <div>
              <p className="text-xs text-amber-700 mb-0.5">Referencia (inclúyela en la transferencia)</p>
              <p className="font-mono text-base font-bold text-amber-900 break-all">{displayRef}</p>
            </div>
          </div>
          <p className="text-xs text-amber-600">
            Incluye la referencia en el concepto o descripción de la transferencia para identificarla más fácil.
          </p>
        </div>
      )}

      {/* Step 2: Upload voucher */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-zinc-200 p-4 sm:p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Upload className="h-5 w-5 text-rd-red shrink-0" />
          <p className="font-display text-lg tracking-wider">2. Sube tu comprobante</p>
        </div>
        <p className="text-xs text-zinc-500">
          Realiza la transferencia y luego sube el voucher. Un administrador lo revisará y confirmará tu pedido.
        </p>

        <div>
          <label className="text-sm text-zinc-600 mb-1 block">Notas (opcional)</label>
          <Input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Información adicional..."
          />
        </div>

        <div>
          <label className="text-sm text-zinc-600 mb-1 block">
            Comprobante (imagen o PDF, máx 5MB)
          </label>
          <label className="flex items-center justify-center gap-2 h-20 rounded-xl border-2 border-dashed border-zinc-300 hover:border-rd-red cursor-pointer transition-colors">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              className="sr-only"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            {file ? (
              <span className="flex items-center gap-2 text-sm text-zinc-700 px-4 text-center min-w-0">
                <FileText className="h-4 w-4 text-rd-red shrink-0" />
                <span className="truncate">{file.name}</span>
              </span>
            ) : (
              <span className="text-sm text-zinc-400">Haz clic para seleccionar archivo</span>
            )}
          </label>
        </div>

        <Button
          type="submit"
          disabled={pending || !selectedId || !file}
          className="w-full bg-rd-red hover:bg-rd-red-dark text-white h-11 font-display tracking-wider"
        >
          {pending ? 'Enviando...' : 'Enviar comprobante'}
        </Button>
      </form>
    </div>
  )
}
```

- [ ] **Step 2: Typecheck**

```bash
npx tsc --noEmit 2>&1 | head -30
```

Expected: No errors in BankTransferInstructions.

- [ ] **Step 3: Commit**

```bash
git add src/components/checkout/BankTransferInstructions.tsx
git commit -m "feat: refactor BankTransferInstructions — Supabase bank accounts, mobile-first layout, secure form"
```

---

## Task 5: Update Checkout Success Page

**Files:**
- Modify: `src/app/(shop)/checkout/exito/[id]/page.tsx`

**Changes:**
- Fetch `bankAccounts` in parallel with order
- Pass `bankAccounts` and `orderTotal` to `BankTransferInstructions`
- Reduce mobile padding (`p-5 sm:p-10`)
- Use amber Clock icon for bank transfer (not green CheckCircle)
- Add "Pendiente de comprobante" status badge for transfers
- Avoid "¡Pedido confirmado!" for bank transfer orders

- [ ] **Step 1: Replace the file**

```tsx
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CheckCircle2, Package, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getOrderById, getActiveBankAccounts } from '@/lib/queries/user'
import { formatRD, formatDate } from '@/lib/format'
import BankTransferInstructions from '@/components/checkout/BankTransferInstructions'

type RouteParams = Promise<{ id: string }>

export default async function CheckoutSuccessPage({ params }: { params: RouteParams }) {
  const { id } = await params
  const [order, bankAccounts] = await Promise.all([
    getOrderById(id),
    getActiveBankAccounts(),
  ])
  if (!order) notFound()

  const isBankTransfer = order.payment_method === 'bank_transfer'

  return (
    <div className="container mx-auto px-4 py-8 sm:py-16 max-w-2xl">
      <div className="bg-white rounded-3xl border border-zinc-200 p-5 sm:p-10 text-center">
        <div
          className={`h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
            isBankTransfer ? 'bg-amber-100' : 'bg-emerald-100'
          }`}
        >
          {isBankTransfer
            ? <Clock className="h-8 w-8 text-amber-600" />
            : <CheckCircle2 className="h-8 w-8 text-emerald-600" />
          }
        </div>

        <h1 className="font-display text-3xl sm:text-4xl md:text-5xl tracking-tight">
          {isBankTransfer ? '¡Pedido creado!' : '¡Pedido confirmado!'}
        </h1>
        <p className="text-zinc-500 mt-2 text-sm sm:text-base">
          Pedido #{order.id.slice(0, 8).toUpperCase()} &middot; {formatDate(order.created_at)}
        </p>

        {isBankTransfer && (
          <div className="mt-3 inline-block bg-amber-50 text-amber-700 text-xs font-bold px-3 py-1.5 rounded-full border border-amber-200">
            Pendiente de comprobante · Pago por revisar
          </div>
        )}

        <div className="mt-6 sm:mt-8 p-4 sm:p-6 bg-rd-bone rounded-2xl text-left space-y-2">
          <p className="text-sm text-zinc-500 uppercase tracking-wider">Total</p>
          <p className="font-display text-3xl sm:text-4xl text-rd-red">{formatRD(order.total)}</p>
          {!isBankTransfer && (
            <p className="text-sm text-zinc-600">
              Estado: <span className="font-bold text-rd-charcoal capitalize">{order.status}</span>
            </p>
          )}
        </div>

        {isBankTransfer && (
          <div className="mt-6 sm:mt-8 text-left">
            <BankTransferInstructions
              orderId={order.id}
              orderTotal={order.total}
              bankAccounts={bankAccounts}
            />
          </div>
        )}

        {!isBankTransfer && (
          <p className="text-sm text-zinc-600 mt-6">
            Te llegará un correo con los detalles. Puedes seguir tu pedido en{' '}
            <Link href={`/perfil/pedidos/${order.id}`} className="text-rd-red font-bold hover:underline">
              Mis pedidos
            </Link>.
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6 sm:mt-8">
          <Link href={`/perfil/pedidos/${order.id}`}>
            <Button className="w-full sm:w-auto bg-rd-charcoal hover:bg-rd-red text-white">
              <Package className="mr-2 h-4 w-4" />Ver pedido
            </Button>
          </Link>
          <Link href="/productos">
            <Button variant="outline" className="w-full sm:w-auto">Seguir comprando</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Typecheck**

```bash
npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 3: Commit**

```bash
git add src/app/\(shop\)/checkout/exito/\[id\]/page.tsx
git commit -m "feat: success page — mobile-first layout, correct transfer state messaging"
```

---

## Task 6: Harden uploadVoucher Server Action

**Files:**
- Modify: `src/lib/actions/voucher.ts`

**Changes:**
- Remove `bank_name`, `reference_number`, `amount` from Zod schema and FormData
- Add `bank_account_id` (UUID) to schema
- Fetch order for ownership + validate `status === 'pending'` and `payment_status === 'pending'`
- Check no existing `pending` or `approved` proof for the order
- Fetch bank account from DB (validates active)
- Generate `reference_number` and `amount` server-side
- Store `bank_account_id` in payment_proofs insert

- [ ] **Step 1: Replace the `uploadSchema` and `uploadVoucher` function**

Open `src/lib/actions/voucher.ts`. Replace the `uploadSchema` constant and the entire `uploadVoucher` function (lines 10–79) with:

```typescript
const uploadSchema = z.object({
  order_id: z.string().uuid(),
  bank_account_id: z.string().uuid(),
  notes: z.string().optional(),
})

export async function uploadVoucher(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false as const, message: 'Inicia sesión' }

  const file = formData.get('file') as File | null
  if (!file || file.size === 0) return { ok: false as const, message: 'Sube un comprobante' }
  if (file.size > MAX_FILE_SIZE) return { ok: false as const, message: 'El archivo no puede superar 5MB' }
  if (!ALLOWED_TYPES.includes(file.type)) return { ok: false as const, message: 'Formato no válido. Usa JPG, PNG, WebP o PDF' }

  const parsed = uploadSchema.safeParse({
    order_id: formData.get('order_id'),
    bank_account_id: formData.get('bank_account_id'),
    notes: formData.get('notes') || undefined,
  })
  if (!parsed.success) return { ok: false as const, message: parsed.error.issues[0]?.message ?? 'Datos inválidos' }

  // Validate order: must belong to user, be bank_transfer, still pending
  const { data: order } = await supabase
    .from('orders')
    .select('id, user_id, payment_method, status, payment_status, total')
    .eq('id', parsed.data.order_id)
    .eq('user_id', user.id)
    .maybeSingle()
  if (!order) return { ok: false as const, message: 'Pedido no encontrado' }
  if (order.payment_method !== 'bank_transfer') return { ok: false as const, message: 'Este pedido no usa transferencia bancaria' }
  if (order.status !== 'pending') return { ok: false as const, message: 'Este pedido ya no está en estado pendiente' }
  if (order.payment_status !== 'pending') return { ok: false as const, message: 'El pago de este pedido ya fue procesado' }

  // Prevent duplicate proofs
  const { count: existingCount } = await supabase
    .from('payment_proofs')
    .select('id', { count: 'exact', head: true })
    .eq('order_id', order.id)
    .in('status', ['pending', 'approved'])
  if ((existingCount ?? 0) > 0) {
    return { ok: false as const, message: 'Ya existe un comprobante pendiente o aprobado para este pedido' }
  }

  // Validate bank account is active
  const { data: bankAccount } = await supabase
    .from('bank_accounts')
    .select('id, bank_name')
    .eq('id', parsed.data.bank_account_id)
    .eq('is_active', true)
    .maybeSingle()
  if (!bankAccount) return { ok: false as const, message: 'Cuenta bancaria no válida' }

  // Generate reference and amount server-side
  const bankCode = bankAccount.bank_name.split(' ').pop()?.slice(0, 3).toUpperCase() ?? 'BNK'
  const reference_number = `${order.id.slice(0, 8).toUpperCase()}-${bankCode}`
  const amount = Number(order.total)

  // Upload file to storage
  const ext = file.name.split('.').pop() ?? 'jpg'
  const filePath = `${user.id}/${order.id}/${Date.now()}.${ext}`
  const { error: uploadError } = await supabase.storage
    .from('payment-vouchers')
    .upload(filePath, file, { contentType: file.type, upsert: false })
  if (uploadError) return { ok: false as const, message: 'Error al subir el archivo: ' + uploadError.message }

  // Create payment proof record
  const { error: insertError } = await supabase.from('payment_proofs').insert({
    order_id: order.id,
    user_id: user.id,
    file_path: filePath,
    bank_name: bankAccount.bank_name,
    bank_account_id: parsed.data.bank_account_id,
    reference_number,
    amount,
    notes: parsed.data.notes || null,
  })
  if (insertError) return { ok: false as const, message: 'Error al guardar el comprobante' }

  // Notify user
  await supabase.from('notifications').insert({
    user_id: user.id,
    title: 'Comprobante recibido',
    message: `Tu comprobante para el pedido #${order.id.slice(0, 8)} está siendo revisado.`,
    type: 'order',
    link: `/perfil/pedidos/${order.id}`,
  })

  revalidatePath(`/perfil/pedidos/${order.id}`)
  revalidatePath('/admin/ordenes')
  return { ok: true as const }
}
```

- [ ] **Step 2: Typecheck**

```bash
npx tsc --noEmit 2>&1 | head -30
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/actions/voucher.ts
git commit -m "feat: uploadVoucher — server-side reference/amount, duplicate proof guard, bank_account_id"
```

---

## Task 7: Order Detail Page — Transfer Status + Invoice Button

**Files:**
- Modify: `src/app/(shop)/perfil/pedidos/[id]/page.tsx`

**Changes:**
- Import `getOrderPaymentProofs`
- Fetch proofs in parallel with order
- For bank transfer orders: show transfer status section instead of (or alongside) tracking bar
- Don't show tracking progress bar before payment approval for bank transfers
- Show invoice download button when `payment_status === 'paid'`

- [ ] **Step 1: Replace the file**

```tsx
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Download } from 'lucide-react'
import { getOrderById, getOrderPaymentProofs } from '@/lib/queries/user'
import { formatRD, formatDate } from '@/lib/format'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

type RouteParams = Promise<{ id: string }>

const STATUS_FLOW = ['pending', 'processing', 'shipped', 'delivered'] as const

const PROOF_STATUS_LABELS: Record<string, string> = {
  pending: 'En revisión',
  approved: 'Aprobado',
  rejected: 'Rechazado',
}
const PROOF_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-red-100 text-red-700',
}

export default async function OrderDetailPage({ params }: { params: RouteParams }) {
  const { id } = await params
  const [order, proofs] = await Promise.all([
    getOrderById(id),
    getOrderPaymentProofs(id),
  ])
  if (!order) notFound()

  const isBankTransfer = order.payment_method === 'bank_transfer'
  const isPaid = order.payment_status === 'paid'
  const statusIndex = STATUS_FLOW.indexOf(order.status as typeof STATUS_FLOW[number])
  const latestProof = proofs[0]

  // Only show the tracking bar when: not a bank transfer, OR bank transfer that has been paid/processing
  const showTrackingBar = order.status !== 'cancelled' && (!isBankTransfer || isPaid)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/perfil/pedidos" className="text-sm text-rd-red hover:underline">← Volver</Link>
      </div>

      <div className="bg-white rounded-3xl border border-zinc-200 p-6 md:p-8">
        <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
          <div>
            <h1 className="font-display text-3xl md:text-4xl tracking-tight">
              Pedido #{order.id.slice(0, 8).toUpperCase()}
            </h1>
            <p className="text-zinc-500">{formatDate(order.created_at)}</p>
          </div>
          <Badge className="bg-rd-yellow text-rd-charcoal font-bold uppercase tracking-wider">
            {order.status}
          </Badge>
        </div>

        {/* Tracking progress — only shown when relevant */}
        {showTrackingBar && (
          <div className="mb-8">
            <div className="flex justify-between text-xs uppercase tracking-wider text-zinc-500 mb-2">
              {STATUS_FLOW.map((s) => <span key={s}>{s}</span>)}
            </div>
            <div className="h-2 bg-zinc-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-rd-red transition-all"
                style={{ width: `${((statusIndex + 1) / STATUS_FLOW.length) * 100}%` }}
              />
            </div>
            {order.tracking_number && (
              <p className="text-xs text-zinc-500 mt-2">
                Seguimiento: <span className="font-mono">{order.tracking_number}</span>
              </p>
            )}
          </div>
        )}

        {/* Transfer status section */}
        {isBankTransfer && (
          <div className="mb-6 rounded-xl border border-zinc-200 p-4 space-y-2">
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
              Estado de transferencia
            </p>
            {!latestProof && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-sm font-medium text-amber-800">Comprobante pendiente</p>
                <p className="text-xs text-amber-600 mt-0.5">
                  Aún no hemos recibido tu comprobante de pago.
                </p>
                <Link
                  href={`/checkout/exito/${order.id}`}
                  className="inline-block mt-2 text-xs font-bold text-rd-red hover:underline"
                >
                  Subir comprobante →
                </Link>
              </div>
            )}
            {latestProof && (
              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-zinc-500 text-xs">Estado del comprobante:</span>
                  <Badge className={`${PROOF_STATUS_COLORS[latestProof.status]} text-[10px] font-bold uppercase`}>
                    {PROOF_STATUS_LABELS[latestProof.status] ?? latestProof.status}
                  </Badge>
                </div>
                {latestProof.bank_name && (
                  <p className="text-xs text-zinc-500">
                    Banco: <span className="font-medium text-zinc-700">{latestProof.bank_name}</span>
                  </p>
                )}
                {latestProof.reference_number && (
                  <p className="text-xs text-zinc-500">
                    Referencia: <span className="font-mono font-medium text-zinc-700">{latestProof.reference_number}</span>
                  </p>
                )}
                {latestProof.status === 'rejected' && latestProof.rejection_reason && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-2">
                    <p className="text-xs font-bold text-red-700">Motivo de rechazo:</p>
                    <p className="text-xs text-red-600 mt-0.5">{latestProof.rejection_reason}</p>
                    <Link
                      href={`/checkout/exito/${order.id}`}
                      className="inline-block mt-2 text-xs font-bold text-rd-red hover:underline"
                    >
                      Subir nuevo comprobante →
                    </Link>
                  </div>
                )}
              </div>
            )}
            {isPaid && (
              <a href={`/api/orders/${order.id}/invoice`} target="_blank" rel="noreferrer">
                <Button
                  variant="outline"
                  className="mt-2 gap-2 text-sm border-zinc-300"
                >
                  <Download className="h-4 w-4" />
                  Descargar factura
                </Button>
              </a>
            )}
          </div>
        )}

        {/* Items */}
        <div className="space-y-3">
          {order.items?.map((it) => (
            <div key={it.id} className="flex gap-4 items-center">
              <div className="relative h-16 w-16 rounded-xl overflow-hidden bg-zinc-100 flex-shrink-0">
                {it.product?.images?.[0] && (
                  <Image
                    src={it.product.images[0]}
                    alt={it.product.name ?? ''}
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold line-clamp-1">{it.product?.name ?? 'Producto'}</p>
                <p className="text-xs text-zinc-500">x{it.quantity} · {formatRD(it.unit_price)}</p>
              </div>
              <p className="font-bold shrink-0">{formatRD(it.unit_price * it.quantity)}</p>
            </div>
          ))}
        </div>

        {/* Address */}
        {order.address && (
          <div className="mt-8 pt-6 border-t border-zinc-200">
            <p className="text-sm text-zinc-500 uppercase tracking-wider mb-1">Dirección de envío</p>
            <p className="text-sm">
              {order.address.address_line1}
              {order.address.address_line2 ? `, ${order.address.address_line2}` : ''}
            </p>
            <p className="text-sm">{order.address.city}, {order.address.province}</p>
            <p className="text-sm text-zinc-500">📞 {order.address.phone}</p>
          </div>
        )}

        {/* Totals */}
        <div className="mt-8 pt-6 border-t border-zinc-200 space-y-1.5 text-sm">
          {order.subtotal != null && <Row label="Subtotal" value={formatRD(order.subtotal)} />}
          <Row label="Envío" value={formatRD(order.shipping)} />
          {order.discount > 0 && (
            <Row label="Descuento" value={`-${formatRD(order.discount)}`} accent />
          )}
          <div className="flex justify-between pt-2 border-t border-zinc-200">
            <span className="font-bold">Total</span>
            <span className="font-display text-2xl text-rd-red">{formatRD(order.total)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-zinc-600">{label}</span>
      <span className={accent ? 'text-emerald-600 font-bold' : ''}>{value}</span>
    </div>
  )
}
```

- [ ] **Step 2: Typecheck**

```bash
npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 3: Commit**

```bash
git add src/app/\(shop\)/perfil/pedidos/\[id\]/page.tsx
git commit -m "feat: order detail — transfer status section, invoice button after approval"
```

---

## Task 8: Admin — VoucherReview Expected Amount + Admin Order Page

**Files:**
- Modify: `src/components/admin/VoucherReview.tsx`
- Modify: `src/app/(shop)/admin/ordenes/[id]/page.tsx`

**Changes to VoucherReview:**
- Add `orderTotal: number` prop
- In `ProofCard`, show "Monto esperado" vs "Monto reportado" comparison with color coding

**Changes to admin order page:**
- Pass `total` to `<VoucherReview>`

- [ ] **Step 1: Update VoucherReview.tsx**

In `src/components/admin/VoucherReview.tsx`:

1. Update the `VoucherReview` function signature to include `orderTotal`:

```typescript
export default function VoucherReview({
  proofs,
  signedUrls,
  orderTotal,
}: {
  proofs: PaymentProof[]
  signedUrls: Record<string, string>
  orderTotal: number
}) {
  if (proofs.length === 0) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <p className="text-sm text-amber-800 font-medium">Sin comprobante</p>
        <p className="text-xs text-amber-600 mt-1">El cliente aún no ha subido un comprobante de transferencia.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {proofs.map((proof) => (
        <ProofCard key={proof.id} proof={proof} signedUrl={signedUrls[proof.id]} orderTotal={orderTotal} />
      ))}
    </div>
  )
}
```

2. Update `ProofCard` to accept and display `orderTotal`:

```typescript
function ProofCard({
  proof,
  signedUrl,
  orderTotal,
}: {
  proof: PaymentProof
  signedUrl?: string
  orderTotal: number
}) {
```

3. Inside `ProofCard`, after the grid with `proof.bank_name`, `proof.reference_number`, `proof.amount`, and before the `{proof.notes && ...}` block, insert the expected vs reported amount comparison:

```tsx
          {/* Expected vs Reported amount comparison */}
          <div className="sm:col-span-2 bg-zinc-50 rounded-lg p-3 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-xs text-zinc-400">Monto esperado (pedido)</span>
              <span className="font-display text-base text-zinc-800">{formatRD(orderTotal)}</span>
            </div>
            {proof.amount != null && (
              <div className="flex justify-between text-sm">
                <span className="text-xs text-zinc-400">Monto reportado</span>
                <span className={`font-display text-base ${
                  Math.abs(proof.amount - orderTotal) < 1
                    ? 'text-emerald-700'
                    : 'text-red-600 font-bold'
                }`}>
                  {formatRD(proof.amount)}
                  {Math.abs(proof.amount - orderTotal) >= 1 && ' ⚠️'}
                </span>
              </div>
            )}
          </div>
```

- [ ] **Step 2: Pass `total` to VoucherReview in admin order page**

In `src/app/(shop)/admin/ordenes/[id]/page.tsx`, find the line:

```tsx
<VoucherReview proofs={proofs} signedUrls={signedUrls} />
```

Replace with:

```tsx
<VoucherReview proofs={proofs} signedUrls={signedUrls} orderTotal={total} />
```

(The variable `total` is already computed on line ~118 of that file.)

- [ ] **Step 3: Typecheck**

```bash
npx tsc --noEmit 2>&1 | head -30
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/admin/VoucherReview.tsx src/app/\(shop\)/admin/ordenes/\[id\]/page.tsx
git commit -m "feat: VoucherReview — expected vs reported amount comparison for admin"
```

---

## Task 9: Invoice API Route

**Files:**
- Create: `src/app/api/orders/[id]/invoice/route.ts`

**Spec:**
- GET `/api/orders/[id]/invoice`
- Auth required: user must own the order OR be admin
- Only returns HTML if `payment_status === 'paid'`
- Returns printable HTML invoice with: header, order details, client info, address, items table, totals, invoice number, date

- [ ] **Step 1: Create the file**

Create directory `src/app/api/orders/[id]/invoice/` and write `route.ts`:

```typescript
import type { NextRequest } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { formatRD, formatDate } from '@/lib/format'

const METHOD_LABELS: Record<string, string> = {
  cod: 'Contra entrega',
  bank_transfer: 'Transferencia bancaria',
  stripe: 'Stripe',
  paypal: 'PayPal',
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  // RLS enforces ownership; admins bypass via is_admin_user()
  const { data: order } = await supabase
    .from('orders')
    .select('*, items:order_items(quantity, unit_price, product:products(name)), address:addresses(*)')
    .eq('id', id)
    .maybeSingle()

  if (!order) return new Response('Not found', { status: 404 })
  if (order.payment_status !== 'paid') {
    return new Response('Invoice not available until payment is approved', { status: 403 })
  }

  const invoiceNumber = `INV-${order.id.slice(0, 8).toUpperCase()}`
  const total = Number(order.total)
  const subtotal = order.subtotal != null ? Number(order.subtotal) : total
  const shipping = Number(order.shipping ?? 0)
  const discount = Number(order.discount ?? 0)

  const itemRows = (order.items ?? []).map((it: { quantity: number; unit_price: number; product?: { name?: string } | null }) => `
    <tr>
      <td>${it.product?.name ?? 'Producto'}</td>
      <td style="text-align:center">${it.quantity}</td>
      <td style="text-align:right">${formatRD(it.unit_price)}</td>
      <td style="text-align:right">${formatRD(it.unit_price * it.quantity)}</td>
    </tr>
  `).join('')

  const addressHtml = order.address
    ? `<p>${order.address.address_line1}${order.address.address_line2 ? ', ' + order.address.address_line2 : ''}</p>
       <p>${order.address.city}, ${order.address.province}</p>
       <p>Tel: ${order.address.phone}</p>`
    : '<p>—</p>'

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Factura ${invoiceNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui, sans-serif; color: #18181b; background: #fff; padding: 40px; max-width: 800px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; }
    .brand { font-size: 28px; font-weight: 900; letter-spacing: -1px; color: #dc2626; }
    .brand-sub { font-size: 12px; color: #71717a; margin-top: 2px; }
    .invoice-meta { text-align: right; font-size: 13px; }
    .invoice-meta .number { font-size: 18px; font-weight: 700; margin-bottom: 4px; }
    .divider { border: none; border-top: 2px solid #f4f4f5; margin: 24px 0; }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 32px; }
    .section-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; color: #71717a; font-weight: 700; margin-bottom: 6px; }
    .section-value { font-size: 13px; line-height: 1.6; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    thead th { background: #f4f4f5; padding: 10px 12px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; color: #71717a; }
    tbody td { padding: 10px 12px; font-size: 13px; border-bottom: 1px solid #f4f4f5; vertical-align: top; }
    .totals { max-width: 280px; margin-left: auto; }
    .totals-row { display: flex; justify-content: space-between; padding: 5px 0; font-size: 13px; }
    .totals-row.final { border-top: 2px solid #18181b; margin-top: 8px; padding-top: 10px; font-weight: 700; font-size: 18px; }
    .total-amount { color: #dc2626; }
    .footer { margin-top: 48px; text-align: center; font-size: 11px; color: #a1a1aa; }
    @media print {
      body { padding: 20px; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand">Tienda RD</div>
      <div class="brand-sub">República Dominicana</div>
    </div>
    <div class="invoice-meta">
      <div class="number">${invoiceNumber}</div>
      <div>Fecha: ${formatDate(order.created_at)}</div>
      <div>Pedido: #${order.id.slice(0, 8).toUpperCase()}</div>
      <div>Método: ${METHOD_LABELS[order.payment_method] ?? order.payment_method}</div>
    </div>
  </div>

  <hr class="divider" />

  <div class="grid-2">
    <div>
      <div class="section-label">Dirección de envío</div>
      <div class="section-value">${addressHtml}</div>
    </div>
    <div>
      <div class="section-label">Estado del pago</div>
      <div class="section-value">
        <strong style="color:#16a34a">✓ Pago aprobado</strong>
      </div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Producto</th>
        <th style="text-align:center">Cant.</th>
        <th style="text-align:right">Precio</th>
        <th style="text-align:right">Subtotal</th>
      </tr>
    </thead>
    <tbody>
      ${itemRows}
    </tbody>
  </table>

  <div class="totals">
    <div class="totals-row">
      <span>Subtotal</span><span>${formatRD(subtotal)}</span>
    </div>
    <div class="totals-row">
      <span>Envío</span><span>${shipping === 0 ? 'Gratis' : formatRD(shipping)}</span>
    </div>
    ${discount > 0 ? `<div class="totals-row" style="color:#16a34a"><span>Descuento</span><span>-${formatRD(discount)}</span></div>` : ''}
    <div class="totals-row final">
      <span>Total</span><span class="total-amount">${formatRD(total)}</span>
    </div>
  </div>

  <div class="footer">
    <p>Gracias por tu compra · Tienda RD · República Dominicana</p>
    <p style="margin-top:4px">Este documento es una factura de compra. Para devoluciones contacta a soporte.</p>
  </div>

  <div class="no-print" style="text-align:center;margin-top:40px">
    <button onclick="window.print()"
      style="padding:12px 32px;background:#dc2626;color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer">
      Imprimir / Guardar PDF
    </button>
  </div>
</body>
</html>`

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  })
}
```

- [ ] **Step 2: Typecheck**

```bash
npx tsc --noEmit 2>&1 | head -30
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/orders/\[id\]/invoice/route.ts
git commit -m "feat: invoice API route — auth-gated HTML invoice for paid orders"
```

---

## Task 10: Verification + Final Commit

**Files:** None new — only verification and git push.

- [ ] **Step 1: Run ESLint**

```bash
cd SOFTWARE_DEVELOPMENT_PROJECTS/tienda-ropa-online
npm run lint
```

Expected: No errors. If there are unused import warnings in modified files, fix them.

- [ ] **Step 2: Run TypeScript check**

```bash
npm run typecheck
```

Expected: `Process finished with exit code 0` (no output = success).

- [ ] **Step 3: Run build**

```bash
npm run build
```

Expected: Build completes with no type errors. Ignore non-critical warnings about static generation.

- [ ] **Step 4: Manual mobile test checklist**

Open the dev server: `npm run dev`

Test on 375px viewport (Chrome DevTools → iPhone 12/13):

1. Go to `/checkout/exito/[some-bank-transfer-order-id]`
   - [ ] Padding is comfortable (not squished on 375px)
   - [ ] Clock icon (amber) shown instead of green CheckCircle
   - [ ] "Pedido creado!" + "Pendiente de comprobante" badge visible
   - [ ] Bank cards expand with account number wrapping correctly (no overflow)
   - [ ] Copy button stays visible, doesn't push content out of viewport
   - [ ] Reference box shows monto + referencia read-only
   - [ ] Form has only: notes + file upload + submit button
   - [ ] Submit button is disabled until bank selected AND file chosen

2. Go to `/perfil/pedidos/[order-id]` for a bank transfer order:
   - [ ] Transfer status section visible
   - [ ] No misleading "confirmed" tracking bar shown while pending
   - [ ] Invoice button visible only when `payment_status = paid`

3. Go to `/admin/ordenes/[order-id]` for an order with a proof:
   - [ ] Expected vs reported amount comparison shown in VoucherReview

4. Go to `/api/orders/[id]/invoice` for a paid order:
   - [ ] HTML invoice renders in browser
   - [ ] Print button visible and functional

- [ ] **Step 5: Push to origin**

```bash
git push origin main
```

---

## Self-Review Checklist

**Spec coverage:**

| Req | Task |
|-----|------|
| 1. Responsividad mobile-first | Tasks 4, 5 |
| 2. Cuentas bancarias desde Supabase | Tasks 1, 2, 3, 4 |
| 3. Selección de banco + referencia automática | Tasks 4, 6 |
| 4. Estado real pendiente hasta aprobación | Tasks 5, 7 |
| 5. Factura descargable tras aprobación | Tasks 9, 7 |
| 6. Admin — monto esperado en VoucherReview | Task 8 |
| 7. Seguridad y validación | Task 6 (server action hardening) |
| 8. Verificación lint/typecheck/build | Task 10 |
| 9. git commit + push | Tasks 1–10 (each commits) + Task 10 pushes |

**Type consistency:** `BankAccount` defined in Task 2, used in Tasks 3, 4, 5. `getActiveBankAccounts` returns `BankAccount[]`, accepted as `bankAccounts: BankAccount[]` prop. `getOrderPaymentProofs` return type matches usage in Task 7. `orderTotal: number` prop added in Task 8 matches `total: number` variable in admin page.

**Security:** Reference number and amount are generated server-side in `uploadVoucher` (Task 6). Client only sends `order_id`, `bank_account_id`, file, notes. RLS policies enforce ownership at DB level. Invoice route checks auth + `payment_status === 'paid'`. No signed URLs are exposed without auth.
