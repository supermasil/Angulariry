import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ToolbarOrgDropdownComponent } from './toolbar-org-dropdown.component';

describe('ToolbarUserDropdownComponent', () => {
  let component: ToolbarOrgDropdownComponent;
  let fixture: ComponentFixture<ToolbarOrgDropdownComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ToolbarOrgDropdownComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ToolbarOrgDropdownComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
