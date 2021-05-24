import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { PopoverService } from '../../../components/popover/popover.service';
import { ToolbarUserDropdownComponent } from './toolbar-user-dropdown/toolbar-user-dropdown.component';
import icPerson from '@iconify/icons-ic/twotone-person';
import faBuildingIcon from '@iconify/icons-fa-solid/building';

import { AuthService } from 'src/app/auth/auth.service';
import { UserModel } from 'src/app/models/user.model';
import { OrganizationModel } from 'src/app/models/organization.model';

@Component({
  selector: 'vex-toolbar-user',
  templateUrl: './toolbar-user.component.html',
  styleUrls: ['./toolbar-user.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ToolbarUserComponent implements OnInit {

  dropdownOpen: boolean;
  icPerson = icPerson;
  faBuildingIcon = faBuildingIcon;
  
  user: UserModel;
  organization: OrganizationModel;

  constructor(private popover: PopoverService,
              private cd: ChangeDetectorRef,
              private authService: AuthService) { }

  ngOnInit() {
    this.authService.getMongoDbUserListener().subscribe(user => {
      this.user = this.authService.getMongoDbUser();
      this.cd.detectChanges();
    });

    this.authService.getUserOrgListener().subscribe(organization => {
      this.organization = this.authService.getUserOrg();
      this.cd.detectChanges();
    });
  }

  onLogOut() {
    this.authService.logout();
  }

  showPopover(originRef: HTMLElement) {
    this.dropdownOpen = true;
    this.cd.markForCheck();

    const popoverRef = this.popover.open({
      content: ToolbarUserDropdownComponent,
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
