import {
  Component,
  EventEmitter,
  OnDestroy,
  Output,
  OnInit,
  ViewChild,
  HostListener,
} from '@angular/core';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { Subscription, take } from 'rxjs';
import { UIService } from 'src/app/common/services/ui.service';
import { WdhGlobalDataService } from '../../services/wdh-global-data.service';
import { CommonModule } from '@angular/common';
import { NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
interface View extends Table {}
interface Table {
  name: string;
  value: string;
}
@Component({
  selector: 'app-wdh-left-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    NgbModalModule,
    RouterLink,
    FormsModule,
    NgbTooltipModule,
    NgbModule,
  ],
  templateUrl: './left-sidebar.component.html',
  styleUrl: './left-sidebar.component.scss',
})
export class LeftSidebarComponent {
  @Output() slidebar = new EventEmitter<boolean>();

  routeChangeEventSubscription: Subscription | undefined;
  currentTab: string = '';
  sidebar: boolean = false;
  tables: Array<Table> = [];
  views: Array<View> = [];
  items: any = [
    { section: 'Tables', content: [], isExpanded: true },
    { section: 'Views', content: [], isExpanded: true },
  ];
  tableNameSubscription: Subscription | undefined;
  @ViewChild('searchBox') searchBox: any;
  searchString = '';
  sidebarOpen = true;

  constructor(
    private route: Router,
    private uiService: UIService,
    private wdhGlobalDataService: WdhGlobalDataService,
  ) {
    this.setInitialTab();
    this.setTabOnRouteChange();
  }

  async ngOnInit(): Promise<void> {
    this.onResize(new Event('init'));
    const { apiTables, apiViews }: any =
      await this.wdhGlobalDataService.getTableAndViewNames();

    apiTables.sort((a: string, b: string) =>
      a.toLowerCase().localeCompare(b.toLowerCase()),
    );
    apiTables.forEach((table: any) => {
      const tableItem: Table = {
        name: this.uiService.convertToTitleCase(table || ''),
        value: table,
      };
      const isTablePresent = this.tables.find(
        (table: any) => table.value === tableItem.value,
      );
      if (!isTablePresent) {
        this.tables.push(tableItem);
      }
    });

    this.items[0].content = this.tables;

    apiViews.sort((a: string, b: string) =>
      a.toLowerCase().localeCompare(b.toLowerCase()),
    );
    apiViews.forEach((view: string) => {
      const viewItem: View = {
        name: this.uiService.convertToTitleCase(view || ''),
        value: view,
      };
      const isViewPresent = this.views.find(
        (view: any) => view.value === viewItem.value,
      );
      if (!isViewPresent) {
        this.views.push(viewItem);
      }
    });

    this.items[1].content = this.views;

    this.tableNameSubscription = this.wdhGlobalDataService.tableName$.subscribe(
      {
        next: (name: string) => {
          if (name) {
            if (apiTables.some((table: String) => table === name)) {
              this.items[0].isExpanded = true;
            } else {
              this.items[1].isExpanded = true;
            }
          }
        },
      },
    );
  }

  ngAfterViewInit() {
    this.searchBox.valueChanges.subscribe((searchString: string) => {
      this.items[0].content = this.tables.filter(
        (table: Table) =>
          this.isIncluded(table.value, searchString) ||
          this.isIncluded(table.name, searchString),
      );
      this.items[0].isExpanded = true;

      this.items[1].content = this.views.filter(
        (view: View) =>
          this.isIncluded(view.value, searchString) ||
          this.isIncluded(view.name, searchString),
      );
      this.items[1].isExpanded = true;
    });
  }

  isIncluded(value: string, searchString: string) {
    return value
      .toLowerCase()
      .trim()
      .includes(searchString.toLowerCase().trim());
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: Event) {
    this.uiService.isMobile$.pipe(take(1)).subscribe((isMobile) => {
      this.sidebarOpen = isMobile ? false : true;
    });
  }

  setInitialTab() {
    const urlSegments = this.route.url.split('/');
    const tab = urlSegments[urlSegments.length - 1];
    this.uiService.setSelectedTab(tab);
    this.currentTab = tab;
  }

  setTabOnRouteChange() {
    this.routeChangeEventSubscription = this.route.events.subscribe({
      next: (value) => {
        if (value instanceof NavigationEnd) {
          const urlSegements = value.url.split('/');
          const tab = urlSegements[urlSegements.length - 1];
          this.uiService.setSelectedTab(tab);
          this.currentTab = tab;
        }
      },
    });
  }

  onAccordionChange(item: any) {
    item.isExpanded = !item.isExpanded;
  }

  onTabChange(e: any, newTab: string, index: number) {
    e.stopPropagation();
    this.slidebar.emit(false);
    if (newTab !== this.currentTab) {
      this.uiService.setSelectedTab(newTab);
    }
    this.toggleSidebarMobile();
  }
  toggleSidebarMobile() {
    this.uiService.isMobile$.pipe(take(1)).subscribe((isMobile) => {
      if (isMobile) {
        this.toggleSidebar();
      }
    });
  }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
    this.uiService.toggleMainSidebar(this.sidebarOpen);
  }

  isProjectActive(project: any): boolean {
    return project?.content?.some(
      (item: any) => item.value === this.currentTab,
    );
  }

  ngOnDestroy(): void {
    if (this.routeChangeEventSubscription) {
      this.routeChangeEventSubscription.unsubscribe();
    }

    if (this.tableNameSubscription) {
      this.tableNameSubscription.unsubscribe();
    }
  }
}
