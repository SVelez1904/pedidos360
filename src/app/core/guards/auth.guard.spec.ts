import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { authGuard } from './auth.guard';
import { AuthService } from '../auth/auth.service';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

describe('authGuard', () => {
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['isAuthenticated']);
    routerSpy = jasmine.createSpyObj('Router', ['createUrlTree']);

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    });
  });

  it('should allow access if authenticated', () => {
    authServiceSpy.isAuthenticated.and.returnValue(true);
    const mockRoute = {} as ActivatedRouteSnapshot;
    const mockState = { url: '/dashboard' } as RouterStateSnapshot;

    const result = TestBed.runInInjectionContext(() => authGuard(mockRoute, mockState));
    expect(result).toBe(true);
  });

  it('should redirect to login if not authenticated', () => {
    authServiceSpy.isAuthenticated.and.returnValue(false);
    const mockRoute = {} as ActivatedRouteSnapshot;
    const mockState = { url: '/dashboard' } as RouterStateSnapshot;
    const dummyUrlTree = {} as any;
    routerSpy.createUrlTree.and.returnValue(dummyUrlTree);

    const result = TestBed.runInInjectionContext(() => authGuard(mockRoute, mockState));
    expect(result).toBe(dummyUrlTree);
    expect(routerSpy.createUrlTree).toHaveBeenCalledWith(['/login'], { queryParams: { returnUrl: '/dashboard' } });
  });
});
