import { HttpErrorResponse } from "@angular/common/http";
import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";
import { FormGroup, FormBuilder, Validators } from "@angular/forms";
import {
	AlertController,
	ModalController,
	LoadingController,
} from "@ionic/angular";
import { CourseSubject } from "src/app/interfaces/course-subject";
import { ApiService } from "src/app/services/api.service";

@Component({
	selector: "app-subjects-form",
	templateUrl: "./subjects-form.component.html",
	styleUrls: ["./subjects-form.component.scss"],
})
export class SubjectsFormComponent implements OnInit {
	@Input() all_subjects: CourseSubject[] = [];
	@Input() course_subject: CourseSubject = null;
	@Input() row_index: number = -1;
	@Input() trigger: string;
	@Output() success_subject: EventEmitter<{
		new_subject: CourseSubject;
		row_index: number;
	}> = new EventEmitter<{
		new_subject: CourseSubject;
		row_index: number;
	}>();

	course_subject_form: FormGroup;
	customAlertOptions: {
		header: string;
		cssClass: string;
		backdropDismiss: boolean;
	};
	customAlertOptions2: {
		header: string;
		cssClass: string;
		backdropDismiss: boolean;
	};
	not_in_equivalent: CourseSubject[] = [];
	not_in_pre_req: CourseSubject[] = [];

	constructor(
		private apiService: ApiService,
		private formBuilder: FormBuilder,
		private alertController: AlertController,
		private modalController: ModalController,
		private loadingController: LoadingController
	) {}

	async ngOnInit() {
		this.initializeSubjectForm();
		this.updateAlertOptions();
		if (this.all_subjects.length === 0) await this.getSubjects();

		this.course_subject_form.controls.code.valueChanges.subscribe(
			(value) => {
				this.updateAlertOptions();
			}
		);

		//update items for pre_requisite subjects
		this.course_subject_form.controls.equivalent_subjects.valueChanges.subscribe(
			(value) => {
				this.not_in_equivalent = this.differSubjects(value);
			}
		);

		//update selection for equivalent subjects
		this.course_subject_form.controls.prerequisite_subjects.valueChanges.subscribe(
			(value) => {
				this.not_in_pre_req = this.differSubjects(value);
			}
		);

		if (this.course_subject != null) {
			this.all_subjects = this.all_subjects.filter(
				(s) => s.id != this.course_subject.id
			);
		}

		this.not_in_equivalent = this.differSubjects(
			this.course_subject_form.controls.equivalent_subjects.value
		);
		this.not_in_pre_req = this.differSubjects(
			this.course_subject_form.controls.prerequisite_subjects.value
		);
	}

	closeSubjectsModal() {
		this.modalController.dismiss();
	}

	differSubjects(to_remove_subjects: any[]) {
		return this.all_subjects.filter(
			(s) => !to_remove_subjects.includes(s.id)
		);
	}

	/**
	 * Get all subjects
	 */
	async getSubjects() {
		this.all_subjects = await this.apiService
			.getSubjects(true, { withTrashed: 1 })
			.catch((er) => {
				return [];
			});
	}

	initializeSubjectForm() {
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
				[Validators.required, Validators.pattern(/^\d+$/)],
			],
			lab_units: [
				this.course_subject ? this.course_subject.lab_units : 0,
				[Validators.required, Validators.pattern(/^\d+$/)],
			],
			equivalent_subjects: [
				this.course_subject
					? this.course_subject.equivalent_previous_subjects.map(
							(es) => es.id
					  )
					: [],
			],
			prerequisite_subjects: [
				this.course_subject
					? this.course_subject.pre_requisite_subjects.map(
							(ps) => ps.id
					  )
					: [],
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
					.createSubject(raw_data)
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

	private updateAlertOptions() {
		//alert options for select subjects interface
		this.customAlertOptions = {
			header: `Select Equivalent Subjects for ${this.course_subject_form.controls.code.value}`,
			cssClass: "custom-select-alert",
			backdropDismiss: false,
		};

		//alert options for select subjects interface
		this.customAlertOptions2 = {
			header: `Select Prerequisite Subjects for ${this.course_subject_form.controls.code.value}`,
			cssClass: "custom-select-alert",
			backdropDismiss: false,
		};
	}
}
