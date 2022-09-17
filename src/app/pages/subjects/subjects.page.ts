import { HttpErrorResponse } from "@angular/common/http";
import {
	Component,
	EventEmitter,
	HostListener,
	OnInit,
	ViewChild,
} from "@angular/core";
import {
	ViewWillLeave,
	ViewWillEnter,
	IonContent,
	IonFab,
	PopoverController,
	ModalController,
	LoadingController,
	AlertController,
} from "@ionic/angular";
import { DataTableDirective } from "angular-datatables";
import { Course } from "src/app/interfaces/course";
import { CourseSubject } from "src/app/interfaces/course-subject";
import { EducationLevel } from "src/app/interfaces/education-level";
import { Level } from "src/app/interfaces/level";
import { SchoolSetting } from "src/app/interfaces/school-setting";
import { TablePage } from "src/app/interfaces/table-page";
import { Term } from "src/app/interfaces/term";
import { ProgramsFormComponent } from "src/app/modules/shared/components/programs-form/programs-form.component";
import { RowContextMenuComponent } from "src/app/modules/shared/components/row-context-menu/row-context-menu.component";
import { SubjectsFormComponent } from "src/app/modules/shared/components/subjects-form/subjects-form.component";
import { ApiService } from "src/app/services/api.service";
import {
	StorageService,
	TABLE_SETTINGS_PREFIX,
} from "src/app/services/storage.service";

