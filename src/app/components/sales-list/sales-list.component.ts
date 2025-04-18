import { Component, OnInit } from '@angular/core';
import { ManagementService } from '../../services/management.service';
import { Sale } from '../../models/sale.model';
import { NotifictionService } from '../../services/notification/notifiction.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Product } from '../../models/product.model';

@Component({
  selector: 'app-sales-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sales-list.component.html',
  styleUrl: './sales-list.component.scss'
})
export class SalesListComponent implements OnInit  {
  [x: string]: any;
  sales: Sale[] = [];
  filteredSales: Sale[] = [];
  products: Product[] = [];
  isLoading = true;
  searchTerm = '';
  currentPage = 1;
  itemsPerPage = 10;

  // Modal states
  showConfirmModal = false;
  showEditModal = false;
  saleToDelete: Sale | null = null;
  //saleToEdit: Sale | null = null;
  saleToEdit: Partial<Sale> & { 
    saleDateInput?: string; 
    saleTimeInput?: string 
  } | null = null;


  // Filtres
  filters = {
    dateFrom: '',
    dateTo: '',
    saleSpace: '',
    paymentMethod: ''
  };

  constructor(
    private managementService: ManagementService,
    private notification: NotifictionService
  ) {}

  async ngOnInit(): Promise<void> {
    await this.loadSales();
  }

  async loadSales(): Promise<void> {
    try {
      this.isLoading = true;
      this.sales = await this.managementService.getSales();
      this.applyFilters();
    } catch (error) {
      console.error('Error loading sales:', error);
      this.notification.showError('Erreur lors du chargement des ventes');
    } finally {
      this.isLoading = false;
    }
  }


  async loadProducts(): Promise<void> {
    try {
      const products = await this.managementService.getProducts();
      if (!Array.isArray(products)) {
        throw new Error('Format de produits invalide');
      }
      this.products = products;
    } catch (error) {
      console.error('Error loading products:', error);
      this.notification.showError('Erreur lors du chargement des produits');
      this.products = []; // Réinitialiser pour éviter des erreurs
    }
  }

  applyFilters(): void {
    this.filteredSales = this.sales.filter(sale => {
      // Vérifications de base
      if (!sale?.saleNumber || !sale?.productName) return false;

      // Filtre de recherche
      const matchesSearch = !this.searchTerm || 
        [sale.saleNumber, sale.clientName, sale.productName].some(
          field => field?.toLowerCase().includes(this.searchTerm.toLowerCase())
        );

      // Filtre par date
      const saleDate = new Date(sale.saleDate).getTime();
      const dateFrom = this.filters.dateFrom ? new Date(this.filters.dateFrom).getTime() : 0;
      const dateTo = this.filters.dateTo ? new Date(this.filters.dateTo).getTime() : Date.now();
      const matchesDate = (!this.filters.dateFrom || saleDate >= dateFrom) &&
                         (!this.filters.dateTo || saleDate <= dateTo);

      // Filtres supplémentaires
      const matchesSpace = !this.filters.saleSpace || sale.saleSpace === this.filters.saleSpace;
      const matchesPayment = !this.filters.paymentMethod || sale.paymentMethod === this.filters.paymentMethod;

      return matchesSearch && matchesDate && matchesSpace && matchesPayment;
    });

    this.currentPage = 1;
  }
  // Méthodes utilitaires
  safeGet(value: any, defaultValue: any = ''): any {
    return value !== undefined && value !== null ? value : defaultValue;
  }

  safeDate(date: any, format: string = 'dd/MM/yyyy'): string {
    try {
      if (!date) return '-';
      const dateObj = new Date(date);
      return isNaN(dateObj.getTime()) ? '-' : dateObj.toLocaleDateString('fr-FR');
    } catch {
      return '-';
    }
  }

  safeNumber(value: any): number {
    return isNaN(Number(value)) ? 0 : Number(value);
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.filters = {
      dateFrom: '',
      dateTo: '',
      saleSpace: '',
      paymentMethod: ''
    };
    this.applyFilters();
  }

  // Gestion des modals
  async openEditModal(sale: Sale): Promise<void> {
    try {
      if (!this.products.length) await this.loadProducts();
      
      // Vérification de la date
      let saleDate = sale.saleDate ? new Date(sale.saleDate) : new Date();
      if (isNaN(saleDate.getTime())) {
        console.error('Date invalide dans la vente:', sale.saleDate);
        saleDate = new Date(); // Fallback à la date actuelle
      }
  
      // Création de l'objet d'édition avec toutes les propriétés
      this.saleToEdit = {
        ...sale,
        saleDateInput: saleDate.toISOString().split('T')[0],
        saleTimeInput: saleDate.toTimeString().substring(0, 5),
        // Assurez-vous que toutes les propriétés sont incluses
        productId: sale.productId,
        productName: sale.productName,
        saleSpace: sale.saleSpace,
        quantity: sale.quantity,
        totalPrice: sale.totalPrice,
        clientName: sale.clientName,
        pointsEarned: sale.pointsEarned,
        pointsUsed: sale.pointsUsed,
        paymentMethod: sale.paymentMethod,
        amountPaid: sale.amountPaid,
        pointsBefore: sale.pointsBefore,
        pointsAfter: sale.pointsAfter,
        discountFromPoints: sale.discountFromPoints || 0
      };
      
      this.showEditModal = true;
    } catch (error) {
      console.error('Erreur dans openEditModal:', error);
      this.notification.showError('Erreur lors de la préparation de l\'édition');
    }
  }


