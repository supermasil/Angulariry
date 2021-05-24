import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToolbarComponent } from './toolbar.component';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatRippleModule } from '@angular/material/core';
import { ToolbarNotificationsModule } from './toolbar-notifications/toolbar-notifications.module';
import { ToolbarUserModule } from './toolbar-user/toolbar-user.module';
import { ToolbarSearchModule } from './toolbar-search/toolbar-search.module';
import { IconModule } from '@visurel/iconify-angular';
import { NavigationModule } from '../navigation/navigation.module';
import { RouterModule } from '@angular/router';
import { NavigationItemModule } from '../../components/navigation-item/navigation-item.module';
import { MegaMenuModule } from '../../components/mega-menu/mega-menu.module';
import { ContainerModule } from '../../directives/container/container.module';
import { ToolbarOrgModule } from './toolbar-org/toolbar-org.module';
import { ToolbarLanguageModule } from './toolbar-language/toolbar-language.module';
import { TranslateModule } from '@ngx-translate/core';


@NgModule({
  declarations: [ToolbarComponent],
  imports: [
    CommonModule,
    FlexLayoutModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatRippleModule,
    ToolbarNotificationsModule,
    ToolbarUserModule,
    ToolbarOrgModule,
    ToolbarSearchModule,
    IconModule,
    NavigationModule,
    RouterModule,
    NavigationItemModule,
    MegaMenuModule,
    ContainerModule,
    ToolbarLanguageModule,
    TranslateModule.forChild()
  ],
  exports: [ToolbarComponent]
})
export class ToolbarModule {
}
