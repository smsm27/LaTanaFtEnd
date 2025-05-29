import { Injectable } from '@angular/core';
import { Prodotto } from '../dto/Prodotto';

@Injectable({
  providedIn: 'root'
})
export class ProdottiStorageService {
  private readonly STORAGE_KEY = 'prodotti_nerd_store';

  constructor() { }

  // Salva tutti i prodotti in localStorage
  salvaProdotti(prodotti: Prodotto[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(prodotti));
    } catch (error) {
      console.error('Errore nel salvare i prodotti in localStorage:', error);
    }
  }

  // Recupera tutti i prodotti da localStorage
  getProdotti(): Prodotto[] {
    try {
      const prodottiJson = localStorage.getItem(this.STORAGE_KEY);
      return prodottiJson ? JSON.parse(prodottiJson) : [];
    } catch (error) {
      console.error('Errore nel recuperare i prodotti da localStorage:', error);
      return [];
    }
  }

  // Recupera un singolo prodotto per ID
  getProdottoById(id: number): Prodotto | null {
    const prodotti = this.getProdotti();
    return prodotti.find(p => p.codice === id) || null;
  }

  // Verifica se i prodotti sono salvati in localStorage
  hasProdotti(): boolean {
    return localStorage.getItem(this.STORAGE_KEY) !== null;
  }

  // Pulisce i prodotti da localStorage
  clearProdotti(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }
}