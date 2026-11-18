# 🔥 Global Flame - Game Deals Platform
Plataforma web enfocada en videojuegos que permite a los usuarios descubrir títulos, consultar ofertas y filtrar precios reales en Pesos Colombianos (COP). 

---

## 🛠️ 1. Requisitos Previos (Software y Hardware)
Para compilar y ejecutar esta plataforma en un entorno local, asegúrate de tener instaladas las siguientes herramientas:

- **Lenguaje/Entorno:** Node.js (v18.0 o superior) y npm.
- **Base de Datos:** PostgreSQL (v14 o superior) para el almacenamiento del catálogo local y caché.
- **Frontend:** Navegador web moderno (Chrome, Edge o Firefox).
- **Herramientas de Control:** Git.

---

## 🚀 2. Pasos Secuenciales para Configuración y Despliegue

Sigue estos pasos para ejecutar el proyecto de forma local:

**Paso 1: Clonar el Repositorio**
Abre tu terminal y ejecuta:
`git clone [URL_del_repositorio]`
`cd global-flame`

**Paso 2: Instalar Dependencias**
Ejecuta el gestor de paquetes de Node para instalar las librerías necesarias del backend (Express, pg, cors, dotenv):
`npm install`

**Paso 3: Configurar Variables de Entorno**
1. Crea un archivo llamado `.env` en la raíz del proyecto.
2. Configura las siguientes variables de acceso a tu base de datos y puertos:
`PORT=3000`
`DB_USER=tu_usuario_postgres`
`DB_PASSWORD=tu_contraseña`
`DB_HOST=localhost`
`DB_PORT=5432`
`DB_NAME=global_flame_db`

**Paso 4: Inicializar la Base de Datos**
Ejecuta el script SQL incluido en la carpeta `/database` para crear las tablas de usuarios y catálogo:
`psql -U postgres -d global_flame_db -f ./database/init.sql`

**Paso 5: Ejecutar la Aplicación**
Inicia el servidor backend:
`npm start`
*El servidor indicará: "Servidor corriendo en http://localhost:3000"*

**Paso 6: Acceso al Frontend**
Abre tu navegador y dirígete a `http://localhost:3000` o simplemente abre el archivo `index.html` de la carpeta frontend.

---

## 🔑 3. Credenciales de Acceso de Prueba

Para probar el rol de usuario estándar (guardar favoritos y visualizar ofertas en COP), utiliza las siguientes credenciales en la pantalla de inicio de sesión:

- **Rol:** Usuario (Gamer)
- **Correo electrónico:** `prueba@globalflame.com`
- **Contraseña:** `Scrum2026*`

*(Nota: Este usuario ya cuenta con 3 juegos en su lista de favoritos para probar la alerta de precios).*
