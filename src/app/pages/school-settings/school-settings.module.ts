import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";

import { IonicModule } from "@ionic/angular";

import { SchoolSettingsPageRoutingModule } from "./school-settings-routing.module";

import { SchoolSettingsPage } from "./school-settings.page";
import { DataTablesModule } from "angular-datatables";
import { SharedModule } from "src/app/modules/shared/shared.module";

@NgModule({
	imports: [
		CommonModule,
		FormsModule,
		IonicModule,
		SchoolSettingsPageRoutingModule,
		DataTablesModule,
		SharedModule,
	],
	declarations: [SchoolSettingsPage],
})
export class SchoolSettingsPageModule {}
