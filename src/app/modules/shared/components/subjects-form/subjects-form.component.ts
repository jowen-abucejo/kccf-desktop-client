import { HttpErrorResponse } from "@angular/common/http";
import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";
import { FormGroup, FormBuilder, Validators } from "@angular/forms";
import {
	AlertController,
	ModalController,
	LoadingController,
} from "@ionic/angular";
import { CourseSubject } from "src/app/interfaces/course-subject";
import { SchoolSetting } from "src/app/interfaces/school-setting";
import { Term } from "src/app/interfaces/term";
import { ApiService } from "src/app/services/api.service";
import { laterOrEqualDate } from "../school-settings-form/school-settings-form.component";
import { regex_tests } from "../student-registration-form/student-registration-form.component";

@Component({
	selector: "app-subjects-form",
	templateUrl: "./subjects-form.component.html",
	styleUrls: ["./subjects-form.component.scss"],
})
export class SubjectsFormComponent implements OnInit {
	@Input() course_subject: CourseSubject = null;
	@Input() trigger: string;
	@Input() row_index: number = -1;
	@Output() success_subject: EventEmitter<{
		new_subject: CourseSubject;
		row_index: number;
	}> = new EventEmitter<{
		new_subject: CourseSubject;
		row_index: number;
	}>();
	course_subject_form: FormGroup;

	constructor(
		private apiService: ApiService,
		private formBuilder: FormBuilder,
		private alertController: AlertController,
		private modalController: ModalController,
		private loadingController: LoadingController
	) {}

	async ngOnInit() {
		this.initializeSettingForm();
	}

	closeSubjectsModal() {
		this.modalController.dismiss();
	}

	initializeSettingForm() {
		this.course_subject_form = this.formBuilder.group({
			code: [
				this.course_subject ? this.course_subject.code : "",
				[Validators.required],
			],
			description: [
				this.course_subject ? this.course_subject.description : "",
				[Validators.required],
			],
			lec_units: [
				this.course_subject ? this.course_subject.lec_units : 0,
				[Validators.required],
			],
			lab_units: [
				this.course_subject ? this.course_subject.lab_units : 0,
				[Validators.required],
			],
		});
	}

	async submitSubjectForm() {
		const raw_data = this.course_subject_form.value;
		const loading = await this.loadingController.create({
			spinner: "bubbles",
			backdropDismiss: false,
		});
		await loading.present();

		const result = this.course_subject
			? await this.apiService
					.updateSubject(this.course_subject.id, raw_data)
					.catch(async (res: HttpErrorResponse) => {
						const alert = await this.alertController.create({
							header: "Subject Update Failed!",
							message: res.error.message,
							buttons: ["OK"],
						});
						await alert.present();
						return null;
					})
			: await this.apiService
					.createSubject(this.course_subject_form.value)
					.catch(async (res: HttpErrorResponse) => {
						const alert = await this.alertController.create({
							header: "Subject Creation Failed!",
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
						? "Subject Update Success"
						: "Subject Creation Success",
				buttons: ["OK"],
			});
			await alert.present();

			//emit new or updated data
			this.success_subject.emit({
				new_subject: result,
				row_index: this.row_index,
			});

			this.closeSubjectsModal();
		}
	}
}
