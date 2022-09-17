import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";

import { IonicModule } from "@ionic/angular";

import { ProgramsPageRoutingModule } from "./programs-routing.module";

import { ProgramsPage } from "./programs.page";
import { DataTablesModule } from "angular-datatables";
import { SharedModule } from "src/app/modules/shared/shared.module";

@NgModule({
	imports: [
		CommonModule,
		FormsModule,
		IonicModule,
		ProgramsPageRoutingModule,
		DataTablesModule,
		SharedModule,
	],
	declarations: [ProgramsPage],
})
export class ProgramsPageModule {}
