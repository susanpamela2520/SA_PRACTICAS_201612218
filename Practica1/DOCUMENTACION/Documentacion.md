# DOCUMENTACIÓN / Práctica 1
# SISTEMA - Delivereats

## LABORATORIO SOFTWARE AVANZADO
---
| Nombre    | Carnet |
|-----------|------|
| Susan Pamela Herrera Monzón  |  201612218 |
---
# Requerimientos Funcionales - Delivereats
---
Los requerimientos funcionales describen las funcionalidades específicas que debe realizar el sistema Delivereats a cada tipo de usuario. Están organizados por roles.

---
# ROL: CLIENTE

* RF-CLI-001: Registro de Usuario Cliente
El sistema debe permitir que un nuevo usuario se registre como cliente.

---

* RF-CLI-002: Inicio de Sesión
El cliente debe poder autenticarse en el sistema.

---

* RF-CLI-003: Explorar Restaurantes
El cliente debe poder ver listado de restaurantes disponibles.

---

* RF-CLI-004: Ver Menú de Restaurante
El cliente debe poder consultar el menú completo de un restaurante específico.

---

* RF-CLI-005: Crear Orden
El cliente debe poder crear una orden con items del menú.

---

* RF-CLI-006: Cancelar Orden
El cliente debe poder cancelar su orden antes de que esté EN_PROCESO.

---

* RF-CLI-007: Ver Historial de Órdenes
El cliente debe poder consultar sus órdenes anteriores.


# ROL: RESTAURANTE/VENDEDOR

* RF-RES-001: Registro de Restaurante
Un usuario debe poder registrarse como propietario de restaurante.

---

* RF-RES-002: Crear Ítem de Menú
El restaurante debe poder agregar nuevos platillos a su menú.

---

* RF-RES-003: Actualizar Ítem de Menú
El restaurante debe poder modificar información de sus platillos.

---

* RF-RES-004: Eliminar Ítem de Menú
El restaurante debe poder eliminar platillos de su menú.

---

* RF-RES-005: Ver Órdenes Recibidas
El restaurante debe poder ver todas las órdenes en estado CREADA.

---

* RF-RES-006: Aceptar y Procesar Orden
El restaurante debe poder aceptar una orden y comenzar su preparación.

---

* RF-RES-007: Marcar Orden como Lista
El restaurante debe poder marcar una orden como LISTA para entrega.
---

* RF-RES-008: Rechazar Orden
El restaurante debe poder rechazar una orden con motivo.

---

# ROL: REPARTIDOR

* RF-REP-001: Registro de Repartidor
Un usuario debe poder registrarse como repartidor.

---

* RF-REP-002: Ver Órdenes Disponibles
El repartidor debe poder ver órdenes en estado LISTA.

---

* RF-REP-003: Aceptar Orden para Entrega

---

* RF-REP-004: Actualizar Estado a En Camino
El repartidor marca que está en ruta.

---

* RF-REP-005: Marcar Entrega como Completada
El repartidor confirma que completó la entrega.

---

* RF-REP-006: Cancelar Entrega
El repartidor puede cancelar una entrega con motivo.

---

# ROL: ADMINISTRADOR

* RF-ADM-001: Crear Restaurante
El administrador puede crear nuevos restaurantes en el sistema.

---

* RF-ADM-002: Actualizar Restaurante
El administrador puede modificar información de restaurantes.

---

* RF-ADM-003: Eliminar Restaurante
 El administrador puede desactivar restaurantes.

---

* RF-ADM-004: Ver Reportes del Sistema
El administrador puede consultar estadísticas generales.

---
# Requerimientos NO Funcionales - Delivereats
----

* RNF-001: Rendimiento
El sistema debe responder de manera eficiente a las solicitudes.

---

* RNF-002: Escalabilidad
**Descripción:** El sistema debe poder escalar horizontalmente.

---

* RNF-003: Disponibilidad
El sistema debe estar disponible 24/7.

---

* RNF-004: Seguridad
El sistema debe proteger la información de los usuarios.

---

* RNF-005: Usabilidad
El sistema debe ser intuitivo y fácil de usar.

---

* RNF-006: Mantenibilidad
El código debe ser fácil de mantener y actualizar.
---

* RNF-007: Portabilidad
El sistema debe funcionar en diferentes plataformas.
---

* RNF-008: Interoperabilidad
El sistema debe poder integrarse con servicios externos.

---

* RNF-009: Confiabilidad
El sistema debe manejar errores adecuadamente.

---

* RNF-010: Cumplimiento Legal
El sistema debe cumplir con regulaciones aplicables.

----
# DIAGRAMA ALTO NIVEL 
----
## Arquitectura del Sistema

El sistema implementa una **arquitectura basada en microservicios**, organizada en capas, cuyo objetivo es garantizar **escalabilidad, mantenibilidad y separación de responsabilidades**. A continuación, se describe el funcionamiento general del diagrama de arquitectura de alto nivel.

