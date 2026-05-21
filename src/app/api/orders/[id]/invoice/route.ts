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
