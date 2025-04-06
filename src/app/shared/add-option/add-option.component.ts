import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule, AbstractControl  } from '@angular/forms';
import { SelectOptionsService } from '../../services/selected/select-options.service';
import { CommonModule } from '@angular/common';
import { NotifictionService } from '../../services/notification/notifiction.service';
import { lastValueFrom } from 'rxjs';

@Component({
  selector: 'app-add-option',
 imports: [FormsModule, ReactiveFormsModule, CommonModule],
  templateUrl: './add-option.component.html',
  styleUrl: './add-option.component.scss'
})
export class AddOptionComponent implements OnInit {
  newSelectorName: string = '';
  newOptionName: string = '';
  selectors: any[] = [];
  options: any[] = [];
  selectedSelectorId: string | null = null;

  constructor(
    private selectOptionsService: SelectOptionsService,
    private notificationService: NotifictionService
  ) {}

  ngOnInit(): void {
    this.loadSelectors();
  }

  onInputChange(){
    
  }

  async addSelector(): Promise<void> {
    if (this.newSelectorName) {
      try {
        await this.selectOptionsService.addSelector(this.newSelectorName).toPromise();
        this.notificationService.showSuccess('Sélecteur ajouté avec succès');
        this.newSelectorName = '';
        this.loadSelectors();
      } catch (error) {
        this.notificationService.showError('Erreur lors de l\'ajout du sélecteur');
      }
    }
  }

  async deleteSelector(selectorId: string): Promise<void> {
    try {
      await this.selectOptionsService.deleteSelector(selectorId).toPromise();
      this.notificationService.showSuccess('Sélecteur supprimé avec succès');
      this.loadSelectors();
    } catch (error) {
      this.notificationService.showError('Erreur lors de la suppression du sélecteur');
    }
  }

  async addOption(selectorId: string, optionName: string): Promise<void> {
    if (optionName) {
      try {
        await this.selectOptionsService.addOption(selectorId, optionName).toPromise();
        this.notificationService.showSuccess('Option ajoutée avec succès');
        this.loadSelectors();
      } catch (error) {
        this.notificationService.showError('Erreur lors de l\'ajout de l\'option');
      }
    }
  }

  async deleteOption(selectorId: string, optionId: string): Promise<void> {
    try {
      await this.selectOptionsService.deleteOption(selectorId, optionId).toPromise();
      this.notificationService.showSuccess('Option supprimée avec succès');
      this.loadSelectors();
    } catch (error) {
      this.notificationService.showError('Erreur lors de la suppression de l\'option');
    }
  }

  toggleEditSelector(selector: any): void {
    if (selector.isEditing) {
      // Sauvegarder les modifications
      this.updateSelectorName(selector.id, selector.editName);
    }
    selector.isEditing = !selector.isEditing;
    selector.editName = selector.name; // Initialiser le champ d'édition
  }

  async updateSelectorName(selectorId: string, newName: string): Promise<void> {
    try {
      await this.selectOptionsService.updateSelectorName(selectorId, newName).toPromise();
      this.notificationService.showSuccess('Nom du sélecteur mis à jour');
      this.loadSelectors();
    } catch (error) {
      this.notificationService.showError('Erreur lors de la mise à jour du sélecteur');
    }
  }

  toggleEditOption(selectorId: string, option: any): void {
    if (option.isEditing) {
      // Sauvegarder les modifications
      this.updateOptionName(selectorId, option.id, option.editName);
    }
    option.isEditing = !option.isEditing;
    option.editName = option.name; // Initialiser le champ d'édition
  }

  async updateOptionName(selectorId: string, optionId: string, newName: string): Promise<void> {
    try {
      await this.selectOptionsService.updateOptionName(selectorId, optionId, newName).toPromise();
      this.notificationService.showSuccess('Nom de l\'option mis à jour');
      this.loadSelectors();
    } catch (error) {
      this.notificationService.showError('Erreur lors de la mise à jour de l\'option');
    }
  }

  private async loadSelectors(): Promise<void> {
    try {
      this.selectors = await lastValueFrom(this.selectOptionsService.getSelectors());
      // Charger les options pour chaque sélecteur
      for (const selector of this.selectors) {
        selector.options = await lastValueFrom(this.selectOptionsService.getOptions(selector.id));
        selector.newOptionName = ''; // Initialiser le champ d'ajout d'option
        selector.isEditing = false; // Initialiser l'état d'édition
      }
    } catch (error) {
      this.notificationService.showError('Erreur lors du chargement des sélecteurs');
    }
  }
}
