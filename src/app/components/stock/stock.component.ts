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
    nombreCasier: 0,
    nombrePaquet: 0,
    hasDemiPlat: false,
    demiPlats: 0,
    vipPriceDemiPlat: 0,
    terracePriceDemiPlat: 0,
    nombreBouteilles: 0,
    createdAt: undefined, // Added for Eau
  };

  isLoading = false;

  showCaseFields = false;
  showBottlesPerCase = false;
  showNombrePaquet = false;
  showDemiPlatPrices = false;
  showNombreBouteillesEau = false; 

  // Propriétés pour stocker les sélecteurs et leurs options
  selectors: { id: string; name: string }[] = [];
  typeBoissonOptions: { id: string; value: string; label: string }[] = []; // Ajout de `value` et `label`
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
    this.loadSelectorsAndOptions(); // Initial calculation
  }

  onTypeChange() {
    this.calculateMargins();
    this.updateFieldVisibility();
  }

  onBoissonTypeChange() {
    if (this.product.caseType === 'half') {
      this.product.nombreCasier = 0;
    }
    this.updateFieldVisibility();
    this.calculateMargins();
  }

  updateFieldVisibility() {
    this.showCaseFields = this.product.boissonType === 'Biere' || this.product.boissonType === 'Sucree';
    this.showBottlesPerCase = this.product.boissonType === 'Vin' || this.product.boissonType === 'Whisky' || this.product.boissonType === 'Biere' || this.product.boissonType === 'Sucree';
    this.showNombrePaquet = this.product.boissonType === 'Eau';
    this.showDemiPlatPrices = this.product.type === 'Nourriture' && !!this.product.hasDemiPlat;
    this.showNombreBouteillesEau = this.product.boissonType === 'Eau'; // Show bottle count for Eau
  }


