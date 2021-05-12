import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { IconModule } from "@visurel/iconify-angular";
import { AngularMaterialModule } from "src/app/angular-material.module";
import { CodeScannerModule } from "../code-scanner/code-scanner.module";
import { SearchBarComponent } from "./search-bar.component";

@NgModule({
  declarations: [
    SearchBarComponent
  ],
  imports: [
    CommonModule,
    AngularMaterialModule,
    FormsModule,
    ReactiveFormsModule,
    CodeScannerModule,
    IconModule
  ],
  exports: [
    SearchBarComponent
  ]
})
export class SearchBarModule {}