  closeEditModal(): void {
    this.showEditModal = false;
    this.saleToEdit = null;
  }

  updateSaleTotal(): void {
    if (!this.saleToEdit) return;

    const product = this.products.find(p => p.id === this.saleToEdit?.productId);
    
    if (product) {
      const price = this.saleToEdit.saleSpace === 'VIP' ? product.vipPrice : product.terracePrice;
      this.saleToEdit.totalPrice = price * this.safeNumber(this.saleToEdit.quantity);
      this.calculatePayment();
    }
  }

  calculatePayment(): void {
    if (!this.saleToEdit) return;

    let amountToPay = this.safeNumber(this.saleToEdit.totalPrice);
    let discountFromPoints = 0;

    if (this.saleToEdit.paymentMethod === 'Points' && this.saleToEdit.pointsUsed) {
      discountFromPoints = Math.floor(this.safeNumber(this.saleToEdit.pointsUsed) / 10) * 5000;
      amountToPay = Math.max(0, amountToPay - discountFromPoints);
    }

    this.saleToEdit.amountPaid = amountToPay;
    this.saleToEdit.discountFromPoints = discountFromPoints;
  }

// Modifiez saveEditedSale
async saveEditedSale(): Promise<void> {
  if (!this.saleToEdit) return;

  try {
    // Validation des champs requis
    if (!this.saleToEdit.productId || !this.saleToEdit.quantity || !this.saleToEdit.paymentMethod) {
      throw new Error('Veuillez remplir tous les champs obligatoires');
    }

    // Combine date et heure
    const dateObj = new Date(
      `${this.saleToEdit.saleDateInput}T${this.saleToEdit.saleTimeInput || '00:00'}:00`
    );

    if (isNaN(dateObj.getTime())) {
      throw new Error('Date/heure invalide');
    }

    // Prépare l'objet à sauvegarder
    const { saleDateInput, saleTimeInput, ...saleData } = this.saleToEdit;
    const saleToSave: Sale = {
      ...saleData as Sale,
      saleDate: dateObj.toISOString(),
      // Calcul des points avec valeurs par défaut
      pointsAfter: (this.saleToEdit.pointsBefore || 0) - (this.saleToEdit.pointsUsed || 0) + (this.saleToEdit.pointsEarned || 0)
    };

    await this.managementService.updateSale(saleToSave);
    this.notification.showSuccess('Vente mise à jour avec succès');
    await this.loadSales();
    this.closeEditModal();
  } catch (error) {
    console.error('Erreur dans saveEditedSale:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la mise à jour';
    this.notification.showError(errorMessage);
  }
}
// Formatage de la date
formatDisplayDate(isoString: string): string {
  if (!isoString) return 'Non spécifiée';
  
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return 'Date invalide';
    
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (e) {
    console.error('Erreur de formatage de date:', e);
    return 'Date invalide';
  }
}

  getSafeDate(sale: Sale): string {
    return sale?.saleDate ? this.formatDisplayDate(sale.saleDate) : 'Non spécifiée';
  }


  openDeleteModal(sale: Sale): void {
    this.saleToDelete = sale;
    this.showConfirmModal = true;
  }

  closeConfirmModal(): void {
    this.showConfirmModal = false;
    this.saleToDelete = null;
  }

  async confirmDelete(): Promise<void> {
    if (!this.saleToDelete) return;

    try {
      await this.managementService.deleteSale(this.saleToDelete.saleNumber);
      this.notification.showSuccess('Vente supprimée avec succès');
      await this.loadSales();
    } catch (error) {
      console.error('Error deleting sale:', error);
      this.notification.showError('Erreur lors de la suppression');
    } finally {
      this.closeConfirmModal();
    }
  }

  // Pagination
  get totalItems(): number {
    return this.filteredSales?.length || 0;
  }

  get paginatedSales(): Sale[] {
    if (!this.filteredSales || this.filteredSales.length === 0) {
      return [];
    }
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredSales.slice(start, start + this.itemsPerPage);
  }

  calculateEndIndex(): number {
    const end = this.currentPage * this.itemsPerPage;
    return end > this.totalItems ? this.totalItems : end;
  }

  getPageNumbers(): number[] {
    const pageCount = Math.ceil(this.totalItems / this.itemsPerPage);
    return Array.from({ length: pageCount }, (_, i) => i + 1);
  }

  // Tri des colonnes
  sortBy(column: string): void {
    this.filteredSales.sort((a, b) => {
      const aValue = this.safeGet(a[column as keyof Sale]);
      const bValue = this.safeGet(b[column as keyof Sale]);
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return aValue - bValue;
      }
      
      return String(aValue).localeCompare(String(bValue));
    });
  }
}
