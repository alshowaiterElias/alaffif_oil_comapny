import { faker } from '@faker-js/faker';

// Add this helper function
const randomElement = <T>(array: T[]): T => {
  return array[Math.floor(Math.random() * array.length)];
};

// Define types
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'manager';
  createdAt: string;
  lastLogin: string;
  status: 'active' | 'inactive';
}

export interface UserRequest {
  id: string;
  name: string;
  email: string;
  requestDate: string;
  status: 'pending' | 'approved' | 'rejected';
  message: string;
}

export interface Report {
  id: string;
  userId: string;
  userName: string;
  date: string;
  location: string;
  status: 'submitted' | 'reviewed' | 'approved' | 'rejected';
  notes: string;
  measurements: Record<string, number>;
}

// Generate dummy data
export const generateUsers = (count: number): User[] => {
  return Array.from({ length: count }, () => ({
    id: faker.string.uuid(),
    name: faker.person.fullName(),
    email: faker.internet.email(),
    role: randomElement(['admin', 'user', 'manager']) as 'admin' | 'user' | 'manager',
    createdAt: faker.date.past().toISOString(),
    lastLogin: faker.date.recent().toISOString(),
    status: randomElement(['active', 'inactive']) as 'active' | 'inactive',
  }));
};

export const generateUserRequests = (count: number): UserRequest[] => {
  return Array.from({ length: count }, () => ({
    id: faker.string.uuid(),
    name: faker.person.fullName(),
    email: faker.internet.email(),
    requestDate: faker.date.recent().toISOString(),
    status: randomElement(['pending', 'approved', 'rejected']) as 'pending' | 'approved' | 'rejected',
    message: faker.lorem.paragraph(),
  }));
};

export const generateOilReports = (count: number, users: User[]): Report[] => {
  return Array.from({ length: count }, () => {
    const user = randomElement(users);
    return {
      id: faker.string.uuid(),
      userId: user.id,
      userName: user.name,
      date: faker.date.recent().toISOString(),
      location: faker.location.city(),
      status: randomElement(['submitted', 'reviewed', 'approved', 'rejected']) as 'submitted' | 'reviewed' | 'approved' | 'rejected',
      notes: faker.lorem.paragraph(),
      measurements: {
        viscosity: parseFloat(faker.number.float({ min: 20, max: 100, fractionDigits: 1 }).toFixed(2)),
        density: parseFloat(faker.number.float({ min: 0.8, max: 1.2, fractionDigits: 1 }).toFixed(3)),
        flashPoint: parseFloat(faker.number.float({ min: 150, max: 400, fractionDigits: 1 }).toFixed(1)),
        pourPoint: parseFloat(faker.number.float({ min: -50, max: 30, fractionDigits: 1 }).toFixed(1)),
        waterContent: parseFloat(faker.number.float({ min: 0, max: 2, fractionDigits:1 }).toFixed(2)),
      },
    };
  });
};

export const generateDieselReports = (count: number, users: User[]): Report[] => {
  return Array.from({ length: count }, () => {
    const user = randomElement(users);
    return {
      id: faker.string.uuid(),
      userId: user.id,
      userName: user.name,
      date: faker.date.recent().toISOString(),
      location: faker.location.city(),
      status: randomElement(['submitted', 'reviewed', 'approved', 'rejected']) as 'submitted' | 'reviewed' | 'approved' | 'rejected',
      notes: faker.lorem.paragraph(),
      measurements: {
        cetaneNumber: parseFloat(faker.number.float({ min: 40, max: 60, fractionDigits: 1 }).toFixed(1)),
        density: parseFloat(faker.number.float({ min: 0, max:10, fractionDigits: 1 }).toFixed(3)),
        sulfurContent: parseFloat(faker.number.float({ min: 0, max: 500, fractionDigits: 1 }).toFixed(1)),
        cloudPoint: parseFloat(faker.number.float({ min: -30, max: 10, fractionDigits: 1 }).toFixed(1)),
        viscosity: parseFloat(faker.number.float({ min: 2, max: 4.5, fractionDigits: 1 }).toFixed(2)),
      },
    };
  });
};

export const generateWaterReports = (count: number, users: User[]): Report[] => {
  return Array.from({ length: count }, () => {
    const user = randomElement(users);
    return {
      id: faker.string.uuid(),
      userId: user.id,
      userName: user.name,
      date: faker.date.recent().toISOString(),
      location: faker.location.city(),
      status: randomElement(['submitted', 'reviewed', 'approved', 'rejected']) as 'submitted' | 'reviewed' | 'approved' | 'rejected',
      notes: faker.lorem.paragraph(),
      measurements: {
        ph: parseFloat(faker.number.float({ min: 6, max: 9, fractionDigits: 1 }).toFixed(1)),
        tds: parseFloat(faker.number.float({ min: 50, max: 1000, fractionDigits: 1 }).toFixed(0)),
        turbidity: parseFloat(faker.number.float({ min: 0, max: 10, fractionDigits: 1 }).toFixed(2)),
        conductivity: parseFloat(faker.number.float({ min: 50, max: 1500, fractionDigits: 1 }).toFixed(0)),
        hardness: parseFloat(faker.number.float({ min: 0, max: 500, fractionDigits: 1 }).toFixed(0)),
      },
    };
  });
};

// Generate initial data
const dummyUsers = generateUsers(20);
export const dummyUserRequests = generateUserRequests(15);
export const dummyOilReports = generateOilReports(30, dummyUsers);
export const dummyDieselReports = generateDieselReports(25, dummyUsers);
export const dummyWaterReports = generateWaterReports(35, dummyUsers);

export { dummyUsers as users }; 