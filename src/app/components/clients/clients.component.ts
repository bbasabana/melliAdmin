import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators , FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ManagementService } from '../../services/management.service';
import { NotifictionService } from '../../services/notification/notifiction.service';
import { Client } from '../../models/client.model';

@Component({
  selector: 'app-clients',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, CommonModule],
  templateUrl: './clients.component.html',
  styleUrl: './clients.component.scss'
})
export class ClientsComponent implements OnInit {
  clientForm: FormGroup;
  isEditMode = false;
  currentClientId: string | null = null;
  clientNumber: string = '';

  constructor(
    private fb: FormBuilder,
    private managementService: ManagementService,
    public notificationService: NotifictionService,
  ) {
    this.clientForm = this.fb.group({
      clientNumber: ['', Validators.required],
      name: ['', [Validators.required, Validators.minLength(2)]],
      phoneNumber: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      email: ['', [Validators.email]],
      address: ['']
    });
    
    // Générer le numéro client initial
    this.generateClientNumber();
  }

  ngOnInit(): void {
    // Si vous avez besoin de charger des données existantes pour l'édition
  }

  // Fonction pour générer un numéro client de type ABC1234
  generateClientNumber(): void {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    
    // Générer 3 lettres aléatoires
    let result = '';
    for (let i = 0; i < 3; i++) {
      result += letters.charAt(Math.floor(Math.random() * letters.length));
    }
    
    // Générer 4 chiffres aléatoires
    for (let i = 0; i < 4; i++) {
      result += numbers.charAt(Math.floor(Math.random() * numbers.length));
    }
    
    this.clientNumber = result;
    this.clientForm.patchValue({ clientNumber: result });
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
        points: 0, // Initialisé à 0
        totalSpent: 0 // Initialisé à 0
      };

      if (this.isEditMode && this.currentClientId) {
        await this.managementService.updateClient(this.currentClientId, clientData);
        this.notificationService.showSuccess('Client mis à jour avec succès');
      } else {
        await this.managementService.addClient(clientData);
        this.notificationService.showSuccess('Client ajouté avec succès');
        this.clientForm.reset();
        this.generateClientNumber(); // Générer un nouveau numéro après l'ajout
      }
    } catch (error) {
      console.error('Erreur:', error);
      this.notificationService.showError('Une erreur est survenue lors de la sauvegarde du client');
    } finally {
      this.notificationService.setLoading(false);
    }
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

// Pour pré-remplir le formulaire en mode édition
setFormData(client: Client) {
  this.isEditMode = true;
  //this.currentClientId = client.id || null; // Correction ici
  this.currentClientId = client.id ? client.id : null;
  this.clientNumber = client.clientNumber || '';
  this.clientForm.patchValue({
    clientNumber: client.clientNumber,
    name: client.name,
    phoneNumber: client.phoneNumber,
    email: client.email,
    address: client.address
  });
}

  resetForm() {
    this.clientForm.reset();
    this.isEditMode = false;
    this.currentClientId = null;
    this.generateClientNumber();
  }

}
