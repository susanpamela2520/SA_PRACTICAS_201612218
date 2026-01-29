CREATE TABLE usuarios (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  rol rol_usuario NOT NULL,
  nombre_completo VARCHAR(255) NOT NULL,
  telefono VARCHAR(20),
  activo BOOLEAN DEFAULT TRUE,
  fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE restaurantes (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER UNIQUE NOT NULL,
  nombre VARCHAR(255) NOT NULL,
  direccion TEXT NOT NULL,
  telefono VARCHAR(20) NOT NULL,
  categoria categoria_restaurante NOT NULL,
  calificacion_promedio DECIMAL(3,2) DEFAULT 0.00,
  activo BOOLEAN DEFAULT TRUE,
  fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

CREATE TABLE items_menu (
  id SERIAL PRIMARY KEY,
  restaurante_id INTEGER NOT NULL,
  nombre VARCHAR(255) NOT NULL,
  precio DECIMAL(10,2) NOT NULL,
  disponible BOOLEAN DEFAULT TRUE,
  tiempo_preparacion INTEGER DEFAULT 15,
  FOREIGN KEY (restaurante_id) REFERENCES restaurantes(id)
);

CREATE TABLE repartidores (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER UNIQUE NOT NULL,
  tipo_vehiculo tipo_vehiculo NOT NULL,
  calificacion_promedio DECIMAL(3,2) DEFAULT 0.00,
  disponible BOOLEAN DEFAULT TRUE,
  fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

CREATE TABLE ordenes (
  id SERIAL PRIMARY KEY,
  numero_orden VARCHAR(50) UNIQUE NOT NULL,
  usuario_id INTEGER NOT NULL,
  restaurante_id INTEGER NOT NULL,
  direccion_entrega TEXT NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  costo_envio DECIMAL(10,2) DEFAULT 0.00,
  total DECIMAL(10,2) NOT NULL,
  estado estado_orden NOT NULL,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
  FOREIGN KEY (restaurante_id) REFERENCES restaurantes(id)
);

CREATE TABLE items_orden (
  id SERIAL PRIMARY KEY,
  orden_id INTEGER NOT NULL,
  item_menu_id INTEGER NOT NULL,
  cantidad INTEGER NOT NULL,
  precio_unitario DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (orden_id) REFERENCES ordenes(id),
  FOREIGN KEY (item_menu_id) REFERENCES items_menu(id)
);

CREATE TABLE entregas (
  id SERIAL PRIMARY KEY,
  orden_id INTEGER UNIQUE NOT NULL,
  repartidor_id INTEGER,
  estado estado_entrega NOT NULL,
  fecha_asignacion TIMESTAMP,
  fecha_entrega TIMESTAMP,
  FOREIGN KEY (orden_id) REFERENCES ordenes(id),
  FOREIGN KEY (repartidor_id) REFERENCES repartidores(id)
);
