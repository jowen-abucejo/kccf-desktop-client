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
	AlertOptions,
} from "@ionic/angular";
import { DataTableDirective } from "angular-datatables";
import { Course } from "src/app/interfaces/course";
import { CourseSubject } from "src/app/interfaces/course-subject";
import { EducationLevel } from "src/app/interfaces/education-level";
import { Level } from "src/app/interfaces/level";
import { Term } from "src/app/interfaces/term";
import { ApiService } from "src/app/services/api.service";
import { SwiperOptions } from "swiper";
import { SwiperComponent } from "swiper/angular";
import { RowContextMenuComponent } from "../row-context-menu/row-context-menu.component";
import { SlideTriggerOptions } from "../student-registration-form/student-registration-form.component";
import { SubjectsFormComponent } from "../subjects-form/subjects-form.component";

@Component({
	selector: "app-programs-form",
	templateUrl: "./programs-form.component.html",
	styleUrls: ["./programs-form.component.scss"],
})
export class ProgramsFormComponent implements OnInit {
	@Input() trigger: string;
	@Input() levels: Level[] = [];
	@Input() program_levels: EducationLevel[] = [];
	@Input() program: Course = null;
	@Input() programs: Course[] = [];
	@Input() row_index: number = -1;
	@Input() subjects: CourseSubject[] = [];
	@Input() terms: Term[] = [];
	@Output() success_registration: EventEmitter<{
		new_program: Course;
		row_index: number;
	}> = new EventEmitter<{
		new_program: Course;
		row_index: number;
	}>();

	@ViewChild(DataTableDirective, { static: false })
	dataTableElement: DataTableDirective;

	@ViewChild("parentDiv", { static: false }) parentDiv: HTMLElement;

	curriculum_subjects: CourseSubject[] = [];
	selectSubjectsForm: FormGroup;
	dtOptions: any;
	programForm: FormGroup;
	levels_selection: Level[] = [];
	swiper_config: SwiperOptions = {
		slidesPerView: 1,
		loop: false,
		pagination: { type: "fraction" },
		allowTouchMove: false,
	};

	customAlertOptions: AlertOptions;

	constructor(
		private apiService: ApiService,
		private formBuilder: FormBuilder,
		private alertController: AlertController,
		private modalController: ModalController,
		private loadingController: LoadingController,
		private popoverController: PopoverController
	) {}

	@ViewChild("swiper", { static: false }) swiper: SwiperComponent;

	async ngOnInit() {
		this.initializeTable();
		if (this.levels.length === 0) this.getLevels();
		if (this.program_levels.length === 0) this.getProgramLevels();
		if (this.terms.length === 0) this.getTerms();
		if (this.subjects.length === 0) {
			this.getSubjects();
		} else {
		}
		if (this.program) {
			this.getProgramSubjects(this.program.id);
		}
		this.initializeProgramForm();
		this.updateAlertOptions();

		//subscribe to education level change and update levels selection
		this.programForm.controls.program_level_id.valueChanges.subscribe(
			(pl) => {
				this.levels_selection = this.levels.filter(
					(l) => l.program_level_id == pl
				);
			}
		);

		this.subscribeToDisplayLevel();
		this.subscribeToDisplayTerm();
		this.subscribeToProgramCode();
		this.subscribeToDisplaySubjects();
	}

