import { Component, EventEmitter, Input, NgZone, OnDestroy, OnInit, Output, ViewChild } from "@angular/core";
import { AbstractControl, FormControl, FormGroup, ValidatorFn } from "@angular/forms";
import { Observable, of } from "rxjs";


@Component({
  selector: 'auto-complete-input',
  templateUrl: './auto-complete-input.component.html',
  styleUrls: ['./auto-complete-input.component.css']
})
export class AutoCompleteInputComponent implements OnInit, OnDestroy {

  data = [];
  @Input() dataObservable: Observable<any[]> = new Observable();
  @Input() selectItemObservable: Observable<any> = new Observable(); // On edit case
  @Input() matLabel = "";
  @Input() matErrorMessage = "";
  @Input() lockOption = false;
  @Input() defaultValue = "";
  @Input() required = true;
  @Input() fields: string[] = [];
  @Output() itemSelected = new EventEmitter();
  @Output() inputInvalid = new EventEmitter();
  @Output() itemCancelled = new EventEmitter();


  filteredData: Observable<any[]>;
  autoCompleteForm: FormGroup;
  selectedItem : any;

  constructor(
    private zone: NgZone
  ) {

  }

  ngOnInit(): void {
    this.autoCompleteForm = new FormGroup({
      item: new FormControl({value: this.defaultValue, disabled: this.defaultValue && this.lockOption}, {validators:[this.autoCompleteValidator()]}) // Default value has to be defined for set value to work
    });
    this.dataObservable.subscribe((data: any[]) => {
      this.zone.run(() => {
        this.data = data;
        this.resetFilteredData();
      })
    });

    this.selectItemObservable.subscribe((item: string) => {
      this.selectItem(item);
    })

    if (this.defaultValue) {
      // this.itemSelected.emit(this.defaultValue);
    }
  }

  ngOnDestroy() {

  }

  autoCompleteValidator(): ValidatorFn {
    return (control: AbstractControl): {[key: string]: any} | null => {
      if (!this.required && control && !control.value) {
        return null;
      }

      if (control && control.value) {
        if ((this.data.some(option => this.transformObjectToString(option) == control.value) && this.selectedItem && this.transformObjectToString(this.selectedItem) == control.value))
          return null;
      }
      this.inputInvalid.emit(control.value);
      return {invalidInput: control.value};
    };
  }

  setData(data: any[]) {
    if (!data) return;
    this.zone.run(() => {
      this.data = data;
      this.resetFilteredData();
    });
    // To prevent "Expression has changed after it was checked"
  }

  filterItems(value: string) {
    let transformedValue = value.toLowerCase();
    this.filteredData = of(this.data.filter(option => this.transformObjectToString(option).toLowerCase().includes(transformedValue)));
  }

  resetForm() {
    this.autoCompleteForm.reset();
  }

  public selectItem(item: any) {
    if (!item) {
      return;
    }
    this.selectedItem = item // Has to be before patching
    this.autoCompleteForm.patchValue({
      item: this.transformObjectToString(item)
    });

    this.itemSelected.emit(item);
    this.resetFilteredData(); // Reset the list

    this.autoCompleteForm.get('item').disable();
  }

  transformObjectToString(item: any) {
    let result = []
    this.fields.forEach(f => {
      let path = f.split('.'); // For nested path
      let value = item[path[0]];
      path.slice(1).forEach(p => {
        value = value[p]
      })
      if (item[f]) {
        result.push(item[f]);
      }
    });
    return result.join(' | ');
  }

  cancelItem() {
    this.selectedItem = null;
    this.autoCompleteForm.get('item').setValue(null);
    this.autoCompleteForm.controls['item'].enable();
    this.itemCancelled.emit();
    this.resetFilteredData();
  }

  resetFilteredData() {
    this.filteredData = of(this.data);
  }

  getFormValidity() {
    if (this.selectedItem && this.transformObjectToString(this.selectedItem) != this.autoCompleteForm.get('item').value) {
      return false;
    }
    this.autoCompleteForm.markAllAsTouched();
    return this.autoCompleteForm.valid;
  }
}
