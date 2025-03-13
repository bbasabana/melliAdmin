import { Component, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-nav-menu',
  imports: [],
  templateUrl: './nav-menu.component.html',
  styleUrl: './nav-menu.component.scss'
})
export class NavMenuComponent {
  activeSection = 'dashboard'; 

  @Output() sectionSelected = new EventEmitter<string>();

  onSelect(section: string) {
    this.activeSection = section;
    this.sectionSelected.emit(section); // Notifier le parent du changement
  }
  
}
