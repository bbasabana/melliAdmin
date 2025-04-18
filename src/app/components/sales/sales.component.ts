import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ManagementService } from '../../services/management.service';
import { NotifictionService } from '../../services/notification/notifiction.service';
import { SelectOptionsService } from '../../services/selected/select-options.service';
import { lastValueFrom } from 'rxjs';
import { CommonModule } from '@angular/common';
import { Sale } from '../../models/sale.model';


@Component({
  selector: 'app-sales',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule], 
  templateUrl: './sales.component.html',
  styleUrl: './sales.component.scss'
})
export class SalesComponent implements OnInit {
  salesForm: FormGroup;
  products: any[] = [];
  clients: any[] = [];
  filteredClients: any[] = [];
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  saleSpaces: any[] = [];
  paymentMethods: any[] = [];
  selectedClient: any = null;
  currentClientPoints: number = 0;
  maxPointsToUse: number = 0;

  constructor(
    private fb: FormBuilder,
    private managementService: ManagementService,
    private notification: NotifictionService,
    private selectOptionsService: SelectOptionsService
  ) {
    this.salesForm = this.fb.group({
      saleNumber: [{ value: this.generateSaleNumber(), disabled: true }],
      productId: ['', Validators.required],
      saleSpace: ['', Validators.required],
      quantity: ['', [Validators.required, Validators.min(1)]],
      clientName: [''],
      clientSearch: [''],
      totalPrice: [{ value: 0, disabled: true }],
      paymentMethod: ['', Validators.required],
      pointsEarned: [{ value: 0, disabled: true }],
      pointsToUse: [0],
      amountToPay: [{ value: 0, disabled: true }],
      discountFromPoints: [{ value: 0, disabled: true }]
    });
  }

  async ngOnInit(): Promise<void> {
    await this.loadInitialData();
    this.setupFormListeners();
  }

  private async loadInitialData(): Promise<void> {
    try {
      await Promise.all([
        this.loadProducts(),
        this.loadClients(),
        this.loadSaleSpaces(),
        this.loadPaymentMethods()
      ]);
    } catch (error) {
      this.handleError('Erreur lors du chargement des données initiales', error);
    }
  }

  private setupFormListeners(): void {
    this.salesForm.get('quantity')?.valueChanges.subscribe(() => this.calculateTotal());
    this.salesForm.get('productId')?.valueChanges.subscribe(() => this.calculateTotal());
    this.salesForm.get('saleSpace')?.valueChanges.subscribe(() => this.calculateTotal());
    this.salesForm.get('paymentMethod')?.valueChanges.subscribe(() => {
      this.calculatePayment();
      this.updatePointsFields();
    });
    this.salesForm.get('pointsToUse')?.valueChanges.subscribe(() => this.calculatePayment());
  }

