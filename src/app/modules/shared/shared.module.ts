import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ColumnsVisibilityComponent } from "./components/columns-visibility/columns-visibility.component";
import { IonicModule } from "@ionic/angular";
import { StudentRegistrationFormComponent } from "./components/student-registration-form/student-registration-form.component";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { SwiperModule } from "swiper/angular";
import { BasicInfoPageComponent } from "./components/student-registration-form/basic-info-page/basic-info-page.component";
import { GuardianInfoPageComponent } from "./components/student-registration-form/guardian-info-page/guardian-info-page.component";
import { EducationBackgroundPageComponent } from "./components/student-registration-form/education-background-page/education-background-page.component";
import { FamilyInfoPageComponent } from "./components/student-registration-form/family-info-page/family-info-page.component";
import { DatePickerComponent } from "./components/date-picker/date-picker.component";
import { SchoolSettingsFormComponent } from "./components/school-settings-form/school-settings-form.component";
import { RowContextMenuComponent } from "./components/row-context-menu/row-context-menu.component";

@NgModule({
	declarations: [
		ColumnsVisibilityComponent,
		StudentRegistrationFormComponent,
		BasicInfoPageComponent,
		GuardianInfoPageComponent,
		EducationBackgroundPageComponent,
		FamilyInfoPageComponent,
		DatePickerComponent,
		SchoolSettingsFormComponent,
		RowContextMenuComponent,
	],
	imports: [
		CommonModule,
		IonicModule.forRoot(),
		FormsModule,
		ReactiveFormsModule,
		SwiperModule,
	],
	exports: [
		ColumnsVisibilityComponent,
		StudentRegistrationFormComponent,
		DatePickerComponent,
		SchoolSettingsFormComponent,
		RowContextMenuComponent,
	],
})
export class SharedModule {}
