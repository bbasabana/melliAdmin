import { Component, inject } from '@angular/core';
import { NgForm } from '@angular/forms';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule, AbstractControl  } from '@angular/forms';
import { Product } from '../../models/product.model';
import { ManagementService } from '../../services/management.service';
import { CommonModule } from '@angular/common';
import { NotifictionService } from '../../services/notification/notifiction.service';
import { SelectOptionsService } from '../../services/selected/select-options.service';
import { lastValueFrom } from 'rxjs';

@Component({
  selector: 'app-stock',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, CommonModule],
  templateUrl: './stock.component.html',
  styleUrl: './stock.component.scss'
})
export class StockComponent {
  product: Product = {
    id: '',
    name: '',
    type: 'Boisson',
    boissonType: undefined,
    quantity: 0,
    bottlesPerCase: 0,
    pricePerBottle: 0,
    purchasePrice: 0,
    vipPrice: 0,
    terracePrice: 0,
    profitVIP: 0,
    profitTerrace: 0,
    isForSale: true,
    observations: '',
    caseType: 'full',
    marginVIP: 0,
    marginTerrace: 0,
    plats: 0,
    pricePerPlat: 0,
    marginPlatVIP: 0,
    marginPlatTerrace: 0,
    marginDemiPlatVIP: 0,
    marginDemiPlatTerrace: 0,
    nombreCasier: 0,
    nombrePaquet: 0,
    hasDemiPlat: false,
    demiPlats: 0,
    vipPriceDemiPlat: 0,
    terracePriceDemiPlat: 0,
    nombreBouteilles: 0,
    packageType: 'casier',
    createdAt: '',
    packageSize: 24,
    lastModified: ''
  };

  isLoading = false;

  // Contrôles d'affichage
  showCaseTypeField = false;
  showQuantityFields = false;
  showDemiPlatPrices = false;
  showPackageSize = false;
  showPaquetFields = false;

  // Options pour les sélecteurs
  packageTypeOptions = [
    { value: 'casier', label: 'Casier' },
    { value: 'paquet', label: 'Paquet' }
  ];

  packageSizeOptions = [
    { value: 12, label: '12 bouteilles' },
    { value: 24, label: '24 bouteilles' }
  ];

  // Données des sélecteurs
  selectors: { id: string; name: string }[] = [];
  typeBoissonOptions: { id: string; value: string; label: string }[] = [];
  typeCasierOptions: { id: string; name: string }[] = [];
  typeProduitOptions: { id: string; name: string }[] = [];

  constructor(
    private firebaseService: ManagementService,
    private notification: NotifictionService,
    private selectOptionsService: SelectOptionsService
  ) { }

  ngOnInit(): void {
    this.updateFieldVisibility();
    this.calculateMargins();
    this.loadSelectorsAndOptions();
  }

  onTypeChange(): void {
    this.updateFieldVisibility();
    this.calculateMargins();
  }

  onBoissonTypeChange(): void {
    // Configuration spécifique pour chaque type de boisson
    switch (this.product.boissonType) {
      case 'Biere':
        this.product.bottlesPerCase = this.product.name?.toLowerCase().includes('tembo') ? 12 : 20;
        this.showPackageSize = false;
        this.product.packageType = 'casier';
        this.showPaquetFields = false;
        break;
      case 'Eau':
        this.showPackageSize = true;
        this.product.packageSize = 24;
        this.product.bottlesPerCase = this.product.packageSize;
        break;
      case 'Sucree':
        this.showPackageSize = true;
        this.product.packageSize = 12;
        this.product.bottlesPerCase = this.product.packageSize;
        break;
      case 'Vin':
      case 'Whisky':
        this.showPackageSize = false;
        this.showPaquetFields = false;
        this.product.packageType = 'casier';
        this.product.caseType = 'full';
        break;
      default:
        this.showPackageSize = false;
        this.showPaquetFields = false;
    }

    this.updateFieldVisibility();
    this.calculateMargins();
  }

