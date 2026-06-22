import InfoPage from '@/components/layout/InfoPage'

export const metadata = { title: 'Términos y condiciones | Cora Mely' }

export default function TerminosPage() {
  return (
    <InfoPage title="Términos y condiciones" subtitle="Última actualización: abril 2026">
      <h2>1. Sobre nosotros</h2>
      <p>Cora Mely es una tienda online de decoración artesanal hecha a mano, operada en República Dominicana. Al usar este sitio aceptas estos términos.</p>

      <h2>2. Cuenta</h2>
      <ul>
        <li>Eres responsable de mantener tu contraseña segura.</li>
        <li>Debes proporcionar datos verídicos al registrarte.</li>
        <li>Una persona, una cuenta. Las cuentas duplicadas pueden ser suspendidas.</li>
      </ul>

      <h2>3. Compras y pagos</h2>
      <ul>
        <li>Los precios están en pesos dominicanos (DOP) e incluyen los impuestos aplicables.</li>
        <li>Aceptamos tarjeta vía Stripe, PayPal, transferencia bancaria y pago contra entrega.</li>
        <li>Podemos rechazar o cancelar un pedido si detectamos fraude o error de precio.</li>
      </ul>

      <h2>4. Envíos</h2>
      <p>Los tiempos y tarifas se detallan en la página de Información de envío. No nos hacemos responsables por demoras de los couriers.</p>

      <h2>5. Cupones</h2>
      <ul>
        <li>Los cupones tienen vigencia limitada y pueden tener mínimo de compra.</li>
        <li>Un cupón por orden, salvo que se indique lo contrario.</li>
        <li>No son canjeables por dinero.</li>
      </ul>

      <h2>6. Propiedad intelectual</h2>
      <p>Todo el contenido del sitio (textos, imágenes, marca) pertenece a Cora Mely o a sus licenciantes. Está prohibido reproducirlo sin autorización.</p>

      <h2>7. Limitación de responsabilidad</h2>
      <p>El sitio se ofrece tal cual. No garantizamos disponibilidad continua ni que esté libre de errores.</p>

      <h2>8. Cambios</h2>
      <p>Podemos actualizar estos términos. La versión vigente es la publicada en esta página.</p>
    </InfoPage>
  )
}
