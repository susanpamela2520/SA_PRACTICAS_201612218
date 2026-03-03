# Delivereats — Práctica 4: Documentación Fase 2
**Software Avanzado — USAC 2026**

Proyecto: **Delivereats — Fase 2**
  
Susan Pamela Herrera Monzon  
Carné: 201612218  
---

# 1. Actualización de Requerimientos

## 1.1 Requerimientos Funcionales

| ID | Módulo | Descripción |
|----|--------|------------|
| RF-01 | Autenticación | Registro con roles Cliente, Restaurante, Administrador |
| RF-02 | Autenticación | Login con JWT firmado |
| RF-03 | Autenticación | Validación de JWT en endpoints protegidos |
| RF-04 | Restaurantes | CRUD restaurantes (Admin) |
| RF-05 | Restaurantes | Listar restaurantes y menú |
| RF-06 | Restaurantes | CRUD ítems menú (Rol Restaurante) |
| RF-07 | Carrito | Agregar ítems al carrito |
| RF-08 | Carrito | Mostrar subtotal y total |
| RF-09 | Carrito | Modificar/eliminar ítems |
| RF-10 | Órdenes | Crear orden y publicar evento en RabbitMQ |
| RF-11 | Órdenes | Consultar historial de órdenes |
| RF-12 | Órdenes | Actualizar estado de orden |
| RF-13 | Mensajería | Order-Service publica order.created |
| RF-14 | Mensajería | Restaurant-Service consume eventos |
| RF-15 | Mensajería | Mensajes persistentes (durable:true) |
| RF-16 | Notificaciones | Notification-Service consume eventos |

---

## 1.2 Requerimientos No Funcionales

| ID | Categoría | Descripción |
|----|-----------|------------|
| RNF-01 | Disponibilidad | 2 réplicas por microservicio | 
| RNF-02 | Escalabilidad | HPA independiente |
| RNF-03 | Seguridad | JWT obligatorio + secrets seguros |
| RNF-04 | Rendimiento | Respuesta < 500 ms |
| RNF-05 | Mensajería | RabbitMQ durable |
| RNF-06 | Portabilidad | Docker + Kubernetes |
| RNF-07 | Mantenibilidad | CI/CD automático |
| RNF-08 | Trazabilidad | Logs con correlationId |
| RNF-09 | Separación | Database-per-service |
| RNF-10 | Resiliencia | Rollout/Rollback sin downtime | 

---
# 2. Diagrama de Arquitectura de Alto Nivel

![diagramaArquitectura](./img/DiagramaAltoNivelF2.png)

Este diagrama presenta la arquitectura de Delivereats en la Fase 2, organizada por capas. El frontend (app-web) se comunica por HTTP con el API Gateway, el cual centraliza la seguridad (AuthGuard/RolesGuard) y enruta las solicitudes hacia los microservicios por gRPC. A diferencia de la Fase 1, se incorpora mensajería asíncrona mediante RabbitMQ: al crearse una orden, el Order-Service publica el evento order.created, que es consumido de manera independiente por el Restaurant-Service y el Notification-Service. Finalmente, se mantiene el patrón database-per-service, donde cada microservicio posee su propia base de datos PostgreSQL aislada para asegurar independencia y escalabilidad

---
# 3. Diagrama Despliegue 

![diagramaDespliegue](./img/Despligue.png)

Este diagrama presenta el despliegue físico/lógico de Delivereats en la Fase 2 tomando como base Kubernetes. El Cliente Web (app-web en React) consume el sistema a través del Ingress Controller, el cual expone únicamente el api-gateway hacia el exterior. El API Gateway enruta internamente las operaciones mediante gRPC hacia auth-service, restaurant-service y order-service. Para la comunicación asíncrona, el order-service publica eventos order.created al broker RabbitMQ (cola durable), los cuales son consumidos por restaurant-service y notification-service. Cada microservicio mantiene su base de datos PostgreSQL independiente (auth-db, restaurant-db y order-db), cumpliendo el enfoque database-per-service para aislamiento, escalabilidad y mantenimiento. 