  onPackageTypeChange(): void {
    if (this.product.packageType === 'paquet') {
      this.product.nombreCasier = 0;
      this.product.caseType = 'full';
    } else {
      this.product.nombrePaquet = 0;
    }
    this.updateFieldVisibility();
    this.calculateMargins();
  }

  onCaseTypeChange(): void {
    if (this.product.caseType === 'half') {
      this.product.nombreCasier = 0;
    }
    this.calculateMargins();
  }

  updateFieldVisibility(): void {
    // Pour les boissons
    if (this.product.type === 'Boisson') {
      this.showCaseTypeField = this.product.packageType === 'casier' && 
                             (this.product.boissonType === 'Biere' || 
                              this.product.boissonType === 'Sucree' || 
                              this.product.boissonType === 'Eau');
      
      this.showPaquetFields = this.product.packageType === 'paquet' && 
                            (this.product.boissonType === 'Sucree' || 
                             this.product.boissonType === 'Eau');
      
      this.showPackageSize = this.product.boissonType === 'Eau' || 
                           this.product.boissonType === 'Sucree';
      
      // Cas spécial pour la Tembo
      if (this.product.boissonType === 'Biere' && this.product.name?.toLowerCase().includes('tembo')) {
        this.product.bottlesPerCase = 12;
      }
    }
    
    // Pour la nourriture
    this.showDemiPlatPrices = this.product.type === 'Nourriture' && !!this.product.hasDemiPlat;
    this.showQuantityFields = this.product.type === 'Boisson';
  }

  updateDemiPlats(): void {
    if (this.product.type === 'Nourriture') {
      if (this.product.hasDemiPlat) {
        this.product.demiPlats = this.product.plats * 2;
        this.product.quantity = this.product.demiPlats;
      } else {
        this.product.quantity = this.product.plats;
        this.product.demiPlats = 0;
      }
      this.calculateMargins();
    }
  }

  calculateQuantity(): void {
    if (this.product.type === 'Boisson') {
      if (this.product.boissonType === 'Vin' || this.product.boissonType === 'Whisky') {
        this.product.quantity = this.product.nombreBouteilles;
      } 
      else if (this.product.packageType === 'paquet') {
        this.product.quantity = this.product.nombrePaquet * (this.product.packageSize || 24);
        this.product.bottlesPerCase = this.product.packageSize || 24;
      } 
      else {
        if (this.product.caseType === 'half') {
          this.product.quantity = this.product.nombreBouteilles;
        } else {
          this.product.quantity = this.product.nombreCasier * this.product.bottlesPerCase;
        }
      }
    } 
    else if (this.product.type === 'Nourriture') {
      this.product.quantity = this.product.hasDemiPlat ? this.product.plats * 2 : this.product.plats;
    }
  }

  // calculateMargins(): void {
  //   this.calculateQuantity();
    
  //   if (this.product.type === 'Boisson') {
  //     this.product.marginVIP = (this.product.quantity * this.product.vipPrice) - this.product.purchasePrice;
  //     this.product.marginTerrace = (this.product.quantity * this.product.terracePrice) - this.product.purchasePrice;
  //   } 
  //   else if (this.product.type === 'Nourriture') {
  //     const numberOfPlats = this.product.hasDemiPlat ? (this.product.plats * 2) : this.product.plats;
  //     this.product.pricePerPlat = this.product.purchasePrice / this.product.plats;
      
  //     this.product.marginPlatVIP = this.product.vipPrice - this.product.pricePerPlat;
  //     this.product.marginPlatTerrace = this.product.terracePrice - this.product.pricePerPlat;
      
  //     this.product.marginVIP = numberOfPlats * this.product.marginPlatVIP;
  //     this.product.marginTerrace = numberOfPlats * this.product.marginPlatTerrace;
      
  //     if (this.product.hasDemiPlat) {
  //       const pricePerDemiPlat = this.product.purchasePrice / numberOfPlats;
  //       this.product.marginVIP = (numberOfPlats * (this.product.vipPriceDemiPlat ?? 0)) - this.product.purchasePrice;
  //       this.product.marginTerrace = (numberOfPlats * (this.product.terracePriceDemiPlat ?? 0)) - this.product.purchasePrice;
  //     }
  //   }
  // }

