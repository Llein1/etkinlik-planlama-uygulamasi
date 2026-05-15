import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, CommonModule, RouterModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private http = inject(HttpClient);
  loginForm: FormGroup;

  constructor(private formBuilder: FormBuilder) {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  onSubmit() {
    if (this.loginForm.valid) {
      const loginData = this.loginForm.value;
      this.http.post('http://localhost:8090/user/login', loginData, { withCredentials: true }).subscribe({
        next: (response) => {
          const {id, name, email} = response as any;
          localStorage.setItem('id', id);
          localStorage.setItem('name', name);
          localStorage.setItem('email', email);
          window.location.href = '/events';
        },
        error: (error) => {
          alert('Giriş başarısız: ' + (error.error?.message || 'Bilinmeyen hata'));
        }
      });
    }
  }
}

