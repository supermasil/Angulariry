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
  @Input() dataObservable: Observable<string[]> = new Observable();
  @Input() matLabel = "";
  @Input() matErrorMessage = "";
  @Input() enforeSelection = false;
  @Input() lockOption = false;
  @Input() defaultValue = "";
  @Output() itemSelected = new EventEmitter();
  @Output() inputInvalid = new EventEmitter();


  filteredData: Observable<string[]>;
  autoCompleteForm: FormGroup;
  selectedItem : string;

  constructor(
    private zone: NgZone
  ) {

  }

  ngOnInit(): void {
    this.autoCompleteForm = new FormGroup({
      item: new FormControl({value: this.defaultValue, disabled: this.defaultValue && this.lockOption}, {validators:[this.autoCompleteValidator()]}) // Default value has to be defined for set value to work
    });
    this.dataObservable.subscribe(data => {
      this.zone.run(() => {
        this.data = data;
        this.resetFilteredData();
      })
    })

    if (this.defaultValue) {
      this.itemSelected.emit(this.defaultValue);
    }

    // this.autoCompleteForm.markAllAsTouched();
  }

  ngOnDestroy() {

  }

  autoCompleteValidator(): ValidatorFn {
    return (control: AbstractControl): {[key: string]: any} | null => {
      if (control && control.value) {
        if ((this.enforeSelection && this.data.includes(control.value)) || !this.enforeSelection)
          return null;
      }
      this.inputInvalid.emit(control.value);
      return {invalidInput: control.value};
    };
  }

  setData(data: string[]) {
    if (!data) return;
    this.zone.run(() => {
      this.data = data;
      this.resetFilteredData();
    });
    // To prevent "Expression has changed after it was checked"
  }

  filterItems(value: string) {
    const filterValue = value.toLowerCase();
    this.filteredData = of(this.data.filter(option => option.toLowerCase().includes(filterValue)));
  }

  resetForm() {
    this.autoCompleteForm.reset();
  }

  public selectItem(value: string) {
    this.autoCompleteForm.patchValue({
      item: value
    });

    this.selectedItem = value;
    this.itemSelected.emit(value);
    this.resetFilteredData(); // Reset the list
    if (this.enforeSelection) {
      if (this.lockOption) {
        this.autoCompleteForm.get('item').disable();
      }
    }
  }

  cancelItem() {
    this.selectedItem = null;
    this.autoCompleteForm.get('item').setValue('');
    this.autoCompleteForm.controls['item'].enable();
    this.resetFilteredData();
  }

  resetFilteredData() {
    this.filteredData = of(this.data);
  }

  getFormValidity() {
    this.autoCompleteForm.markAllAsTouched();
    return this.autoCompleteForm.valid;
  }
}