### Capa Frontend
La capa de frontend corresponde a la aplicación web desarrollada con tecnologías modernas como React, Vue o Angular. Esta capa es responsable de la interacción con los usuarios y proporciona interfaces diferenciadas para los roles de cliente, restaurante, repartidor y administrador.  
El frontend no accede directamente a los microservicios, sino que se comunica exclusivamente con el API Gateway mediante peticiones HTTP/REST en formato JSON.

### Capa API Gateway
El API Gateway actúa como el **punto único de entrada** al sistema. Su función principal es recibir las solicitudes del frontend y redirigirlas al microservicio correspondiente. Además, centraliza aspectos de seguridad como la validación de tokens JWT, el control de acceso y el manejo de reglas básicas de seguridad.  
Esta capa permite desacoplar el frontend de la lógica interna del sistema.

### Capa de Microservicios
La lógica de negocio se encuentra distribuida en microservicios independientes, cada uno con una responsabilidad específica:

- **Auth Service:** gestiona el registro, inicio de sesión y validación de tokens JWT.
- **Catalog Service:** administra la información de restaurantes y menús.
- **Order Service:** controla la creación, consulta y actualización de órdenes.
- **Delivery Service:** gestiona la asignación y el estado de las entregas.
- **Notification Service:** se encarga del envío de notificaciones y correos electrónicos.

La comunicación entre el API Gateway y los microservicios, así como entre algunos servicios internos, se realiza de forma directa.

### Capa de Base de Datos
El sistema utiliza una base de datos relacional PostgreSQL para el almacenamiento de la información. Cada microservicio accede únicamente a los datos que necesita, lo que favorece la organización, integridad y consistencia de la información.

### Servicios Externos
El servicio de notificaciones se integra con un servidor SMTP externo para el envío de correos electrónicos. Esta integración se mantiene aislada del resto del sistema, evitando dependencias directas entre los microservicios y servicios externos.

### Beneficios de la Arquitectura
Esta arquitectura permite escalar los servicios de manera independiente, facilita el mantenimiento del sistema y mejora la seguridad al centralizar el acceso mediante el API Gateway. Además, su diseño modular la hace adecuada para sistemas modernos de alta disponibilidad y crecimiento progresivo.

![Texto alternativo](img/DiagramaAltoNivel.png)
---

----
# DIAGRAMA DESPLIEGUE 
----

El diagrama de despliegue es una vista mas simple de cómo se ejecuta el sistema Delivereats tanto en el entorno de desarrollo como en la nube, permitiendo identificar claramente los componentes principales y su relación.

### Desarrollo
En el entorno local se representa la ejecución del sistema durante la etapa de desarrollo. El Frontend corresponde a la aplicación web utilizada por los usuarios para interactuar con el sistema. Esta aplicación se comunica mediante peticiones **REST** con el **Backend**, el cual agrupa el API Gateway y los microservicios que contienen la lógica de negocio del sistema.

El backend se conecta a una **base de datos PostgreSQL**, donde se almacena la información necesaria para el funcionamiento del sistema. Esta separación permite desarrollar y probar la aplicación de forma controlada antes de su despliegue.

### Google Cloud Platform
En el entorno de producción, el sistema se encuentra desplegado en **Google Cloud Platform (GCP)**. El acceso de los usuarios se realiza a través de un **Load Balancer**, el cual gestiona las conexiones seguras mediante **HTTPS** y distribuye el tráfico hacia los servicios disponibles.

El **Frontend Service** se ejecuta en **Cloud Run**, permitiendo que la aplicación web escale automáticamente según la demanda. Este frontend se comunica con los **Backend Services**, que incluyen el API Gateway y los microservicios desplegados también en Cloud Run, encargados de procesar las solicitudes del sistema.

Los servicios de backend se conectan a **Cloud SQL con PostgreSQL**, una base de datos administrada que garantiza la persistencia, disponibilidad y seguridad de los datos. Adicionalmente, el frontend accede a **Cloud Storage** para la carga y consulta de archivos estáticos, como imágenes o recursos de la aplicación.

### Flujo General del Sistema
El flujo de funcionamiento del sistema inicia cuando el usuario accede a la aplicación web. Las solicitudes son enviadas al backend a través del API Gateway, donde se procesan y se obtiene o almacena la información necesaria en la base de datos. Finalmente, las respuestas son retornadas al frontend para su presentación al usuario.

### Beneficios del Enfoque de Despliegue
Este modelo de despliegue permite una clara separación entre desarrollo y producción, facilita el escalado automático de los servicios, mejora la disponibilidad del sistema y simplifica el mantenimiento, lo que lo hace adecuado para aplicaciones modernas basadas en microservicios.

![Texto alternativo](img/DiagramaDespliegue.png)

----
# MODELO ENTIDAD-RELACION (DATABASE)
----

![Texto alternativo](img/ModeloEntidad-Relacion.png)


