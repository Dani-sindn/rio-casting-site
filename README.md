# Rio Casting — sitio web

> **Versiones:** la raíz es la versión vigente (v3): el logo como pieza 3D girada sobre una pared, con marco de bronce gastado y bisel, y el interior con la forma exacta del logo, que se llena de metal fundido por una entrada arriba del palo de la R. `v2/` guarda el hero anterior (logo oscuro con la barra que se llena) y `v1/` la primera propuesta; ambas como referencia, no indexadas. `v3/` solo redirige a la raíz.

Landing en inglés para Rio Casting (casting de metales en Nueva York para clientes en todo el mundo). Es un sitio estático, sin build: `index.html`, `styles.css`, `main.js` y `config.js`.

## Marca

- Logo recreado en vector desde el arte oficial (coincide ~98,5 % con la referencia): `assets/rio-logo.svg` (versión para fondo claro) y `assets/rio-logo-white.svg` (para fondo oscuro), con el nombre "RÍO CASTING INC." y "CREATION WITHOUT LIMITS"; el símbolo solo está en `assets/rio-mark.svg` / `assets/rio-mark-white.svg`. La barra del logo va en el naranja de la marca, `#FF6B0F`, en todas las versiones.
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
- **Precios en vivo (Kitco):** el Metal desk muestra las gráficas oficiales de 24 h de Kitco (oro, plata, platino, paladio), que Kitco ofrece gratis como imágenes en kitconet.com/price con la condición de enlazar a `www.kitco.com/connecting.html`. Kitco no ofrece los números como datos (no hay API pública); para eso haría falta una licencia de datos con Kitco. El sitio recarga las imágenes cada minuto.
- **Valores de referencia:** la tabla por kilate, el estimador, el precio del menú y los precios de la biblioteca se calculan con `api.gold-api.com` (gratis, sin key, sin SLA), cada 60 s, y están rotulados como referencia. Si falla, se usan los últimos precios guardados en el navegador.

## Secciones

1. Hero: video del vertido de metal sobre el molde del logo (`assets/video/`), a la derecha del texto en escritorio y arriba en móvil. Sus bordes se funden con el fondo para no quedar bajo el texto, y se desvanece en el último segundo antes de reiniciarse, así el loop no corta. Es el segundo video del cliente ("Rio casting video hero 2", 8,6 s): se recortaron las franjas negras laterales y se muestra entero, del tamaño que cabe a la derecha del texto, para que la R completa quede siempre a la vista (en móvil, arriba del texto). Se sirve en 1600 px (1,9 MB) o 960 px en móvil (0,6 MB), sin audio y con imagen de póster mientras carga. El hero queda fijo y el resto de la página sube encima como una cortina.
2. The Rio Standard (antes "Our principle"): texto grande y de peso que se revela palabra por palabra con el scroll; al lado, la joya en línea SVG cambia de forma y de metal en un loop propio (sin etiquetas).
3. (Se eliminaron la franja de datos y la marquesina; esa info se repite más abajo.)
4. Our Advantage (antes "Capabilities"): 4 cards con íconos propios y hover (Metal Casting, CAD Design + 3D Printing, Laser Scanning & Engraving, Finishing). Cada card muestra un extracto y un enlace "See more" que abre la card completa (subtítulo, textos y "Our Capabilities") en un modal (`<dialog>`, se cierra con la X, Esc o tocando fuera).
5. Material library ("We can cast any precious & non-precious metal."): cuadrícula de 13 metales (Gold, Platinum, Sterling Silver, Palladium, Brass, Bronze, White Metal, Aluminum, Steel, Copper, Cobalt, Thai Gold, Gunmetal) más una celda "Another alloy? Ask us". Al elegir uno se muestra su ficha debajo (descripción, datos y precio spot si aplica). Los datos de cada metal están en `METALS` dentro de `main.js`.
6. Metal desk: gráficas en vivo de Kitco (en móvil se deslizan de lado), oro por kilate y estimador de metal (cera → metal → valor) como valores de referencia.
7. Cierre (Worldwide · Start a project): una sola sección con el globo animado de rutas desde NYC detrás, el texto de Worldwide, los datos de contacto y un formulario solo de contacto (nombre, empresa, email, teléfono y mensaje opcional). La sección "How it works" se eliminó.
8. Footer.

No incluye fotos de joyas, por decisión de producto. El hero usa el video propio del cliente; el resto de las imágenes son generativas (CSS, SVG y canvas), sin fotos de stock.

## Por confirmar con el cliente

- Teléfono: el mockup dice "212-7640-7674"; se usó 212-764-7674.
- Si el oro 100% reciclado y el white metal siguen vigentes.
- Fichas de metales nuevos (Aluminum, Steel, Copper, Cobalt, Thai Gold, Gunmetal): textos y datos de referencia redactados para la web; conviene que el cliente los revise. "Thai Gold" se interpretó como oro tailandés 23K (96,5 %).
- Las fotos reales del taller y del equipo, si se quieren agregar más adelante.

## Rendimiento

- **Hero (video):** H.264 sin audio, comprimido para web (1,9 MB escritorio / 0,6 MB móvil). Se pausa cuando el hero queda tapado o la pestaña está oculta. Con "reducir movimiento" o ahorro de datos se muestra solo el póster. El hero 3D anterior (WebGL) queda en el historial de git y en `v2/`.
- **Globo y joya SVG:** 30 fps. La geometría se calcula una sola vez y solo se animan mientras están en pantalla.
- **Gama baja / ahorro de datos / "reducir movimiento":** las animaciones se muestran como imagen fija.
- **Scroll:** un único listener agrupado por frame. Se quitaron las animaciones CSS infinitas que repintaban y los `backdrop-filter` sobre el canvas.
- **Carga:** scripts con `defer`, fuentes recortadas a los pesos usados y versiones `?v=` en CSS/JS para invalidar caché al publicar.
