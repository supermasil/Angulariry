import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { BrowserModule } from "@angular/platform-browser";
import { AngularMaterialModule } from "src/app/angular-material.module";
import { AutoCompleteInputComponent } from "./auto-complete-input.component";


@NgModule({
  declarations: [
    AutoCompleteInputComponent
  ],
  imports: [
    CommonModule,
    AngularMaterialModule,
    FormsModule,
    ReactiveFormsModule
  ],
  exports: [
    AutoCompleteInputComponent
  ]
})
export class AutoCompleteInputModule {

}
