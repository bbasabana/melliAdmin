

export interface Product {
  id: string;
  name: string;
  type: 'Boisson' | 'Nourriture';
  boissonType?: 'Vin' | 'Biere' | 'Sucree' | 'Eau' | 'Whisky';
  quantity: number;
  bottlesPerCase: number;
  pricePerBottle: number;
  purchasePrice: number;
  vipPrice: number;
  terracePrice: number;
  profitVIP: number;
  profitTerrace: number;
  isForSale: boolean;
  observations: string;
  caseType: 'full' | 'half';
  marginVIP: number;
  marginTerrace: number;
  plats: number;
  pricePerPlat: number;
  marginPlatVIP: number;
  marginPlatTerrace: number;
  nombreCasier: number;
  nombrePaquet: number;
  hasDemiPlat: boolean;
  demiPlats: number;
  vipPriceDemiPlat: number;
  terracePriceDemiPlat: number;
  nombreBouteilles: number;
  createdAt?: Date | string; // Add this line
  lastModified?: Date | string; // A
}