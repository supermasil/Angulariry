import { NgxMatDatetimePickerModule, NgxMatTimepickerModule } from "@angular-material-components/datetime-picker";
import { NgxMatMomentModule } from "@angular-material-components/moment-adapter";
import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { TranslateModule } from "@ngx-translate/core";
import { AngularMaterialModule } from "src/app/angular-material.module";
import { UserListCommonModule } from "src/app/auth/user-list-common/user-list-common.module";
import { TrackingListCommonTemplateModule } from "src/app/trackings/tracking-list/tracking-list-common/tracking-list-common.module";
import { AutoCompleteInputModule } from "../auto-complete-input/auto-complete-input.module";
import { CodeScannerModule } from "../code-scanner/code-scanner.module";
import { SaveCancelButtonsModule } from "../save-cancel-buttons/save-cancel-buttons.module";
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
    ReportsRoutingModule,
    TranslateModule.forChild(),
    AutoCompleteInputModule,
    NgxMatDatetimePickerModule,
    MatDatepickerModule,
    NgxMatTimepickerModule,
    NgxMatMomentModule,
    SaveCancelButtonsModule,
    TrackingListCommonTemplateModule,
    UserListCommonModule
  ],
  exports: [
    TrackingsReportComponent,
    UsersReportComponent
  ]
})
export class ReportsModule {}
