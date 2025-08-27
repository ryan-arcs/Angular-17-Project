import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { DeploymentInfoComponent } from 'src/app/my-apps/iapp/applications/layout/logs/deployment-popup/deployment-info.component';

@Component({
  selector: 'app-deployments',
  standalone: true,
  imports: [],
  templateUrl: './deployments.component.html',
  styleUrl: './deployments.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeploymentsComponent implements OnInit {
  @Input() deploymentIdList: any[] = [];
  @Input() selectedInstanceId: string = '';
  @Input() applicationName: string = '';
  @Output() instanceId: EventEmitter<string> = new EventEmitter<string>();
  @Input() advancedFilters!: boolean;
  deploymentTime: any = [];
  toggleClass: string = '';

  constructor(private modalService: NgbModal) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['deploymentIdList']) {
      this.groupDeploymentIdsByTime();
    }
    if (changes['advancedFilters']) {
      if (this.advancedFilters) {
        this.toggleClass = 'toggle';
      } else {
        this.toggleClass = '';
      }
    }
  }

  ngOnInit() {
    if (this.advancedFilters) {
      this.toggleClass = 'toggle';
    } else {
      this.toggleClass = '';
    }
  }
  /**
   * Group deployment Ids by date and filter out 30 days older deployment ids
   * @return {void}
   */
  groupDeploymentIdsByTime(): void {
    const groupedTimes = this.deploymentIdList.reduce((acc, deployment) => {
      const { date, time } = this.convertCreateTime(deployment.createTime);

      if (!acc[date]) {
        acc[date] = [];
      }
      const instancesData = deployment.instances.map(
        (instance: any, index: number) => ({
          ...instance,
          displayName: `worker-${instance?.instanceId?.slice(-1)}`,
        }),
      );

      acc[date].push({
        time: time,
        deploymentId: deployment.deploymentId,
        instances: instancesData?.reverse(),
      });
      return acc;
    }, {});

    this.deploymentTime = Object.entries(groupedTimes).map(
      ([date, times], index) => ({
        date,
        times,
        show: this.showHideDeploymentPanel(index, times as any),
      }),
    );

    if (this.deploymentTime.filter((dTime: any) => dTime.show)?.length > 1) {
      this.deploymentTime[1].show = false;
    }
  }

  showHideDeploymentPanel(index: number, times: any[]) {
    return (
      index < 2 ||
      times?.some((time) =>
        time.instances?.some(
          (instance: any) => instance?.instanceId === this.selectedInstanceId,
        ),
      )
    );
  }
  /**
   * Check if a date is older than 30 days from the current date
   * @param {string} date
   * @return {boolean}
   */

  isDate30DaysAgo(date: string): boolean {
    const providedDate = new Date(date);
    const currentDate = new Date();

    const differenceInMilliseconds: number =
      currentDate.getTime() - providedDate.getTime();
    const differenceInDays: number =
      differenceInMilliseconds / (1000 * 60 * 60 * 24);

    return differenceInDays >= 30;
  }

  /**
   * Emit modified deploymentId to 'logs' component
   * @param {string} deploymentId
   * @return {void}
   */
  onSelectingInstanceId(instanceId: string): void {
    this.instanceId.emit(instanceId);
  }

  /**
   * Convert the creation time to a user-friendly date and time format
   * @param {string} createTime
   * @return {object}
   */
  convertCreateTime(createTime: string) {
    const createDate = new Date(createTime);
    const currentDate = new Date();
    const createDateOnly = new Date(
      createDate.getFullYear(),
      createDate.getMonth(),
      createDate.getDate(),
    );
    const todayDateOnly = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      currentDate.getDate(),
    );
    const yesterdayDateOnly = new Date(todayDateOnly);
    yesterdayDateOnly.setDate(todayDateOnly.getDate() - 1);
    const timeOptions: any = {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
    };
    const timeFormat = createDate.toLocaleTimeString('en-US', timeOptions);
    const dateOptions: any = {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    };
    const dateFormat = createDate.toLocaleDateString('en-US', dateOptions);
    if (createDateOnly.getTime() === todayDateOnly.getTime()) {
      return { date: 'Today', time: timeFormat };
    } else if (createDateOnly.getTime() === yesterdayDateOnly.getTime()) {
      return { date: 'Yesterday', time: timeFormat };
    } else {
      return { date: dateFormat, time: timeFormat };
    }
  }

  openDeploymentPopup() {
    const columnsModalRef = this.modalService.open(DeploymentInfoComponent, {
      size: 'md',
      windowClass: 'deployment-info-popup',
      backdropClass: 'mwl',
      backdrop: 'static'
    });
    columnsModalRef.componentInstance.applicationName = this.applicationName;
  }

  /**
   * Toggle the visibility of deployment times
   * @param {number} id
   * @return {void}
   */

  showAndHide(id: number) {
    this.deploymentTime = this.deploymentTime.map(
      (item: any, index: number) => {
        if (index == id) return { ...item, show: !item.show };
        else return item;
      },
    );
  }
}
