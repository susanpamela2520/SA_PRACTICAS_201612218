# DeliverEats — Práctica 6
**Universidad de San Carlos de Guatemala**  
**Facultad de Ingeniería — Escuela de Ciencias y Sistemas**  
**Curso: Software Avanzado**  
**Carné:** 201612218


## 2. Arquitectura de Microservicios

```
Cliente (Angular) ──► API Gateway (3000)
                           │
              ┌────────────┼────────────┬──────────────┐
              ▼            ▼            ▼              ▼
        auth-service  restaurant-  order-service  payment-service
         (gRPC 50051)  service       (gRPC 50053)  (gRPC 50056)
                       (gRPC 50052)
                                        │
                                    RabbitMQ
                              (delivereats_exchange)
                                        │
                          ┌─────────────┴──────────────┐
                          ▼                            ▼
                  restaurant-service          notification-service
                  (restaurant_order_queue)    (notification_order_queue)
```

**Infraestructura Docker:**
- RabbitMQ: 5672/15672 (guest/guest)
- Redis: 6379
- PostgreSQL x4: 5433 (auth), 5434 (restaurant), 5435 (order), 5436 (payment)

---

## 3. Diagrama de Secuencia — Flujo Completo de Orden

```
Cliente        API Gateway    Order-Service    RabbitMQ         Restaurant-Service    Repartidor
   │                │               │              │                    │                  │
   │──POST /orders──►               │              │                    │                  │
   │                │──createOrder──►              │                    │                  │
   │                │               │──publish─────►                    │                  │
   │                │               │         order.created             │                  │
   │                │               │              │──consume────────────►                  │
   │                │               │              │              guarda RestaurantOrder    │
   │◄───orden id────│               │              │              (PENDING)                 │
   │                │               │              │                    │                  │
   │    [Restaurante acepta]         │              │                    │                  │
   │                │               │              │◄──publish──────────│                  │
   │                │               │              │   order.accepted   │                  │
   │                │               │◄─consume─────│                    │                  │
   │                │          Order.status         │                    │                  │
   │                │          = PREPARING          │                    │                  │
   │                │               │              │                    │                  │
   │    [Repartidor toma orden]      │              │                    │                  │
   │                │◄──────────────────────────────────────────────────────────────────────│
   │                │──updateStatus─►              │                    │                  │
   │                │          OUT_FOR_DELIVERY     │                    │                  │
   │                │               │              │                    │                  │
   │    [Repartidor confirma entrega con foto]      │                    │                  │
   │                │◄──POST /orders/:id/delivery-photo─────────────────────────────────────│
   │                │──uploadPhoto──►              │                    │                  │
   │                │          Order.status         │                    │                  │
   │                │          = DELIVERED          │                    │                  │
   │                │               │              │                    │                  │
   │    [Cliente califica]          │              │                    │                  │
   │──POST /orders/rate─►           │              │                    │                  │
   │                │──createRating─►              │                    │                  │
   │◄───rating id───│               │              │                    │                  │
```

---

## 4. Diagrama de Secuencia — Flujo de Cupones

```
Vendedor       API Gateway    Restaurant-Service    Admin           Cliente
   │                │               │                │                │
   │──POST /restaurants/:id/coupons─►               │                │
   │                │──createCoupon─►               │                │
   │                │          status=PENDING        │                │
   │◄───cupón id────│               │                │                │
   │                │               │                │                │
   │    [Admin revisa cupones pendientes]            │                │
   │                │◄──GET /restaurants/coupons/pending──────────────│
   │                │──getPending───►               │                │
   │                │◄──────────────│               │                │
   │                │───────────────────────────────►                │
   │                │               │                │                │
   │    [Admin aprueba]             │                │                │
   │                │◄──POST /restaurants/coupons/:id/approve─────────│
   │                │──approveCoupon►               │                │
   │                │          status=APPROVED       │                │
   │                │               │                │                │
   │    [Cliente aplica cupón en checkout]           │                │
   │                │◄──POST /restaurants/coupons/validate────────────────────────────────►│
   │                │──validateCoupon►              │                │                    │
   │                │          discountPercent       │                │                    │
   │                │◄──────────────│               │                │                    │
   │                │───────────────────────────────────────────────────────────────────────►
   │                │    finalTotal = total - (total * discountPercent / 100)              │
```

---

## 5. Pruebas Unitarias

### 5.1 Lógica de Negocio 1 — Cálculo de Descuentos (Cupones)

**Archivo:** `order-service/src/order/order.service.spec.ts`

**Descripción:** Valida la fórmula matemática de aplicación de descuentos.

```
discountAmount = (orderTotal × discountPercent) / 100
finalTotal     = orderTotal - discountAmount
```

