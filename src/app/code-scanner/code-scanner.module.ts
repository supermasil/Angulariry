import { NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { AngularMaterialModule } from '../angular-material.module';
import { CodeScannerComponent } from "./code-scanner.component";

// @NgModule({
//   declarations: [CodeScannerComponent],
//   imports: [BrowserModule, AngularMaterialModule],
//   exports: [CodeScannerComponent],
//   bootstrap: [CodeScannerComponent]
// })
// export class CodeScannerModule {}

@NgModule({
  declarations: [CodeScannerComponent],
  imports: [BrowserModule, AngularMaterialModule],
  exports: [CodeScannerComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  providers: [],
  bootstrap: [CodeScannerComponent],
})
export class CodeScannerModule {}
