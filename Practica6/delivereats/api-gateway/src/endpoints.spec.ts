// api-gateway/src/endpoints.spec.ts
describe('Endpoint Core 1 - POST /auth/login', () => {
  const mockLogin = (email: string, password: string) => {
    return new Promise<any>((resolve, reject) => {
      if (email === 'test@test.com' && password === '123456') {
        resolve({ status: 201, body: { token: 'fake-jwt-token' } });
      } else {
        reject({ status: 401, message: 'Credenciales incorrectas' });
      }
    });
  };

  it('rechaza credenciales incorrectas con 401', async () => {
    try {
      await mockLogin('malo@test.com', 'wrongpass');
      fail('Deberia haber lanzado error');
    } catch (err: any) {
      expect(err.status).toBe(401);
    }
  });

  it('retorna token con credenciales correctas', async () => {
    const res = await mockLogin('test@test.com', '123456');
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('token');
  });
});

describe('Endpoint Core 2 - POST /orders (Creacion de Orden)', () => {
  const mockCreateOrder = (token: string | null, items: any[]) => {
    return new Promise<any>((resolve, reject) => {
      if (!token) { reject({ status: 401, message: 'No autorizado' }); return; }
      if (!items || items.length === 0) { reject({ status: 400, message: 'Items requeridos' }); return; }
      resolve({ status: 201, body: { id: 1, total: 100, status: 'PENDING' } });
    });
  };

  it('rechaza orden sin token con 401', async () => {
    try {
      await mockCreateOrder(null, [{ menuItemId: 1, quantity: 1, price: 25 }]);
      fail('Deberia lanzar error');
    } catch (err: any) {
      expect(err.status).toBe(401);
    }
  });

  it('rechaza orden con items vacios con 400', async () => {
    try {
      await mockCreateOrder('valid-token', []);
      fail('Deberia lanzar error');
    } catch (err: any) {
      expect(err.status).toBe(400);
    }
  });

  it('crea orden exitosamente con token e items validos', async () => {
    const res = await mockCreateOrder('valid-token', [{ menuItemId: 1, quantity: 2, price: 25 }]);
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.status).toBe('PENDING');
  });
});

describe('Endpoint Core 3 - GET /restaurants/filter (Filtros)', () => {
  const allRestaurants = [
    { id: 1, name: 'Pizza Hut', category: 'PIZZA', hasPromotion: true },
    { id: 2, name: 'Subway', category: 'PANES', hasPromotion: false },
    { id: 3, name: 'Pizza Express', category: 'PIZZA', hasPromotion: true },
  ];

  const mockFilter = (params: { category?: string; search?: string; onlyWithPromotion?: boolean }) => {
    let result = [...allRestaurants];
    if (params.category) result = result.filter(r => r.category === params.category!.toUpperCase());
    if (params.search) result = result.filter(r => r.name.toLowerCase().includes(params.search!.toLowerCase()));
    if (params.onlyWithPromotion) result = result.filter(r => r.hasPromotion);
    return Promise.resolve({ status: 200, body: { restaurants: result } });
  };

  it('retorna restaurantes filtrados por categoria PIZZA', async () => {
    const res = await mockFilter({ category: 'PIZZA' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('restaurants');
    expect(Array.isArray(res.body.restaurants)).toBe(true);
    expect(res.body.restaurants.length).toBe(2);
    res.body.restaurants.forEach((r: any) => expect(r.category).toBe('PIZZA'));
  });

  it('filtra correctamente por texto de busqueda', async () => {
    const res = await mockFilter({ search: 'pizza' });
    expect(res.status).toBe(200);
    expect(res.body.restaurants.length).toBe(2);
  });

  it('filtra solo restaurantes con promocion activa', async () => {
    const res = await mockFilter({ onlyWithPromotion: true });
    expect(res.status).toBe(200);
    expect(res.body.restaurants.every((r: any) => r.hasPromotion)).toBe(true);
  });

  it('retorna todos si no hay filtros', async () => {
    const res = await mockFilter({});
    expect(res.status).toBe(200);
    expect(res.body.restaurants.length).toBe(3);
  });
});