  // Modifiez la méthode calculateMargins pour la nourriture
  calculateMargins(): void {
    this.calculateQuantity();
    
    // Calcul pour tous les produits
    if (this.product.quantity > 0) {
      this.product.marginUnitVIP = this.product.vipPrice - (this.product.purchasePrice / this.product.quantity);
      this.product.marginUnitTerrace = this.product.terracePrice - (this.product.purchasePrice / this.product.quantity);
    }
  
    if (this.product.type === 'Boisson') {
      this.product.marginVIP = (this.product.quantity * this.product.vipPrice) - this.product.purchasePrice;
      this.product.marginTerrace = (this.product.quantity * this.product.terracePrice) - this.product.purchasePrice;
    } 
    else if (this.product.type === 'Nourriture') {
      this.product.marginVIP = (this.product.vipPrice * this.product.plats) - this.product.purchasePrice;
      this.product.marginTerrace = (this.product.terracePrice * this.product.plats) - this.product.purchasePrice;
      
      if (this.product.hasDemiPlat) {
        const demiPlatCount = this.product.plats * 2;
        const vipDemiPlatPrice = this.product.vipPrice / 2;
        const terraceDemiPlatPrice = this.product.terracePrice / 2;
        
        this.product.marginDemiPlatVIP = vipDemiPlatPrice - (this.product.purchasePrice / demiPlatCount);
        this.product.marginDemiPlatTerrace = terraceDemiPlatPrice - (this.product.purchasePrice / demiPlatCount);
      }
    }
  }
  // async addProduct(form: NgForm): Promise<void> {
  //   if (form.invalid) {
  //     this.notification.showError('Formulaire invalide');
  //     return;
  //   }
    
  //   this.notification.setLoading(true);
  //   this.isLoading = true;

  //   this.calculateQuantity();
  //   this.product.id = this.generateProductId();
  //   this.product.createdAt = new Date().toISOString();
  //   this.product.lastModified = this.product.createdAt;

  //   // Nettoyage de l'objet avant enregistrement
  //   const productToSave: any = {
  //     ...this.product,
  //     // Suppression des champs inutiles selon le type
  //     ...(this.product.type === 'Nourriture' && {
  //       boissonType: undefined,
  //       bottlesPerCase: undefined,
  //       nombreCasier: undefined,
  //       nombrePaquet: undefined,
  //       nombreBouteilles: undefined,
  //       packageType: undefined,
  //       packageSize: undefined,
  //       caseType: undefined
  //     }),
  //     ...(this.product.type === 'Boisson' && {
  //       plats: undefined,
  //       pricePerPlat: undefined,
  //       hasDemiPlat: undefined,
  //       demiPlats: undefined,
  //       vipPriceDemiPlat: undefined,
  //       terracePriceDemiPlat: undefined,
  //       marginPlatVIP: undefined,
  //       marginPlatTerrace: undefined
  //     })
  //   };

  //   // Suppression des champs undefined
  //   const cleanedProduct = JSON.parse(JSON.stringify(productToSave));

