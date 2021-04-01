import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { filter } from 'rxjs/operators';

import { Alert, AlertType } from './alert.model';

@Injectable({ providedIn: 'root' })
export class AlertService {
    private subject = new Subject<Alert>();
    private defaultId = 'default-alert';


    // enable subscribing to alerts observable
    onAlert(): Observable<Alert> {
        return this.subject.asObservable();
    }

    // convenience methods
    success(message: string, options?: any) {
        this.alert(new Alert({ ...options, type: AlertType.Success, message }));
    }

    errorWithRequestId(requestId: string, message: string, options?: any) {
        let alert = new Alert({ ...options, type: AlertType.Error, message});
        alert.id = requestId;
        this.alert(alert);
    }

    error(message: string, options?: any) {
      let alert = new Alert({ ...options, type: AlertType.Error, message});
      this.alert(alert);
  }


    info(message: string, options?: any) {
        this.alert(new Alert({ ...options, type: AlertType.Info, message }));
    }

    warn(message: string, options?: any) {
        this.alert(new Alert({ ...options, type: AlertType.Warning, message }));
    }

    scroll() {
      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    }

    // main alert method
    alert(alert: Alert) {
        alert.id = alert.id || this.defaultId;
        this.subject.next(alert);
        this.scroll();
    }

    // clear alerts
    clear(id = this.defaultId) {
        this.subject.next(new Alert({ id }));
    }
}