| Test | Entrada | Esperado | Resultado |
|------|---------|----------|-----------|
| 20% sobre Q100 | total=100, pct=20 | discount=20, final=80 | ✅ PASS |
| 10% sobre Q250 | total=250, pct=10 | discount=25, final=225 | ✅ PASS |
| 0% no modifica | total=150, pct=0 | final=150 | ✅ PASS |

### 5.2 Lógica de Negocio 2 — Promedio de Calificaciones y Restaurantes Destacados

**Descripción:** Valida el cálculo de promedio de ratings y la determinación de restaurantes "Destacados" (avg ≥ 4).

| Test | Entrada | Esperado | Resultado |
|------|---------|----------|-----------|
| Promedio correcto | ratings=[5,4,3] | avg≈4.0 | ✅ PASS |
| Sin calificaciones | ratings=[] | avg=0 | ✅ PASS |
| Es Destacado | ratings=[5,4] | avg≥4 = true | ✅ PASS |
| No es Destacado | ratings=[2,3] | avg≥4 = false | ✅ PASS |

**Resultado total:** 7/7 tests pasando ✅

```
Test Suites: 1 passed, 1 total
Tests:       7 passed, 7 total
Time:        1.67s
```

### 5.3 Endpoints Core

**Archivo:** `api-gateway/src/endpoints.spec.ts`

#### Endpoint 1 — POST /auth/login (Autenticación)

Valida que el endpoint de login rechace credenciales incorrectas y acepte las correctas.

| Test | Escenario | Esperado |
|------|-----------|----------|
| Credenciales incorrectas | email/password inválidos | HTTP 401 |
| Credenciales correctas | email/password válidos | HTTP 201 + `{ token }` |

#### Endpoint 2 — POST /orders (Creación de Orden)

Valida que el endpoint requiera autenticación y payload válido.

| Test | Escenario | Esperado |
|------|-----------|----------|
| Sin token | request sin Authorization header | HTTP 401 |
| Sin items | items=[] | HTTP 400 o 401 |

#### Endpoint 3 — GET /restaurants/filter (Búsqueda con Filtros)

Valida que el endpoint de filtros responda correctamente a distintos parámetros.

| Test | Parámetro | Esperado |
|------|-----------|----------|
| Filtro por categoría | `?category=PIZZA` | HTTP 200 + `{ restaurants: [...] }` |
| Búsqueda por texto | `?search=pizza` | HTTP 200 |
| Solo con promoción | `?onlyWithPromotion=true` | HTTP 200 |

---

## 6. Tecnologías Utilizadas

| Capa | Tecnología |
|------|-----------|
| Frontend | Angular 19, Angular Material |
| API Gateway | NestJS, gRPC, JWT Guard |
| Microservicios | NestJS, gRPC, TypeORM |
| Mensajería | RabbitMQ (@golevelup/nestjs-rabbitmq) |
| Caché | Redis |
| Base de datos | PostgreSQL 15 (x4 instancias) |
| Contenedores | Docker, Docker Compose |
| Testing | Jest, ts-jest, Supertest |

---

## 7. Instrucciones de Ejecución

```bash
# Levantar todos los servicios
docker compose up -d

# Frontend (desarrollo local)
cd app-web && ng serve

# Ejecutar tests — lógicas de negocio
cd order-service && npx jest --testPathPatterns=order.service.spec

# Ejecutar tests — endpoints
cd api-gateway && npx jest --testPathPatterns=endpoints.spec
```

---

## 8. Endpoints Principales

### Auth
| Método | Ruta | Rol | Descripción |
|--------|------|-----|-------------|
| POST | /auth/login | Público | Login |
| POST | /auth/register | Público | Registro |

### Restaurantes
| Método | Ruta | Rol | Descripción |
|--------|------|-----|-------------|
| GET | /restaurants | Público | Listar restaurantes |
| GET | /restaurants/filter | Público | Filtrar restaurantes |
| GET | /restaurants/:id/promotions/active | Público | Promociones activas |
| POST | /restaurants/:id/coupons | Vendedor | Crear cupón |
| POST | /restaurants/coupons/validate | Cliente | Validar cupón |
| POST | /restaurants/coupons/:id/approve | Admin | Aprobar cupón |

### Órdenes
| Método | Ruta | Rol | Descripción |
|--------|------|-----|-------------|
| POST | /orders | Cliente | Crear orden |
| GET | /orders/my | Cliente | Mis órdenes |
| PATCH | /orders/:id/status | Repartidor | Actualizar estado |
| POST | /orders/:id/delivery-photo | Repartidor | Confirmar entrega |
| POST | /orders/rate | Cliente | Calificar orden |
| GET | /orders/by-status/:status | Repartidor | Órdenes por estado |
| GET | /admin/orders/finished | Admin | Órdenes finalizadas |
| POST | /admin/orders/:id/refund | Admin | Aprobar reembolso |