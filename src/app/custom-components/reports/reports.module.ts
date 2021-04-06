import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { AngularMaterialModule } from "src/app/angular-material.module";
import { CodeScannerModule } from "../code-scanner/code-scanner.module";
import { SearchBarModule } from "../search-bar/search-bar.module";
import { ReportsRoutingModule } from "./reports-routing.module";
import { TrackingsReportComponent } from "./trackings-report.component";
import { UsersReportComponent } from "./users-report.component";


@NgModule({
  declarations: [
    TrackingsReportComponent,
    UsersReportComponent
  ],
  imports: [
    CommonModule,
    AngularMaterialModule,
    FormsModule,
    ReactiveFormsModule,
    CodeScannerModule,
    SearchBarModule,
    ReportsRoutingModule
  ],
  exports: [
    TrackingsReportComponent,
    UsersReportComponent
  ]
})
export class ReportsModule {}
