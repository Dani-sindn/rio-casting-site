# Rio Casting — sitio web

Landing en inglés para Rio Casting (casting de metales en Nueva York para clientes en todo el mundo). Es un sitio estático, sin build: `index.html`, `styles.css`, `main.js` y `config.js`.

## Ver en local

```bash
python3 -m http.server 4180
```

Abrir http://localhost:4180. Se necesita un servidor (no `file://`) para que carguen los precios en vivo.

## Editar datos del negocio

Todo está en `config.js`: dirección, teléfono, email, el feed de precios y el endpoint del formulario.

- **Formulario:** con `form.endpoint` vacío abre el email del visitante con la solicitud prellenada. Para recibirla directo, poner una URL (Formspree, Basin, API propia) que acepte POST JSON.
- **Precios:** vienen de `api.gold-api.com` (gratis, sin key, sin SLA) y se refrescan cada 60 s. Si falla, se muestran los últimos precios guardados en el navegador, marcados como "last known". Para producción conviene un proveedor con SLA (Metals-API, GoldAPI.io, etc.).

## Secciones

1. Hero con metal líquido en WebGL; el visitante cambia el metal (molten, oro amarillo, rosa, blanco, platino, plata, bronce). El hero queda fijo y el resto de la página sube encima como una cortina.
2. Our principle (scrollytelling): con el scroll, el texto se va "vertiendo" palabra por palabra y una joya en línea SVG cambia de forma (solitario → colgante → aro → brazalete → brillante) y de metal.
3. (Se eliminaron la franja de datos y la marquesina; esa info se repite más abajo.)
4. Capabilities: casting, CAD, impresión 3D castable, acabado.
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
