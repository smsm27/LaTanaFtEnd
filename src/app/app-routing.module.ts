import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { CarrelloComponent } from './carrello/carrello.component';
import { LaTanaDelNerdComponent } from './home/home.component';
import { LoginComponent } from './login/login.component';
import { AuthGuard } from './auth.guard';

const routes: Routes = [
  { path: '', component: LaTanaDelNerdComponent },
  { path: 'login', component: LoginComponent },
  { path: 'home', component: LaTanaDelNerdComponent, canActivate: [AuthGuard] },
  { path: 'carrello', component: CarrelloComponent },
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
