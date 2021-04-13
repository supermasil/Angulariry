import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AngularMaterialModule } from '../../angular-material.module';
import { NgxCurrencyModule } from 'ngx-currency';
import { TranslateModule } from '@ngx-translate/core';
import { UserListCommonComponent } from './user-list-common.component';
import { RouterModule } from '@angular/router';


@NgModule({
  declarations: [
    UserListCommonComponent
  ],
  imports: [
    CommonModule,
    AngularMaterialModule,
    FormsModule,
    ReactiveFormsModule,
    NgxCurrencyModule,
    TranslateModule.forChild(),
    RouterModule
  ],
  exports: [
    UserListCommonComponent
  ]
})
export class UserListCommonModule {

}
