import { NgModule } from "@angular/core";
import { CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { AngularMaterialModule } from '../../angular-material.module';
import { CodeScannerComponent } from "./code-scanner.component";
import { CommonModule } from "@angular/common";

@NgModule({
  declarations: [CodeScannerComponent],
  imports: [
    CommonModule,
    AngularMaterialModule,
    ],
  exports: [CodeScannerComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  providers: [],
  bootstrap: [],
})
export class CodeScannerModule {}
