<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1zH8UuihubhDXz29H0MWHLLBzYF_TEBOu

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. (Opcional) Define `VITE_API_URL` para apuntar al backend (por defecto `http://localhost:4000`).
4. En una terminal inicia el backend persistente (guarda Pesos y Escalas en `./data/logistics.json`):
   `npm run server`
5. En otra terminal ejecuta el frontend:
   `npm run dev`

## Ejecutar con Docker

Se incluyó una orquestación mínima que levanta el frontend en NGINX y un backend Node con almacenamiento persistente en disco (montado como volumen).

```bash
docker-compose up --build
```

- Frontend: http://localhost:4173
- Backend: http://localhost:4000 (expuesto) y accesible desde el frontend vía `/api` gracias al proxy NGINX.
- Los datos de Logística se guardan en `./data/logistics.json` (montado como volumen en el contenedor), por lo que quedan persistidos en tu PC entre reinicios.
