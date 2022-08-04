import { Component, Input, OnInit, ViewChild } from "@angular/core";
import {
	AbstractControl,
	FormBuilder,
	FormGroup,
	ValidationErrors,
	Validators,
} from "@angular/forms";
import { AlertController, IonModal } from "@ionic/angular";
import { Term } from "src/app/interfaces/term";
import { ApiService } from "src/app/services/api.service";
import { regex_tests } from "../student-registration-form/student-registration-form.component";

/**
 * Check if control date value is later or equal to the other
 * @param compareTo  name of the control to compare to
 * @returns true if values of date is later of equal to the other and false if not
 */
export function laterOrEqualDate(
	compareTo: string
): (AbstractControl) => ValidationErrors | null {
	return (control: AbstractControl): ValidationErrors | null => {
		return !!control.parent &&
			!!control.parent.value &&
			control.value >= control.parent.controls[compareTo].value
			? null
			: { laterOrEqualDate: false };
	};
}

@Component({
	selector: "app-school-settings-form",
	templateUrl: "./school-settings-form.component.html",
	styleUrls: ["./school-settings-form.component.scss"],
})
export class SchoolSettingsFormComponent implements OnInit {
	@Input() trigger: string;

	@Input() terms: Term[] = [];
	school_setting_form: FormGroup = this.formBuilder.group({
		academic_year: [
			"",
			[
				Validators.required,
				Validators.pattern(regex_tests.academic_year),
			],
		],
		term: [null, [Validators.required]],
		enrollment_start_date: [
			"",
			[Validators.required, Validators.pattern(regex_tests.date_time)],
		],
		enrollment_end_date: [
			"",
			[
				Validators.required,
				Validators.pattern(regex_tests.date_time),
				laterOrEqualDate("enrollment_start_date"),
			],
		],
		encoding_start_date: [
			"",
			[Validators.required, Validators.pattern(regex_tests.date_time)],
		],
		encoding_end_date: [
			"",
			[
				Validators.required,
				Validators.pattern(regex_tests.date_time),
				,
				laterOrEqualDate("encoding_start_date"),
			],
		],
	});

	constructor(
		private formBuilder: FormBuilder,
		private apiService: ApiService,
		private alertController: AlertController
	) {}

	@ViewChild(IonModal) settings_modal: IonModal;
	async ngOnInit() {
		this.getTerms();

		this.school_setting_form.controls.enrollment_start_date.valueChanges.subscribe(
			(value) => {
				this.school_setting_form.controls.enrollment_end_date.updateValueAndValidity();
			}
		);

		this.school_setting_form.controls.encoding_start_date.valueChanges.subscribe(
			(value) => {
				this.school_setting_form.controls.encoding_end_date.updateValueAndValidity();
			}
		);
	}

	closeSchoolSettingsModal() {
		this.settings_modal.dismiss();
	}

	async createSchoolSetting() {
		const result = await this.apiService.createSchoolSetting(
			this.school_setting_form.value
		);
	}

	async getTerms() {
		this.terms = await this.apiService.getTerms().catch((er) => {
			return null;
		});
	}
}
