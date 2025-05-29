import { Component, OnInit, OnDestroy } from '@angular/core';
import { CarrelloService } from '../servizi/carrello.service';
import { Router } from '@angular/router';
import { Keyclock } from '../servizi/keyclock.service';
import { OggettoCarrello } from '../dto/OggettoCarrello';
import { Prodotto } from '../dto/Prodotto';
import { CarrelloDto } from '../dto/CarrelloDto';
import { Subscription } from 'rxjs';
import { ProdottiStorageService } from '../servizi/prodotti-storage.service';

@Component({
  selector: 'app-carrello',
  templateUrl: './carrello.component.html',
  styleUrls: ['./carrello.component.css']
})
export class CarrelloComponent implements OnInit, OnDestroy {
  carrelloDto: CarrelloDto | undefined;
  totaleCarrello: number = 0;
  isUserLoggedIn: boolean = false;
  username: string = '';
  
  private authSubscription: Subscription = new Subscription();
  //private carrelloSubscription: Subscription = new Subscription();

  constructor(
    private carrelloService: CarrelloService,
    private router: Router,
    private keycloakService: Keyclock,
    private prodottiStorage: ProdottiStorageService
  ) { }

 ngOnInit(): void {
    // FORZA il refresh del carrello dal backend ogni volta che il componente viene caricato
    this.carrelloService.refreshCarrello();
    
    // Piccolo delay per permettere al backend di rispondere, poi carica i dati
    setTimeout(() => {
      this.caricaCarrello();
    }, 500);

    // Sottoscrivi ai cambiamenti dell'utente
    this.authSubscription = this.keycloakService.currentUser$.subscribe(user => {
      this.isUserLoggedIn = !!user;
      this.username = user ? (user.preferred_username || user.username || 'Utente') : '';
    });
  }
  private caricaCarrello(): void {
    this.carrelloDto = this.carrelloService.getCarrelloDto();
    this.calcolaTotale();
  }

  ngOnDestroy(): void {
    this.authSubscription.unsubscribe();
    //this.carrelloSubscription.unsubscribe();
  }

 
  get carrelloItems(): OggettoCarrello[] {
    return this.carrelloDto?.oggettiCarrello || [];
  }

  get numeroArticoli(): number {
    return this.carrelloService.getNumeroArticoli();
  }

  get carrelloVuoto(): boolean {
    return this.carrelloItems.length === 0;
  }

  // METODI per recuperare informazioni sui prodotti
  getProdottoById(prodottoId: number): Prodotto | null {
    return this.prodottiStorage.getProdottoById(prodottoId);
  }

  getCarrelloConProdotti(): Array<{item: OggettoCarrello, prodotto: Prodotto | null}> {

    return this.carrelloService.getCarrelloConProdotti();
  }

  // METODI per il calcolo del totale
  calcolaTotale(): void {
    this.totaleCarrello = this.carrelloService.calcolaTotale();
  }

  getPrezzoItem(item: OggettoCarrello): number {
    const prodotto = this.getProdottoById(item.prodottoId);
    return prodotto?.prezzo || item.prezzo || 0;
  }

  getTotaleItem(item: OggettoCarrello): number {
    return this.getPrezzoItem(item) * item.quantitaScelta;
  }

  // METODI per la gestione del carrello
 incrementaQuantita(item: OggettoCarrello): void {
  console.log('Incremento quantità per l\'item:', item);
  // Crea una copia dell'item per evitare modifiche dirette
  const itemCopy: OggettoCarrello = {
    ...item,
    quantitaScelta: 1,
    
  };
  
  this.carrelloService.aggiungiAlCarrello(itemCopy);
  
  // Forza il refresh del carrello dopo l'operazione
  setTimeout(() => {
    this.carrelloService.refreshCarrello();
    setTimeout(() => {
      this.carrelloDto = this.carrelloService.getCarrelloDto();
      this.calcolaTotale();
    }, 300);
  }, 200);
}

  decrementaQuantita(item: OggettoCarrello): void {
  if (item.quantitaScelta <= 1) {
    // Se la quantità è 1, rimuovi l'item
    this.rimuoviDalCarrello(item);
    return;
  }
  
  // Crea una copia dell'item per evitare modifiche dirette
  const itemCopy: OggettoCarrello = {
    ...item,
    quantitaScelta: -1,
   };
  
  this.carrelloService.aggiungiAlCarrello(itemCopy);
  
  
}

  rimuoviDalCarrello(item: OggettoCarrello): void {
    const prodotto = this.getProdottoById(item.prodottoId);

    if (prodotto) {
      this.carrelloService.rimuoviDalCarrello(prodotto);
    }
  }

  svuotaCarrello(): void {
    if (confirm('Sei sicuro di voler svuotare il carrello?')) {
      this.carrelloService.svuotaCarrello();
    }
  }

  // METODI per la navigazione e checkout
  continuaAcquisti(): void {
    this.router.navigate(['/prodotti']);
  }

  procediAllOrdine(): void {
    if (this.carrelloVuoto) {
      alert('Il carrello è vuoto');
      return;
    }

    if (!this.isUserLoggedIn) {
      alert('Devi effettuare il login per procedere con l\'ordine');
      return;
    }

    // Forza il salvataggio del carrello prima di procedere
    this.carrelloService.confermaCarrelloBackend().subscribe();
    
    
  }

 

  // METODI per il template (helper methods)
  trackByItemCodice(index: number, item: OggettoCarrello): number {
    return item.codice;
  }

  formatPrezzo(prezzo: number): string {
    return prezzo.toFixed(2);
  }
}