import { Component, ChangeDetectorRef, OnInit, OnDestroy } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { ManagementService } from '../../services/management.service';
import { Product } from '../../models/product.model';
import { NotifictionService } from '../../services/notification/notifiction.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // Import FormsModule
import { Timestamp } from 'firebase/firestore';


@Component({
  selector: 'app-list-produit',
  imports: [CommonModule,FormsModule],
  templateUrl: './list-produit.component.html',
  styleUrl: './list-produit.component.scss'
})
export class ListProduitComponent implements OnInit, OnDestroy {
private ngUnsubscribe = new Subject<void>();

  products: Product[] = [];
    filteredProducts: Product[] = [];
    totalProducts: number = 0;
    totalVipMargin: number = 0;
    totalTerraceMargin: number = 0;
    totalBottlesSucree: number = 0;
    totalBottlesBiere: number = 0;
    searchTerm: string = '';
    productTypeFilter: string = ''; //'' or "Boisson" or "Nourriture"
    pageSize: number = 10;
    currentPage: number = 1;
    isEditModalOpen: boolean = false;
    productToEdit: Product | null = null;
    isDeleteModalOpen: boolean = false;
    productToDeleteId: string | null = null;
    isLoading: boolean = false;
    stockAlerts: { [productId: string]: boolean } = {};  // Object to track stock alerts
    initialProductsLength: number = 0; // Store the initial length of the product list

    constructor(private managementService: ManagementService,
                private notificationService: NotifictionService,
                private cdr: ChangeDetectorRef
    ) {
    }

    ngOnInit(): void {
        this.loadProducts();
    }

    ngOnDestroy(): void {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }

    // async loadProducts() {
    //     this.isLoading = true;
    //     try {
    //         this.products = await this.managementService.getProducts();
    //         this.initialProductsLength = this.products.length; // Store the initial length
    //         this.products.forEach(product => {
    //          if (product.lastModified) {
    //                 if (typeof product.lastModified === 'string') {
    //                     product.lastModified = this.formatDate(product.lastModified);
    //                 }
    //              if (typeof product.createdAt === 'string') {
    //                     product.createdAt = this.formatDate(product.createdAt);
    //                 }
    //             }

    //         });
    //         this.filterProducts();
    //         this.calculateTotals();
    //         this.checkStockAlerts();
    //     } catch (error) {
    //         this.notificationService.showError('Impossible de charger les produits.');
    //         console.error(error);
    //     } finally {
    //         this.isLoading = false;
    //     }
    // }

    async loadProducts() {
        this.isLoading = true;
        try {
            const products = await this.managementService.getProducts();
            this.products = products.map(product => {
                if (product.lastModified && typeof product.lastModified === 'string') {
                    product.lastModified = this.formatDate(product.lastModified);
                }
                if (product.createdAt && typeof product.createdAt === 'string') {
                    product.createdAt = this.formatDate(product.createdAt);
                }
                return product;
            });
            this.initialProductsLength = this.products.length;
            this.filterProducts();
            this.calculateTotals();
            this.checkStockAlerts();
        } catch (error) {
            this.notificationService.showError('Impossible de charger les produits.');
            console.error(error);
        } finally {
            this.isLoading = false;
        }
    }

