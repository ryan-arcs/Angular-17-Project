import { Directive, ElementRef, Input, OnChanges, OnDestroy, SimpleChanges, NgZone, ChangeDetectorRef } from '@angular/core';
import { TableauGlobalDataServiceNew } from '../services';
import { TableauView } from '../interfaces';
 
@Directive({
  selector: '[lazyLoadThumbnail]',
  standalone: true
})
export class LazyLoadThumbnailDirective implements OnChanges, OnDestroy {
  @Input() lazyLoadThumbnail?: TableauView;
  @Input() fallback = 'assets/images/tableau.png';
 
  private observer?: IntersectionObserver;
  private isLoading = false;
  
  constructor(
    private el: ElementRef,
    private tableauGlobalDataService: TableauGlobalDataServiceNew,
    private zone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}
  
  /**
   * Angular lifecycle hook called when input properties change.
   * Triggers thumbnail setup and observer logic when lazyLoadThumbnail is updated.
   * 
   * @param changes - Object of changed input properties
   */
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['lazyLoadThumbnail']?.currentValue) {
      this.setupThumbnail();
      this.zone.runOutsideAngular(() => {
        setTimeout(() => {
          // this.zone.run(() => {
          //   this.cdr.markForCheck();
          // });
          this.setupObserver();
        });
        this.cleanupObserver();
      });
    }
  }
  
  // Assigns a fallback image to the thumbnail if lazy loading is enabled.
  private setupThumbnail(): void {
    if (!this.lazyLoadThumbnail) return;
    this.lazyLoadThumbnail.thumbnail = this.fallback;
  }
  
  /**
   * Initializes an IntersectionObserver to detect when the element is in view.
   * When intersecting, it triggers thumbnail loading and stops observing.
   */
  private setupObserver(): void {
    if (!this.lazyLoadThumbnail) return;
 
    this.observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          this.zone.run(() => {
            this.loadThumbnail();
          });
          this.cleanupObserver();
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );
 
    this.observer.observe(this.el.nativeElement);
  }
  
  /**
   * Asynchronously loads the thumbnail image for the view.
   * Updates the component state and handles loading and error logic.
   */
  private async loadThumbnail(): Promise<void> {
    if (!this.lazyLoadThumbnail || this.isLoading) return;
    
    const workbookId = this.lazyLoadThumbnail.workbook?.id || '';
    const viewId = this.lazyLoadThumbnail.id || '';
    
    if (!workbookId || !viewId) return;
 
    try {
      this.isLoading = true;
      const thumbnail = await this.tableauGlobalDataService.getViewThumbnail(viewId, workbookId);
      
      if (thumbnail && this.lazyLoadThumbnail) {
        this.lazyLoadThumbnail.thumbnail = thumbnail;
        this.cdr.markForCheck();
      }
    } catch (error) {
      console.error('Failed to load thumbnail:', error);
    } finally {
      this.isLoading = false;
    }
  }
  
  // Disconnects the IntersectionObserver and cleans up resources.
  private cleanupObserver(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = undefined;
    }
  }
  
  // Cleans up the IntersectionObserver to prevent memory leaks.
  ngOnDestroy(): void {
    this.cleanupObserver();
  }
}