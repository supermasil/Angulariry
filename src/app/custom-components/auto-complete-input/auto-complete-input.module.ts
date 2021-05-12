import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { MatTooltipModule } from "@angular/material/tooltip";
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
    ReactiveFormsModule,
    MatTooltipModule
  ],
  exports: [
    AutoCompleteInputComponent
  ]
})
export class AutoCompleteInputModule {

}
