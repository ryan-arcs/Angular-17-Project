import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { UIService } from 'src/app/common/services/ui.service';
import { NgbDropdownModule, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Subscription } from 'rxjs';
import { ResourceTrackerGlobalDataService } from '../../services/resource-tracker-global-data.service';
import { messages } from '../../constants';
import { AgChartsAngular } from 'ag-charts-angular';
import { UserDetailsModalComponent } from './user-details-modal/user-details-modal.component';
import {
  OffboardingResource,
  OffboardingResourceChildTicket,
  OffboardingResourceChildTicketComment,
} from '../../interfaces/global.interface';
import { NoDataFoundComponent } from 'src/app/common/components/no-data-found/no-data-found.component';

interface TasksByStatus {
  status: string;
  count: number;
  percentage: number;
}

interface GroupedComment {
  date: string;
  comments: OffboardingResourceChildTicketComment[];
}

@Component({
  selector: 'offboarding-details',
  standalone: true,
  providers: [DatePipe],
  imports: [
    ReactiveFormsModule,
    CommonModule,
    NgbDropdownModule,
    AgChartsAngular,
    NoDataFoundComponent,
  ],
  templateUrl: './offboarding-details.component.html',
  styleUrl:
    '../../onboarding/onboarding-details/onboarding-details.component.scss',
})
export class OffboardingDetailsComponent implements OnInit, OnDestroy {
  options: any;
  offboardingResource?: OffboardingResource;
  offboardingResourceSubscription: Subscription | undefined;
  selectedChildTicket?: OffboardingResourceChildTicket;
  errorMessage = '';
  errorDescription = '';
  formattedStartDate = '';
  tasksByStatus: TasksByStatus[] = [];
  selectedTheme = '';
  subscriptions: Subscription = new Subscription();

  constructor(
    private uiService: UIService,
    private route: ActivatedRoute,
    private resourceTrackerGlobalDataService: ResourceTrackerGlobalDataService,
    private modalService: NgbModal,
    private datePipe: DatePipe,
  ) {}

  ngOnInit(): void {
    const selectedThemeSubcription = this.uiService.activatedTheme$.subscribe({
      next: (theme)=>{
        this.selectedTheme = theme;
        this.renderGraph(this.offboardingResource?.parentTicket?.childTickets);
      }
    })

    this.subscriptions.add(selectedThemeSubcription);

    this.offboardingResourceSubscription =
      this.resourceTrackerGlobalDataService.offboardingResource$.subscribe({
        next: (offboardingResource: OffboardingResource) => {
          if (offboardingResource?.parentTicket?.id) {
            this.offboardingResource = offboardingResource;
            const childTickets =
              offboardingResource?.parentTicket?.childTickets;
            if (childTickets?.length) {
              this.renderGraph(childTickets);
              this.selectedChildTicket = childTickets?.[0];
              if (this.selectedChildTicket?.comments) {
                this.groupCommentsByDate();
              }
            } else {
              this.errorMessage =
                messages.error.offboardingChildTicket.notFound;
              this.errorDescription =
                messages.error.offboardingChildTicket.notFound;
            }
          } else {
            this.errorMessage = messages.error.offboarding.notFound;
            this.errorDescription = messages.error.offboarding.notFound;
          }
        },
      });
  }

