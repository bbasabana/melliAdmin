import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc, getDocs, doc, deleteDoc, updateDoc } from '@angular/fire/firestore';
import { Observable, from } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SelectOptionsService {

  constructor(private firestore: Firestore) {}
// Ajouter un nouveau sélecteur
addSelector(selectorName: string): Observable<void> {
  const selectorsCollection = collection(this.firestore, 'selectors');
  return from(addDoc(selectorsCollection, { name: selectorName }).then(() => {}));
}

// Récupérer tous les sélecteurs
getSelectors(): Observable<{ id: string; name: string }[]> {
  const selectorsCollection = collection(this.firestore, 'selectors');
  return from(
    getDocs(selectorsCollection).then((snapshot) => {
      return snapshot.docs.map((doc) => ({ id: doc.id, name: doc.data()['name'] }));
    })
  );
}

 // Récupérer les options d'un sélecteur spécifique
 getSelectorOptions(selectorId: string): Observable<{ id: string; name: string }[]> {
  const optionsCollection = collection(this.firestore, `selectors/${selectorId}/options`);
  return from(
    getDocs(optionsCollection).then((snapshot) => {
      return snapshot.docs.map((doc) => ({ id: doc.id, name: doc.data()['name'] }));
    })
  );
}

// Supprimer un sélecteur et ses options
deleteSelector(selectorId: string): Observable<void> {
  const selectorDoc = doc(this.firestore, `selectors/${selectorId}`);
  return from(deleteDoc(selectorDoc));
}

// Mettre à jour le nom d'un sélecteur
updateSelectorName(selectorId: string, newName: string): Observable<void> {
  const selectorDoc = doc(this.firestore, `selectors/${selectorId}`);
  return from(updateDoc(selectorDoc, { name: newName }));
}

// Ajouter une option à un sélecteur
addOption(selectorId: string, optionName: string): Observable<void> {
  const optionsCollection = collection(this.firestore, `selectors/${selectorId}/options`);
  return from(addDoc(optionsCollection, { name: optionName }).then(() => {}));
}

// Récupérer les options d'un sélecteur
getOptions(selectorId: string): Observable<{ id: string; name: string }[]> {
  const optionsCollection = collection(this.firestore, `selectors/${selectorId}/options`);
  return from(
    getDocs(optionsCollection).then((snapshot) => {
      return snapshot.docs.map((doc) => ({ id: doc.id, name: doc.data()['name'] }));
    })
  );
}

// Supprimer une option d'un sélecteur
deleteOption(selectorId: string, optionId: string): Observable<void> {
  const optionDoc = doc(this.firestore, `selectors/${selectorId}/options/${optionId}`);
  return from(deleteDoc(optionDoc));
}

// Mettre à jour le nom d'une option
updateOptionName(selectorId: string, optionId: string, newName: string): Observable<void> {
  const optionDoc = doc(this.firestore, `selectors/${selectorId}/options/${optionId}`);
  return from(updateDoc(optionDoc, { name: newName }));
}
}
