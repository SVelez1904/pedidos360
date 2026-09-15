# Guía de Integración Frontend - Backend: Pedidos360

Este documento detalla la arquitectura de integración entre el Frontend (**Angular 18+**) y el ecosistema existente de microservicios backend (**Spring Boot 3+ / Java 21**).

---

## 1. Arquitectura General del Sistema

```
+-------------------------------------------------------------+
|               Angular 18+ Frontend (SPA)                   |
|  - Standalone Components   - Reactive Signals               |
|  - MSAL Angular (Azure AD) - HttpInterceptors (JWT + Error) |
+------------------------------+------------------------------+
                               | HTTPS / Bearer JWT
                               v
               +-------------------------------+
               |    AWS API Gateway HTTP API    |
               +---------------+---------------+
                               |
       +-----------------------+-----------------------+
       |                       |                       |
       v                       v                       v
+---------------+      +---------------+      +---------------+
|  ms-orders    |      |  ms-catalog   |      |  ms-reporting  |
| (Spring Boot) |      | (Spring Boot) |      | (Spring Boot) |
+-------+-------+      +-------+-------+      +-------+-------+
        |                      |                      |
        +------------+---------+----------------------+
                     |
         +-----------v-----------+
         |     Message Broker    |
         | RabbitMQ (Asíncrono)  |
         | Kafka (Event Stream)  |
         +-----------------------+
```

---

## 2. Autenticación y Autorización (Azure AD / Entra ID)

### Flujo de Tokens
1. El usuario inicia sesión utilizando **Microsoft Entra ID (Azure AD)** vía MSAL (`MsalService`).
2. Azure AD emite un **Access Token (JWT)** con los scopes configurados (ej. `api://pedidos360-api/Orders.ReadWrite`).
3. El `jwtInterceptor` de Angular intercepta automáticamente todas las peticiones dirigidas a `environment.apiUrl` e inyecta la cabecera:
   ```http
   Authorization: Bearer <azure_ad_jwt_token>
   ```
4. El backend Spring Boot valida la firma del token utilizando el endpoint JWKS público de Microsoft (`https://login.microsoftonline.com/{tenantId}/discovery/v2.0/keys`).

### Mapeo de Roles de Azure AD a la Aplicación
Los roles asignados en el portal de Azure AD (App Registrations > App Roles) son leídos de los claims `roles`:
- `Admin`: Acceso irrestricto (Dashboard analítico, Catálogo, Reportería BI, Auditoría, Gestión total de pedidos).
- `Operator`: Acceso a Bodega y Despacho (Dashboard operacional, Catálogo de productos, Actualización de estados del ciclo de vida de pedidos).
- `Customer`: Acceso a clientes (Creación de pedidos, Consulta del historial y detalle de sus propios pedidos).

---

## 3. Catálogo de Endpoints REST (Backend Spring Boot)

Todas las rutas son expuestas a través del API Gateway bajo el prefijo `/api`:

### 3.1. Microservicio de Pedidos (`ms-orders`)
| Método | Endpoint | Roles Permitidos | Descripción |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/orders` | `Admin`, `Operator`, `Customer` | Lista paginada y filtrada de pedidos. |
| `GET` | `/api/orders/{id}` | `Admin`, `Operator`, `Customer` | Detalle completo del pedido por ID. |
| `POST` | `/api/orders` | `Admin`, `Customer` | Creación de una nueva orden de compra. |
| `PATCH` | `/api/orders/{id}/status` | `Admin`, `Operator` | Transición del estado del pedido. |
| `POST` | `/api/orders/{id}/cancel` | `Admin`, `Customer` | Cancelación formal de un pedido. |

#### Ciclo de Vida de Estados del Pedido:
`CREATED` ➔ `ACCEPTED` ➔ `IN_PREPARATION` ➔ `DISPATCHED` ➔ `DELIVERED` (o `CANCELLED` antes del despacho).

---

### 3.2. Microservicio de Catálogo (`ms-catalog`)
| Método | Endpoint | Roles Permitidos | Descripción |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/products` | `Admin`, `Operator`, `Customer` | Listado de productos e inventario. |
| `GET` | `/api/products/{id}` | `Admin`, `Operator`, `Customer` | Ficha técnica de un producto. |
| `POST` | `/api/products` | `Admin` | Registro de un nuevo producto en catálogo. |
| `PUT` | `/api/products/{id}` | `Admin` | Actualización de datos del producto. |
| `PATCH` | `/api/products/{id}/stock`| `Admin`, `Operator` | Ajuste rápido de inventario físico. |

---

### 3.3. Microservicio de Reportería y BI (`ms-reporting`)
| Método | Endpoint | Roles Permitidos | Descripción |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/report/kpis` | `Admin` | KPIs consolidados (Ventas, Órdenes, Lead Time). |
| `GET` | `/api/report/sales-trend` | `Admin` | Ventas agrupadas cronológicamente. |
| `GET` | `/api/report/orders-by-status` | `Admin` | Distribución porcentual por estado. |
| `GET` | `/api/report/top-products` | `Admin` | Ranking de productos más vendidos. |
| `GET` | `/api/report/lead-time` | `Admin` | Desglose de tiempos vs SLA de entrega. |

---

### 3.4. Microservicio de Auditoría y Trazabilidad (`ms-audit`)
| Método | Endpoint | Roles Permitidos | Descripción |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/audit/events` | `Admin` | Eventos inmutables procesados desde Kafka/RabbitMQ. |

---

## 4. Activación de Conexión Real con Backend

Por defecto, para facilitar el desarrollo autónomo en entornos locales sin el backend levantado, el frontend incluye un mecanismo de contingencia (`mockFallback`).

Para conectar con el backend Spring Boot real:

1. Modifica `src/environments/environment.development.ts` (o `src/environments/environment.production.ts`):
   ```typescript
   export const environment = {
     production: false,
     apiUrl: 'https://tu-api-gateway.execute-api.us-east-1.amazonaws.com/api',
     enableMockFallback: false, // <-- Cambiar a FALSE para exigir backend real
     azure: {
       clientId: 'TU_AZURE_CLIENT_ID',
       tenantId: 'TU_AZURE_TENANT_ID',
       authority: 'https://login.microsoftonline.com/TU_AZURE_TENANT_ID',
       redirectUri: '/auth/callback',
       postLogoutRedirectUri: '/login',
       apiScope: 'api://TU_AZURE_CLIENT_ID/access_as_user'
     }
   };
   ```
2. Inicia la aplicación:
   ```bash
   npm start
   ```
3. Verifica en la consola de red (DevTools > Network) que las llamadas HTTP devuelvan código `200 OK` con los DTOs de Spring Boot.
