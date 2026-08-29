# Guía de Contribución

¡Gracias por tu interés en contribuir a LibreDrop! Este documento te guía a través del proceso de contribución.

## Cómo contribuir

1. **Haz un fork** del repositorio y clónalo localmente.
2. **Crea una rama** con un nombre descriptivo:
   ```bash
   git checkout -b feature/nueva-funcionalidad
   git checkout -b fix/correccion-de-bug
   ```
3. **Realiza tus cambios** siguiendo el estilo del proyecto.
4. **Añade tests** para las funcionalidades nuevas o corregidas.
5. **Verifica que pasen los tests** y linters (ver abajo).
6. **Haz un commit** con un mensaje claro y descriptivo.
7. **Abre un pull request** (PR) describiendo los cambios y su motivación.

## Buenas prácticas

- Mantén los commits pequeños y con un solo propósito.
- Escribe mensajes de commit en imperativo (ej.: "add jwt auth").
- No incluyas secretos ni credenciales en el código ni en los commits.
- Documenta los cambios relevantes en `VERSIONS.md`.
- Comenta con libreros solo cuando aporte claridad.

## Entorno de desarrollo

```bash
cd backend
python -m venv .venv
source .venv/bin/activate   # Linux/Mac
# .venv\Scripts\activate    # Windows
pip install -r requirements.txt
cp .env.example .env
python manage.py migrate
python manage.py runserver
```

## Tests

Ejecuta la suite de tests del backend:

```bash
python manage.py test
```

Añade tests para cualquier cambio de comportamiento. Los tests deben ubicarse en el archivo `tests.py` de la app correspondiente.

## Reportar errores

Para reportar un bug o solicitar una feature, abre un issue en GitHub con la mayor cantidad de contexto posible:

- Pasos para reproducir el problema.
- Resultado esperado vs. obtenido.
- Versión, sistema operativo y navegador si aplica.
- Capturas de pantalla o logs relevantes.

## Código de conducta

Sé respetuoso e inclusivo. Las contribuciones deben mantener un ambiente colaborativo y agradable para todos.
