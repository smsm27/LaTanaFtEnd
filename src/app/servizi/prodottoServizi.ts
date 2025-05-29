import { HttpClient, HttpErrorResponse, HttpHeaders} from "@angular/common/http"
import { ADDRESS_BACKEND } from "./costanti";
import { Prodotto } from "../dto/Prodotto";
import { catchError, throwError } from "rxjs";
import {  Injectable } from "@angular/core";

@Injectable({
  providedIn: 'root'
})



export class prodottoServizi{
  path: string = "/prodotti";

  constructor(private http: HttpClient){
  }

  getProdotti(){
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.http.get<Prodotto[]>(ADDRESS_BACKEND+this.path+"/getProdotti",{headers})
    .pipe(
      catchError((error: HttpErrorResponse) => {
        if(error.status === 400) {
          const errorResponse = error.error as HttpErrorResponse;
          return throwError(() => HttpErrorResponse);
        }
        return throwError(() => 'si è verificato un errore')
    })
    )
  }
}