// Fonction utilitaire pour supprimer les accents
private removeAccents(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

// Charger les sélecteurs et leurs options depuis Firestore
async loadSelectorsAndOptions(): Promise<void> {
  try {
    // Récupérer tous les sélecteurs
    this.selectors = await lastValueFrom(this.selectOptionsService.getSelectors());

    // Récupérer les options pour chaque sélecteur
    for (const selector of this.selectors) {
      switch (selector.name) {
        case 'TypeBoisson':
          const boissonOptions = await lastValueFrom(
            this.selectOptionsService.getSelectorOptions(selector.id)
          );
          // Mapper les options pour avoir `value` (sans accent) et `label` (avec accent)
          this.typeBoissonOptions = boissonOptions.map((option) => ({
            id: option.id,
            value: this.removeAccents(option.name), // Valeur sans accent
            label: option.name, // Libellé avec accent
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


  addProduct(form: NgForm) {
    if (form.invalid) {
      this.notification.showError('Formulaire invalide');
      return;
    }
    this.notification.setLoading(true);
    this.isLoading = true;
  
    this.product.id = this.generateProductId();
    this.product.createdAt = new Date(); // Ajouter la date de création
    this.calculateMargins();
  
    // Nettoyer l'objet product pour supprimer les champs avec des valeurs undefined
    const cleanedProduct = JSON.parse(JSON.stringify(this.product));
  
    this.firebaseService.addProduct(this.product.id, cleanedProduct)  // Pass the generated ID
      .then(() => {
        this.isLoading = false;
        this.notification.setLoading(false);
        this.notification.showSuccess('Produit ajouté avec succès !');
        form.resetForm();
        this.product = {  // Reset to default values
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
            nombreCasier: 0,
            nombrePaquet: 0,
            hasDemiPlat: false,
            demiPlats: 0,
            vipPriceDemiPlat: 0,
            terracePriceDemiPlat: 0,
            nombreBouteilles: 0,
            createdAt: undefined, // Use undefined instead of null
        };
        this.updateFieldVisibility(); // Reset visibility flags
      })
      .catch((error) => {
        this.isLoading = false;
        this.notification.setLoading(false);
        this.notification.showError('Une erreur est survenue lors de l\'ajout du produit.');
      });
  }

  // calculateMargins() {
  //   if (this.product.type === 'Boisson') {
  //     if (this.product.boissonType === 'Eau') {
  //       // Eau Calculation
  //       const numberOfBottles = this.product.nombreBouteilles || 1;
  //       this.product.marginVIP = (numberOfBottles * this.product.vipPrice) - this.product.purchasePrice;
  //       this.product.marginTerrace = (numberOfBottles * this.product.terracePrice) - this.product.purchasePrice;
  //     } else if (this.product.boissonType === 'Vin' || this.product.boissonType === 'Whisky' || this.product.boissonType === 'Biere' || this.product.boissonType === 'Sucree') {
  //       // Other Drinks Calculation
  //       let numberOfBottles = this.product.bottlesPerCase;
  //       if (this.product.boissonType === 'Biere' || this.product.boissonType === 'Sucree') {
  //         numberOfBottles *= this.product.nombreCasier !== 1 ? this.product.nombreCasier : 1;
  //       }
  //       this.product.marginVIP = (numberOfBottles * this.product.vipPrice) - this.product.purchasePrice;
  //       this.product.marginTerrace = (numberOfBottles * this.product.terracePrice) - this.product.purchasePrice;
  //     } else {
  //       this.product.marginVIP = 0;
  //       this.product.marginTerrace = 0;
  //     }
  //   } else if (this.product.type === 'Nourriture') {
  //     // Food Calculation
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
  //   } else {
  //     this.product.marginVIP = 0;
  //     this.product.marginTerrace = 0;
  //   }
  // }
  calculateMargins() {
    if (this.product.type === 'Boisson') {
      if (this.product.boissonType === 'Eau') {
        // Eau Calculation
        const numberOfBottles = this.product.nombreBouteilles || 1;
        this.product.marginVIP = (numberOfBottles * this.product.vipPrice) - this.product.purchasePrice;
        this.product.marginTerrace = (numberOfBottles * this.product.terracePrice) - this.product.purchasePrice;
      } else if (this.product.boissonType === 'Vin' || this.product.boissonType === 'Whisky' || this.product.boissonType === 'Biere' || this.product.boissonType === 'Sucree') {
        // Other Drinks Calculation
        let numberOfBottles = this.product.bottlesPerCase;
        if (this.product.boissonType === 'Biere' || this.product.boissonType === 'Sucree') {
          if (this.product.caseType === 'half') {
            numberOfBottles;
          } else if (this.product.nombreCasier && this.product.nombreCasier !== 1) {
            numberOfBottles *= this.product.nombreCasier;
          }
        }
        this.product.marginVIP = (numberOfBottles * this.product.vipPrice) - this.product.purchasePrice;
        this.product.marginTerrace = (numberOfBottles * this.product.terracePrice) - this.product.purchasePrice;
      } else {
        this.product.marginVIP = 0;
        this.product.marginTerrace = 0;
      }
    } else if (this.product.type === 'Nourriture') {
      // Food Calculation
      const numberOfPlats = this.product.hasDemiPlat ? (this.product.plats * 2) : this.product.plats;
      this.product.pricePerPlat = this.product.purchasePrice / this.product.plats;
  
      this.product.marginPlatVIP = this.product.vipPrice - this.product.pricePerPlat;
      this.product.marginPlatTerrace = this.product.terracePrice - this.product.pricePerPlat;
  
      this.product.marginVIP = numberOfPlats * this.product.marginPlatVIP;
      this.product.marginTerrace = numberOfPlats * this.product.marginPlatTerrace;
  
      if (this.product.hasDemiPlat) {
        const pricePerDemiPlat = this.product.purchasePrice / numberOfPlats;
        this.product.marginVIP = (numberOfPlats * (this.product.vipPriceDemiPlat ?? 0)) - this.product.purchasePrice;
        this.product.marginTerrace = (numberOfPlats * (this.product.terracePriceDemiPlat ?? 0)) - this.product.purchasePrice;
      }
    } else {
      this.product.marginVIP = 0;
      this.product.marginTerrace = 0;
    }
  }

  private generateProductId(): string {
    return 'product_' + new Date().getTime();
  }
}
