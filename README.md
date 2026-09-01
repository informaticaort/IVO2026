# IVO2026 — Sala de Escape "IA Fuera de Control"

App Next.js con 5 juegos (CIDI, AMI, HMP, CEO, LUM) y un **backoffice de monitoreo
en tiempo real** para ver en qué vista está trabajando cada grupo.

## Monitoreo en tiempo real (host local)

El monitoreo corre **en una sola máquina** (el host del evento), sin base de datos
ni internet: el estado de los grupos vive en memoria del proceso.

- Cada grupo, al navegar entre juegos, reporta su ubicación (heartbeat cada 5s).
- El panel `/admin` consulta el estado cada 2s y lo muestra agrupado por juego,
  con foto del equipo, tiempo en sala y orden/filtros.
- Si un grupo cierra la pestaña o se desconecta, desaparece del panel
  (al instante por aviso de cierre, o a más tardar en ~15s por vencimiento).

### Correr en el evento

1. Instalar dependencias (una sola vez):
   ```bash
   npm install
   ```
2. Compilar y arrancar (build de producción, recomendado para el evento):
   ```bash
   npm run build
   npm run start:lan       # expone el server en la red local (0.0.0.0:3000)
   ```
   Para desarrollo/pruebas: `npm run dev:lan`.

3. **Grupos** (tablets/celulares/PCs en la misma red): entran a
   `http://<IP-DEL-HOST>:3000`
   (la IP local del host; en Windows: `ipconfig` → "Dirección IPv4").

4. **Administrador**: `http://localhost:3000/admin` en la misma máquina,
   o `http://<IP-DEL-HOST>:3000/admin` desde otra.

> **Firewall (Windows):** la primera vez, permitir el acceso de Node en redes
> privadas para que los dispositivos de la LAN puedan conectarse al puerto 3000.

### Clave del panel (`/admin`)

El panel se protege con una clave para que los alumnos no vean el monitoreo.
La clave del evento es **`LRDL`** y ya viene configurada: al entrar a `/admin`
aparece la pantalla de acceso y se tipea ahí.

La clave queda **recordada en ese navegador** (localStorage), así que después
alcanza con entrar a `/admin`. También se puede pasar por URL:
`http://<host>:3000/admin?key=LRDL`. No distingue mayúsculas de minúsculas.

Para usar otra clave, copiar `.env.example` a `.env.local` y completar
`ADMIN_KEY`. Next carga `.env.local` automáticamente tanto en `dev` como en
`start` (no se commitea). El valor por defecto está en
[lib/presence/admin-key.ts](lib/presence/admin-key.ts).

### Cuenta regresiva de entrada

Todo el proyecto está detrás de una cuenta regresiva que termina el
**02/09/2026 a las 09:20** ([components/gate/countdown-gate.tsx](components/gate/countdown-gate.tsx)).
Antes de esa hora se entra con la clave **`superclave`**, que también queda
recordada en el navegador. Al llegar a cero la pantalla se desbloquea sola.

### Ajustes finos (opcional)

En [lib/presence/types.ts](lib/presence/types.ts):
- `HEARTBEAT_INTERVAL_MS` (5s) — cada cuánto cada grupo reporta.
- `PRESENCE_TTL_MS` (15s) — cuánto tarda en limpiarse un grupo sin heartbeat.
