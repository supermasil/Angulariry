import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from "@angular/core";


@Component({
  selector: 'save-cancel-buttons',
  templateUrl: './save-cancel-buttons.component.html',
  styleUrls: ['./save-cancel-buttons.component.css']
})
export class SaveCancelButtonsComponent implements OnInit, OnDestroy {
  @Input() redirectUrl: string = "/"
  @Output() saveButtonClicked = new EventEmitter();

  constructor() {}

  ngOnInit() {
  }

  ngOnDestroy() {
  }

  saveButtonPressed() {
    this.saveButtonClicked.emit();
  }
}