El sistema **Delivereats** es una plataforma de delivery de comida que permite a los usuarios realizar pedidos a distintos restaurantes y recibirlos a través de repartidores.  
El diagrama entidad–relación representa la estructura de la base de datos y muestra cómo se relacionan las entidades principales del sistema.

El diseño busca mantener la información organizada, evitar datos duplicados y facilitar el control de usuarios, pedidos, entregas y calificaciones.

---

## 1. Entidad Usuarios

La entidad **usuarios** almacena la información de todas las personas que utilizan el sistema.  
Un usuario puede tener diferentes roles dentro de la plataforma, como cliente, restaurante, repartidor o administrador.

### Atributos principales:
- Identificador del usuario
- Correo electrónico
- Contraseña encriptada
- Rol del usuario
- Nombre completo
- Teléfono
- Estado del usuario
- Fecha de registro

### Relaciones:
- Un usuario cliente puede realizar muchas órdenes.
- Un usuario restaurante está asociado a un solo restaurante.
- Un usuario repartidor está asociado a un solo repartidor.
- Un usuario puede recibir varias notificaciones.

---

## 2. Entidad Restaurantes

La entidad **restaurantes** contiene la información de los establecimientos que ofrecen comida en la plataforma.

### Atributos principales:
- Usuario propietario del restaurante
- Nombre del restaurante
- Dirección
- Teléfono
- Categoría de comida
- Calificación promedio
- Estado del restaurante

### Relaciones:
- Cada restaurante pertenece a un usuario.
- Un restaurante puede tener muchos ítems en su menú.
- Un restaurante puede recibir muchas órdenes.
- Un restaurante puede recibir varias calificaciones.

---

## 3. Entidad Items del Menú

La entidad **items_menu** representa los platillos o productos que ofrece cada restaurante.

### Atributos principales:
- Restaurante al que pertenece
- Nombre del platillo
- Descripción
- Precio
- Categoría
- Disponibilidad
- Tiempo de preparación

### Relaciones:
- Un restaurante puede tener muchos ítems de menú.
- Un ítem del menú puede formar parte de muchas órdenes.

---

## 4. Entidad Órdenes

La entidad **ordenes** registra los pedidos realizados por los clientes dentro del sistema.

### Atributos principales:
- Número de orden
- Cliente que realiza la orden
- Restaurante al que se le hace el pedido
- Dirección de entrega
- Subtotal
- Costo de envío
- Total
- Estado de la orden
- Fecha de creación

### Relaciones:
- Un cliente puede realizar muchas órdenes.
- Un restaurante puede recibir muchas órdenes.
- Una orden contiene varios ítems.
- Una orden tiene una sola entrega.
- Una orden puede tener una calificación de restaurante.

---

## 5. Entidad Items de Orden

La entidad **items_orden** permite almacenar el detalle de los productos incluidos en cada orden.  
Esta tabla funciona como una relación muchos a muchos entre órdenes e ítems del menú.

### Atributos principales:
- Orden a la que pertenece
- Ítem del menú
- Cantidad
- Precio unitario
- Subtotal

---

## 6. Entidad Repartidores

La entidad **repartidores** almacena la información de los usuarios encargados de realizar las entregas.

### Atributos principales:
- Usuario asociado
- Tipo de vehículo
- Calificación promedio
- Disponibilidad
- Fecha de registro

### Relaciones:
- Un repartidor puede realizar muchas entregas.
- Cada repartidor pertenece a un solo usuario.

---

## 7. Entidad Entregas

La entidad **entregas** permite llevar el control del proceso de entrega de una orden.

### Atributos principales:
- Orden asociada
- Repartidor asignado
- Estado de la entrega
- Fecha de asignación
- Fecha de entrega

### Relaciones:
- Cada orden tiene una sola entrega.
- Un repartidor puede realizar muchas entregas.
- Una entrega puede ser calificada.

---

## 8. Entidad Notificaciones

La entidad **notificaciones** registra los mensajes enviados a los usuarios sobre el estado de sus órdenes.

### Atributos principales:
- Usuario destinatario
- Orden relacionada
- Tipo de notificación
- Fecha de creación

### Relaciones:
- Un usuario puede recibir muchas notificaciones.
- Una notificación puede estar relacionada con una orden.

---

## 9. Entidad Calificaciones de Restaurante

Esta entidad permite a los clientes calificar a los restaurantes después de completar una orden.

### Relaciones:
- Cada orden puede tener una sola calificación.
- Un restaurante puede recibir muchas calificaciones.

---

## 10. Entidad Calificaciones de Repartidor

Esta entidad permite a los clientes calificar el servicio del repartidor después de recibir su pedido.

### Relaciones:
- Cada entrega puede tener una sola calificación.
- Un repartidor puede recibir muchas calificaciones.

---

## 11. Enumeraciones (ENUM)

Las enumeraciones se utilizan para controlar valores específicos dentro del sistema, como:
- Roles de usuario
- Estados de las órdenes
- Estados de las entregas
- Categorías de restaurantes
- Tipos de vehículos

