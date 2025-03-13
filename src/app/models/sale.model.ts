// src/app/models/sale.model.ts
export interface Sale {
    id?: string;
    date: Date;
    product: string;
    space: 'VIP' | 'Terrasse';
    quantity: number;
    totalPrice: number;
    clientName: string;
  }