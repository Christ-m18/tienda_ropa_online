import InfoPage from '@/components/layout/InfoPage'

export const metadata = { title: 'Política de privacidad | Cora Mely' }

export default function PrivacidadPage() {
  return (
    <InfoPage title="Política de privacidad" subtitle="Tus datos son tuyos. Aquí explicamos qué guardamos y por qué.">
      <h2>1. Qué datos recopilamos</h2>
      <ul>
        <li>Nombre, correo y teléfono al registrarte.</li>
        <li>Direcciones de envío que tú añadas.</li>
        <li>Historial de pedidos y reseñas que publiques.</li>
        <li>Datos técnicos básicos para seguridad y prevención de fraude.</li>
      </ul>

      <h2>2. Para qué los usamos</h2>
      <ul>
        <li>Procesar tus pedidos y entregártelos.</li>
        <li>Notificarte sobre el estado de tus compras.</li>
        <li>Atender consultas y devoluciones.</li>
        <li>Mejorar el catálogo y las recomendaciones.</li>
      </ul>

      <h2>3. Con quién los compartimos</h2>
      <ul>
        <li>Couriers de envío para entregarte el pedido.</li>
        <li>Procesadores de pago (Stripe, PayPal) cuando elijas tarjeta.</li>
        <li>Supabase, nuestro proveedor de base de datos y autenticación.</li>
        <li>No vendemos tus datos a terceros.</li>
      </ul>

      <h2>4. Cookies</h2>
      <p>Usamos cookies para mantener tu sesión y guardar tu carrito. No usamos cookies de seguimiento publicitario.</p>

      <h2>5. Tus derechos</h2>
      <p>Puedes pedirnos en cualquier momento que actualicemos o borremos tus datos escribiendo a hola@coramely.do.</p>

      <h2>6. Seguridad</h2>
      <p>Aplicamos cifrado en tránsito (HTTPS) y políticas de acceso fila por fila en la base de datos.</p>

      <h2>7. Contacto</h2>
      <p>Si tienes dudas sobre privacidad escríbenos a hola@coramely.do.</p>
    </InfoPage>
  )
}
