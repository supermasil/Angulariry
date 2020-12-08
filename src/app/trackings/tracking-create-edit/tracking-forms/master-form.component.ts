import { Component } from "@angular/core";
import { FormGroup } from '@angular/forms';


@Component({
  selector: 'master-form-create',
  templateUrl: './master-form.component.html',
  styleUrls: ['./master-form.component.css', '../tracking-create.component.css']
})
export class masterFormCreateComponent {
  masterForm: FormGroup;
}
