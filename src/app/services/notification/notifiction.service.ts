import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NotifictionService {

  private errorMessageSubject = new BehaviorSubject<string | null>(null);
  private successMessageSubject = new BehaviorSubject<string | null>(null);
  private isLoadingSubject = new BehaviorSubject<boolean>(false);

  // Observables pour les messages et le loader
  errorMessage$ = this.errorMessageSubject.asObservable();
  successMessage$ = this.successMessageSubject.asObservable();
  isLoading$ = this.isLoadingSubject.asObservable();

  // Afficher un message d'erreur
  showError(message: string) {
    this.errorMessageSubject.next(message);
    setTimeout(() => this.errorMessageSubject.next(null), 5000); // Masquer après 5 secondes
  }

  // Afficher un message de succès
  showSuccess(message: string) {
    this.successMessageSubject.next(message);
    setTimeout(() => this.successMessageSubject.next(null), 5000); // Masquer après 5 secondes
  }

  // Activer/désactiver le loader
  setLoading(isLoading: boolean) {
    this.isLoadingSubject.next(isLoading);
  }
}
