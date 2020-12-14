import { Component, OnInit } from "@angular/core";
import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';


@Component({
  selector: 'serviced-form-create',
  templateUrl: './serviced-form.component.html',
  styleUrls: ['./serviced-form.component.css', '../tracking-create.component.css']
})
export class ServicedFormCreateComponent implements OnInit {
  servicedForm: FormGroup;

  ngOnInit() {
    this.servicedForm = new FormGroup({
      orderNumber: new FormControl({value: "sev-" + Date.now(), disabled: true}),
      items: new FormArray([this.createItem()]),
      content: new FormControl(""),
    });
  }

  onSave() {

  }


  createItem(): FormGroup {
    return new FormGroup({
      orderNumber: new FormControl({value: "sev-" + Date.now(), disabled: true}, {validators: [Validators.required]}),
      productLink: new FormControl("", {validators: [Validators.required]}),
      productPrice: new FormControl("", {validators: [Validators.required, Validators.min(0.01)]}),
      specifications: new FormControl("", {validators: [Validators.required]}),
      quantity: new FormControl("", {validators: [Validators.required]}),
      content: new FormControl("")
    });
  }

  addItem() {
    (this.servicedForm.get('items') as FormArray).push(this.createItem());
  }

  removeItem(i: number) {
    if((this.servicedForm.get('items') as FormArray).length == 1) {
      return;
    }
    (this.servicedForm.get('items') as FormArray).removeAt(i);
  }
}
