import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { Prodotto } from '../dto/Prodotto';
import { prodottoServizi } from '../servizi/prodottoServizi';
import { CarrelloService } from '../servizi/carrello.service';
import { Keyclock } from '../servizi/keyclock.service';
import { OggettoCarrello } from '../dto/OggettoCarrello';
import { ProdottiStorageService } from '../servizi/prodotti-storage.service';

@Component({
  selector: 'app-la-tana-del-nerd',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class LaTanaDelNerdComponent implements OnInit, OnDestroy {
  prodotti: Prodotto[] = [];
  searchText: string = '';
  isUserLoggedIn: boolean = false;
  username: string = '';
  private authSubscription: Subscription = new Subscription();

  constructor(
    private prodottoServizi: prodottoServizi,
    private carrelloService: CarrelloService,
    private router: Router,
    private keycloakService: Keyclock,
    private prodottiStorage: ProdottiStorageService
  ) { }

  ngOnInit(): void {
    this.caricaProdotti();
    this.checkAuthenticationStatus();
    
    this.authSubscription = this.keycloakService.currentUser$.subscribe(user => {
      this.isUserLoggedIn = !!user;
      this.username = user ? (user.preferred_username || user.username || 'Utente') : '';
    });
  }

  ngOnDestroy(): void {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }

  private checkAuthenticationStatus(): void {
    this.isUserLoggedIn = this.keycloakService.isAuthenticated();
    if (this.isUserLoggedIn) {
      this.username = this.keycloakService.getUsernameFromToken() || 'Utente';
      this.carrelloService.inizializzaCarrello();
    }
  }

  caricaProdotti(): void {
    if (this.keycloakService.isAuthenticated()) {
      this.prodottoServizi.getProdotti().subscribe(
        (data: Prodotto[]) => {
          this.prodotti = data;
          this.prodottiStorage.salvaProdotti(data);
        },
        error => {
          console.error('Errore nel caricamento dei prodotti:', error);
          this.handleRequestError(error);
        }
      );
    } else {
      this.keycloakService.checkAndRefreshToken().subscribe(
        (success) => {
          if (success) {
            this.loadProdottiWithValidToken();
          } else {
            this.handleTokenExpired();
          }
        },
        error => {
          console.error('Errore nel refresh del token:', error);
          this.handleTokenExpired();
        }
      );
    }
  }

  private loadProdottiWithValidToken(): void {
    this.prodottoServizi.getProdotti().subscribe(
      (data: Prodotto[]) => {
        this.prodotti = data;
        this.prodottiStorage.salvaProdotti(data);
      },
      error => {
        console.error('Errore nel caricamento dei prodotti dopo refresh token:', error);
        this.handleRequestError(error);
      }
    );
  }

  private handleRequestError(error: any): void {
    if (error.status === 401) {
      console.log('Token scaduto durante la richiesta');
      this.handleTokenExpired();
    } else {
      this.prodotti = this.prodottiStorage.getProdotti();
      console.log('Prodotti caricati da localStorage a causa di errore di rete');
    }
  }

  private handleTokenExpired(): void {
    console.log('Token scaduto e refresh fallito, effettuo logout');
    this.prodotti = this.prodottiStorage.getProdotti();
    this.keycloakService.logout();
    alert('La tua sessione è scaduta. Effettua nuovamente il login per accedere a tutte le funzionalità.');
  }

  get prodottiFiltrati(): Prodotto[] {
    if (!this.searchText) {
      return this.prodotti;
    }
    return this.prodotti.filter(prodotto =>
      prodotto.nome.toLowerCase().includes(this.searchText.toLowerCase())
    );
  }

  /**
   * Controlla se un prodotto è già presente nel carrello
   */
  private isProdottoGiaInCarrello(prodotto: Prodotto): boolean {
    const carrelloDto = this.carrelloService.getCarrelloDto();
    if (!carrelloDto || !carrelloDto.oggettiCarrello) {
      return false;
    }
    
    return carrelloDto.oggettiCarrello.some(item => 
      item.prodottoId === prodotto.codice || item.codice === prodotto.codice
    );
  }

  /**
   * Aggiungi prodotto al carrello - SOLO se non è già presente
   */
  aggiungiAlCarrello(prodotto: Prodotto): void {
    // Verifica autenticazione
    if (!this.keycloakService.isAuthenticated()) {
      alert('La tua sessione è scaduta. Effettua nuovamente il login.');
      this.router.navigate(['/login']);
      return;
    }

    // Verifica se il prodotto è già nel carrello
    if (this.isProdottoGiaInCarrello(prodotto)) {
      // Mostra messaggio e chiedi all'utente cosa fare
      const risposta = confirm(
        `${prodotto.nome} è già presente nel carrello.\n\n` +
        `Vuoi andare al carrello per modificare la quantità?\n\n` +
        `• OK = Vai al carrello\n` +
        `• Annulla = Resta qui`
      );
      
      if (risposta) {
        this.router.navigate(['/carrello']);
      }
      return;
    }

    // Verifica disponibilità
    if (prodotto.quantita <= 0) {
      alert(`Spiacenti, ${prodotto.nome} non è disponibile al momento.`);
      return;
    }

    console.log('Aggiunta nuovo prodotto al carrello:', prodotto);

    // Crea nuovo item per il carrello
    const nuovoItem: OggettoCarrello = {
      prodottoId: prodotto.codice,
      nome: prodotto.nome,
      prezzo: prodotto.prezzo,
      quantitaScelta: 1, // Sempre 1 per i nuovi prodotti
      codice: prodotto.codice // Usa il codice del prodotto
    };

    // Aggiungi al carrello
    this.carrelloService.aggiungiAlCarrello(nuovoItem);
    
    // Messaggio di successo con opzioni
    const messaggioSuccesso = `✅ ${prodotto.nome} aggiunto al carrello!\n\nCosa vuoi fare ora?`;
    
    setTimeout(() => {
      const azione = confirm(
        `${messaggioSuccesso}\n\n` +
        `• OK = Vai al carrello\n` +
        `• Annulla = Continua shopping`
      );
      
      if (azione) {
        this.router.navigate(['/carrello']);
      }
    }, 500); // Piccolo delay per permettere al backend di processare
  }

  /**
   * Getter semplificato per il carrello (solo per contare gli items)
   */
  get numeroArticoliCarrello(): number {
    return this.carrelloService.getNumeroArticoli();
  }

  /**
   * Metodo helper per verificare se un prodotto specifico è nel carrello
   * (utile per il template se vuoi mostrare stati diversi)
   */
  isInCarrello(prodotto: Prodotto): boolean {
    return this.isProdottoGiaInCarrello(prodotto);
  }

  /**
   * Getter per il totale del carrello (se vuoi mostrarlo nella header)
   */
  get totaleCarrello(): number {
    return this.carrelloService.calcolaTotale();
  }

  vaiAlLogin(): void {
    this.router.navigate(['/login']);
  }

  vaiAlCarrello(): void {
    this.router.navigate(['/carrello']);
  }

  logout(): void {
    this.keycloakService.logout();
    this.isUserLoggedIn = false;
    this.username = '';
    alert('Logout effettuato con successo!');
  }
}