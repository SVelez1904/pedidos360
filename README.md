# Pedidos360 - Frontend Angular 18+

Frontend empresarial para el sistema de gestión y trazabilidad de pedidos **Pedidos360**, diseñado para integrarse con la arquitectura de microservicios **Spring Boot 3+ / Java 21**, **AWS API Gateway**, **Microsoft Entra ID (Azure AD)**, **RabbitMQ** y **Apache Kafka**.

---

## Características Principales

- **Arquitectura Angular 18+ Moderna**:
  - Componentes Standalone (100% libre de NgModules obsoletos).
  - Reactividad nativa con **Angular Signals** (`signal()`, `computed()`).
  - Control Flow declarativo de Angular 18 (`@if`, `@for`, `@switch`).
  - Carga diferida (**Lazy Loading**) por rutas en `app.routes.ts`.
  - Formularios reactivos tipados (**Typed Reactive Forms**).

- **Seguridad Empresarial & Azure AD**:
  - Integración nativa con **MSAL Angular** (`@azure/msal-angular`, `@azure/msal-browser`).
  - `JwtInterceptor`: Inyección automática de tokens Bearer JWT en solicitudes salientes.
  - `AuthGuard` y `RoleGuard`: Protección estricta de rutas según roles (`Admin`, `Operator`, `Customer`).
  - Selector interactivo de simulación de roles para pruebas en modo desarrollo.

- **Diseño UI/UX Profesional**:
  - Estilizado con **Tailwind CSS**, paleta de colores limpia y tipografía corporativa de alto contraste.
  - Formateo de moneda en Pesos Chilenos (**CLP**) con separador de miles.
  - Estados de carga con **Skeleton Loaders** y estados vacíos informativos (**Empty State**).
  - Sistema reactivo de notificaciones (**Toasts**) para feedback inmediato de acciones y errores HTTP.

- **Módulos Funcionales**:
  1. **Dashboard Multirrol**:
     - *Admin*: KPIs de ventas totales, ticket promedio, lead time operacional y gráficos de tendencia.
     - *Operator*: Pipeline activo de preparación, pedidos pendientes y alertas de quiebre de stock.
     - *Customer*: Resumen de pedidos recientes y acceso rápido a compra.
  2. **Gestión de Pedidos (`/orders`)**:
     - Listado con filtros por estado, búsqueda por número de pedido/cliente y rangos de fecha.
     - Creación de pedidos con selector dinámico de catálogo, control de stock y cálculo de impuestos (IVA 19%).
     - Detalle del pedido (`/orders/:id`) con trazabilidad completa de 5 fases y transiciones de estado según rol.
  3. **Catálogo e Inventario (`/catalog`)**:
     - Filtros por categoría y nivel de disponibilidad (Normal, Stock Bajo, Agotado).
     - Creación y edición de productos con validaciones de formulario.
     - Ajuste rápido de inventario físico mediante ventana modal.
  4. **Reportería & Business Intelligence (`/reports`)**:
     - Métricas avanzadas, distribución porcentual del pipeline, lead time por etapa y ranking de productos.
     - Exportación de reportes en formato **CSV** y **JSON**.
  5. **Auditoría & Trazabilidad (`/audit`)**:
     - Registro cronológico de eventos inmutables provenientes de Kafka/RabbitMQ con filtros avanzados.

---

## Estructura del Código

```
src/
├── app/
│   ├── core/                    # Servicios troncales y seguridad
│   │   ├── auth/                # MSAL, AuthService y configuración Azure AD
│   │   ├── guards/              # authGuard y roleGuard
│   │   ├── interceptors/        # jwtInterceptor y errorInterceptor
│   │   ├── models/              # Interfaces TypeScript de DTOs
│   │   └── services/            # Orders, Catalog, Reports, Audit, Notification
│   ├── features/                # Módulos y vistas de negocio
│   │   ├── auth/                # Login y Auth Callback
│   │   ├── dashboard/           # Dashboard interactivo multirrol
│   │   ├── orders/              # Listado, Creación y Detalle de Pedidos
│   │   ├── catalog/             # Catálogo, formulario de producto y ajuste de stock
│   │   ├── reports/             # Métricas avanzadas y exportación de datos
│   │   └── audit/               # Registro de auditoría y eventos
│   ├── layout/                  # Shell visual (Header, Sidebar, MainLayout)
│   └── shared/                  # Componentes reutilizables y Pipes
│       ├── components/          # Badge, KpiCard, EmptyState, Skeleton, Toast
│       └── pipes/               # ClpCurrency, OrderStatus, TimeAgo
├── environments/                # Variables de entorno (Desarrollo y Producción)
├── index.html                   # Entrypoint HTML
├── main.ts                      # Bootstrap de Angular Application
└── styles.css                   # Configuración y capas de Tailwind CSS
```

---

## Requisitos Previos

- **Node.js**: v18.19.0 o v20+
- **npm**: v9+

---

## Instrucciones de Instalación y Ejecución

### 1. Clonar el repositorio e instalar dependencias
```bash
git clone <url-del-repositorio>
cd pedidos360-frontend
npm install
```

### 2. Iniciar el servidor de desarrollo
```bash
npm start
# o alternativamente:
npm run dev
```
La aplicación estará disponible en `http://localhost:3000`.

### 3. Compilación para Producción
```bash
npm run build
```
Los artefactos optimizados se generarán en el directorio `dist/`.

### 4. Ejecución de Pruebas Unitarias
```bash
npm run lint
```

---

## Despliegue con Docker

El proyecto cuenta con un `Dockerfile` multi-etapa optimizado con **Nginx Alpine**:

### Construir la imagen Docker:
```bash
docker build -t pedidos360-frontend:latest .
```

### Ejecutar el contenedor:
```bash
docker run -d -p 80:80 \
  -e API_GATEWAY_URL="http://api-gateway:8080/api/" \
  --name pedidos360-frontend \
  pedidos360-frontend:latest
```

### Despliegue mediante Docker Compose:
```bash
docker-compose up -d
```

---

## Configuración de Variables de Entorno

Configuradas en `src/environments/environment.ts`:

| Variable | Descripción | Valor por Defecto |
| :--- | :--- | :--- |
| `production` | Indica si el entorno es productivo | `false` |
| `apiUrl` | URL base del API Gateway de Spring Boot | `http://localhost:8080/api` |
| `enableMockFallback` | Permite alternar entre llamadas reales y contingencia en memoria | `true` |
| `azure.clientId` | Application (Client) ID de Azure Entra ID | `pedidos360-client-id` |
| `azure.tenantId` | Directory (Tenant) ID de Azure Entra ID | `pedidos360-tenant-id` |
| `azure.authority` | Endpoint de autenticación de Microsoft Entra ID | `https://login.microsoftonline.com/...` |
| `azure.apiScope` | Scope solicitado para consumir el API backend | `api://pedidos360-api/Orders.ReadWrite` |

Para más detalles sobre la arquitectura de microservicios y endpoints, consulta el archivo [docs/backend-integration.md](docs/backend-integration.md).
