import { Injectable, inject, Injector, runInInjectionContext } from '@angular/core';
import { Firestore, collection, addDoc, doc, setDoc, getDoc, getDocs, deleteDoc } from '@angular/fire/firestore';
import { Product } from '../models/product.model';
import { Client } from '../models/client.model';
import { Sale } from '../models/sale.model';
import { Purchase } from '../models/purchase.model';
import { Expense } from '../models/expense.model';
import { Observable, of } from 'rxjs';


@Injectable({
  providedIn: 'root',
})
export class ManagementService {

  private firestore = inject(Firestore); // Injecter Firestore avec `inject`
  private injector = inject(Injector); // Injecter l'Injector

  async addProduct(id: string, product: Product) {
    return runInInjectionContext(this.injector, async () => {
      try {
        const productRef = doc(this.firestore, 'products', id); // Référence au document spécifique avec l'ID personnalisé
        await setDoc(productRef, product); // Ajouter le document avec l'ID personnalisé
        console.log('Produit ajouté avec succès, ID :', id); // Log l'ID du document
        return id; // Retourner l'ID du document
      } catch (error) {
        console.error('Erreur lors de l\'ajout du produit :', error); // Log en cas d'erreur
        throw error; // Propager l'erreur
      }
    });
  }

  async getProducts() {
    return runInInjectionContext(this.injector, async () => {
      try {
        const productCollection = collection(this.firestore, 'products'); // Référence à la collection 'products'
        const snapshot = await getDocs(productCollection); // Récupérer tous les documents
        const products = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Product)); // Mapper les documents
        return products;
      } catch (error) {
        console.error('Erreur lors de la récupération des produits :', error); // Log en cas d'erreur
        throw error; // Propager l'erreur
      }
    });
  }

  async updateProduct(id: string, product: Product) {
    return runInInjectionContext(this.injector, async () => {
      try {
        const productRef = doc(this.firestore, 'products', id); // Référence au document spécifique
        await setDoc(productRef, product); // Mettre à jour le document
        console.log('Produit mis à jour avec succès, ID :', id); // Log en cas de succès
      } catch (error) {
        console.error('Erreur lors de la mise à jour du produit :', error); // Log en cas d'erreur
        throw error; // Propager l'erreur
      }
    });
  }

  async deleteProduct(id: string) {
    return runInInjectionContext(this.injector, async () => {
      try {
        const productRef = doc(this.firestore, 'products', id); // Référence au document spécifique
        await deleteDoc(productRef); // Supprimer le document
        console.log('Produit supprimé avec succès, ID :', id); // Log en cas de succès
      } catch (error) {
        console.error('Erreur lors de la suppression du produit :', error); // Log en cas d'erreur
        throw error; // Propager l'erreur
      }
    });
  }
  

  // **Clients**
  async addClient(client: Client) {
    return runInInjectionContext(this.injector, async () => {
      try {
        const clientCollection = collection(this.firestore, 'clients'); // Référence à la collection 'clients'
        const clientRef = await addDoc(clientCollection, client); // Ajouter un document avec un ID auto-généré
        console.log('Client ajouté avec succès, ID :', clientRef.id); // Log l'ID du document
        return clientRef.id; // Retourner l'ID du document
      } catch (error) {
        console.error('Erreur lors de l\'ajout du client :', error); // Log en cas d'erreur
        throw error; // Propager l'erreur
      }
    });
  }

  async getClients() {
    return runInInjectionContext(this.injector, async () => {
      try {
        const clientCollection = collection(this.firestore, 'clients'); // Référence à la collection 'clients'
        const snapshot = await getDocs(clientCollection); // Récupérer tous les documents
        const clients = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Client)); // Mapper les documents
        return clients;
      } catch (error) {
        console.error('Erreur lors de la récupération des clients :', error); // Log en cas d'erreur
        throw error; // Propager l'erreur
      }
    });
  }

  async updateClient(id: string, client: Client) {
    return runInInjectionContext(this.injector, async () => {
      try {
        const clientRef = doc(this.firestore, 'clients', id); // Référence au document spécifique
        await setDoc(clientRef, client); // Mettre à jour le document
        console.log('Client mis à jour avec succès, ID :', id); // Log en cas de succès
      } catch (error) {
        console.error('Erreur lors de la mise à jour du client :', error); // Log en cas d'erreur
        throw error; // Propager l'erreur
      }
    });
  }

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

  // Ventes
  async addSale(sale: Sale): Promise<string> {
    return runInInjectionContext(this.injector, async () => {
      try {
        if (!sale.saleNumber) {
          throw new Error('Le numéro de vente est requis');
        }
  
        const saleRef = doc(this.firestore, 'sales', sale.saleNumber);
        await setDoc(saleRef, sale);
        
        console.log('Vente ajoutée avec succès, Numéro :', sale.saleNumber);
        return sale.saleNumber;
      } catch (error) {
        console.error('Erreur lors de l\'ajout de la vente :', error);
        throw error;
      }
    });
  }

  async getSales() {
    return runInInjectionContext(this.injector, async () => {
      try {
        const saleCollection = collection(this.firestore, 'sales'); // Référence à la collection 'sales'
        const snapshot = await getDocs(saleCollection); // Récupérer tous les documents
        const sales = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Sale)); // Mapper les documents
        return sales;
      } catch (error) {
        console.error('Erreur lors de la récupération des ventes :', error); // Log en cas d'erreur
        throw error; // Propager l'erreur
      }
    });
  }

  async deleteSale(saleNumber: string): Promise<void> {
    return runInInjectionContext(this.injector, async () => {
      try {
        const saleRef = doc(this.firestore, 'sales', saleNumber);
        await deleteDoc(saleRef);
        console.log('Vente supprimée avec succès');
      } catch (error) {
        console.error('Erreur lors de la suppression de la vente:', error);
        throw error;
      }
    });
  }
  
  async updateSale(sale: Sale): Promise<void> {
    return runInInjectionContext(this.injector, async () => {
      try {
        const saleRef = doc(this.firestore, 'sales', sale.saleNumber);
        await setDoc(saleRef, sale);
        console.log('Vente mise à jour avec succès');
      } catch (error) {
        console.error('Erreur lors de la mise à jour de la vente:', error);
        throw error;
      }
    });
  }

  // **Achats**
  async addPurchase(purchase: Purchase) {
    return runInInjectionContext(this.injector, async () => {
      try {
        const purchaseCollection = collection(this.firestore, 'purchases'); // Référence à la collection 'purchases'
        const purchaseRef = await addDoc(purchaseCollection, purchase); // Ajouter un document avec un ID auto-généré
        console.log('Achat ajouté avec succès, ID :', purchaseRef.id); // Log l'ID du document
        return purchaseRef.id; // Retourner l'ID du document
      } catch (error) {
        console.error('Erreur lors de l\'ajout de l\'achat :', error); // Log en cas d'erreur
        throw error; // Propager l'erreur
      }
    });
  }

  async getPurchases() {
    return runInInjectionContext(this.injector, async () => {
      try {
        const purchaseCollection = collection(this.firestore, 'purchases'); // Référence à la collection 'purchases'
        const snapshot = await getDocs(purchaseCollection); // Récupérer tous les documents
        const purchases = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Purchase)); // Mapper les documents
        return purchases;
      } catch (error) {
        console.error('Erreur lors de la récupération des achats :', error); // Log en cas d'erreur
        throw error; // Propager l'erreur
      }
    });
  }

  // **Dépenses**
  async addExpense(expense: Expense) {
    return runInInjectionContext(this.injector, async () => {
      try {
        const expenseCollection = collection(this.firestore, 'expenses'); // Référence à la collection 'expenses'
        const expenseRef = await addDoc(expenseCollection, expense); // Ajouter un document avec un ID auto-généré
        console.log('Dépense ajoutée avec succès, ID :', expenseRef.id); // Log l'ID du document
        return expenseRef.id; // Retourner l'ID du document
      } catch (error) {
        console.error('Erreur lors de l\'ajout de la dépense :', error); // Log en cas d'erreur
        throw error; // Propager l'erreur
      }
    });
  }

  async getExpenses() {
    return runInInjectionContext(this.injector, async () => {
      try {
        const expenseCollection = collection(this.firestore, 'expenses'); // Référence à la collection 'expenses'
        const snapshot = await getDocs(expenseCollection); // Récupérer tous les documents
        const expenses = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Expense)); // Mapper les documents
        return expenses;
      } catch (error) {
        console.error('Erreur lors de la récupération des dépenses :', error); // Log en cas d'erreur
        throw error; // Propager l'erreur
      }
    });
  }
}