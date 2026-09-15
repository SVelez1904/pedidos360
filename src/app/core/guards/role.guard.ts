import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { UserRole } from '../models/user.model';
import { NotificationService } from '../services/notification.service';

export const roleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const notificationService = inject(NotificationService);

  const allowedRoles = route.data?.['roles'] as UserRole[] | undefined;

  if (!allowedRoles || allowedRoles.length === 0) {
    return true;
  }

  if (authService.hasRole(allowedRoles)) {
    return true;
  }

  // Si el usuario no tiene los roles permitidos
  notificationService.error(
    'Acceso Denegado',
    `No tienes permisos para acceder a esta sección (${route.routeConfig?.path || ''}). Rol requerido: ${allowedRoles.join(' o ')}`
  );

  router.navigate(['/dashboard']);
  return false;
};
