import { Prodotto } from "./Prodotto";

export interface OggettoCarrello {
  prodottoId: number;
  codice: number;
  nome: string;
  prezzo: number;
  quantitaScelta: number;
}