# Rio Casting — sitio web

> **Versiones:** la raíz es la versión vigente (v3): el logo como pieza 3D girada sobre una pared, con marco de bronce gastado y bisel, y el interior con la forma exacta del logo, que se llena de metal fundido por una entrada arriba del palo de la R. `v2/` guarda el hero anterior (logo oscuro con la barra que se llena) y `v1/` la primera propuesta; ambas como referencia, no indexadas. `v3/` solo redirige a la raíz.

Landing en inglés para Rio Casting (casting de metales en Nueva York para clientes en todo el mundo). Es un sitio estático, sin build: `index.html`, `styles.css`, `main.js` y `config.js`.

## Marca

- Logo recreado en vector desde el arte oficial (coincide ~98,5 % con la referencia): `assets/rio-logo.svg` (versión para fondo claro) y `assets/rio-logo-white.svg` (para fondo oscuro), con el nombre "RÍO CASTING INC." y "CREATION WITHOUT LIMITS"; el símbolo solo está en `assets/rio-mark.svg` / `assets/rio-mark-white.svg`. El azul de la barra es `#04448A` (en fondos oscuros se usa el tono más claro `#3D74D1`).
- Los textos del logo usan **Jost**, la alternativa abierta más cercana a la letra del logo (estilo Futura). Si el cliente tiene la fuente original o el logo en curvas, conviene reemplazar esos textos.
- Tipografía del sitio: **Jost** para titulares, etiquetas y marca; Geist para textos; Geist Mono para datos y precios.

## Ver en local

```bash
python3 -m http.server 4180
```

Abrir http://localhost:4180. Se necesita un servidor (no `file://`) para que carguen los precios en vivo.

## Editar datos del negocio

Todo está en `config.js`: dirección, teléfono, email y el feed de precios.

- **Formulario:** por ahora no envía nada; al pulsar "Send request" muestra una nota con el teléfono y el email. El envío real queda para la siguiente entrega.
- **Precios:** vienen de `api.gold-api.com` (gratis, sin key, sin SLA) y se refrescan cada 60 s. Si falla, se muestran los últimos precios guardados en el navegador, marcados como "last known". Para producción conviene un proveedor con SLA (Metals-API, GoldAPI.io, etc.).

## Secciones

1. Hero (WebGL): el logo (versión oficial con dos astas, R y barra) como pieza 3D en perspectiva, montada sobre una pared con sombra suave. Un chorro de metal entra por la abertura superior y llena el interior del logo, en loop: 18K Yellow Gold → 18K Rose Gold → Platinum 950 → Sterling Silver. La geometría sale de un campo de distancia del logo oficial, así que los bordes se ven nítidos a cualquier tamaño. El hero queda fijo y el resto de la página sube encima como una cortina.
2. The Rio Standard (antes "Our principle"): el texto se revela palabra por palabra con el scroll; la joya en línea SVG cambia de forma y de metal en un loop propio (solitario → colgante → aro → brazalete → brillante).
3. (Se eliminaron la franja de datos y la marquesina; esa info se repite más abajo.)
4. Our Advantage (antes "Capabilities"): 4 cards con íconos propios y hover (Metal Casting, CAD Design + 3D Printing, Scan & Engraving, Finishing).
5. Material library: ficha interactiva por metal con su precio spot.
6. Metal desk: precios en vivo (oz / g / dwt / kg), oro por kilate y estimador de metal (cera → metal → valor).
7. Proceso en 4 pasos.
8. Worldwide: globo animado con rutas desde NYC.
10. Formulario "Start a project".
11. Contacto y footer.

No incluye fotos de joyas, por decisión de producto. Las imágenes son generativas (shader, CSS y canvas), así que no hay fotos de stock.

## Por confirmar con el cliente

- Teléfono: el mockup dice "212-7640-7674"; se usó 212-764-7674.
- Si el oro 100% reciclado y el white metal siguen vigentes.
- Las fotos reales del taller y del equipo, si se quieren agregar más adelante.

## Rendimiento

- **Hero (WebGL):** renderiza a un presupuesto fijo de píxeles (~380k en escritorio, ~200k en móvil, ~120k en equipos de gama baja) y el navegador lo escala. Va a 30 fps, usa la GPU de bajo consumo y se detiene cuando el hero queda tapado o la pestaña está oculta. Si detecta frames lentos, baja la resolución sola.
- **Globo y joya SVG:** 30 fps. La geometría se calcula una sola vez y solo se animan mientras están en pantalla.
- **Gama baja / ahorro de datos / "reducir movimiento":** las animaciones se muestran como imagen fija.
- **Scroll:** un único listener agrupado por frame. Se quitaron las animaciones CSS infinitas que repintaban y los `backdrop-filter` sobre el canvas.
- **Carga:** scripts con `defer`, fuentes recortadas a los pesos usados y versiones `?v=` en CSS/JS para invalidar caché al publicar.
