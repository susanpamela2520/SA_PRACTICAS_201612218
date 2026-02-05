# Delivereats - Sistema de Autenticación con JWT y gRPC

**Estudiante:** Susan Pamela Herrera Monzon  
**Carné:** 201612218  

---

## Descripción del Proyecto

Sistema de autenticación para la plataforma Delivereats implementado con arquitectura de microservicios. Permite el registro y login de usuarios (Clientes, Repartidores, Restaurantes y Administradores) utilizando JWT para gestión de sesiones y comunicación gRPC entre servicios.

---

##  Arquitectura
```
El sistema está basado en una **arquitectura de microservicios**, diseñada para separar responsabilidades, mejorar la seguridad y facilitar la escalabilidad.
```
![Texto alternativo](img/Arquitectura.png)

### Componentes:

1. **Frontend (React + Vite)**
   - Interfaz de usuario para registro y login
   - Módulo público para clientes
   - Módulo de administración para crear Repartidores y Restaurantes
   - Almacena JWT en localStorage

2. **API Gateway (NestJS)**
   - Expone endpoints REST: `/api/auth/register`, `/api/auth/login`, `/api/protected/ping`
   - Valida JWT en rutas protegidas
   - Actúa como cliente gRPC para comunicarse con Auth-Service

3. **Auth-Service (NestJS + gRPC)**
   - Microservicio que maneja la lógica de autenticación
   - Genera tokens JWT
   - Encripta contraseñas con bcrypt
   - Gestiona usuarios en PostgreSQL a través de TypeORM

4. **PostgreSQL**
   - Base de datos relacional
   - Almacena usuarios con contraseñas encriptadas

---

### URLs de acceso

- **Frontend:** http://localhost:5173
- **API Gateway:** http://localhost:3000
- **Auth-Service:** gRPC en puerto 50051 (no HTTP)
- **PostgreSQL:** localhost:5432

---

##  Funcionalidades Implementadas

###  Registro de Usuarios

**Registro de Cliente (módulo público):**
- URL: http://localhost:5173/register
- Campos: Nombre completo, Email, Teléfono, Contraseña
- Rol asignado automáticamente: CLIENTE

**Registro de Repartidor/Restaurante modo Admin :**
- URL: http://localhost:5173/admin
- Campos: Tipo (Repartidor/Restaurante), Nombre, Email, Teléfono, Contraseña
- Solo accesible desde el módulo de administración

###  Login y Gestión de Sesiones

- URL: http://localhost:5173/login
- Genera JWT tras validar credenciales
- Token almacenado en localStorage del navegador
- Duración del token: 2 horas (configurable en `.env`)

### Seguridad

- **Contraseñas encriptadas:** Uso de bcrypt con salt rounds = 10
- **JWT firmado:** Con secreto de 128 caracteres
- **Validación de tokens:** Middleware en Gateway para rutas protegidas
- **Manejo de errores:** Email duplicado, credenciales inválidas

###  Comunicación gRPC

- Protocolo definido en `proto/auth.proto`
- Gateway (cliente) → Auth-Service (servidor)
- Mensajes: `RegisterRequest`, `LoginRequest`, `AuthResponse`

---

##  Tecnologías Utilizadas

| Componente | Tecnologías |
|------------|-------------|
| **Frontend** | React 18, Vite, CSS puro |
| **Gateway** | NestJS, @grpc/grpc-js, @nestjs/jwt |
| **Auth-Service** | NestJS, gRPC, TypeORM, bcrypt |
| **Base de Datos** | PostgreSQL 16 |
| **Contenedores** | Docker, Docker Compose |
| **Comunicación** | REST (Frontend ↔ Gateway), gRPC (Gateway ↔ Auth-Service) |

---

##  Variables de Entorno

### auth-service/.env
```env
DB_HOST=postgres
DB_PORT=5432
DB_USER=delivereats_user
DB_PASS=delivereats/22418
DB_NAME=delivereats_auth
JWT_SECRET=<generado-con-crypto>
JWT_EXPIRES=2h
GRPC_PORT=50051
```

### gateway/.env
```env
GATEWAY_PORT=3000
AUTH_GRPC_URL=auth-service:50051
JWT_SECRET=<mismo-que-auth-service>
```

** IMPORTANTE:** El `JWT_SECRET` debe ser idéntico en ambos servicios.

---

##  Pruebas Realizadas

### 1. Registro de Cliente
- **Entrada:** Nombre, Email, Teléfono, Contraseña
- **Resultado:** Usuario creado en BD con contraseña encriptada
- **Verificación:** Consulta en TablePlus muestra hash bcrypt

### 2. Login Exitoso
- **Entrada:** Email y contraseña correctos
- **Resultado:** Token JWT generado y almacenado en localStorage
- **Verificación:** Token visible en DevTools → Application → Local Storage

### 3. Login con Credenciales Inválidas
- **Entrada:** Contraseña incorrecta
- **Resultado:** Mensaje "Credenciales inválidas"
- **Código de estado:** 200 con `ok: false`

### 4. Registro con Email Duplicado
- **Entrada:** Email ya existente
- **Resultado:** Mensaje "Email ya registrado"

### 5. Ruta Protegida
- **URL:** http://localhost:3000/api/protected/ping
- **Con token:** Retorna `{ok: true, user: {...}}`
- **Sin token:** Retorna `401 Unauthorized`

### 6. Comunicación gRPC
- **Logs del Gateway:** "Llamando a Auth-Service.Register via gRPC"
- **Logs del Auth-Service:** "Recibida petición Register"
- **Verificación:** Sin errores de conexión

---

##  Principios SOLID Aplicados

### 1. **Single Responsibility Principle (SRP)**
- `PasswordService`: Solo encripta y compara contraseñas
- `JwtTokenService`: Solo genera tokens JWT
- `UserRepository`: Solo interactúa con la BD de usuarios

### 2. **Open/Closed Principle (OCP)**
- Los servicios son extensibles sin modificar código existente
- Nuevos roles de usuario se agregan sin cambiar la lógica de autenticación

### 3. **Liskov Substitution Principle (LSP)**
- Los guards de autenticación implementan la interfaz `CanActivate`
- Pueden ser intercambiados sin romper funcionalidad

### 4. **Interface Segregation Principle (ISP)**
- Interfaces específicas para cada operación gRPC (Register, Login)
- No se fuerza a implementar métodos innecesarios

### 5. **Dependency Inversion Principle (DIP)**
- Los controladores dependen de abstracciones (servicios), no de implementaciones concretas
- Inyección de dependencias con NestJS

---
