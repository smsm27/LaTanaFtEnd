import { Injectable } from '@angular/core';
import { Prodotto } from '../dto/Prodotto';
import { HttpClient, HttpErrorResponse, HttpHeaders} from "@angular/common/http"
import { CarrelloDto } from '../dto/CarrelloDto';
import { ADDRESS_BACKEND } from './costanti';
import { OggettoCarrello } from '../dto/OggettoCarrello';
import { ProdottiStorageService } from './prodotti-storage.service';
import { Keyclock } from './keyclock.service';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CarrelloService {
  private carrelloDto: CarrelloDto = {
    codice: -1,
    oggettiCarrello: []
    };
  //private carrelloSubject = new BehaviorSubject<CarrelloDto | undefined>(undefined);
  //public carrello$: Observable<CarrelloDto | undefined> = this.carrelloSubject.asObservable();
  
  path: string = "/carrello";

  constructor(
    private http: HttpClient,
    private prodottiStorage: ProdottiStorageService,
    private keycloakService: Keyclock
  ) {
    this.inizializzaCarrello();
  }

  public inizializzaCarrello(): void {
    const username = this.keycloakService.getUsernameFromToken();
    if (!username) {
      console.log('Utente non autenticato, impossibile inizializzare carrello');
      return;
    }

    this.recuperaCarrelloDaBackend();
  }


  public recuperaCarrelloDaBackend(): void {
 
  
  this.http.get<CarrelloDto>(ADDRESS_BACKEND + this.path + '/getCarrello', {
    headers: new HttpHeaders({
      'Content-Type': 'application/json'
    })
  }).subscribe(
    (carrello) => {
      this.carrelloDto = carrello;
      console.log('Carrello recuperato dal backend:', this.carrelloDto);
      
    },
    (error: HttpErrorResponse) => {
      console.error('Errore nel recupero del carrello:', error);
      
      
      if (error.status === 404 || error.status === 0) {
        console.log('Carrello non trovato, creazione nuovo carrello');
        this.creaCarrello();
      } 
    }
  );
}

  private creaCarrello(): void {
    const username = this.keycloakService.getUsernameFromToken();
    if (!username) return;
    this.http.post<CarrelloDto>(ADDRESS_BACKEND + this.path + '/creaCarrello', {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      })
    }).subscribe(
      (carrelloCreato) => {
        this.carrelloDto = carrelloCreato;
        // Doppio controllo per sicurezza
        if (!this.carrelloDto.oggettiCarrello) {
          this.carrelloDto.oggettiCarrello = [];
        }
        //this.carrelloSubject.next(this.carrelloDto);
        console.log('Nuovo carrello creato:', this.carrelloDto);
      },
      (error: HttpErrorResponse) => {
        console.error('Errore nella creazione del carrello:', error);
        
      }
    );
  }

  public confermaCarrelloBackend(): Observable<CarrelloDto> {
    return new Observable(observer => {
      if (this.carrelloDto && this.keycloakService.isAuthenticated()) {
        this.http.post<CarrelloDto>(ADDRESS_BACKEND + this.path + '/confermaCarrello', {
          headers: new HttpHeaders({
            'Content-Type': 'application/json'
          })
        }).subscribe(
          (carrelloAggiornato) => {
            console.log('Acquisto effettuato:', carrelloAggiornato);
            
              this.carrelloDto = carrelloAggiornato;
            // Assicurati che l'array sia sempre inizializzato anche dopo il salvataggio
            if (!this.carrelloDto.oggettiCarrello) {
              this.carrelloDto.oggettiCarrello = [];
            }
            //this.carrelloSubject.next(this.carrelloDto);
            observer.next(carrelloAggiornato);
            observer.complete();
            alert('Acquisto effettuato con successo!, grazie!!!');
            
            
          },
          (error: HttpErrorResponse) => {
            console.error('Errore nel salvataggio del carrello nel backend:', error);
            alert(error.error.errore);
          }
        );
      } else {
        observer.error('Carrello non inizializzato o utente non autenticato');
      }
    });
  }
  getCarrelloDto(): CarrelloDto {
  
    return this.carrelloDto;
  }
  public aggiungiAlCarrello(nuovoOggettoCarrello: OggettoCarrello): void {
    console.log('Aggiunta al carrello:', JSON.stringify(nuovoOggettoCarrello, null, 2));
  if (!this.carrelloDto) {
    console.error('CarrelloDto non inizializzato');
    this.inizializzaCarrello();
    return;
  }

  if (!this.carrelloDto.oggettiCarrello) {
    this.carrelloDto.oggettiCarrello = [];
  }

  // Salva lo stato precedente per eventuale rollback
  const statoCarrelloPrecedente = JSON.parse(JSON.stringify(this.carrelloDto.oggettiCarrello));

  this.http.post<CarrelloDto>(ADDRESS_BACKEND + this.path + '/add', nuovoOggettoCarrello, {
    headers: new HttpHeaders({
      'Content-Type': 'application/json'
    })
  }).subscribe(
    response => {
      console.log('Prodotto aggiunto al carrello nel backend:', response);
      // Aggiorna direttamente con la risposta invece di fare una nuova chiamata
      this.carrelloDto = response;
      // Assicurati che l'array sia sempre inizializzato
      if (!this.carrelloDto.oggettiCarrello) {
        this.carrelloDto.oggettiCarrello = [];
      }
      console.log('CarrelloDto aggiornato:', JSON.stringify(this.carrelloDto, null, 2));
    },
    error => {
      alert(error.error.errore);
      console.error('Errore nell\'aggiunta al carrello:', error.message);
      
      // Rollback: ripristina lo stato precedente del carrello
      this.carrelloDto.oggettiCarrello = statoCarrelloPrecedente;
      console.log('Rollback effettuato, carrello ripristinato');
    }
  );
}
  rimuoviDalCarrello(prodotto: Prodotto): void {
  if (!this.carrelloDto || !this.carrelloDto.oggettiCarrello) return;

  const prodottoId = Number(prodotto.codice);
  const index = this.carrelloDto.oggettiCarrello.findIndex(item => Number(item.prodottoId) === prodottoId);
  
  if (index !== -1) {
    // Salva lo stato precedente per eventuale rollback
    const statoCarrelloPrecedente = JSON.parse(JSON.stringify(this.carrelloDto.oggettiCarrello));
    
    // Rimuovi immediatamente dall'interfaccia (ottimistic update)
    this.carrelloDto.oggettiCarrello.splice(index, 1);
    
    // Effettua la chiamata al backend
    this.http.delete<CarrelloDto>(ADDRESS_BACKEND + this.path + '/deleteOggetto/' + prodottoId, {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      })
    }).subscribe(
      (response) => {
        console.log('Prodotto rimosso dal carrello nel backend:', response);
        // Aggiorna il carrello con la risposta del backend
        this.carrelloDto = response;
        // Assicurati che l'array sia sempre inizializzato
        if (!this.carrelloDto.oggettiCarrello) {
          this.carrelloDto.oggettiCarrello = [];
        }
        console.log('Carrello aggiornato dopo rimozione:', this.carrelloDto);
      },
      (error: HttpErrorResponse) => {
        console.error('Errore nella rimozione dal carrello:', error);
        
        // Rollback: ripristina lo stato precedente del carrello
        this.carrelloDto.oggettiCarrello = statoCarrelloPrecedente;
        console.log('Rollback effettuato, carrello ripristinato');
        
        // Mostra messaggio di errore all'utente
        alert('Errore nella rimozione del prodotto dal carrello. Riprova.');
      }
    );
  }
}
  svuotaCarrello(): void {
    if (!this.carrelloDto) return;
    this.carrelloDto.oggettiCarrello = [];
    this.http.delete<CarrelloDto>(ADDRESS_BACKEND + this.path + '/svuotaCarrello');
  }
  calcolaTotale(): number {
    if (!this.carrelloDto) return 0;

    return this.carrelloDto.oggettiCarrello.reduce((totale, item) => {
      const prodotto = this.prodottiStorage.getProdottoById(item.prodottoId);
      const prezzo = prodotto?.prezzo || item.prezzo || 0;
      return totale + (prezzo * item.quantitaScelta);
    }, 0);
  }
  getNumeroArticoli(): number {
    if (!this.carrelloDto) return 0;
    return this.carrelloDto.oggettiCarrello.reduce((total, item) => total + item.quantitaScelta, 0);
  }
  getProdottoCompleto(item: OggettoCarrello): Prodotto | null {
    return this.prodottiStorage.getProdottoById(item.prodottoId);
  }
  getCarrelloConProdotti(): Array<{item: OggettoCarrello, prodotto: Prodotto | null}> {
    console.log('CarrelloDto:', JSON.stringify(this.carrelloDto, null, 2));
    if (!this.carrelloDto) return [];
    
    return this.carrelloDto.oggettiCarrello.map(item => ({
      item: item,
      prodotto: this.getProdottoCompleto(item)
    }));
  }

  public refreshCarrello(): void {
  this.recuperaCarrelloDaBackend();
}

}