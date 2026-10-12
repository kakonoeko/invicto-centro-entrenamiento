# Invicto · Demo de reservas

La web existente mantiene su logo, fotografías, negro y dorado, contenidos y tarifas. Los accesos desde la portada abren la nueva experiencia de reservas.

## Probar

- Abrir `reservas.html` en un servidor web o en la versión publicada en GitHub Pages o Sites.
- Elegir Fuerza, Boxeo sin contacto o Bajo impacto. Elegir duración, fecha y hora.
- Completar con datos ficticios, por ejemplo Alex Demo y alex@example.com.
- Confirmar y consultar Mis reservas o Agenda del centro.
- Elegir Sesión individual, Bono de 8 sesiones o Cuota mensual para pasar al pago simulado. Los importes son de ejemplo.
- En el pago, probar el resultado aprobado o rechazado. La plaza se retiene 5 minutos, y un rechazo, cancelación o caducidad la libera.
- En Pagos y bonos, consultar importes simulados, comprobantes y créditos restantes. Con el mismo correo y duración, elegir Usar mi bono de demo para consumir una sesión.
- Cancelar, restaurar una reserva, marcar asistencia o descargar la agenda del día en CSV.
- Usar Reiniciar datos de prueba para empezar de cero.

La reserva descuenta una plaza de un aforo de seis personas. Una cancelación la devuelve. No se pueden reservar sesiones completas, pasadas, duplicadas o que coincidan con otra reserva del mismo correo.

## Qué está simulado

Los horarios, entrenadores, asistentes, reservas, pagos y bonos son de demostración. Se guardan en localStorage del navegador. Stripe no está conectado, ni siquiera en su modo de prueba. No se solicitan datos bancarios ni se realiza ningún cobro. No hay base de datos compartida, cuentas de usuario, autenticación de gestión, correos, WhatsApp automático ni conexión con Google Calendar. El archivo ICS descargado se importa manualmente al calendario y está marcado como DEMO. GitHub Pages es público: cualquiera puede abrir la agenda de demostración. La copia publicada en Sites mantiene su acceso privado. Ninguna de las dos debe contener datos de clientes reales.

Los pagos aprobados confirman la reserva y generan un comprobante sin validez fiscal. Los bonos incluyen 8 créditos de 30 o 60 minutos, usan uno para la reserva inicial y caducan a los 90 días de ejemplo. La cuota mensual incluye 8 créditos durante 30 días, sin renovación automática. Cancelar una sesión individual simula un reembolso; cancelar una sesión de bono o cuota devuelve un crédito, sin devolver el importe de la compra. Una reserva reembolsada requiere otro pago simulado para reservar de nuevo. Los pagos completados son idempotentes: volver a pulsar o recargar no crea otro cargo de prueba.

La disponibilidad corresponde a cuatro semanas desde la fecha actual en Europe/Madrid. Se generan clases de lunes a sábado. Los cambios se reflejan entre pestañas del mismo navegador; no hay sincronización entre dispositivos ni control de aforo real.

Los botones de WhatsApp del contacto siguen abriendo el chat real de Invicto. No se envía ningún mensaje automáticamente.

## Archivos

La raíz del repositorio contiene la web estática completa, lista para GitHub Pages y cualquier hosting estático. No requiere instalación ni compilación. Para una vista previa local desde la raíz del repositorio, usar un servidor estático (por ejemplo `python -m http.server 8000`) y abrir `http://localhost:8000`. Los módulos JavaScript requieren HTTP; abrir el archivo directamente desde el disco no ejecutará el flujo de reservas.

`check-booking.mjs` verifica las reglas de reserva con `node check-booking.mjs`. `check-payments.mjs` verifica retención, expiración, rechazo, reintento, idempotencia, reembolso, créditos y migración de reservas anteriores con `node check-payments.mjs`. `booking-model.js` separa el modelo de la interfaz para facilitar la futura conexión a un backend.

## Para convertirlo en un sistema real

Conectar el modelo a una API con almacenamiento compartido y transacciones de aforo; añadir acceso de socios y autorización para gestión; configurar los horarios reales, políticas y bonos; incorporar confirmaciones y protección de los datos de clientes. La demo no debe utilizarse para gestionar reservas reales.

## Publicación y sincronización

Web pública: https://kakonoeko.github.io/invicto-centro-entrenamiento/

Reservas: https://kakonoeko.github.io/invicto-centro-entrenamiento/reservas.html

GitHub Pages publica desde la rama `main`, carpeta raíz. `.nojekyll` sirve los archivos estáticos sin procesarlos con Jekyll. No se necesita compilación ni instalación de dependencias.

Esta versión se ha copiado del proyecto de Sites, revisión `0a4572c40cd97a589ca8727aebce6febd2eee99a`. Los cambios futuros en Sites no se copian automáticamente a GitHub: hay que volver a sincronizarlos. No se incluyen la configuración privada del alojamiento, credenciales ni datos guardados en el navegador.