	private async createContextMenu(
		e: any,
		subject: CourseSubject,
		index: number
	) {
		const menu = await this.popoverController.create({
			component: RowContextMenuComponent,
			event: e.originalEvent,
			componentProps: {
				subtitle: "Subject Code: " + subject.code,
				options: [
					{
						label: "Remove",
						icon_name: "trash-outline",
						callback: async () => {
							const dtInstance = await this.dataTableElement
								.dtInstance;
							const data_index = dtInstance.rows().indexes()[
								index
							];
							dtInstance.row(data_index).remove();
							dtInstance.rows().draw();

							this.curriculum_subjects =
								this.curriculum_subjects.filter(
									(cs) => cs.id != subject.id
								);

							this.selectSubjectsForm.controls.subjects.setValue(
								this.curriculum_subjects.map(
									(cs) => cs.pivot.subject_id
								),
								{ emitEvent: false }
							);

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

	closeProgramModal() {
		this.modalController.dismiss();
	}

	async exportAs(button_index: number) {
		const dtInstance = <any>await this.dataTableElement.dtInstance;
		dtInstance.table().button(button_index).trigger();
	}

	/**
	 * Get all levels
	 */
	async getLevels() {
		this.levels = await this.apiService.getLevels().catch((er) => {
			return null;
		});
	}

	/**
	 * Get all program levels
	 */
	async getProgramLevels() {
		this.program_levels = await this.apiService
			.getProgramLevels()
			.catch((er) => {
				return [];
			});
	}

	/**
	 * Get all subjects
	 */
	async getSubjects() {
		this.subjects = await this.apiService
			.getSubjects(true, { withTrashed: 1 })
			.catch((er) => {
				return [];
			});
	}

	/**
	 * Get all subjects for a program
	 * @param program_id id of program to get all assigned subjects
	 */
	async getProgramSubjects(program_id: number) {
		let curriculum_with_subjects: any = await this.apiService
			.getProgramSubjects(program_id, {
				withTrashed: 0,
			})
			.catch((er) => {
				return null;
			});
		this.curriculum_subjects = curriculum_with_subjects
			? curriculum_with_subjects.subjects
			: [];

		//display selected subjects in table
		const dtInstance = await this.dataTableElement.dtInstance;
		dtInstance.rows.add(this.curriculum_subjects);
		dtInstance.rows().draw();

		//display and disable selected subjects in dropdown
		this.selectSubjectsForm.controls.subjects.setValue(
			this.curriculum_subjects.map((cs) => cs.pivot.subject_id)
		);

		if (this.dataTableElement) {
			dtInstance.on("column-reorder", async (e, settings, details) => {
				// dtInstance.rows().draw();
			});
		}
	}

	/**
	 * Get all terms
	 */
	async getTerms() {
		this.terms = await this.apiService.getTerms(true).catch((er) => {
			return [];
		});
	}

	initializeProgramForm() {
		this.programForm = this.formBuilder.group({
			id: [this.program ? this.program.id : ""],
			code: [
				this.program ? this.program.code : "",
				[Validators.required],
			],
			description: [
				this.program ? this.program.description : "",
				[Validators.required],
			],
			program_level_id: [
				this.program ? this.program.program_level_id : "",
				[Validators.required],
			],
			subjects: [],
		});

		//display subjects form group
		this.selectSubjectsForm = this.formBuilder.group({
			current_term: [""],
			current_level: [""],
			subjects: [[]],
		});

		if (this.program) {
			this.levels_selection = this.levels.filter(
				(l) => l.program_level_id == this.program.program_level_id
			);
		}
	}

	initializeTable() {
		this.dtOptions = {
			data: this.curriculum_subjects,
			columns: [
				{ title: "ID", data: "id" },
				{
					title: "Term",
					data: (row, type, val, meta) => {
						if (this.terms.length == 0 || !row.pivot.term_id)
							return null;
						return this.terms.find((t) => t.id == row.pivot.term_id)
							.code;
					},
				},
				{
					title: "Level",
					data: (row, type, val, meta) => {
						if (this.levels.length == 0 || !row.pivot.level_id)
							return null;
						return this.levels.find(
							(l) => l.id == row.pivot.level_id
						).code;
					},
				},
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
				{
					title: "Status",
					data: (row, type, val, meta) => {
						return row.deleted_at ? "INACTIVE" : "ACTIVE";
					},
				},
			],
			paging: false,
			responsive: true,
			searching: false,
			ordering: true,
			colReorder: true,
			order: [
				[2, "asc"],
				[1, "asc"],
				[3, "asc"],
			],
			// orderFixed: {
			// 	pre: [
			// 		[1, "asc"],
			// 		[2, "asc"],
			// 	],
			// },
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
			// drawCallback: async (
			// 	settings,
			// 	levels = this.levels,
			// 	terms = this.terms
			// ) => {
			// 	const dtInstance = await this.dataTableElement.dtInstance;
			// 	let last_term = null;
			// 	let last_level = null;
			// 	let rows = dtInstance.rows().nodes();
			// 	let columns: any[] = [];
			// 	// let new_thead = $("<thead></thead>");
			// 	let new_row = $("<tr></tr>");
			// 	for (let index = 0; index < dtInstance.columns().count(); index++) {
			// 		dtInstance.column(index).visible()
			// 			? columns.push(
			// 					dtInstance.column(index).header().cloneNode(true)
			// 			  )
			// 			: "";
			// 	}
			// 	new_row.append(columns);
			// 	// new_thead.append(new_row);
			// 	dtInstance
			// 		.column(1)
			// 		.data()
			// 		.each(function (term_id, i) {
			// 			const level_id = dtInstance.column(2).data()[i];
			// 			if (last_term !== term_id || last_level != level_id) {
			// 				$(rows)
			// 					.eq(i)
			// 					.before(
			// 						`<tr><td colspan='6' class="ion-padding-top"><b>${
			// 							levels.find((l) => l.id == level_id)
			// 								.description
			// 						} ${
			// 							terms.find((t) => t.id == term_id).code
			// 						} TERM</b></td></tr>`
			// 					)
			// 					.before(new_row.clone(true, true));
			// 				last_term = term_id;
			// 				last_level = level_id;
			// 			}
			// 		});
			// },
		};
	}

	private async showSubjectForm() {
		let event_emitter = new EventEmitter();
		event_emitter.subscribe(
			async (res: { new_subject: CourseSubject; row_index: number }) => {
				this.subjects.push(res.new_subject);
			}
		);

		//create modal
		const modal = await this.modalController.create({
			component: SubjectsFormComponent,
			componentProps: {
				success_subject: event_emitter,
				trigger: "",
			},
			cssClass: "modal-max-width",
			backdropDismiss: false,
			mode: "ios",
			presentingElement: this.parentDiv,
			showBackdrop: true,
		});
		return await modal.present();
	}

	slidePage(options: SlideTriggerOptions) {
		if (options.direction == "next") {
			return this.swiper.swiperRef.slideNext();
		}
		if (options.direction == "previous") {
			return this.swiper.swiperRef.slidePrev();
		}
	}

	subjectExist(id: number) {
		return this.curriculum_subjects.some((cs) => cs.id === id);
	}

	async submitProgramForm() {
		this.programForm.controls.subjects.setValue(
			this.curriculum_subjects.map((cs) => cs.pivot)
		);
		const raw_data = this.programForm.value;
		const loading = await this.loadingController.create({
			spinner: "bubbles",
			backdropDismiss: false,
		});
		await loading.present();
		let new_program = this.program
			? await this.apiService
					.updateProgram(this.program.id, raw_data)
					.catch(async (res: HttpErrorResponse) => {
						const alert = await this.alertController.create({
							header: res.error.error,
							message: res.error.message,
							buttons: ["OK"],
						});
						await alert.present();
						return null;
					})
			: await this.apiService
					.createProgram(raw_data)
					.catch(async (res: HttpErrorResponse) => {
						const alert = await this.alertController.create({
							header: res.error.error,
							message: res.error.message,
							buttons: ["OK"],
						});
						await alert.present();
						return null;
					});

		await loading.dismiss();

		if (new_program) {
			const alert = await this.alertController.create({
				header:
					this.row_index > -1
						? "Curriculum Update Success"
						: "Curriculum Creation Success",
				buttons: ["OK"],
			});
			await alert.present();

			//emit new or updated data
			this.success_registration.emit({
				new_program,
				row_index: this.row_index,
			});

			this.closeProgramModal();
		}
	}

	subscribeToDisplayLevel() {
		return this.selectSubjectsForm.controls.current_level.valueChanges.subscribe(
			(v) => {
				this.updateAlertOptions();
			}
		);
	}

	subscribeToDisplayTerm() {
		return this.selectSubjectsForm.controls.current_term.valueChanges.subscribe(
			(v) => {
				this.updateAlertOptions();
			}
		);
	}

	subscribeToDisplaySubjects() {
		return this.selectSubjectsForm.controls.subjects.valueChanges.subscribe(
			async (value: number[]) => {
				value.forEach((selected_id) => {
					if (
						!this.curriculum_subjects.some(
							(cs) => cs.pivot.subject_id == selected_id
						)
					) {
						const missing = this.subjects.find(
							(s) => s.id == selected_id
						);
						missing.pivot = {
							level_id:
								this.selectSubjectsForm.controls.current_level
									.value,
							term_id:
								this.selectSubjectsForm.controls.current_term
									.value,
							program_id: this.program ? this.program.id : 0,
							subject_id: selected_id,
						};
						this.curriculum_subjects.push(missing);
					}
				});

				const dtInstance = await this.dataTableElement.dtInstance;
				dtInstance.rows().remove();
				dtInstance.rows.add(this.curriculum_subjects);
				dtInstance.rows().draw();
			}
		);
	}

	subscribeToProgramCode() {
		return this.programForm.controls.code.valueChanges.subscribe((v) => {
			this.updateAlertOptions();
		});
	}

	private updateAlertOptions() {
		//alert options for select subjects interface
		this.customAlertOptions = {
			header: `Select Subjects for ${this.programForm.controls.code.value}`,
			subHeader: `Term:${
				this.terms.length &&
				this.selectSubjectsForm.controls.current_term.value
					? this.terms.find(
							(t) =>
								t.id ==
								this.selectSubjectsForm.controls.current_term
									.value
					  ).code
					: "-"
			} and Level: ${
				this.levels.length &&
				this.selectSubjectsForm.controls.current_level.value
					? this.levels.find(
							(l) =>
								l.id ==
								this.selectSubjectsForm.controls.current_level
									.value
					  ).code
					: "-"
			}`,
			cssClass: "custom-select-alert",
			backdropDismiss: false,
		};
	}
}
