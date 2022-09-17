import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";

import { IonicModule } from "@ionic/angular";

import { SubjectsPageRoutingModule } from "./subjects-routing.module";

import { SubjectsPage } from "./subjects.page";
import { DataTablesModule } from "angular-datatables";
import { SharedModule } from "src/app/modules/shared/shared.module";

@NgModule({
	imports: [
		CommonModule,
		FormsModule,
		IonicModule,
		SubjectsPageRoutingModule,
		DataTablesModule,
		SharedModule,
	],
	declarations: [SubjectsPage],
})
export class SubjectsPageModule {}
