export const BACKEND_MODEL = {
  base: '/api',
  resources: {
    movies: {
      endpoint: '/movies',
      fields: ['id', 'title', 'durationMin', 'ageRating', 'description', 'imageUrl', 'active'],
    },
    theaters: {
      endpoint: '/theaters',
      replaces: 'rooms',
      fields: ['id', 'name', 'capacity'],
    },
    screenings: {
      endpoint: '/screenings',
      replaces: 'sessions',
      fields: ['id', 'dateTime', 'price', 'status', 'movie', 'theater'],
      relations: ['movie', 'theater'],
    },
    purchases: {
      endpoint: '/purchases',
      replaces: 'reservations',
      fields: ['id', 'status', 'paymentMethod', 'total', 'createdAt', 'screening', 'user', 'seats'],
      relations: ['screening', 'user', 'seats'],
    },
    users: {
      endpoint: '/users',
      fields: ['id', 'email', 'role', 'dateOfBirth'],
      roles: ['ADMIN', 'CLIENT'],
    },
    seats: {
      endpoint: '/seats',
      screeningSeatsEndpoint: '/screenings/:screeningId/seats',
    },
    merchandise: {
      endpoint: '/merchandise',
      replaces: 'inventory',
    },
  },
};