@Component({
	selector: "app-subjects",
	templateUrl: "./subjects.page.html",
	styleUrls: ["./subjects.page.scss"],
})
export class SubjectsPage
	implements OnInit, ViewWillLeave, ViewWillEnter, TablePage
{
	buttons: {
		label: string;
		callback: () => any;
	}[] = [
		{
			label: "CSV",
			callback: () => {
				this.exportAs(1);
			},
		},
		{
			label: "EXCEL",
			callback: () => {
				this.exportAs(2);
			},
		},
		{
			label: "PDF",
			callback: () => {
				this.exportAs(3);
			},
		},
	];
	categories: {
		name: string;
		filter_key: string;
		items: EducationLevel[];
	}[] = [];
	filters = {
		subject_status: "ALL",
		programs: [],
	};
	hasScrollbar = false;
	isSearching: boolean = false;
	programs: Course[] = [];
	subjects: CourseSubject[] = [];
	private table_columns: any[] = [];
	private table_data_status = {
		current_page: 0,
		last_page: 2,
		limit: 15,
		order: "DESC",
		search: "",
	};
	terms: Term[] = [];

	// checks if there's a scrollbar when the user resizes the window or zooms in/out
	@HostListener("window:resize", ["$event"])
	async onResize() {
		await this.checkForScrollbar();
	}

	@ViewChild(DataTableDirective, { static: false })
	dataTableElement: DataTableDirective;

	dtOptions = {
		data: this.subjects,
		columns: [
			{ title: "ID", data: "id" },
			{ title: "Code", data: "code" },
			{ title: "Description", data: "description" },
			{ title: "Lec Units", data: "lec_units" },
			{ title: "Lab Units", data: "lab_units" },
			{
				title: "Status",
				data: null,
				render: (data, type, row) => {
					return row.deleted_at ? "INACTIVE" : "ACTIVE";
				},
			},
		],
		paging: false,
		responsive: true,
		searching: true,
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
			// { targets: [1, 2, 3, 8], searchable: true },
			// { targets: "_all", searchable: false, visible: true },
			// {
			// 	targets: [9],
			// 	className: "dynamic-text-alignment ion-padding-right",
			// },
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

	table_name = "subjectsTable";
	table_settings;

	@ViewChild("tableContent", { static: false }) private content: IonContent;

	@ViewChild(IonFab) fab: IonFab;

	constructor(
		private storage: StorageService,
		private apiService: ApiService,
		private popoverController: PopoverController,
		private modalController: ModalController,
		private loadingController: LoadingController,
		private alertController: AlertController
	) {}

	async ionViewWillEnter(): Promise<void> {
		this.getPrograms(true);
	}

	async ionViewWillLeave(): Promise<void> {
		this.programs = [];
		// await this.saveTableSettings();
	}

	async ngOnInit() {
		// await this.loadTableSettings();
		this.loadMoreData().then(() => this.checkForScrollbar());
	}

	async addNewRows(response: any) {
		if (!response.data) return;
		this.table_data_status.current_page = response.current_page;
		this.table_data_status.last_page = response.last_page;
		const dtInstance = await this.dataTableElement.dtInstance;
		dtInstance.rows.add(response.data);
		dtInstance.rows().draw();
	}

	async checkForScrollbar(ignoreSearchingStatus = false) {
		const scrollElement = await this.content.getScrollElement();
		this.hasScrollbar =
			scrollElement.scrollHeight > scrollElement.clientHeight;
		while (
			//   !this.isDateFilterApplied &&
			!this.hasScrollbar &&
			this.table_data_status.current_page <
				this.table_data_status.last_page
		) {
			if (!this.isSearching || ignoreSearchingStatus) {
				await this.fetchRecords().then(() => {
					this.hasScrollbar =
						scrollElement.scrollHeight > scrollElement.clientHeight;
				});
			}
		}
		return;
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
						label: "View Subject",
						icon_name: "eye-outline",
						callback: () => {
							this.viewSubject(subject, index);
						},
					},
					{
						label: subject.deleted_at ? "Activate" : "Deactivate",
						icon_name: subject.deleted_at
							? "checkmark-circle-outline"
							: "close-circle-outline",
						callback: () => {
							this.toggleStatus(subject, index);
						},
					},
				],
			},
			backdropDismiss: true,
			showBackdrop: false,
		});
		return await menu.present();
	}

	async exportAs(button_index: number) {
		const dtInstance = <any>await this.dataTableElement.dtInstance;
		dtInstance.table().button(button_index).trigger();
	}

	async fetchRecords(
		page: number = this.table_data_status.current_page + 1,
		limit: number = this.table_data_status.limit,
		order: string = this.table_data_status.order,
		search: string = this.table_data_status.search
	) {
		if (this.table_data_status.last_page <= page) return;
		const subjects = await this.apiService
			.getSubjects(true, {
				page,
				limit,
				order,
				search,
				withTrashed: 1,
				subject_status: this.filters.subject_status,
				"p[]": this.filters.programs,
			})
			.catch((er) => {
				return null;
			});
		if (subjects) this.addNewRows(subjects);
	}

	/**
	 * Get all programs
	 */
	async getPrograms(fresh: boolean = false) {
		this.programs = await this.apiService
			.getPrograms(fresh, { withTrashed: 1 })
			.catch((er) => {
				return [];
			});
	}

	async filterSubjects(event: any = null) {
		//check if event is new set of filters
		if (event !== null && "programs" in event) this.filters = event;

		const dtInstance = await this.dataTableElement.dtInstance;
		dtInstance.rows().remove();
		dtInstance.rows().draw();

		//resets table data status
		this.table_data_status.current_page = 0;
		this.table_data_status.last_page = 2;
		this.table_data_status.limit = 15;
		this.table_data_status.order = "DESC";
		await this.loadMoreData().then(() => this.checkForScrollbar());
	}

	async loadTableSettings() {
		const raw_data_settings = await this.storage
			.get(TABLE_SETTINGS_PREFIX + this.table_name)
			.catch((res) => {
				return null;
			});
		this.table_settings =
			JSON.parse(raw_data_settings) ?? this.table_settings;

		if (this.dataTableElement) {
			const dtInstance: any = await this.dataTableElement.dtInstance;

			if (this.table_settings.reorder.length > 0) {
				dtInstance.colReorder.order(this.table_settings.reorder);
			}

			if (this.table_settings.visibility.length > 0) {
				const hidden_columns = this.table_settings.visibility
					.map((v, i) => (!v ? i : -1))
					.filter((v) => v > -1);

				if (hidden_columns.length > 0) {
					dtInstance.columns(hidden_columns).visible(false);
				}
			}

			/*Update table settings on reorder of columns*/
			dtInstance.on("column-reorder", async () => {
				this.table_settings.reorder = dtInstance.colReorder.order();
			});
		}
	}

	async loadMoreData(event = null) {
		if (this.isSearching) return;
		this.isSearching = true;
		await this.fetchRecords();
		if (event) event?.target?.complete();
		this.isSearching = false;
	}

	async saveTableSettings() {
		const dtInstance: any = await this.dataTableElement.dtInstance;
		this.table_settings.visibility = dtInstance
			.columns()
			.visible()
			.toArray();
		await this.storage
			.set(
				TABLE_SETTINGS_PREFIX + this.table_name,
				JSON.stringify(this.table_settings)
			)
			.catch((res) => {});
	}

	async showColVisMenu(event: Event) {
		if (!this.dataTableElement) return;

		/*prevent the closing of fab on click of an item */
		// event.stopPropagation();
		this.fab.activated = false;

		this.table_columns = [];
		const dtInstance = <DataTables.Api>(
			await this.dataTableElement.dtInstance
		);
		dtInstance.columns().every((index) => {
			if (index > 0) {
				const col = dtInstance.column(index);
				const column = {
					label: col.header().textContent,
					checked: col.visible(),
					callback: () => {
						this.toggleColumnVisibility(index);
					},
				};
				this.table_columns.push(column);
			}
		});
	}

	async showExportMenu(event: Event) {
		if (!this.dataTableElement) return;

		/*prevent the closing of fab on click of an item */
		// event.stopPropagation();
		this.fab.activated = false;
	}

	async showFilterMenu(event: Event) {
		this.categories = [];
		/*prevent the closing of fab on click of an item */
		// event.stopPropagation;
		this.fab.activated = false;

		this.categories.push({
			name: "Programs",
			filter_key: "programs",
			items: this.programs,
		});
	}

	private async showSubjectForm(
		subject: CourseSubject = null,
		row_index: number
	) {
		let event_emitter = new EventEmitter();
		const dtInstance = await this.dataTableElement.dtInstance;
		event_emitter.subscribe(
			async (res: { new_subject: CourseSubject; row_index: number }) => {
				if (!res.new_subject) return;
				if (
					res.row_index > -1 &&
					(res.new_subject.code.indexOf(
						this.table_data_status.search
					) > -1 ||
						res.new_subject.description.indexOf(
							this.table_data_status.search
						) > -1)
				) {
					//update row data and redraw
					const data_index = dtInstance.rows().indexes()[
						res.row_index
					];
					dtInstance.row(data_index).data(res.new_subject);
					dtInstance.row(data_index).invalidate("data").draw();
					this.popoverController.dismiss();
				} else {
					//add new row and redraw
					dtInstance.row.add(res.new_subject);
					dtInstance.rows().draw();
				}
			}
		);

		//create modal
		const modal = await this.modalController.create({
			component: SubjectsFormComponent,
			componentProps: {
				course_subject: subject,
				row_index: row_index,
				success_subject: event_emitter,
				trigger: "",
			},
			cssClass: "modal-max-width",
			backdropDismiss: false,
		});
		return await modal.present();
	}

	async toggleColumnVisibility(index: number) {
		if (!this.dataTableElement) return;

		const dtInstance: any = await this.dataTableElement.dtInstance;
		const col = dtInstance.column(index);
		const v = col.visible();
		col.visible(!v);

		dtInstance.columns.adjust();
	}

	private async toggleStatus(subject: CourseSubject, index: number) {
		const loading = await this.loadingController.create({
			spinner: "bubbles",
			backdropDismiss: false,
		});
		await loading.present();

		let result: any = await this.apiService
			.deleteSubject(subject.id)
			.catch(async (res: HttpErrorResponse) => {
				await loading.dismiss();
				const alert = await this.alertController.create({
					header: "Status Update Failed!",
					buttons: ["OK"],
				});
				await alert.present();
			});

		if (result) {
			await loading.dismiss();
			const alert = await this.alertController.create({
				header: "Status Update Success.",
				buttons: ["OK"],
			});
			await alert.present();

			//update row data and redraw
			const dtInstance = await this.dataTableElement.dtInstance;
			const data_index = dtInstance.rows().indexes()[index];
			if (this.filters.subject_status == "ALL") {
				dtInstance.row(data_index).data()["deleted_at"] =
					result.deleted_at;
				dtInstance.row(data_index).invalidate("data").draw();
			} else {
				dtInstance.row(data_index).remove();
				dtInstance.rows().draw();
			}
			this.popoverController.dismiss();
		}
	}

	private async viewSubject(subject: CourseSubject, row_index: number) {
		await this.showSubjectForm(subject, row_index);
	}
}
