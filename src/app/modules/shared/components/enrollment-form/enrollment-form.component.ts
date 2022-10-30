import { HttpErrorResponse } from "@angular/common/http";
import {
	Component,
	EventEmitter,
	Input,
	OnInit,
	Output,
	ViewChild,
} from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import {
	AlertController,
	ModalController,
	LoadingController,
	PopoverController,
} from "@ionic/angular";
import { DataTableDirective } from "angular-datatables";
import { Course } from "src/app/interfaces/course";
import { CourseSubject } from "src/app/interfaces/course-subject";
import {
	EnrolledSubject,
	EnrollmentHistory,
} from "src/app/interfaces/enrollment-history";
import { Level } from "src/app/interfaces/level";
import { Student } from "src/app/interfaces/student";
import { StudentType } from "src/app/interfaces/student-type";
import { OfferSubject } from "src/app/interfaces/subject-pivot";
import { ApiService } from "src/app/services/api.service";
import { RowContextMenuComponent } from "../row-context-menu/row-context-menu.component";

@Component({
	selector: "app-enrollment-form",
	templateUrl: "./enrollment-form.component.html",
	styleUrls: ["./enrollment-form.component.scss"],
})
export class EnrollmentFormComponent implements OnInit {
	@Input() enrollment: EnrollmentHistory = null;
	@Input() levels: Level[] = [];
	@Input() offered_subjects: CourseSubject[] = [];
	@Input() programs: Course[] = [];
	@Input() row_index: number = -1;
	@Input() student_types: StudentType[] = [];
	@Input() student: Student;
	@Output() success_enrollment: EventEmitter<{
		new_student: Student;
		row_index: number;
	}> = new EventEmitter<{
		new_student: Student;
		row_index: number;
	}>();

	customAlertOptions: any;
	dtOptions: any;
	enrollmentFormGroup: FormGroup;
	enrollmentIsSetAndOpen: boolean = false;
	selection_levels: Level[];

	@ViewChild(DataTableDirective, { static: false })
	dataTableElement: DataTableDirective;

	constructor(
		private apiService: ApiService,
		private formBuilder: FormBuilder,
		private alertController: AlertController,
		private modalController: ModalController,
		private loadingController: LoadingController,
		private popoverController: PopoverController
	) {}

	async ngOnInit() {
		this.initializeEnrollmentForm();
		this.showLevelsForProgram(this.enrollment.program_id, false);
		this.updateProgramAndLevelState(
			this.enrollment.enrolled_subjects.length
		);
		this.updateAlertOptions();
		this.initializeTable();

		this.subscribeToEnrolledSubjects();
		this.enrollmentIsSetAndOpen = this.isCurrentlyOpen(
			this.enrollment.school_setting.enrollment_start_date,
			this.enrollment.school_setting.enrollment_end_date
		);
		this.subscribeToProgram();
	}

	closeEnrollmentModal() {
		this.modalController.dismiss();
	}

	private async createContextMenu(
		e: any,
		enrolled_subject: EnrolledSubject,
		index: number
	) {
		if (
			!this.enrollmentIsSetAndOpen ||
			enrolled_subject.status == "DROPPED"
		)
			return;
		const menu = await this.popoverController.create({
			component: RowContextMenuComponent,
			event: e.originalEvent,
			componentProps: {
				subtitle: "Subject Code: " + enrolled_subject.subject.code,
				options: [
					{
						label:
							enrolled_subject.status == "ENLISTED"
								? "Remove Subject"
								: "Drop Subject",
						icon_name: "trash-outline",
						callback: async () => {
							await this.dropSubject(index, enrolled_subject);
							menu.dismiss();
						},
					},
				],
			},
			backdropDismiss: true,
			showBackdrop: false,
		});
		return await menu.present();
	}

	async dropSubject(index: number, enrolled_subject: EnrolledSubject) {
		const dtInstance = await this.dataTableElement.dtInstance;
		const data_index = dtInstance.rows().indexes()[index];
		dtInstance.row(data_index).remove();
		dtInstance.rows().draw();

		let to_enroll_subjects = this.enrollmentFormGroup.controls
			.enrolled_subjects.value as Array<number>;
		this.enrollmentFormGroup.controls.enrolled_subjects.setValue(
			to_enroll_subjects.filter(
				(id) => id !== enrolled_subject.offer_subject_id,
				{ emitEvent: false }
			)
		);

		this.updateProgramAndLevelState(dtInstance.rows.length);
	}

	/**
	 * Get school setting with all offer subjects
	 * @param school_setting_id id of program to get all assigned subjects
	 */
	private async getSchoolSetting(
		school_setting_id: number,
		params: any = null
	) {
		params
			? (params["withTrashed"] = 1)
			: (params = {
					withTrashed: 1,
			  });
		return this.apiService
			.getSchoolSetting(school_setting_id, params)
			.catch((er) => {
				return null;
			});
	}

	initializeEnrollmentForm() {
		this.enrollmentFormGroup = this.formBuilder.group({
			student_id: [
				this.enrollment ? this.enrollment.student_id : "",
				[Validators.required],
			],
			school_setting_id: [
				this.enrollment ? this.enrollment.school_setting_id : "",
				[Validators.required],
			],
			program_id: [
				this.enrollment ? this.enrollment.program_id : "",
				[Validators.required],
			],
			level_id: [
				this.enrollment ? this.enrollment.level_id : "",
				[Validators.required],
			],
			student_type_id: [
				this.enrollment ? this.enrollment.student_type_id : "",
				[Validators.required],
			],
			status: [
				this.enrollment ? this.enrollment.status : "",
				[Validators.required],
			],
			enrolled_subjects: [],
		});

		this.enrollmentFormGroup.controls.enrolled_subjects.setValue(
			this.enrollment.enrolled_subjects.map((os) => os.offer_subject_id)
		);
	}

	initializeTable() {
		let enrolled = this.enrollment.enrolled_subjects;

		enrolled.map((es) => {
			es.subject = this.offered_subjects.find((os) => {
				let offer_subject = os.pivot as OfferSubject;
				return offer_subject.id == es.offer_subject_id;
			});
		});

		this.dtOptions = {
			data: enrolled,
			columns: [
				{ title: "Subject Code", data: "subject.code" },
				{ title: "Description", data: "subject.description" },
				{ title: "Lab Units", data: "subject.lab_units" },
				{ title: "Lec Units", data: "subject.lec_units" },
				{
					title: "Total Units",
					data: (row, type, val, meta) => {
						return +row.subject.lab_units + +row.subject.lec_units;
					},
				},
				{ title: "Status", data: "status" },
			],
			paging: false,
			responsive: true,
			searching: false,
			ordering: true,
			colReorder: true,
			order: [[1, "asc"]],
			autoWidth: true,
			info: false,
			dom: "rtip",
			processing: false,
			buttons: [
				"colvis",
				{
					extend: "csv",
					text: "CSV",
					exportOptions: {
						columns: ":visible",
					},
				},
				{
					extend: "excel",
					name: "excel",
					text: "Excel",
					exportOptions: {
						columns: ":visible",
					},
					// title: () => {return this.export_setup.page_title;},
					// messageTop: () => {return this.export_setup.page_subtitle;},
				},
				{
					extend: "pdf",
					text: "PDF",
					exportOptions: {
						columns: ":visible",
					},
					customize: (doc) => {
						doc.defaultStyle.alignment = "center";
						doc.content[1].table.widths = Array(
							doc.content[1].table.body[0].length + 1
						)
							.join("*")
							.split("");
					},
					download: "open",
				},
			],
			rowCallback: (row: Node, data: EnrolledSubject, index: number) => {
				// Unbind first in order to avoid any duplicate handler
				// (see https://github.com/l-lin/angular-datatables/issues/87)
				// Note: In newer jQuery v3 versions, `unbind` and `bind` are
				// deprecated in favor of `off` and `on`
				$("td", row).off("contextmenu");
				$("td", row).on("contextmenu", (e) => {
					e.preventDefault();
					this.createContextMenu(e, data, index);
				});
			},
		};
	}

	private isCurrentlyOpen(start_date: string, end_date: string): boolean {
		let now = new Date().getTime();
		return (
			now >= new Date(start_date).getTime() &&
			now <= new Date(end_date).getTime()
		);
	}

	private showLevelsForProgram(
		program_id: number,
		reset_level: boolean = true
	) {
		const selected_program = this.programs.find((p) => p.id == program_id);
		this.selection_levels = this.levels.filter(
			(value) =>
				value.program_level_id === selected_program.program_level_id
		);
		if (reset_level)
			this.enrollmentFormGroup.controls.level_id.setValue(null);
	}

	async submitEnrollmentForm() {
		const raw_data = this.enrollmentFormGroup.getRawValue();
		const loading = await this.loadingController.create({
			spinner: "bubbles",
			backdropDismiss: false,
		});
		await loading.present();

		const result =
			this.enrollment.id > 0
				? await this.apiService
						.updateEnrollmentHistory(this.enrollment.id, raw_data)
						.catch(async (res: HttpErrorResponse) => {
							const alert = await this.alertController.create({
								header: "Enrollment Update Failed!",
								message: res.error.message,
								buttons: ["OK"],
							});
							await alert.present();
							return null;
						})
				: await this.apiService
						.createEnrollmentHistory(raw_data)
						.catch(async (res: HttpErrorResponse) => {
							const alert = await this.alertController.create({
								header: "Student Enrollment Failed!",
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
					this.enrollment.id > 0
						? "Enrollment Update Success"
						: "Student Enrollment Success",
				buttons: ["OK"],
			});
			await alert.present();

			//emit new or updated data
			this.success_enrollment.emit({
				new_student: result,
				row_index: this.row_index,
			});

			this.closeEnrollmentModal();
		}
	}

	subscribeToEnrolledSubjects() {
		return this.enrollmentFormGroup.controls.enrolled_subjects.valueChanges.subscribe(
			async (value: number[]) => {
				const dtInstance = await this.dataTableElement.dtInstance;
				let to_enroll_subjects: EnrolledSubject[] = dtInstance
					.rows()
					.data()
					.toArray();
				let new_subjects: EnrolledSubject[] = [];
				value.forEach((os) => {
					if (
						!to_enroll_subjects.some(
							(es) =>
								es.status != "DROPPED" &&
								es.offer_subject_id == os
						)
					) {
						new_subjects.push({
							id: 0,
							enrollment_history_id: this.enrollment.id,
							offer_subject_id: os,
							status: "ENLISTED",
							subject: this.offered_subjects.find((cs) => {
								const offer_subject = cs.pivot as OfferSubject;
								return offer_subject.id == os;
							}),
						});
					}
				});

				// dtInstance.rows().remove();
				dtInstance.rows.add(new_subjects);
				dtInstance.rows().draw();

				this.updateProgramAndLevelState(
					to_enroll_subjects.length + new_subjects.length
				);
			}
		);
	}

	private updateAlertOptions() {
		//alert options for select subjects interface
		this.customAlertOptions = {
			header: `Enroll Student to Subjects for AY ${this.enrollment.school_setting.academic_year} (${this.enrollment.school_setting.term.code})`,
			cssClass: "custom-select-alert",
			backdropDismiss: false,
		};
	}

	/**
	 * Reset the value of level field and update the level options on change of selected program
	 * @returns a subscription that resets the level field and update the options on level selection
	 */
	subscribeToProgram() {
		return this.enrollmentFormGroup.controls.program_id.valueChanges.subscribe(
			async (value) => {
				this.showLevelsForProgram(value);
				let settings_with_subjects = await this.getSchoolSetting(
					this.enrollment.school_setting.id,
					{
						student_id: this.enrollment.student_id,
						program_id: value,
					}
				);
				this.offered_subjects = settings_with_subjects
					? settings_with_subjects.subjects
					: [];
			}
		);
	}

	updateProgramAndLevelState(enrolled_subject_count: number = 0) {
		if (enrolled_subject_count > 0) {
			this.enrollmentFormGroup.controls.program_id.disable({
				emitEvent: false,
			});
			// this.enrollmentFormGroup.controls.level_id.disable();
		} else {
			this.enrollmentFormGroup.controls.program_id.enable({
				emitEvent: false,
			});
			// this.enrollmentFormGroup.controls.level_id.enable();
		}
	}
}
