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
import { CustomersComponent } from "../../components/customers/customers.component";
import { PurchasesComponent } from '../../components/purchases/purchases.component';
import { ExpensesComponent } from '../../components/expenses/expenses.component';
import { ListProduitComponent } from "../../components/list-produit/list-produit.component";
import { AddOptionComponent } from "../../shared/add-option/add-option.component";

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, NavMenuComponent, StockComponent, SalesComponent, CustomersComponent, PurchasesComponent, ExpensesComponent, ListProduitComponent, AddOptionComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent  {

  products: Product[] = [];
  sales: Sale[] = [];
  clients: Client[] = [];
  expenses: Expense[] = [];
  totalInvested: number = 0;
  totalSalesVIP: number = 0;
  totalSalesTerrace: number = 0;
  totalPoints: number = 0;
  totalExpenses: number = 0;

  constructor(private managementService: ManagementService) {}

  ngOnInit(): void {
    // Récupération des produits
    this.managementService.getProducts()
      .then((products) => {
        this.products = products;
        this.totalInvested = this.products.reduce((total, product) => total + product.purchasePrice, 0);
      })
      .catch((error) => {
        console.error("Erreur de récupération des produits: ", error);
      });

    // Récupération des ventes
    this.managementService.getSales()
      .then((sales) => {
        this.sales = sales;
        this.totalSalesVIP = this.sales.filter(sale => sale.space === 'VIP').reduce((total, sale) => total + sale.totalPrice, 0);
        this.totalSalesTerrace = this.sales.filter(sale => sale.space === 'Terrasse').reduce((total, sale) => total + sale.totalPrice, 0);
      })
      .catch((error) => {
        console.error("Erreur de récupération des ventes: ", error);
      });

    // Récupération des clients
    this.managementService.getClients()
      .then((clients) => {
        this.clients = clients;
        this.totalPoints = this.clients.reduce((total, client) => total + client.points, 0);
      })
      .catch((error) => {
        console.error("Erreur de récupération des clients: ", error);
      });

    // Récupération des dépenses
    this.managementService.getExpenses()
      .then((expenses) => {
        this.expenses = expenses;
        this.totalExpenses = this.expenses.reduce((total, expense) => total + expense.amount, 0);
      })
      .catch((error) => {
        console.error("Erreur de récupération des dépenses: ", error);
      });
  }
  currentComponent = 'dashboard'; // Composant actif par défaut

  loadContent(section: string) {
    this.currentComponent = section; // Mettre à jour le composant actif
  }


}
