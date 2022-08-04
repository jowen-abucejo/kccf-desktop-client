import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";

import { IonicModule } from "@ionic/angular";

import { StudentsPageRoutingModule } from "./students-routing.module";

import { StudentsPage } from "./students.page";
import { DataTablesModule } from "angular-datatables";
import { SharedModule } from "src/app/modules/shared/shared.module";

@NgModule({
	imports: [
		CommonModule,
		FormsModule,
		IonicModule,
		StudentsPageRoutingModule,
		DataTablesModule,
		SharedModule,
	],
	declarations: [StudentsPage],
})
export class StudentsPageModule {}
