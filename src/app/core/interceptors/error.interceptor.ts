import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { NotificationService } from '../services/notification.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const notificationService = inject(NotificationService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'Ocurrió un error inesperado';

      switch (error.status) {
        case 401:
          errorMessage = 'Sesión expirada o no autorizada. Redirigiendo a inicio de sesión...';
          notificationService.error('Error de Autenticación (401)', errorMessage);
          authService.logout();
          break;

        case 403:
          errorMessage = 'No tienes permisos para realizar esta acción.';
          notificationService.error('Acceso Prohibido (403)', errorMessage);
          break;

        case 404:
          errorMessage = error.error?.message || 'Recurso no encontrado en el servidor.';
          notificationService.error('No Encontrado (404)', errorMessage);
          break;

        case 409:
          errorMessage = error.error?.message || 'Conflicto con el estado actual del recurso (ej. stock insuficiente o cambio de estado ya realizado).';
          notificationService.warning('Conflicto (409)', errorMessage);
          break;

        case 422:
          if (error.error?.validationErrors) {
            const valList = Object.entries(error.error.validationErrors)
              .map(([field, msg]) => `${field}: ${msg}`)
              .join(', ');
            errorMessage = `Error de validación: ${valList}`;
          } else {
            errorMessage = error.error?.message || 'Los datos enviados no superaron las reglas de validación del backend.';
          }
          notificationService.error('Error de Validación (422)', errorMessage);
          break;

        case 500:
        case 502:
        case 503:
        case 504:
          errorMessage = 'Ocurrió un error en el servidor. Intenta nuevamente.';
          notificationService.error('Error del Servidor (500)', errorMessage);
          break;

        default:
          if (error.status === 0) {
            errorMessage = 'No se pudo conectar con el API Gateway / Backend. Verifica tu conexión a la red o URL del backend.';
          } else {
            errorMessage = error.error?.message || `Error HTTP (${error.status}): ${error.statusText}`;
          }
          notificationService.error('Error de Comunicación', errorMessage);
          break;
      }

      // Evitar propagar detalles internos o stack traces
      return throwError(() => new Error(errorMessage));
    })
  );
};