  //   try {
  //     await this.firebaseService.addProduct(cleanedProduct.id, cleanedProduct);
  //     this.notification.showSuccess('Produit ajouté avec succès !');
  //     form.resetForm();
  //     this.resetProduct();
  //   } catch (error) {
  //     this.notification.showError('Erreur lors de l\'ajout: ' + (error as Error).message);
  //   } finally {
  //     this.isLoading = false;
  //     this.notification.setLoading(false);
  //   }
  // }


// Modifiez la méthode addProduct
  async addProduct(form: NgForm): Promise<void> {
    if (form.invalid) {
      this.notification.showError('Formulaire invalide');
      return;
    }

    if (await this.checkProductExists(this.product.name)) {
      this.notification.showError('Un produit avec ce nom existe déjà');
      return;
    }

    this.notification.setLoading(true);
    this.isLoading = true;

    this.calculateQuantity();
    this.calculateMargins();

    const productToSave = {
      ...this.product,
      id: this.generateProductId(),
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      // Nettoyage des champs selon le type
      ...(this.product.type === 'Nourriture' ? {
        boissonType: undefined,
        bottlesPerCase: undefined,
        nombreCasier: undefined,
        nombrePaquet: undefined,
        nombreBouteilles: undefined,
        packageType: undefined,
        packageSize: undefined,
        caseType: undefined
      } : {
        plats: undefined,
        pricePerPlat: undefined,
        hasDemiPlat: undefined,
        demiPlats: undefined,
        vipPriceDemiPlat: undefined,
        terracePriceDemiPlat: undefined,
        marginPlatVIP: undefined,
        marginPlatTerrace: undefined
      })
    };

    try {
      await this.firebaseService.addProduct(productToSave.id, JSON.parse(JSON.stringify(productToSave)));
      this.notification.showSuccess('Produit ajouté avec succès !');
      form.resetForm();
      this.resetProduct();
    } catch (error) {
      this.notification.showError(`Erreur lors de l'ajout: ${(error as Error).message}`);
    } finally {
      this.isLoading = false;
      this.notification.setLoading(false);
    }
  }

  

  private resetProduct(): void {
    this.product = {
      id: '',
      name: '',
      type: 'Boisson',
      boissonType: undefined,
      quantity: 0,
      bottlesPerCase: 0,
      pricePerBottle: 0,
      purchasePrice: 0,
      vipPrice: 0,
      terracePrice: 0,
      profitVIP: 0,
      profitTerrace: 0,
      isForSale: true,
      observations: '',
      caseType: 'full',
      marginVIP: 0,
      marginTerrace: 0,
      plats: 0,
      pricePerPlat: 0,
      marginPlatVIP: 0,
      marginPlatTerrace: 0,
      marginDemiPlatVIP: 0,
      marginDemiPlatTerrace: 0,
      nombreCasier: 0,
      nombrePaquet: 0,
      hasDemiPlat: false,
      demiPlats: 0,
      vipPriceDemiPlat: 0,
      terracePriceDemiPlat: 0,
      nombreBouteilles: 0,
      packageType: 'casier',
      packageSize: 24,
      createdAt: '',
      lastModified: ''
    };
    this.updateFieldVisibility();
  }

  private generateProductId(): string {
    return 'product_' + new Date().getTime();
  }

  private removeAccents(str: string): string {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  // Ajoutez cette méthode pour vérifier si le produit existe déjà
  async checkProductExists(name: string): Promise<boolean> {
    try {
      // Utilisez directement la promesse retournée par getProducts()
      const products = await this.firebaseService.getProducts();
      return products.some(p => p.name.toLowerCase() === name.toLowerCase());
    } catch (error) {
      this.notification.showError('Erreur lors de la vérification des produits');
      return false;
    }
  }

  async loadSelectorsAndOptions(): Promise<void> {
    try {
      this.selectors = await lastValueFrom(this.selectOptionsService.getSelectors());

      for (const selector of this.selectors) {
        switch (selector.name) {
          case 'TypeBoisson':
            const boissonOptions = await lastValueFrom(
              this.selectOptionsService.getSelectorOptions(selector.id)
            );
            this.typeBoissonOptions = boissonOptions.map((option) => ({
              id: option.id,
              value: this.removeAccents(option.name),
              label: option.name,
            }));
            break;
          case 'TypeCasier':
            this.typeCasierOptions = await lastValueFrom(
              this.selectOptionsService.getSelectorOptions(selector.id)
            );
            break;
          case 'TypeProduit':
            this.typeProduitOptions = await lastValueFrom(
              this.selectOptionsService.getSelectorOptions(selector.id)
            );
            break;
        }
      }
    } catch (error) {
      this.notification.showError('Erreur lors du chargement des sélecteurs et options');
    }
  }
}

