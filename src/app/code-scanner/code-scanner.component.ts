import { Component, ViewChild, AfterViewInit } from "@angular/core";
import { BarecodeScannerLivestreamComponent } from "ngx-barcode-scanner";
import { CodeScannerService } from './code-scanner.service';

@Component({
  selector: "app-code-scanner",
  templateUrl: './code-scanner.component.html',
  styleUrls: ['./code-scanner.component.html']
})
export class CodeScannerComponent implements AfterViewInit {
  constructor(public codeScannerService: CodeScannerService) {}
  @ViewChild(BarecodeScannerLivestreamComponent)
  barecodeScanner: BarecodeScannerLivestreamComponent;
  barcodeValue;
  isOpen = false;

  ngAfterViewInit() {}

  onScannerClick() {
    if (!this.isOpen) {
      this.barecodeScanner.start();
    } else {
      this.barecodeScanner.stop();
    }
    this.isOpen = !this.isOpen;
  }

  onValueChanges(result) {
    if (result.codeResult.code !== this.barcodeValue) {
      this.barcodeValue = result.codeResult.code;
      // console.log(this.barcodeValue)
      this.codeScannerService.updateCodeScannerUpdateListener(this.barcodeValue);
    }
  }

  onStarted(started) {
    // console.log(started);
  }
}
