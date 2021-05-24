import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { PopoverService } from '../../../components/popover/popover.service';
import { ToolbarOrgDropdownComponent } from './toolbar-org-dropdown/toolbar-org-dropdown.component';
import baselineApartment from '@iconify/icons-ic/baseline-apartment';
import faBuildingIcon from '@iconify/icons-fa-solid/building';
import { UserModel } from 'src/app/models/user.model';
import { OrganizationModel } from 'src/app/models/organization.model';

@Component({
  selector: 'vex-toolbar-org',
  templateUrl: './toolbar-org.component.html',
  styleUrls: ['./toolbar-org.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ToolbarOrgComponent implements OnInit {

  dropdownOpen: boolean;
  icBuilding = baselineApartment;
  faBuildingIcon = faBuildingIcon;
  
  user: UserModel;
  organization: OrganizationModel;

  constructor(private popover: PopoverService,
              private cd: ChangeDetectorRef) { }

  ngOnInit() {  }

  showPopover(originRef: HTMLElement) {
    this.dropdownOpen = true;
    this.cd.markForCheck();

    const popoverRef = this.popover.open({
      content: ToolbarOrgDropdownComponent,
      origin: originRef,
      offsetY: 12,
      position: [
        {
          originX: 'center',
          originY: 'top',
          overlayX: 'center',
          overlayY: 'bottom'
        },
        {
          originX: 'end',
          originY: 'bottom',
          overlayX: 'end',
          overlayY: 'top',
        },
      ]
    });

    popoverRef.afterClosed$.subscribe(() => {
      this.dropdownOpen = false;
      this.cd.markForCheck();
    });
  }
}
