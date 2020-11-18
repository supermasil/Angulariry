import { NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";

import { BarecodeScannerLivestreamModule } from "ngx-barcode-scanner";
import { AngularMaterialModule } from '../angular-material.module';
import { CodeScannerComponent } from "./code-scanner.component";

@NgModule({
  declarations: [CodeScannerComponent],
  imports: [BrowserModule, BarecodeScannerLivestreamModule, AngularMaterialModule],
  exports: [CodeScannerComponent],
  bootstrap: [CodeScannerComponent]
})
export class CodeScannerModule {}
