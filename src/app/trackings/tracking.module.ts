import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AngularMaterialModule } from '../angular-material.module';
import { TrackingListComponent } from './tracking-list/tracking-list.component';
import { TrackingToolComponent } from './tracking-tool/tracking-tool.component';
import { NgxCurrencyModule } from 'ngx-currency';
import { ItemsListComponent } from './tracking-create-edit/items-list/items-list.component';
import { FileUploaderModule } from '../custom-components/file-uploader/file-uploader.module';
import { AutoCompleteInputModule } from '../custom-components/auto-complete-input/auto-complete-input.module';
import { TrackingRoutingModule } from './tracking-routing.module';
import { GeneralInfoComponent } from './tracking-create-edit/general-info/general-info.component';
import { FinalizedInfoComponent } from './tracking-create-edit/finalized-info/finalized-info.component';
import { ConsolidationTableComponent } from './tracking-create-edit/consolidation-table/consolidation-table.component';
import { TranslateModule } from '@ngx-translate/core';
import { NotesComponent } from '../custom-components/notes/notes.component';
import { SaveCancelButtonsModule } from '../custom-components/save-cancel-buttons/save-cancel-buttons.module';
import { SearchBarModule } from '../custom-components/search-bar/search-bar.module';
import { TrackingListCommonModule } from './tracking-list/tracking-list-common/tracking-list-common.module';
import { OnlineTrackingFormComponent } from './tracking-create-edit/tracking-forms/online-form.component';
import { ServicedTrackingFormComponent } from './tracking-create-edit/tracking-forms/serviced-form.component';
import { InPersonTrackingFormComponent } from './tracking-create-edit/tracking-forms/in-person-form.component';
import { ConsolidatedTrackingFormComponent } from './tracking-create-edit/tracking-forms/consolidated-form.component';
import { MasterTrackingFormComponent } from './tracking-create-edit/tracking-forms/master-form.component';


@NgModule({
  declarations: [
    TrackingToolComponent,
    TrackingListComponent,
    OnlineTrackingFormComponent,
    ServicedTrackingFormComponent,
    InPersonTrackingFormComponent,
    ConsolidatedTrackingFormComponent,
    MasterTrackingFormComponent,
    ItemsListComponent,
    GeneralInfoComponent,
    FinalizedInfoComponent,
    ConsolidationTableComponent,
    NotesComponent
  ],
  imports: [
    CommonModule,
    AngularMaterialModule,
    FormsModule,
    ReactiveFormsModule,
    NgxCurrencyModule,
    FileUploaderModule,
    AutoCompleteInputModule,
    TrackingRoutingModule,
    SaveCancelButtonsModule,
    TranslateModule.forChild(),
    SearchBarModule,
    TrackingListCommonModule
  ]
})
export class TrackingModule {

}
