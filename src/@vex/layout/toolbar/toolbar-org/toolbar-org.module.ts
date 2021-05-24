import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToolbarOrgComponent } from './toolbar-org.component';
import { ToolbarOrgDropdownComponent } from './toolbar-org-dropdown/toolbar-org-dropdown.component';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatIconModule } from '@angular/material/icon';
import { MatRippleModule } from '@angular/material/core';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { RelativeDateTimeModule } from '../../../pipes/relative-date-time/relative-date-time.module';
import { RouterModule } from '@angular/router';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { AngularMaterialModule } from 'src/app/angular-material.module';
import { IconModule } from '@visurel/iconify-angular';
import { ToolbarOrgOnboardComponent } from './toolbar-org-onboard/toolbar-org-onboard.component';


@NgModule({
  declarations: [ToolbarOrgComponent, ToolbarOrgDropdownComponent, ToolbarOrgOnboardComponent],
  imports: [
    CommonModule,
    FlexLayoutModule,
    MatIconModule,
    IconModule,
    MatRippleModule,
    MatMenuModule,
    MatButtonModule,
    RelativeDateTimeModule,
    RouterModule,
    MatTooltipModule,
    AngularMaterialModule,
    TranslateModule.forChild()
  ],
  exports: [ToolbarOrgComponent],
  entryComponents: [ToolbarOrgDropdownComponent]
})
export class ToolbarOrgModule {
}