  renderGraph(childTickets?: any[]){
    if(!childTickets){
      return;
    }
    const pendingTasksCount = childTickets.filter(
      (childTicket) => childTicket.status?.toLowerCase() !== 'done',
    )?.length;
    const completedTasksCount = childTickets.filter(
      (childTicket) => childTicket.status?.toLowerCase() === 'done',
    )?.length;

    this.tasksByStatus = [
      {
        status: 'Completed',
        count: completedTasksCount,
        percentage: Number(
          Math.round(
            (completedTasksCount / childTickets?.length) * 100,
          ),
        ),
      },
      {
        status: 'Pending',
        count: pendingTasksCount,
        percentage: Number(
          Math.round(
            (pendingTasksCount / childTickets?.length) * 100,
          ),
        ),
      },
    ];

    this.options = {
      data: this.tasksByStatus,
      background: {
        fill: this.getThemeVariableForCanvas(this.selectedTheme),
      },
      legend: {
        enabled: true,
        item: {
          marker: { shape: 'circle' },
          label: {
            formatter: (params: any) => {
              return `${params.value}`;
            },
            color: this.getThemeVariableForCanvasText(this.selectedTheme)
          },
        },
      },
      series: [
        {
          type: 'donut',
          calloutLabelKey: 'status',
          angleKey: 'percentage',
          fills: ['#17B631', '#676879'],
          innerRadiusRatio: 0.7,
          cornerRadius: 8,

          innerLabels: [
            {
              text: this.chartInnerData(),
              fontSize: 13,
              color: this.getThemeVariableForCanvasText(this.selectedTheme)
            },
            {
              text: this.totalTasks(childTickets?.length),
              fontSize: 31,
              fontWeight: 'bold',
              color: this.getThemeVariableForCanvasText(this.selectedTheme)
            },
          ],
          innerCircle: {
            fill: this.getThemeVariableForCanvas(this.selectedTheme),
          },
          sectorSpacing: 7,
          tooltip: {
            enabled: true,
            renderer: (params: any) => {
              return {
                title: `${params.datum.status}`,
                content: `${params.datum.status}: ${params.datum.percentage}%`,
              };
            },
          },
          calloutLabel: {
            enabled: false,
          },
        },
      ],
    };
  }

  // Updating the inner donut chart data.
  chartInnerData() {
    return `Total Tasks`;
  }
  // Updating the inner chart data with total number of tasks
  totalTasks(count: number) {
    return `${count}`;
  }

  getThemeVariableForCanvasText(activatedTheme: string){
    switch(activatedTheme){
      case('dark'):
       return '#ffffff';
      default:
        return '#464646';
    }
  }

  // get theme color for canvas
  getThemeVariableForCanvas(activatedTheme: string){
    switch(activatedTheme){
      case('dark'):
       return '#2c2c2c';
      default:
        return '#F6F7FB';
    }
  }

  // Returning to the previous page.
  navigateBack() {
    this.uiService.goBack();
  }

  // selecting the child ticket.
  selectChildTicket(selectedChildTicket: OffboardingResourceChildTicket) {
    this.selectedChildTicket = selectedChildTicket;
  }

  // Opening the view details modal.
  openUserDetailsModal() {
    const columnsModalRef = this.modalService.open(UserDetailsModalComponent, {
      windowClass: 'sidebar-small',
    });
    columnsModalRef.componentInstance.offboardingResource =
      this.offboardingResource;
  }

  concatValues(firstName: string, lastName: string) {
    return `${firstName + lastName}`;
  }

  showInitials(name: string) {
    if (name) {
      const requiredInitials = name
        ?.split(/[\s-]+/)
        .map((word) => word.charAt(0).toUpperCase())
        .join('');
      return requiredInitials;
    }
    return '';
  }

  groupCommentsByDate(comments?: Array<OffboardingResourceChildTicketComment>) {
    let groupedComments: Array<GroupedComment> = [];
    if (comments?.length) {
      for (const comment of comments) {
        let groupDate = this.datePipe.transform(
          comment.updatedDate,
          'MMM dd, yyyy',
        );
        const thisGroup = groupedComments.find(
          (groupedComment) => groupedComment.date === groupDate,
        );
        if (thisGroup?.date) {
          thisGroup.comments.push(comment);
        } else {
          groupedComments.push({
            date: String(groupDate),
            comments: [comment],
          });
        }
      }
    }
    return groupedComments;
  }

  editedCommentTitle(updatedDate?: string, createdDate?: string) {
    return `Last Updated Date: ${this.datePipe.transform(updatedDate, 'MMM dd, yyyy hh:mm a')} Created Date: ${this.datePipe.transform(createdDate, 'MMM dd, yyyy hh:mm a')}`;
  }

  getDateDisplayName(date?: string) {
    const currentDate = new Date();
    const today = this.datePipe.transform(currentDate, 'MMM dd, yyyy');
    const yesterday = this.datePipe.transform(
      currentDate.setDate(currentDate.getDate() - 1),
      'MMM dd, yyyy',
    );

    if (date === today) {
      return 'Today';
    } else if (date === yesterday) {
      return 'Yesterday';
    } else {
      return date;
    }
  }
  ngOnDestroy(): void {
    this.offboardingResourceSubscription?.unsubscribe();
    this.subscriptions?.unsubscribe();
  }
}
