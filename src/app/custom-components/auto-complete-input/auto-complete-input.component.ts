import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from "@angular/core";
import { AbstractControl, FormControl, FormGroup, ValidatorFn } from "@angular/forms";
import { Observable, of, Subscription } from "rxjs";


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
  inputCtrl = new FormControl();

  autoCompleteForm: FormGroup;
  @ViewChild('submitButton') submitButton: ElementRef;

  constructor(private cdr: ChangeDetectorRef) {

  }

  ngOnInit(): void {
    this.autoCompleteForm = new FormGroup({
      item: new FormControl({value: this.defaultValue, disabled: this.defaultValue != ""} , {validators:[this.autoCompleteValidator()]})
    });

    this.dataObservable.subscribe(data => {
      this.data = data;
      this.resetFilteredData();
      this.cdr.detectChanges();
    })

    this.autoCompleteForm.markAllAsTouched();
  }

  ngOnDestroy() {

  }

  autoCompleteValidator(): ValidatorFn {
    return (control: AbstractControl): {[key: string]: any} | null => {
      if (control && control.value) {
        if (this.enforeSelection && this.data.includes(control.value))
          return null;
        if (!this.enforeSelection)
          return null;
      }
      this.inputInvalid.emit();
      return {wrongCompanyCode: control.value};
    };
  }

  setData(data: string[]) {
    if (!data) return;
    this.data = data;
    this.resetFilteredData();
    this.cdr.detectChanges();
    // To prevent "Expression has changed after it was checked"
  }

  filterItems(value: string) {
    const filterValue = value.toLowerCase();
    this.filteredData = of(this.data.filter(option => option.toLowerCase().includes(filterValue)));
  }

  selectItem(value: string) {
    this.autoCompleteForm.get('item').setValue(value);
    this.itemSelected.emit(value);
    this.resetFilteredData(); // Reset the list
    if (this.enforeSelection) {
      if (this.lockOption) {
        this.autoCompleteForm.get('item').disable();
      }

      this.triggerValidation();
    }
  }

  cancelItem() {
    this.inputInvalid.emit();
    this.autoCompleteForm.get('item').setValue('');
    this.autoCompleteForm.controls['item'].enable();
    this.resetFilteredData();
  }

  resetFilteredData() {
    this.filteredData = of(this.data);
  }

  getFormValidity() {
    return this.autoCompleteForm.valid;
  }

  triggerValidation() {
    this.submitButton.nativeElement.click();
    return this.autoCompleteForm.valid;
  }
}
