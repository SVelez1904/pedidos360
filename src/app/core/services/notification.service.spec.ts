import { TestBed } from '@angular/core/testing';
import { NotificationService } from './notification.service';

describe('NotificationService', () => {
  let service: NotificationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NotificationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should add a toast and notify subscribers', (done) => {
    service.notifications$.subscribe(toasts => {
      if (toasts.length > 0) {
        expect(toasts[0].title).toBe('Test Title');
        expect(toasts[0].message).toBe('Test message body');
        expect(toasts[0].type).toBe('success');
        done();
      }
    });

    service.success('Test Title', 'Test message body');
  });

  it('should remove toast by id', (done) => {
    service.info('Info Test', 'Info details');
    const current = service.getToasts();
    expect(current.length).toBe(1);
    const toastId = current[0].id;

    service.remove(toastId);
    expect(service.getToasts().length).toBe(0);
    done();
  });
});
