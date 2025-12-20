import { User } from '@/types';

// Initial mock users data
let users: User[] = [
  {
    id: '1',
    name: 'Admin Vape',
    email: 'admin@vapestore.com',
    role: 'admin',
  },
  {
    id: '2',
    name: 'Kasir 1',
    email: 'kasir1@vapestore.com',
    role: 'kasir',
  },
  {
    id: '3',
    name: 'Budi Santoso',
    email: 'budi@vapestore.com',
    role: 'kasir',
  },
  {
    id: '4',
    name: 'Siti Rahayu',
    email: 'siti@vapestore.com',
    role: 'kasir',
  },
];

export const getUsers = (): User[] => [...users];

export const getUserById = (id: string): User | undefined => {
  return users.find(u => u.id === id);
};

export const addUser = (user: Omit<User, 'id'>): User => {
  const newUser: User = {
    ...user,
    id: Date.now().toString(),
  };
  users = [...users, newUser];
  return newUser;
};

export const updateUser = (id: string, data: Partial<User>): User | undefined => {
  const index = users.findIndex(u => u.id === id);
  if (index === -1) return undefined;
  
  users[index] = { ...users[index], ...data };
  return users[index];
};

export const deleteUser = (id: string): boolean => {
  const initialLength = users.length;
  users = users.filter(u => u.id !== id);
  return users.length < initialLength;
};

export const mockUsers = users;
