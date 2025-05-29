import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Keyclock } from '../servizi/keyclock.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  loading = false;
  error = '';
  submitted = false;
  returnUrl: string = '/home';

  constructor(
    private formBuilder: FormBuilder,
    private keycloakService: Keyclock,
    private router: Router,
    private route: ActivatedRoute
  ) {
    // Reindirizza alla home se l'utente è già autenticato
    if (this.keycloakService.isAuthenticated()) {
      this.router.navigate(['/home']);
    }

    this.loginForm = this.formBuilder.group({
      username: ['', Validators.required],
      password: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    // Prendi returnUrl dai parametri di query o utilizza home come default
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/home';
  }

  // Getter per facilità di accesso ai campi del form
  get f() { return this.loginForm.controls; }

  onSubmit(): void {
    this.submitted = true;

    // Ferma qui se il form non è valido
    if (this.loginForm.invalid) {
      return;
    }

    this.loading = true;
    this.error = '';

    // È importante usare la sintassi corretta in base alla versione di Angular
    const username = this.f['username'].value;
    const password = this.f['password'].value;

    this.keycloakService.login(username, password)
      .subscribe({
        next: () => {
          // Naviga al returnUrl o alla home dopo il login avvenuto con successo
          const token = localStorage.getItem('access_token');
          console.log('Token:', token);
          this.router.navigate([this.returnUrl]);
        },
        error: (error: any) => {
          this.error = 'Username o password non validi';
          this.loading = false;
        }
      });
  }
}
