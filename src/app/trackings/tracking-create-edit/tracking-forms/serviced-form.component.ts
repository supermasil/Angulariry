import { Component, OnInit } from "@angular/core";
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { mimeType } from '../mime-type.validator';


@Component({
  selector: 'serviced-form-create',
  templateUrl: './serviced-form.component.html',
  styleUrls: ['./serviced-form.component.css', '../tracking-create.component.css']
})
export class servicedFormCreateComponent implements OnInit {
  servicedForm: FormGroup;

  ngOnInit() {
    this.servicedForm = new FormGroup({
      orderNumber: new FormControl({value: "sev-" + Date.now(), disabled: true}, {validators: [Validators.required]}),
      productLink: new FormControl("", {validators: [Validators.required]}),
      productPrice: new FormControl("", {validators: [Validators.required, Validators.min(0.01)]}),
      specifications: new FormControl("", {validators: [Validators.required]}),
      quantity: new FormControl("", {validators: [Validators.required]}),
      content: new FormControl(""),
      fileValidator: new FormControl(null, {asyncValidators: [mimeType]})
    });
  }

  onSave() {

  }

  onFilePicked(event: Event) {

  }

  deleteFile(index: number, url: string) {

  }

}
