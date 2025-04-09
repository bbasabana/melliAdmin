import { Component, OnInit, runInInjectionContext} from '@angular/core';
import { FormBuilder, FormGroup, Validators , FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ManagementService } from '../../services/management.service';
import { Client } from '../../models/client.model';
import { NotifictionService } from '../../services/notification/notifiction.service';
import { Injectable, inject } from '@angular/core';
import { Firestore, doc, deleteDoc } from '@angular/fire/firestore';


@Component({
  selector: 'app-customers',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, CommonModule],
  templateUrl: './customers.component.html',
  styleUrl: './customers.component.scss'
})
export class CustomersComponent {
  private firestore = inject(Firestore);
  clientForm: FormGroup;
  clients: Client[] = [];
  loading = true;
  page = 1;
  pageSize = 10;
  isEditMode = false;
  currentClientId: string | null = null;
  clientNumber: string = '';
  Math: any;
  showDeleteModal = false;
  clientToDelete: string | null = null;

  constructor(
    private fb: FormBuilder,
    private managementService: ManagementService,
    public notificationService: NotifictionService
  ) {
    this.clientForm = this.fb.group({
      clientNumber: ['', Validators.required],
      name: ['', [Validators.required, Validators.minLength(2)]],
      phoneNumber: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      email: ['', [Validators.email]],
      address: ['']
    });
    
    this.generateClientNumber();
  }

  ngOnInit(): void {
    this.loadClients();
  }

  // Génère un numéro client aléatoire ABC1234
  generateClientNumber(): void {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    let result = '';
    
    for (let i = 0; i < 3; i++) {
      result += letters.charAt(Math.floor(Math.random() * letters.length));
    }
    
    for (let i = 0; i < 4; i++) {
      result += numbers.charAt(Math.floor(Math.random() * numbers.length));
    }
    
    this.clientNumber = result;
    this.clientForm.patchValue({ clientNumber: result });
  }

  async loadClients() {
    this.loading = true;
    try {
      this.clients = await this.managementService.getClients();
    } catch (error) {
      console.error('Error loading clients:', error);
      this.notificationService.showError('Erreur lors du chargement des clients');
    } finally {
      this.loading = false;
    }
  }


  async onSubmit() {
    if (this.clientForm.invalid) {
      this.markFormGroupTouched(this.clientForm);
      return;
    }

    this.notificationService.setLoading(true);

    try {
      const clientData: Client = {
        clientNumber: this.clientForm.value.clientNumber,
        name: this.clientForm.value.name,
        phoneNumber: this.clientForm.value.phoneNumber,
        email: this.clientForm.value.email || '',
        address: this.clientForm.value.address || '',
        points: 0,
        totalSpent: 0
      };

      if (this.isEditMode && this.currentClientId) {
        await this.managementService.updateClient(this.currentClientId, clientData);
        this.notificationService.showSuccess('Client mis à jour avec succès');
      } else {
        await this.managementService.addClient(clientData);
        this.notificationService.showSuccess('Client ajouté avec succès');
        this.generateClientNumber();
      }
      this.resetForm();
      this.loadClients();
    } catch (error) {
      console.error('Error saving client:', error);
      this.notificationService.showError("Erreur lors de l'enregistrement du client");
    } finally {
      this.notificationService.setLoading(false);
    }
  }

  editClient(client: Client) {
    this.isEditMode = true;
    this.currentClientId = client.id || null;
    this.clientNumber = client.clientNumber || '';
    this.clientForm.patchValue({
      clientNumber: client.clientNumber,
      name: client.name,
      phoneNumber: client.phoneNumber,
      email: client.email,
      address: client.address
    });
  }

  // deleteClient(id: string) {
  //   this.clientToDelete = id;
  //   this.showDeleteModal = true;
  // }


  // Ouvrir le modal
// openDeleteModal(clientId: string) {
//   this.clientToDelete = clientId;
//   this.showDeleteModal = true;
// }

openDeleteModal(clientId: string | undefined) {
  if (!clientId) return;
  this.clientToDelete = clientId;
  this.showDeleteModal = true;
}

// Confirmer la suppression
async confirmDelete() {
  alert('Êtes-vous sûr de vouloir supprimer ce client ?' + this.clientToDelete);
  
  if (!this.clientToDelete) {
    console.error('Aucun ID client à supprimer');
    return;
  }

  this.notificationService.setLoading(true);
  
  try {
    await this.managementService.deleteClient(this.clientToDelete);
    this.notificationService.showSuccess('Client supprimé avec succès');
    
    // Actualiser la liste
    this.clients = this.clients.filter(c => c.id !== this.clientToDelete);
    
    // Réinitialiser la pagination si besoin
    if (this.clients.length <= (this.page - 1) * this.pageSize && this.page > 1) {
      this.page--;
    }
  } catch (error) {
    this.notificationService.showError('Erreur lors de la suppression');
  } finally {
    this.notificationService.setLoading(false);
    this.showDeleteModal = false;
    this.clientToDelete = null;
  }
}
  // Par cette implémentation complète
  async deleteClient(id: string): Promise<boolean> {
    try {
      const clientRef = doc(this.firestore, 'clients', id);
      await deleteDoc(clientRef);
      console.log('Client supprimé avec succès, ID:', id);
      return true;
    } catch (error) {
      console.error('Erreur suppression client:', error);
      throw error;
    }
  }


  resetForm() {
    this.clientForm.reset();
    this.isEditMode = false;
    this.currentClientId = null;
    if (!this.isEditMode) {
      this.generateClientNumber();
    }
  }

  nextPage() {
    if (this.page * this.pageSize < this.clients.length) {
      this.page++;
    }
  }

  prevPage() {
    if (this.page > 1) {
      this.page--;
    }
  }

  getTotalPages(): number {
    return this.clients ? Math.ceil(this.clients.length / this.pageSize) : 0;
  }

  // Marque tous les champs comme touchés pour afficher les erreurs
  private markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  // Utilitaire pour le template
  min(a: number, b: number): number {
    return Math.min(a, b);
  }
}
