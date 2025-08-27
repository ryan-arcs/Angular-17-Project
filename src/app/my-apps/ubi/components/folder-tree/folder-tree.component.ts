import { Component, Input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { EnvironmentProject } from '../../interfaces';

@Component({
  selector: 'app-folder-tree',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './folder-tree.component.html',
  styleUrl: './folder-tree.component.scss',
})
export class FolderTreeComponent {
  @Input() project!: EnvironmentProject;
  constructor(
  ) {}

  // // Toggles menu expansion and optionally fetches child projects
  async getChildProjectsByProject(project: EnvironmentProject) {
    project.isMenuExpanded = !project.isMenuExpanded;
  }
}