  generateSaleNumber(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  async loadProducts(): Promise<void> {
    try {
      this.products = await this.managementService.getProducts();
    } catch (error) {
      this.handleError('Erreur lors du chargement des produits', error);
    }
  }

  async loadClients(): Promise<void> {
    try {
      this.clients = await this.managementService.getClients();
      this.filteredClients = [...this.clients];
    } catch (error) {
      this.handleError('Erreur lors du chargement des clients', error);
    }
  }

  async loadSaleSpaces(): Promise<void> {
    try {
      const selectors = await lastValueFrom(this.selectOptionsService.getSelectors());
      const saleSpaceSelector = selectors.find(s => s.name === 'SaleSpace');
      
      if (saleSpaceSelector) {
        this.saleSpaces = await lastValueFrom(
          this.selectOptionsService.getSelectorOptions(saleSpaceSelector.id)
        );
        
        if (this.saleSpaces.length > 0) {
          this.salesForm.patchValue({ saleSpace: this.saleSpaces[0].name });
        }
      }
    } catch (error) {
      this.handleError('Erreur lors du chargement des espaces de vente', error);
    }
  }

  async loadPaymentMethods(): Promise<void> {
    try {
      const selectors = await lastValueFrom(this.selectOptionsService.getSelectors());
      const paymentMethodSelector = selectors.find(s => s.name === 'ModePayment');
      
      if (paymentMethodSelector) {
        this.paymentMethods = await lastValueFrom(
          this.selectOptionsService.getSelectorOptions(paymentMethodSelector.id)
        );
        
        if (this.paymentMethods.length > 0) {
          this.salesForm.patchValue({ paymentMethod: this.paymentMethods[0].name });
        }
      }
    } catch (error) {
      this.handleError('Erreur lors du chargement des méthodes de paiement', error);
    }
  }

  filterClients(): void {
    const searchTerm = this.salesForm.get('clientSearch')?.value?.toLowerCase();
    this.filteredClients = searchTerm 
      ? this.clients.filter(client =>
          client.name.toLowerCase().includes(searchTerm) ||
          client.phoneNumber?.includes(searchTerm) ||
          client.clientNumber?.toLowerCase().includes(searchTerm)
        )
      : [...this.clients];
  }

  selectClient(client: any): void {
    this.selectedClient = client;
    this.currentClientPoints = client.points || 0;
    this.maxPointsToUse = this.currentClientPoints;
    
    this.salesForm.patchValue({
      clientName: client.name,
      clientSearch: client.name,
      pointsToUse: 0
    });
    
    this.filteredClients = [];
    this.updatePointsFields();
    this.calculatePayment();
  }

  calculateTotal(): void {
    const productId = this.salesForm.get('productId')?.value;
    const saleSpace = this.salesForm.get('saleSpace')?.value;
    const quantity = this.salesForm.get('quantity')?.value;

    if (productId && quantity > 0) {
      const product = this.products.find(p => p.id === productId);
      if (product) {
        const price = saleSpace === 'VIP' ? product.vipPrice : product.terracePrice;
        const total = price * quantity;
        this.salesForm.get('totalPrice')?.setValue(total);
        
        // Calcul des points gagnés (2 points par 10 000 FC dépensés)
        const pointsEarned = Math.floor(total / 10000) * 2;
        this.salesForm.get('pointsEarned')?.setValue(pointsEarned);
        
        this.calculatePayment();
      }
    }
  }

  calculatePayment(): void {
    const totalPrice = this.salesForm.get('totalPrice')?.value || 0;
    const paymentMethod = this.salesForm.get('paymentMethod')?.value;
    const pointsToUse = this.salesForm.get('pointsToUse')?.value || 0;

    let amountToPay = totalPrice;
    let discountFromPoints = 0;
    let pointsUsed = 0;

    if (paymentMethod === 'Points' && this.selectedClient) {
      // Conversion points en réduction (10 points = 5000 FC)
      const possibleDiscount = Math.floor(pointsToUse / 10) * 5000;
      discountFromPoints = Math.min(possibleDiscount, totalPrice);
      
      pointsUsed = Math.floor(discountFromPoints / 5000) * 10;
      amountToPay = Math.max(0, totalPrice - discountFromPoints);
    }

    this.salesForm.patchValue({
      pointsToUse: pointsUsed,
      amountToPay: amountToPay,
      discountFromPoints: discountFromPoints
    });
  }

  updatePointsFields(): void {
    const paymentMethod = this.salesForm.get('paymentMethod')?.value;
    if (paymentMethod === 'Points' && this.selectedClient) {
      const totalPrice = this.salesForm.get('totalPrice')?.value || 0;
      // Calcul du maximum de points utilisables (par tranches de 10 points)
      this.maxPointsToUse = Math.min(
        this.currentClientPoints,
        Math.floor(totalPrice / 5000) * 10
      );
    }
  }

  async onSubmit(): Promise<void> {
    if (this.salesForm.invalid) {
      this.notification.showError('Veuillez remplir tous les champs obligatoires');
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    try {
      const formData = this.salesForm.getRawValue();
      const productId = formData.productId;
      const quantity = formData.quantity;

      // Vérification stock
      const product = this.products.find(p => p.id === productId);
      if (!product || product.quantity < quantity) {
        throw new Error('Stock insuffisant pour ce produit');
      }

      // Calcul des points
      const pointsUsed = formData.paymentMethod === 'Points' ? formData.pointsToUse : 0;
      const pointsEarned = formData.paymentMethod === 'Points' ? 0 : formData.pointsEarned;
      const amountPaid = formData.amountToPay;

      // Création de la vente
      const sale: Sale = {
        saleNumber: formData.saleNumber,
        productId,
        productName: product.name,
        saleSpace: formData.saleSpace,
        quantity,
        totalPrice: formData.totalPrice,
        clientName: formData.clientName || undefined,
        pointsEarned,
        pointsUsed,
        paymentMethod: formData.paymentMethod,
        saleDate: new Date().toISOString(),
        amountPaid,
        pointsBefore: this.selectedClient?.points || 0,
        pointsAfter: this.selectedClient ? 
                     (this.selectedClient.points - pointsUsed + pointsEarned) : 0,
        discountFromPoints: formData.discountFromPoints
      };

      // Enregistrement
      await this.managementService.addSale(sale);
      
      // Mise à jour stock - gestion différenciée par type de produit
      const updatedProduct = { ...product, quantity: product.quantity - quantity };
      
      if (product.type === 'Nourriture' && product.hasDemiPlat && quantity % 1 !== 0) {
        // Gestion spécifique pour les demi-plats
        updatedProduct.demiPlats = product.demiPlats - quantity;
      }
      
      await this.managementService.updateProduct(productId, updatedProduct);

      // Mise à jour client
      if (this.selectedClient) {
        const updatedClient = {
          ...this.selectedClient,
          points: sale.pointsAfter,
          totalSpent: (this.selectedClient.totalSpent || 0) + amountPaid
        };
        await this.managementService.updateClient(this.selectedClient.id, updatedClient);
      }

      this.notification.showSuccess('Vente enregistrée avec succès');
      this.resetForm();
    } catch (error) {
      this.handleError('Erreur lors de l\'enregistrement', error);
    } finally {
      this.isLoading = false;
    }
  }

  private resetForm(): void {
    this.salesForm.reset({
      saleNumber: this.generateSaleNumber(),
      saleSpace: this.saleSpaces[0]?.name || '',
      paymentMethod: this.paymentMethods[0]?.name || '',
      quantity: '',
      productId: '',
      totalPrice: 0,
      pointsEarned: 0,
      pointsToUse: 0,
      amountToPay: 0,
      discountFromPoints: 0,
      clientName: '',
      clientSearch: ''
    });
    this.selectedClient = null;
    this.currentClientPoints = 0;
    this.maxPointsToUse = 0;
    this.filteredClients = [...this.clients];
    this.loadProducts(); // Recharger les produits pour mettre à jour les stocks
  }

  private handleError(message: string, error: any): void {
    console.error(message, error);
    this.notification.showError(message);
  }
}
