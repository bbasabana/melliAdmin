export interface Product {
  id: string;
  name: string;
  type: 'Boisson' | 'Nourriture';
  boissonType?: 'Vin' | 'Biere' | 'Sucree' | 'Eau' | 'Whisky' | 'Autre';
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
  packageType: 'casier' | 'paquet'; // Nouveau champ pour le type d'emballage
  caseType: 'full' | 'half'; // Seulement si packageType = 'casier'
  marginVIP: number;
  marginTerrace: number;
  marginDemiPlatVIP?: number;
  marginDemiPlatTerrace?: number;
  marginUnitVIP?: number;       // Marge unitaire VIP
  marginUnitTerrace?: number;
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
  createdAt: string;
  lastModified?: string;
  packageSize?: number; // Taille du paquet (12 ou 24)
}
