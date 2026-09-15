import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-auth-callback',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
      <div class="w-10 h-10 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
      <h2 class="text-white text-base font-semibold">Procesando autenticación con Microsoft...</h2>
      <p class="text-slate-400 text-xs mt-1">Validando token JWT y permisos de acceso</p>
    </div>
  `
})
export class AuthCallbackComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);

  ngOnInit(): void {
    // Redirigir al dashboard una vez procesada la autenticación
    setTimeout(() => {
      if (this.authService.isAuthenticated()) {
        this.router.navigate(['/dashboard']);
      } else {
        this.router.navigate(['/login']);
      }
    }, 800);
  }
}
