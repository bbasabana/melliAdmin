import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ManagementService } from '../../services/management.service';
import { Product } from '../../models/product.model';
import { Sale } from '../../models/sale.model';
import { Client } from '../../models/client.model';
import { Expense } from '../../models/expense.model';
import { NavMenuComponent } from '../../components/nav-menu/nav-menu.component';
import { StockComponent } from "../../components/stock/stock.component";
import { SalesComponent } from '../../components/sales/sales.component';
import { SalesListComponent } from '../../components/sales-list/sales-list.component';
import { CustomersComponent } from "../../components/customers/customers.component";
import { PurchasesComponent } from '../../components/purchases/purchases.component';
import { ExpensesComponent } from '../../components/expenses/expenses.component';
import { ListProduitComponent } from "../../components/list-produit/list-produit.component";
import { AddOptionComponent } from "../../shared/add-option/add-option.component";
import { Purchase } from '../../models/purchase.model';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, NavMenuComponent, StockComponent, SalesComponent, CustomersComponent, PurchasesComponent, ExpensesComponent, ListProduitComponent, AddOptionComponent, SalesListComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  products: Product[] = [];
  sales: Sale[] = [];
  clients: Client[] = [];
  expenses: Expense[] = [];
  purchases: Purchase[] = [];
  
  // Statistiques principales
  totalInvested: number = 0;
  totalSalesVIP: number = 0;
  totalSalesTerrace: number = 0;
  totalPoints: number = 0;
  totalExpenses: number = 0;
  totalPurchases: number = 0;
  totalDiscountFromPoints: number = 0;
  
  // Statistiques avancées
  profitVIP: number = 0;
  profitTerrace: number = 0;
  totalClients: number = 0;
  bestSellingProduct: {name: string, count: number} = {name: '', count: 0};
  
  currentComponent = 'dashboard';
  isLoading = true;

  constructor(private managementService: ManagementService) {}

  async ngOnInit(): Promise<void> {
    await this.loadData();
    this.isLoading = false;
  }

  async loadData(): Promise<void> {
    try {
      // Chargement en parallèle pour meilleures performances
      const [products, sales, clients, expenses, purchases] = await Promise.all([
        this.managementService.getProducts(),
        this.managementService.getSales(),
        this.managementService.getClients(),
        this.managementService.getExpenses(),
        this.managementService.getPurchases()
      ]);

      this.products = products;
      this.sales = sales;
      this.clients = clients;
      this.expenses = expenses;
      this.purchases = purchases;

      this.calculateStatistics();
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    }
  }

  private calculateStatistics(): void {
    // Investissements et achats
    this.totalInvested = this.products.reduce((total, product) => 
      total + (product.purchasePrice || 0), 0);
    
    this.totalPurchases = this.purchases.reduce((total, purchase) => 
      total + (purchase.totalPrice || 0), 0);

    // Ventes
    const vipSales = this.sales.filter(sale => sale.saleSpace === 'VIP');
    const terraceSales = this.sales.filter(sale => sale.saleSpace === 'Terrasse');
    
    this.totalSalesVIP = vipSales.reduce((total, sale) => 
      total + (sale.amountPaid || 0), 0);
    
    this.totalSalesTerrace = terraceSales.reduce((total, sale) => 
      total + (sale.amountPaid || 0), 0);
    
    this.totalDiscountFromPoints = this.sales.reduce((total, sale) => 
      total + (sale.discountFromPoints || 0), 0);

    // Points clients
    this.totalPoints = this.clients.reduce((total, client) => 
      total + (client.points || 0), 0);
    
    this.totalClients = this.clients.length;

    // Dépenses
    this.totalExpenses = this.expenses.reduce((total, expense) => 
      total + (expense.amount || 0), 0);

    // Calcul des profits
    this.profitVIP = this.totalSalesVIP - this.calculateCostOfSales(vipSales);
    this.profitTerrace = this.totalSalesTerrace - this.calculateCostOfSales(terraceSales);

    // Produit le plus vendu
    this.calculateBestSellingProduct();
  }

  private calculateCostOfSales(sales: Sale[]): number {
    return sales.reduce((total, sale) => {
      const product = this.products.find(p => p.id === sale.productId);
      if (product) {
        const costPerUnit = product.purchasePrice / product.quantity;
        return total + (costPerUnit * sale.quantity);
      }
      return total;
    }, 0);
  }

  private calculateBestSellingProduct(): void {
    const productSales: {[key: string]: number} = {};
    
    this.sales.forEach(sale => {
      if (!productSales[sale.productId]) {
        productSales[sale.productId] = 0;
      }
      productSales[sale.productId] += sale.quantity;
    });

    let maxCount = 0;
    let bestProductId = '';
    
    Object.entries(productSales).forEach(([productId, count]) => {
      if (count > maxCount) {
        maxCount = count;
        bestProductId = productId;
      }
    });

    if (bestProductId) {
      const product = this.products.find(p => p.id === bestProductId);
      this.bestSellingProduct = {
        name: product?.name || 'Inconnu',
        count: maxCount
      };
    }
  }

  loadContent(section: string): void {
    this.currentComponent = section;
  }

  refreshData(): void {
    this.isLoading = true;
    this.loadData().then(() => {
      this.isLoading = false;
    });
  }
}