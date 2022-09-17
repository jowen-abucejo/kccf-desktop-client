import { HttpErrorResponse } from "@angular/common/http";
import {
	Component,
	EventEmitter,
	Input,
	OnInit,
	Output,
	ViewChild,
} from "@angular/core";
import {
	AbstractControl,
	FormBuilder,
	FormGroup,
	ValidationErrors,
	Validators,
} from "@angular/forms";
import {
	AlertController,
	LoadingController,
	ModalController,
} from "@ionic/angular";
import { SchoolSetting } from "src/app/interfaces/school-setting";
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
	@Input() school_setting: SchoolSetting = null;
	@Input() trigger: string;
	@Input() terms: Term[] = [];
	@Input() row_index: number = -1;
	@Output() success_setting: EventEmitter<{
		new_setting: SchoolSetting;
		row_index: number;
	}> = new EventEmitter<{
		new_setting: SchoolSetting;
		row_index: number;
	}>();
	school_setting_form: FormGroup;

	constructor(
		private apiService: ApiService,
		private formBuilder: FormBuilder,
		private alertController: AlertController,
		private modalController: ModalController,
		private loadingController: LoadingController
	) {}

	async ngOnInit() {
		this.initializeSettingForm();
		await this.getTerms();

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
		this.modalController.dismiss();
	}

	initializeSettingForm() {
		this.school_setting_form = this.formBuilder.group({
			academic_year: [
				this.school_setting ? this.school_setting.academic_year : "",
				[
					Validators.required,
					Validators.pattern(regex_tests.academic_year),
				],
			],
			term: [
				this.school_setting ? this.school_setting.term_id : null,
				[Validators.required],
			],
			enrollment_start_date: [
				this.school_setting
					? new Date(
							this.school_setting.enrollment_start_date
					  ).toJSON()
					: "",
				[Validators.required],
			],
			enrollment_end_date: [
				this.school_setting
					? new Date(this.school_setting.enrollment_end_date).toJSON()
					: "",
				[
					Validators.required,
					laterOrEqualDate("enrollment_start_date"),
				],
			],
			encoding_start_date: [
				this.school_setting
					? new Date(this.school_setting.encoding_start_date).toJSON()
					: "",
				[Validators.required],
			],
			encoding_end_date: [
				this.school_setting
					? new Date(this.school_setting.encoding_end_date).toJSON()
					: "",
				[Validators.required, laterOrEqualDate("encoding_start_date")],
			],
		});
	}

	async submitSchoolSetting() {
		const raw_data = this.school_setting_form.value;
		const loading = await this.loadingController.create({
			spinner: "bubbles",
			backdropDismiss: false,
		});
		await loading.present();

		const result = this.school_setting
			? await this.apiService
					.updateSchoolSetting(this.school_setting.id, raw_data)
					.catch(async (res: HttpErrorResponse) => {
						const alert = await this.alertController.create({
							header: "School Setting Update Failed!",
							message: res.error.message,
							buttons: ["OK"],
						});
						await alert.present();
						return null;
					})
			: await this.apiService
					.createSchoolSetting(this.school_setting_form.value)
					.catch(async (res: HttpErrorResponse) => {
						const alert = await this.alertController.create({
							header: "School Setting Creation Failed!",
							message: res.error.message,
							buttons: ["OK"],
						});
						await alert.present();
						return null;
					});

		await loading.dismiss();
		if (result) {
			const alert = await this.alertController.create({
				header:
					this.row_index > -1
						? "School Setting Update Success"
						: "School Setting Creation Success",
				buttons: ["OK"],
			});
			await alert.present();

			//emit new or updated data
			this.success_setting.emit({
				new_setting: result,
				row_index: this.row_index,
			});

			this.closeSchoolSettingsModal();
		}
	}

	async getTerms() {
		this.terms = await this.apiService.getTerms().catch((er) => {
			return null;
		});
	}
}
