// src/app/models/expense.model.ts
export interface Expense {
    id?: string;
    date: Date;
    description: string;
    amount: number;
  }