    formatDate(date: Date | string | Timestamp): string {
          if (!date) return '';
   
       let jsDate: Date;
   
       if (typeof date === 'string') {
           jsDate = new Date(date);
       } else if (typeof date === 'object' && 'seconds' in date) {
           jsDate = new Date(date.seconds * 1000); // Convert Firestore Timestamp to JavaScript Date
       } else if (date instanceof Date) {
           jsDate = date;
       } else {
           return ''; // Or handle the error as appropriate
       }
   
       const day = String(jsDate.getDate()).padStart(2, '0');
       const month = String(jsDate.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed
       const year = jsDate.getFullYear();
       const hours = String(jsDate.getHours()).padStart(2, '0');
       const minutes = String(jsDate.getMinutes()).padStart(2, '0');
   
       return `${day}/${month}/${year} ${hours}:${minutes}`;
       }

    filterProducts() {
        this.filteredProducts = this.products.filter(product => {
            const searchMatch = product.name.toLowerCase().includes(this.searchTerm.toLowerCase());
            const typeMatch = !this.productTypeFilter || product.type === this.productTypeFilter;
            return searchMatch && typeMatch;
        });
        this.totalProducts = this.filteredProducts.length; // Update total products count
        this.updatePagination();
    }

    onSearchTermChange() {
        this.currentPage = 1;
        this.filterProducts();
    }

    onProductTypeFilterChange() {
        this.currentPage = 1;
        this.filterProducts();
    }

    calculateTotals() {
        this.totalVipMargin = this.products.reduce((sum, product) => sum + (product.marginVIP || 0), 0);
        this.totalTerraceMargin = this.products.reduce((sum, product) => sum + (product.marginTerrace || 0), 0);

        //Recalculate total for biere and sucree
        this.totalBottlesSucree = this.products
            .filter(product => product.type === 'Boisson' && product.boissonType === 'Sucree')
            .reduce((sum, product) => {
                let bottles = product.bottlesPerCase || 0;
                if (product.nombreCasier) {
                    bottles *= product.nombreCasier;
                }
                return sum + bottles;
            }, 0);

        this.totalBottlesBiere = this.products
            .filter(product => product.type === 'Boisson' && product.boissonType === 'Biere')
            .reduce((sum, product) => {
                let bottles = product.bottlesPerCase || 0;
                if (product.nombreCasier) {
                    bottles *= product.nombreCasier;
                }
                return sum + bottles;
            }, 0);
    }

    checkStockAlerts() {
        this.stockAlerts = {}; // Reset alerts

        for (const product of this.products) {
            if (product.type === 'Boisson') {
                if (product.boissonType === 'Vin' || product.boissonType === 'Eau' || product.boissonType === 'Whisky') {
                    if ((product.bottlesPerCase || 0) < 5) {
                        this.stockAlerts[product.id] = true; // Set alert to true
                    }
                }
            } else if (product.type === 'Nourriture' && (product.plats || 0) < 3) {
                this.stockAlerts[product.id] = true;
            }
        }
    }

    // Pagination
    get pagedProducts(): Product[] {
        const startIndex = (this.currentPage - 1) * this.pageSize;
        return this.filteredProducts.slice(startIndex, startIndex + this.pageSize);
    }

    updatePagination() {
        this.currentPage = 1; // Reset to first page on filter change
    }

    goToPage(pageNumber: number) {
        this.currentPage = pageNumber;
    }

    get totalPages(): number {
        return Math.ceil(this.filteredProducts.length / this.pageSize);
    }

    get pageNumbers(): number[] {
        const visiblePages = 5; // Number of visible page numbers in the pagination
        const totalPages = this.totalPages;
        let startPage = Math.max(1, this.currentPage - Math.floor(visiblePages / 2));
        let endPage = Math.min(totalPages, startPage + visiblePages - 1);

        // Adjust startPage and endPage in edge cases
        if (endPage - startPage < visiblePages - 1) {
            startPage = Math.max(1, endPage - visiblePages + 1);
        }

        return Array.from({length: endPage - startPage + 1}, (_, i) => startPage + i);
    }

    // Edit Product
    openEditModal(product: Product) {
        this.productToEdit = {...product}; // Create a copy to avoid direct modification
        this.isEditModalOpen = true;
    }

    closeEditModal() {
        this.isEditModalOpen = false;
        this.productToEdit = null;
    }

    calculateMargins(product: Product) {
      if (product.type === 'Boisson') {
          let unitPrice = 0;
  
          if (product.boissonType === 'Eau' && product.purchasePrice) {
              // Eau : Nombre de paquets * prix d'achat
              unitPrice = product.purchasePrice;
          } else if ((product.boissonType === 'Vin' || product.boissonType === 'Whisky' || product.boissonType === 'Biere' || product.boissonType === 'Sucree')
              && product.bottlesPerCase && product.purchasePrice) {
              // Autres boissons : Calcul basé sur le nombre de bouteilles par casier et le nombre de casiers
              const totalBottles = (product.bottlesPerCase * (product.nombreCasier || 1)) || product.bottlesPerCase;
              unitPrice = product.purchasePrice / totalBottles;
              product.pricePerBottle = unitPrice;
          }
  
          product.pricePerBottle = unitPrice;
          product.profitVIP = product.vipPrice - unitPrice;
          product.profitTerrace = product.terracePrice - unitPrice;
          product.marginVIP = product.profitVIP;
          product.marginTerrace = product.profitTerrace;
  
      } else if (product.type === 'Nourriture' && product.plats && product.purchasePrice) {
          // Calcul pour la nourriture
          product.pricePerPlat = product.purchasePrice / product.plats;
  
          product.marginPlatVIP = product.vipPrice - product.pricePerPlat;
          product.marginPlatTerrace = product.terracePrice - product.pricePerPlat;
  
          product.marginVIP = product.marginPlatVIP;
          product.marginTerrace = product.marginPlatTerrace;
  
          if (product.hasDemiPlat) {
              const pricePerDemiPlat = product.pricePerPlat / 2;
              product.marginPlatVIP = (product.vipPriceDemiPlat ?? 0) - pricePerDemiPlat;
              product.marginPlatTerrace = (product.terracePriceDemiPlat ?? 0) - pricePerDemiPlat;
          }
      } else {
          product.marginVIP = 0;
          product.marginTerrace = 0;
      }
  }

    async saveProduct() {
        if (!this.productToEdit) return;
        this.isLoading = true;
        try {
            //Update Margin beforesave
            this.calculateMargins(this.productToEdit);
            this.productToEdit.lastModified = new Date(); // Update lastModified date
            await this.managementService.updateProduct(this.productToEdit.id, this.productToEdit);
            this.notificationService.showSuccess('Produit mis à jour avec succès!');
            this.closeEditModal();
            await this.loadProducts(); // Reload products to reflect changes
        } catch (error) {
            this.notificationService.showError('Erreur lors de la mise à jour du produit.');
            console.error(error);
        } finally {
            this.isLoading = false;
        }
    }

    // Delete Product
    openDeleteModal(productId: string) {
        this.productToDeleteId = productId;
        this.isDeleteModalOpen = true;
    }

    closeDeleteModal() {
        this.isDeleteModalOpen = false;
        this.productToDeleteId = null;
    }

    // async deleteProduct() {
    //     if (!this.productToDeleteId) return;
    //     this.isLoading = true;
    //     try {
    //         await this.managementService.deleteProduct(this.productToDeleteId);
    //         this.notificationService.showSuccess('Produit supprimé avec succès!');
    //         this.closeDeleteModal();
    //         // After successful deletion, filter out the deleted product from the local arrays.
    //         this.products = this.products.filter(product => product.id !== this.productToDeleteId);
    //         this.filterProducts(); // Refresh the filtered list
    //         this.calculateTotals(); // Recalculate totals
    //         this.checkStockAlerts(); // Recheck alerts
    //     } catch (error) {
    //         this.notificationService.showError('Erreur lors de la suppression du produit.');
    //         console.error(error);
    //     } finally {
    //         this.isLoading = false;
    //     }
    // }


    async deleteProduct() {
        if (!this.productToDeleteId) return;
        this.isLoading = true;
        try {
            await this.managementService.deleteProduct(this.productToDeleteId);
            this.notificationService.showSuccess('Produit supprimé avec succès!');
            this.closeDeleteModal();
            
            await this.loadProducts();
            
            // Forcer le rafraîchissement du template
            this.cdr.detectChanges();
            // 1. Mettre à jour le tableau products
            this.products = this.products.filter(product => product.id !== this.productToDeleteId);
            
            // 2. Rafraîchir la liste filtrée
            this.filterProducts();
            console.log('pagedProducts after filterProducts():', this.pagedProducts); // Add this line
            
            // 3. Recalculer les totaux
            this.calculateTotals();
            
            // 4. Vérifier les alertes de stock
            this.checkStockAlerts();
            
            // 5. Forcer la détection de changements
            setTimeout(() => {
                this.cdr.detectChanges();
            }, 0);
        } catch (error) {
            this.notificationService.showError('Erreur lors de la suppression du produit.');
            console.error(error);
        } finally {
            this.isLoading = false;
        }
    }
    getProductStockLevel(product: Product): string {
      if (product.type === 'Boisson') {
          if (product.boissonType === 'Sucree' || product.boissonType === 'Biere' || product.boissonType === 'Vin' || product.boissonType === 'Eau' || product.boissonType === 'Whisky') {
              return `Bouteilles: ${product.bottlesPerCase || 0}`;
          } else {
              return 'N/A';  // Or handle the case where boissonType is not defined
          }
      } else if (product.type === 'Nourriture') {
          return `Plats: ${product.plats || 0}`;
      } else {
          return 'N/A';
      }
  }
}
