import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-search-box',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './search-box.component.html',
  styleUrl: './search-box.component.scss'
})
export class SearchBoxComponent {
  @Input() searchValue?: string = '';
  @Input() placeholder: string = 'Search here...';
  @Input() customClass: string = '';
  @Output() searchChange = new EventEmitter<string>();
  @Output() searchInput = new EventEmitter<string>();

  onSearchInput(): void {
    this.searchChange.emit(this.searchValue);
    this.searchInput.emit(this.searchValue);
  }

  clearSearch(){
    this.searchValue = '';
    this.onSearchInput();
  }
}
