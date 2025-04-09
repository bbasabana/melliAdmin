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
    totalPlats: number = 0;
    totalDemiPlats: number = 0;
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
        this.totalPlats = 0;
        this.totalDemiPlats = 0;
    
        // Calcul des totaux par type de produit
        this.totalBottlesSucree = this.products
            .filter(product => product.type === 'Boisson' && product.boissonType === 'Sucree')
            .reduce((sum, product) => {
                if (product.packageType === 'paquet') {
                    return sum + ((product.nombrePaquet || 0) * (product.packageSize || 0));
                } else {
                    return sum + ((product.nombreCasier || 0) * (product.bottlesPerCase || 0));
                }
            }, 0);
    
        this.totalBottlesBiere = this.products
            .filter(product => product.type === 'Boisson' && product.boissonType === 'Biere')
            .reduce((sum, product) => {
                return sum + ((product.nombreCasier || 0) * (product.bottlesPerCase || 0));
            }, 0);
    
        // Calcul des plats et demi-plats
        this.products.forEach(product => {
            if (product.type === 'Nourriture') {
                this.totalPlats += product.plats || 0;
                if (product.hasDemiPlat) {
                    this.totalDemiPlats += product.demiPlats || 0;
                }
            }
        });
    }
    checkStockAlerts() {
        this.stockAlerts = {}; // Reset alerts
    
        for (const product of this.products) {
            if (product.type === 'Boisson') {
                // Alertes pour les boissons
                const totalBottles = product.packageType === 'paquet' 
                    ? (product.nombrePaquet || 0) * (product.packageSize || 0)
                    : (product.nombreCasier || 0) * (product.bottlesPerCase || 0);
                
                if (totalBottles < 5) {
                    this.stockAlerts[product.id] = true;
                }
            } else if (product.type === 'Nourriture') {
                // Alertes pour la nourriture
                if ((product.plats || 0) < 3) {
                    this.stockAlerts[product.id] = true;
                }
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
        this.productToEdit = {
            ...product,
            nombreCasier: product.nombreCasier ?? 0,
            nombrePaquet: product.nombrePaquet ?? 0,
            nombreBouteilles: product.nombreBouteilles ?? 0,
            plats: product.plats ?? 0,
            demiPlats: product.demiPlats ?? 0,
            vipPriceDemiPlat: product.vipPriceDemiPlat ?? 0,
            terracePriceDemiPlat: product.terracePriceDemiPlat ?? 0,
            purchasePrice: product.purchasePrice ?? 0,
            vipPrice: product.vipPrice ?? 0,
            terracePrice: product.terracePrice ?? 0
        };
        this.isEditModalOpen = true;
    }

    closeEditModal() {
        this.isEditModalOpen = false;
        this.productToEdit = null;
    }

    // Méthodes pour gérer les changements dans le formulaire d'édition

    

    onEditTypeChange() {
        if (!this.productToEdit) return;
        
        if (this.productToEdit.type === 'Boisson') {
            // Réinitialiser les champs nourriture
            this.productToEdit.plats = 0;
            this.productToEdit.hasDemiPlat = false;
            this.productToEdit.demiPlats = 0;
            this.productToEdit.vipPriceDemiPlat = 0;
            this.productToEdit.terracePriceDemiPlat = 0;
            
            // Initialiser les valeurs par défaut pour les boissons
            this.productToEdit.boissonType = 'Biere';
            this.onEditBoissonTypeChange();
        } else {
            // Pour la nourriture, supprimer les champs spécifiques aux boissons
            delete (this.productToEdit as any).boissonType;
            delete (this.productToEdit as any).bottlesPerCase;
            delete (this.productToEdit as any).packageType;
            delete (this.productToEdit as any).packageSize;
            
            // Réinitialiser les compteurs
            this.productToEdit.nombreCasier = 0;
            this.productToEdit.nombrePaquet = 0;
            this.productToEdit.nombreBouteilles = 0;
            
            // Initialiser les valeurs pour la nourriture
            this.productToEdit.plats = this.productToEdit.plats ?? 0;
        }
        
        this.calculateMargins(this.productToEdit);
    }


    // onEditBoissonTypeChange() {
    //     if (!this.productToEdit) return;
    
    //     switch (this.productToEdit.boissonType) {
    //         case 'Biere':
    //             this.productToEdit.bottlesPerCase = this.productToEdit.name?.toLowerCase().includes('tembo') ? 12 : 20;
    //             this.productToEdit.packageType = 'casier';
    //             this.productToEdit.nombreCasier = this.productToEdit.nombreCasier ?? 0;
    //             break;
    //         case 'Eau':
    //         case 'Sucree':
    //             this.productToEdit.packageSize = this.productToEdit.boissonType === 'Eau' ? 24 : 12;
    //             this.productToEdit.bottlesPerCase = this.productToEdit.packageSize;
    //             this.productToEdit.packageType = 'casier'; // Valeur par défaut
    //             this.productToEdit.nombreCasier = this.productToEdit.nombreCasier ?? 0;
    //             this.productToEdit.nombrePaquet = this.productToEdit.nombrePaquet ?? 0;
    //             break;
    //         case 'Vin':
    //         case 'Whisky':
    //             this.productToEdit.packageType = 'casier';
    //             this.productToEdit.nombreBouteilles = this.productToEdit.nombreBouteilles ?? 0;
    //             break;
    //     }
    //     this.calculateMargins(this.productToEdit);
    // }

    onEditBoissonTypeChange() {
        if (!this.productToEdit) return;
    
        switch (this.productToEdit.boissonType) {
            case 'Biere':
                this.productToEdit.bottlesPerCase = this.productToEdit.name?.toLowerCase().includes('tembo') ? 12 : 20;
                this.productToEdit.packageType = 'casier';
                this.productToEdit.nombreCasier = this.productToEdit.nombreCasier ?? 0;
                break;
            case 'Eau':
            case 'Sucree':
                this.productToEdit.packageSize = this.productToEdit.boissonType === 'Eau' ? 24 : 12;
                this.productToEdit.bottlesPerCase = this.productToEdit.packageSize;
                this.productToEdit.packageType = 'casier'; // Valeur par défaut
                this.productToEdit.nombreCasier = this.productToEdit.nombreCasier ?? 0;
                this.productToEdit.nombrePaquet = this.productToEdit.nombrePaquet ?? 0;
                break;
            case 'Vin':
            case 'Whisky':
                // Pour Vin/Whisky, on utilise uniquement nombreBouteilles
                this.productToEdit.packageType = undefined;
                this.productToEdit.nombreBouteilles = this.productToEdit.nombreBouteilles ?? 0;
                break;
        }
        this.calculateMargins(this.productToEdit);
    }

    onEditPlatsChange() {
        if (this.productToEdit!.hasDemiPlat) {
            this.productToEdit!.demiPlats = (this.productToEdit!.plats || 0) * 2;
        }
        this.calculateMargins(this.productToEdit!);
    }

    onEditDemiPlatChange() {
        if (this.productToEdit!.hasDemiPlat) {
            this.productToEdit!.demiPlats = (this.productToEdit!.plats || 0) * 2;
        } else {
            this.productToEdit!.demiPlats = 0;
        }
        this.calculateMargins(this.productToEdit!);
    }


    // calculateMargins(product: Product) {
    //     if (product.type === 'Boisson') {
    //         // Calcul pour les boissons
    //         const nombreCasiers = product.nombreCasier;
    //         const nombreBouteilles = product.bottlesPerCase * nombreCasiers;
            
    //         // Prix d'achat total (ne change pas avec le nombre de casiers)
    //         const prixAchatTotal = product.purchasePrice;
            
    //         // Calcul des marges totales
    //         product.marginVIP = (nombreBouteilles * product.vipPrice) - prixAchatTotal;
    //         product.marginTerrace = (nombreBouteilles * product.terracePrice) - prixAchatTotal;
            
    //         // Pour référence (optionnel)
    //         product.pricePerBottle = prixAchatTotal / nombreBouteilles;
    //         product.profitVIP = product.vipPrice - product.pricePerBottle;
    //         product.profitTerrace = product.terracePrice - product.pricePerBottle;
    
    //     } else if (product.type === 'Nourriture' && product.plats && product.purchasePrice) {
    //         // Calcul pour la nourriture
    //         const nombrePlats = product.plats;
    //         const prixAchatTotal = product.purchasePrice;
            
    //         // Calcul des marges totales
    //         product.marginVIP = (nombrePlats * product.vipPrice) - prixAchatTotal;
    //         product.marginTerrace = (nombrePlats * product.terracePrice) - prixAchatTotal;
            
    //         // Pour référence (optionnel)
    //         product.pricePerPlat = prixAchatTotal / nombrePlats;
    //         product.marginPlatVIP = product.vipPrice - product.pricePerPlat;
    //         product.marginPlatTerrace = product.terracePrice - product.pricePerPlat;
    
    //         if (product.hasDemiPlat) {
    //             // Si demi-plat est activé, on double virtuellement le nombre de plats
    //             const nombreDemiPlats = product.plats * 2;
    //             product.marginVIP = (nombreDemiPlats * (product.vipPriceDemiPlat ?? 0)) - prixAchatTotal;
    //             product.marginTerrace = (nombreDemiPlats * (product.terracePriceDemiPlat ?? 0)) - prixAchatTotal;
    //         }
    //     } else {
    //         product.marginVIP = 0;
    //         product.marginTerrace = 0;
    //     }
    // }


    calculateMargins(product: Product) {
        if (!product.purchasePrice) product.purchasePrice = 0;
        if (!product.vipPrice) product.vipPrice = 0;
        if (!product.terracePrice) product.terracePrice = 0;
        if (!product.vipPriceDemiPlat) product.vipPriceDemiPlat = 0;
        if (!product.terracePriceDemiPlat) product.terracePriceDemiPlat = 0;
    
        if (product.type === 'Boisson') {
            let totalBottles = 0;
            
            if (product.boissonType === 'Vin' || product.boissonType === 'Whisky') {
                totalBottles = product.nombreBouteilles || 0;
            } 
            else if (product.packageType === 'paquet') {
                totalBottles = (product.nombrePaquet || 0) * (product.packageSize || 0);
            } 
            else {
                totalBottles = (product.nombreCasier || 0) * (product.bottlesPerCase || 0);
            }
    
            product.marginVIP = (totalBottles * product.vipPrice) - product.purchasePrice;
            product.marginTerrace = (totalBottles * product.terracePrice) - product.purchasePrice;
        } 
        else if (product.type === 'Nourriture') {
            const totalPlats = product.plats || 0;
            
            if (product.hasDemiPlat) {
                const totalDemiPlats = totalPlats * 2;
                product.marginVIP = (totalDemiPlats * product.vipPriceDemiPlat) - product.purchasePrice;
                product.marginTerrace = (totalDemiPlats * product.terracePriceDemiPlat) - product.purchasePrice;
            } else {
                product.marginVIP = (totalPlats * product.vipPrice) - product.purchasePrice;
                product.marginTerrace = (totalPlats * product.terracePrice) - product.purchasePrice;
            }
        }
    }


    // async saveProduct() {
    //     if (!this.productToEdit) return;
    //     this.isLoading = true;
    
    //     // Nettoyer l'objet avant enregistrement
    //     const productToSave: any = {
    //         ...this.productToEdit,
    //         ...(this.productToEdit.type === 'Nourriture' && {
    //             boissonType: undefined,
    //             bottlesPerCase: undefined,
    //             nombreCasier: undefined,
    //             nombrePaquet: undefined,
    //             nombreBouteilles: undefined,
    //             packageType: undefined
    //         }),
    //         ...(this.productToEdit.type === 'Boisson' && {
    //             plats: undefined,
    //             hasDemiPlat: undefined,
    //             vipPriceDemiPlat: undefined,
    //             terracePriceDemiPlat: undefined
    //         })
    //     };
    
    //     try {
    //         await this.managementService.updateProduct(productToSave.id, productToSave);
    //         this.notificationService.showSuccess('Produit mis à jour avec succès!');
    //         this.closeEditModal();
    //         await this.loadProducts();
    //     } catch (error) {
    //         this.notificationService.showError('Erreur lors de la mise à jour du produit.');
    //     } finally {
    //         this.isLoading = false;
    //     }
    // }

    async saveProduct() {
        if (!this.productToEdit) return;
        this.isLoading = true;
    
        // Créer une copie profonde nettoyée du produit
        const productToSave: Product = {
            ...this.productToEdit,
            // Initialiser tous les champs numériques à 0 si undefined/null
            nombreCasier: this.productToEdit.nombreCasier ?? 0,
            nombrePaquet: this.productToEdit.nombrePaquet ?? 0,
            nombreBouteilles: this.productToEdit.nombreBouteilles ?? 0,
            plats: this.productToEdit.plats ?? 0,
            demiPlats: this.productToEdit.demiPlats ?? 0,
            vipPriceDemiPlat: this.productToEdit.vipPriceDemiPlat ?? 0,
            terracePriceDemiPlat: this.productToEdit.terracePriceDemiPlat ?? 0,
            purchasePrice: this.productToEdit.purchasePrice ?? 0,
            vipPrice: this.productToEdit.vipPrice ?? 0,
            terracePrice: this.productToEdit.terracePrice ?? 0,
            lastModified: new Date().toISOString()
        };
    
        // Nettoyer les champs inutiles selon le type
        if (productToSave.type === 'Nourriture') {
            // Utiliser delete pour supprimer complètement les champs
            delete (productToSave as any).boissonType;
            delete (productToSave as any).bottlesPerCase;
            delete (productToSave as any).nombreCasier;
            delete (productToSave as any).nombrePaquet;
            delete (productToSave as any).nombreBouteilles;
            delete (productToSave as any).packageType;
            delete (productToSave as any).packageSize;
        } else {
            delete (productToSave as any).plats;
            delete (productToSave as any).hasDemiPlat;
            delete (productToSave as any).demiPlats;
            delete (productToSave as any).vipPriceDemiPlat;
            delete (productToSave as any).terracePriceDemiPlat;
        }
    
        try {
            await this.managementService.updateProduct(productToSave.id, productToSave);
            this.notificationService.showSuccess('Produit mis à jour avec succès!');
            this.closeEditModal();
            await this.loadProducts();
        } catch (error) {
            this.notificationService.showError('Erreur lors de la mise à jour du produit.');
            console.error('Détails de l\'erreur:', error);
        } finally {
            this.isLoading = false;
        }
    }

    onPackageTypeChange() {
        if (!this.productToEdit) return;
        // Réinitialiser les valeurs quand on change de type
        if (this.productToEdit.packageType === 'paquet') {
            this.productToEdit.nombreCasier = 0;
        } else {
            this.productToEdit.nombrePaquet = 0;
        }
        this.calculateMargins(this.productToEdit);
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
            if (product.boissonType === 'Vin' || product.boissonType === 'Whisky') {
                return `${product.nombreBouteilles || 0} bouteilles`;
            }
            else if (product.packageType === 'paquet') {
                const totalBottles = (product.nombrePaquet || 0) * (product.packageSize || 0);
                return `${product.nombrePaquet || 0} paquet(s) (${totalBottles} bouteilles)`;
            }
            else {
                const totalBottles = (product.nombreCasier || 0) * (product.bottlesPerCase || 0);
                return `${product.nombreCasier || 0} casier(s) (${totalBottles} bouteilles)`;
            }
        } 
        else if (product.type === 'Nourriture') {
            if (product.hasDemiPlat) {
                return `${product.plats} plats (${product.demiPlats} demi-plats)`;
            } else {
                return `${product.plats || 0} plats`;
            }
        }
        return 'N/A';
    }
}
