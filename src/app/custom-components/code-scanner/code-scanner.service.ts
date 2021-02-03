import { Injectable } from "@angular/core";
import { Subject } from 'rxjs';


@Injectable({ providedIn: "root"})
export class CodeScannerService {
  private codeScannerUpdated = new Subject<string>();

  constructor() {}

  getCodeScannerUpdateListener() {
    return this.codeScannerUpdated.asObservable();
  }

  updateCodeScannerUpdateListener(code: string) {
    this.codeScannerUpdated.next(code)
  }
}
