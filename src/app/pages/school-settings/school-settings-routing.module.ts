import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SchoolSettingsPage } from './school-settings.page';

const routes: Routes = [
  {
    path: '',
    component: SchoolSettingsPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SchoolSettingsPageRoutingModule {}
