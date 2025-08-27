import { DatePipe } from '@angular/common';
import {
  Component,
  ElementRef,
  Renderer2,
  OnDestroy,
  NgModule,
  OnInit,
} from '@angular/core';
import { FormsModule, NgModel } from '@angular/forms';
import { environment } from '@environments/environment';

@Component({
  standalone: true,
  providers: [DatePipe, NgModule, NgModel],
  imports: [FormsModule],
  template: `
    <div class="schedule-component">
      @if (!isEditing) {
        @if (value) {
          <p title="Please contact to administration to change the expression">
            {{ value }}
          </p>
        }
        @if (isEditable) {
          <!-- <button [disabled]="!isEditable" class="circul-btn small" title='Edit' (click)="startEditing()"><span class="material-symbols-rounded">
                edit
                </span></button> -->
        }
      }
      @if (isEditing) {
        <div class="save-row">
          <input
            type="text"
            (keydown)="onKeyDown($event)"
            [value]="value"
            [(ngModel)]="value"
          />
          <button
            class="circul-btn small"
            title="Close"
            (click)="cancelEditing()"
          >
            <span class="material-symbols-rounded"> close </span>
          </button>
          <button class="circul-btn small" title="Save" (click)="saveValue()">
            <span class="material-symbols-rounded"> save </span>
          </button>
        </div>
      }
    </div>
  `,
})
export class CustomScheduleCellComponent
  implements OnInit, OnDestroy
{
  isAdmin!: boolean;
  isEditable!: any;
  scheduleValueSetter!: any;
  value!: string;
  html!: HTMLElement;
  isEditing: boolean = false;
  params!: any;
  uniqueIndex!: any;
  originalValue!: any;
  static currentlyEditingIndex: number | null = null;
  defaultDateFormat = environment?.defaultDateFormat || "MMM d, yyyy h:mm:ss a";


  agInit(params: any): void {
    this.params = params;
    this.uniqueIndex = this.params.uniqueIndex;
    try {
      this.value =
        this.datePipe.transform(params.value, this.defaultDateFormat) || '';
      this.originalValue = this.value;
    } catch {
      this.value = params.value;
      this.originalValue = this.value;
    }
    (this.isAdmin = params.isAdmin),
      (this.isEditable = params.data.schedule !== 'Disabled'),
      (this.scheduleValueSetter = params.scheduleValueSetter);

    this.html = this.renderer.createElement('div');
    this.renderer.addClass(this.html, 'schedule-menu');
    this.renderer.setStyle(this.html, 'background-color', 'white');
    this.renderer.setStyle(
      this.html,
      'box-shadow',
      '0px 8px 18px 0px rgba(0,0,0,0.3)',
    );
    this.renderer.setStyle(this.html, 'z-index', '1');
    const content = '';

    if (this.html) {
      this.html.innerHTML = content;
    }

    this.updateIndexState();
  }

  constructor(
    private el: ElementRef,
    private renderer: Renderer2,
    private datePipe: DatePipe,
  ) {}

  ngOnInit(): void {
    this.updateIndexState();
  }

  updateEditingStateGlobally() {
    this.params.api.refreshCells({ force: true });
  }



  startEditing() {
    CustomScheduleCellComponent.currentlyEditingIndex = this.params.rowIndex;
    this.updateEditingStateGlobally();
  }

  onKeyDown(event: any) {
    const key = event.which || event.keyCode;
    if (key === 37 || key === 39) {
      //Left or right
      event.stopPropagation();
    }
  }

  saveValue() {
    this.params.oldValue = this.params.value;
    this.params.newValue = this.value;
    const response = this.scheduleValueSetter(this.params);
    if (!response) {
      this.value = this.params.value;
    }
    CustomScheduleCellComponent.currentlyEditingIndex = null;
    this.updateIndexState();
  }

  updateIndexState() {
    this.isEditing =
      CustomScheduleCellComponent.currentlyEditingIndex ===
      this.params.rowIndex;
  }

  cancelEditing() {
    this.value = this.originalValue;
    this.isEditing = false;
    CustomScheduleCellComponent.currentlyEditingIndex = null;
    this.updateEditingStateGlobally();
  }

  ngOnDestroy(): void {
    if (
      CustomScheduleCellComponent.currentlyEditingIndex === this.params.rowIndex
    ) {
      CustomScheduleCellComponent.currentlyEditingIndex = null;
    }
  }
}
