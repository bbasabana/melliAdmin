export interface Client {
  id?: string; 
  clientNumber: string;
  name: string;
  phoneNumber: string;
  email?: string;
  address?: string;
  points: number;
  totalSpent: number;
  createdAt?: Date;
  updatedAt?: Date;
  }