---
# 4. Diagrama Despliegue Kubernetes

![diagramaKubernetes](./img/kubernetes.png)

Este diagrama describe el despliegue de Delivereats Fase 2 sobre Kubernetes dentro del namespace delivereats. El Ingress Controller expone únicamente al api-gateway hacia el exterior, mientras que el resto de microservicios permanecen como servicios internos (ClusterIP). Cada microservicio se ejecuta en su Deployment con réplicas (principalmente 2 para alta disponibilidad), y RabbitMQ se despliega como StatefulSet para conservar estado/persistencia. Además, la configuración se separa en ConfigMaps para valores no sensibles y Secrets para credenciales (DB), JWT y la URL de RabbitMQ, asegurando buenas prácticas de seguridad y portabilidad.

---
# 5. Diagrama Base de Datos 

![diagramaBase](./img/db.png)

Este diagrama representa el esquema de base de datos bajo el enfoque database-per-service: auth-db, restaurant-db y order-db. En auth-db se almacena el usuario autenticado, agregando isActive y createdAt como soporte de soft-delete y auditoría. En restaurant-db se gestionan restaurantes y menú, incorporando isAvailable para disponibilidad en tiempo real. En order-db se controla el ciclo de vida de la orden y sus ítems, añadiendo updatedAt para registrar cambios de estado y correlationId para trazabilidad de eventos publicados/consumidos en RabbitMQ. Las relaciones entre bases se interpretan como referencias lógicas (por IDs), manteniendo el desacoplamiento entre servicios.

---
# 6. Diagrama Actividades 

![diagramaActividades](./img/Actividades.png)

Este diagrama representa el flujo principal de la Fase 2 de Delivereats, organizado por carriles (swimlanes) para identificar responsabilidades por componente. El Cliente agrega ítems al carrito en el frontend y confirma la orden mediante POST /orders. El API Gateway aplica controles de seguridad con AuthGuard (validación JWT) y RolesGuard (rol Cliente); si falla, responde con 401 o 403. Si es válido, el Gateway invoca al Order-Service vía gRPC para crear la orden con estado PENDING, generar un correlationId y publicar el evento order.created. RabbitMQ encola el mensaje con persistencia, y los consumidores (Restaurant-Service y Notification-Service) procesan el evento de manera asíncrona, registrando confirmaciones/notificaciones. Finalmente, el Order-Service retorna el OrderResponse al Gateway y este responde al frontend con la confirmación de la orden


# Implementacion de Kubernets

Implementacion de Kubernetes en el proyecto Fase 2

app-web (Frontend React)
api-gateway
auth-service
restaurant-service
order-service
notification-service
RabbitMQ

Bases de datos independientes:
    auth-db
    restaurant-db
    order-db


## Pasos 

### Paso 1
Escribe esto en consola.
```Javascript 
kubectl create namespace delivereats
```
### Paso 2
Con esto aparece el nombre "deliverearts"
```javascript
kubectl get ns
```

### Paso 3

Todos los valores sensibles deben almacenarse como Secrets.

* Secret de Base de Datos

```javascript
kubectl create secret generic db-secrets \
  --namespace delivereats \
  --from-literal=DB_USER='postgres' \
  --from-literal=DB_PASSWORD='TU_PASSWORD_AQUI'
```

* Secret JWT

```javascript
    kubectl create secret generic rabbitmq-secret \
  --namespace delivereats \
  --from-literal=RABBITMQ_URL='amqp://guest:guest@rabbitmq:5672'
```
```javascript
  * Secret RabbitMQ
  kubectl create secret generic rabbitmq-secret \
  --namespace delivereats \
  --from-literal=RABBITMQ_URL='amqp://guest:guest@rabbitmq:5672'
  ```
  Se puede verificar con el siguiente comando:
```javascript
kubectl get secrets -n delivereat
```