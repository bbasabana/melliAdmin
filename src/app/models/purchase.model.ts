// src/app/models/purchase.model.ts
export interface Purchase {
    id?: string;
    date: Date;
    product: string;
    quantity: number;
    totalCost: number;
  }