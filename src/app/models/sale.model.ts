export interface Sale {
  id?: string;
  saleNumber: string;
  productId: string;
  productName: string;
  saleSpace: string;
  quantity: number;
  totalPrice: number;
  clientName?: string;
  pointsEarned?: number;
  pointsUsed?: number;
  paymentMethod: string;
  saleDate:string; 
  saleTime?: string; 
  amountPaid: number;
  pointsBefore: number;
  pointsAfter: number;
  discountFromPoints?: number;
}
