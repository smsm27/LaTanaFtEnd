import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AppRoutingModule } from './app-routing.module';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';

import { JwtModule, JwtInterceptor } from '@auth0/angular-jwt';

import { AppComponent } from './app.component';
import { LaTanaDelNerdComponent } from './home/home.component';
import { CarrelloComponent } from './carrello/carrello.component';
import { LoginComponent } from './login/login.component';

// Funzione per ottenere il token JWT dal localStorage
export function tokenGetter() {
  const token = localStorage.getItem('access_token');
  // Sempre recupera il token più aggiornato
  return token;
}

@NgModule({
  declarations: [
    AppComponent,
    LaTanaDelNerdComponent,
    CarrelloComponent,
    LoginComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    AppRoutingModule,
    JwtModule.forRoot({
      config: {
        tokenGetter: tokenGetter,
        allowedDomains: ['localhost:8081'], // Domini dove aggiungere il token
        disallowedRoutes: ['localhost:8081/auth'] // Route dove NON aggiungere il token
      }
    })
  ],
  providers: [
    // Registra l'interceptor JWT
    {
      provide: HTTP_INTERCEPTORS,
      useClass: JwtInterceptor,
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }