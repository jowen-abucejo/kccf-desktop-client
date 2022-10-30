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
	AlertOptions,
	LoadingController,
	ModalController,
	PopoverController,
} from "@ionic/angular";
import { DataTableDirective } from "angular-datatables";
import { CourseSubject } from "src/app/interfaces/course-subject";
import { SchoolSetting } from "src/app/interfaces/school-setting";
import { Term } from "src/app/interfaces/term";
import { ApiService } from "src/app/services/api.service";
import { SwiperOptions } from "swiper";
import { SwiperComponent } from "swiper/angular";
import { RowContextMenuComponent } from "../row-context-menu/row-context-menu.component";
import {
	regex_tests,
	SlideTriggerOptions,
} from "../student-registration-form/student-registration-form.component";

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
			new Date(control.value).getTime() >=
				new Date(control.parent.controls[compareTo].value).getTime()
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
	@Input() subjects: CourseSubject[] = [];
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

	customAlertOptions: AlertOptions;
	dtOptions: any;
	offer_subjects: CourseSubject[] = [];
	offerSubjectsForm: FormGroup;
	schoolSettingForm: FormGroup;
	swiper_config: SwiperOptions = {
		slidesPerView: 1,
		loop: false,
		pagination: { type: "fraction" },
		allowTouchMove: false,
	};

	@ViewChild(DataTableDirective, { static: false })
	dataTableElement: DataTableDirective;

	@ViewChild("swiper", { static: false }) swiper: SwiperComponent;

	constructor(
		private apiService: ApiService,
		private formBuilder: FormBuilder,
		private alertController: AlertController,
		private modalController: ModalController,
		private loadingController: LoadingController,
		private popoverController: PopoverController
	) {}

	async ngOnInit() {
		this.initializeTable();
		if (this.terms.length === 0)
			this.getTerms().finally(() => {
				this.updateAlertOptions();
			});
		if (this.subjects.length === 0) {
			this.getSubjects();
		}
		if (this.school_setting) {
			this.getSchoolSetting(this.school_setting.id);
		}
		this.initializeSettingForm();

		this.subscribeToSettingsTerm();
		this.subscribeToDisplaySubjects();

		this.schoolSettingForm.controls.enrollment_start_date.valueChanges.subscribe(
			(value) => {
				this.schoolSettingForm.controls.enrollment_end_date.updateValueAndValidity();
			}
		);

		this.schoolSettingForm.controls.encoding_start_date.valueChanges.subscribe(
			(value) => {
				this.schoolSettingForm.controls.encoding_end_date.updateValueAndValidity();
			}
		);
	}

	async addNewRows() {
		//display selected subjects in table
		const dtInstance = await this.dataTableElement.dtInstance;
		dtInstance.rows.add(this.offer_subjects);
		dtInstance.rows().draw();

		//display and disable selected subjects in dropdown
		this.offerSubjectsForm.controls.subjects.setValue(
			this.offer_subjects.map((os) => os.id)
		);
	}

	closeSchoolSettingsModal() {
		this.modalController.dismiss();
	}

	private async createContextMenu(
		e: any,
		offer_subject: CourseSubject,
		index: number
	) {
		const menu = await this.popoverController.create({
			component: RowContextMenuComponent,
			event: e.originalEvent,
			componentProps: {
				subtitle: "Subject Code: " + offer_subject.code,
				options: [
					{
						label: "Remove",
						icon_name: "trash-outline",
						callback: async () => {
							await this.removeSubject(index, offer_subject);
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

	async removeSubject(index: number, offer_subject: CourseSubject) {
		const dtInstance = await this.dataTableElement.dtInstance;
		const data_index = dtInstance.rows().indexes()[index];
		dtInstance.row(data_index).remove();
		dtInstance.rows().draw();

		this.offer_subjects = this.offer_subjects.filter(
			(cs) => cs.id != offer_subject.id
		);

		this.offerSubjectsForm.controls.subjects.setValue(
			this.offer_subjects.map((os) => os.id),
			{ emitEvent: false }
		);
	}

	private displaySelectedTermCode(term_id: number) {
		if (!term_id || this.terms.length === 0) return null;
		return this.terms.find(
			(t) => t.id == this.schoolSettingForm.controls.term.value
		).code;
	}

	/**
	 * Get all subjects
	 */
	async getSubjects() {
		this.subjects = await this.apiService
			.getSubjects(true, { withTrashed: 0 })
			.catch((er) => {
				return [];
			});
	}

	async getTerms() {
		this.terms = await this.apiService.getTerms().catch((er) => {
			return null;
		});
	}

	/**
	 * Get school setting with all offer subjects
	 * @param school_setting_id id of program to get all assigned subjects
	 */
	async getSchoolSetting(school_setting_id: number) {
		let settings_with_subjects: any = await this.apiService
			.getSchoolSetting(school_setting_id, {
				withTrashed: 1,
			})
			.catch((er) => {
				return null;
			});
		this.offer_subjects = settings_with_subjects
			? settings_with_subjects.subjects
			: [];

		await this.addNewRows();
	}

	initializeSettingForm() {
		const disableYearTerm = this.school_setting
			? this.school_setting.students_count > 0 ||
			  this.school_setting.enrollment_histories_count > 0
			: false;
		this.schoolSettingForm = this.formBuilder.group({
			academic_year: [
				{
					value: this.school_setting
						? this.school_setting.academic_year
						: "",
					disabled: disableYearTerm,
				},
				[
					Validators.required,
					Validators.pattern(regex_tests.academic_year),
				],
			],
			term: [
				{
					value: this.school_setting
						? this.school_setting.term_id
						: null,
					disabled: disableYearTerm,
				},
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
			subjects: [],
		});

		//display subjects form group
		this.offerSubjectsForm = this.formBuilder.group({
			subjects: [[]],
		});

		this.updateAlertOptions();
	}

	initializeTable() {
		this.dtOptions = {
			data: this.offer_subjects,
			columns: [
				{ title: "ID", data: "id" },
				{ title: "Subject Code", data: "code" },
				{ title: "Description", data: "description" },
				{ title: "Lab Units", data: "lab_units" },
				{ title: "Lec Units", data: "lec_units" },
				{
					title: "Total Units",
					data: (row, type, val, meta) => {
						return +row.lab_units + +row.lec_units;
					},
				},
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
						// doc.pageMargins = [38, 120, 38, 38];
						doc.defaultStyle.alignment = "center";
						// doc.pageOrientation =
						// 	this.export_setup.page_orientation;
						// doc.pageSize = this.export_setup.page_size;
						// doc.content[0] = {
						// 	text: this.export_setup.page_title,
						// 	style: { fontSize: 14, bold: true },
						// 	margin: this.export_setup.page_title
						// 		? [0, 0, 0, 15]
						// 		: 0,
						// };
						doc.content[1].table.widths = Array(
							doc.content[1].table.body[0].length + 1
						)
							.join("*")
							.split("");
						// 	if (this.export_setup.page_subtitle) {
						// 		doc.content.splice(1, 0, {
						// 			text: this.export_setup.page_subtitle,
						// 			style: {
						// 				fontSize: 11,
						// 				bold: false,
						// 				lineHeight: 1.5,
						// 				alignment: "left",
						// 			},
						// 			margin: [0, 0, 0, 15],
						// 		});
						// 	}
						// 	doc.images = this.pdfHeader
						// 		? { headerTemplate: this.pdfHeader }
						// 		: {};
						// 	doc.header = {
						// 		columns: [
						// 			this.pdfHeader
						// 				? {
						// 						image: "headerTemplate",
						// 						height: 50,
						// 						width: 50,
						// 						absolutePosition: {
						// 							x: -240,
						// 							y: 35,
						// 						},
						// 				  }
						// 				: "",
						// 			{
						// 				stack: [
						// 					{
						// 						columns: [
						// 							{
						// 								text: "Republic of the Philippines",
						// 								width: "*",
						// 								style: { fontSize: 11 },
						// 							},
						// 						],
						// 					},
						// 					{
						// 						columns: [
						// 							{
						// 								text: "Province of Cavite",
						// 								width: "*",
						// 								style: { fontSize: 11 },
						// 							},
						// 						],
						// 					},

						// 					{
						// 						columns: [
						// 							{
						// 								text: "Municipality of Naic",
						// 								width: "*",
						// 								style: {
						// 									fontSize: 15,
						// 									bold: true,
						// 								},
						// 							},
						// 						],
						// 					},
						// 				],
						// 				width: "*",
						// 			},
						// 		],
						// 		margin: [this.pdfHeader ? -50 : 0, 38, 0, 38],
						// 	};
						// 	if (!this.pdfHeader) {
						// 		doc.header.columns.splice(0, 1);
						// 	}
					},
					download: "open",
				},
			],
			columnDefs: [
				{
					targets: [0],
					visible: false,
				},
			],
			rowCallback: (row: Node, data: CourseSubject, index: number) => {
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

	async slidePage(options: SlideTriggerOptions) {
		if (options.direction == "next") {
			if (!this.school_setting) {
				const params = {
					withTrashed: 1,
					subject_status: "ACTIVE",
					"t[]": [this.schoolSettingForm.controls.term.value],
				};
				let recommended_offers = await this.apiService
					.getSubjects(true, params)
					.catch((err: HttpErrorResponse) => {
						return [];
					});
				this.offer_subjects = recommended_offers;
				this.addNewRows();
			}

			return this.swiper.swiperRef.slideNext();
		}
		if (options.direction == "previous") {
			return this.swiper.swiperRef.slidePrev();
		}
	}

	subjectExist(id: number) {
		return this.offer_subjects.some((os) => os.id === id);
	}

	async submitSchoolSetting() {
		this.schoolSettingForm.controls.subjects.setValue(
			this.offer_subjects.map((os) => os.id)
		);
		const raw_data = this.schoolSettingForm.getRawValue();
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
					.createSchoolSetting(this.schoolSettingForm.value)
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

	subscribeToDisplaySubjects() {
		return this.offerSubjectsForm.controls.subjects.valueChanges.subscribe(
			async (value: number[]) => {
				value.forEach((selected_id) => {
					if (
						!this.offer_subjects.some((os) => os.id == selected_id)
					) {
						const missing = this.subjects.find(
							(s) => s.id == selected_id
						);
						this.offer_subjects.push(missing);
					}
				});

				const dtInstance = await this.dataTableElement.dtInstance;
				dtInstance.rows().remove();
				dtInstance.rows.add(this.offer_subjects);
				dtInstance.rows().draw();
			}
		);
	}

	subscribeToSettingsTerm() {
		return this.schoolSettingForm.controls.term.valueChanges.subscribe(
			(v) => {
				this.updateAlertOptions();
			}
		);
	}

	private updateAlertOptions() {
		//alert options for select subjects interface
		const term_code =
			this.terms.length && this.schoolSettingForm.controls.term.value
				? this.terms.find(
						(t) =>
							t.id == this.schoolSettingForm.controls.term.value
				  ).code
				: "***";
		this.customAlertOptions = {
			header: `Offer Subjects for AY ${this.schoolSettingForm.controls.academic_year.value} (${term_code})`,
			cssClass: "custom-select-alert",
			backdropDismiss: false,
		};
	}
}
