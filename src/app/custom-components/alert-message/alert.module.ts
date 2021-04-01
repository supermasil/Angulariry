import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AlertComponent } from './alert.component';
import { ToastrModule } from 'ngx-toastr';

@NgModule({
    imports: [
      CommonModule
    ],
    declarations: [AlertComponent],
    exports: [AlertComponent]
})
export class AlertModule { }
