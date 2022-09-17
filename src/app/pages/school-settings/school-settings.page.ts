import { formatDate } from "@angular/common";
import { Component, EventEmitter, OnInit, ViewChild } from "@angular/core";
import {
	AlertController,
	IonContent,
	IonFab,
	IonModal,
	LoadingController,
	ModalController,
	PopoverController,
} from "@ionic/angular";
import { DataTableDirective } from "angular-datatables";
import { SchoolSetting } from "src/app/interfaces/school-setting";
import { TablePage } from "src/app/interfaces/table-page";
import { Term } from "src/app/interfaces/term";
import { RowContextMenuComponent } from "src/app/modules/shared/components/row-context-menu/row-context-menu.component";
import { SchoolSettingsFormComponent } from "src/app/modules/shared/components/school-settings-form/school-settings-form.component";
import { ApiService } from "src/app/services/api.service";
import {
	StorageService,
	TABLE_SETTINGS_PREFIX,
} from "src/app/services/storage.service";

@Component({
	selector: "app-school-settings",
	templateUrl: "./school-settings.page.html",
	styleUrls: ["./school-settings.page.scss"],
})
export class SchoolSettingsPage implements OnInit, TablePage {
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
	filters = {
		settings_status: "ALL",
	};
	hasScrollbar = false;
	isSearching: boolean = false;
	school_settings: SchoolSetting[] = [];
	private table_columns: any[] = [];
	private table_data_status = {
		current_page: 0,
		end_date: "",
		last_page: 2,
		limit: 15,
		order: "DESC",
		search: "",
		start_date: "",
	};
	terms: Term[] = [];

	@ViewChild(DataTableDirective, { static: false })
	dataTableElement: DataTableDirective;

	@ViewChild(IonModal) modal: IonModal;
	// @ViewChild('tableContent', { static: false }) private content: IonContent;

	dtOptions = {
		data: this.school_settings,
		columns: [
			{
				title: "Academic Year",
				data: "academic_year",
			},
			{
				title: "Term",
				data: "term.code",
			},
			{
				title: "Enrollment Start",
				data: "enrollment_start_date",
				render: (data, type, row) => {
					return formatDate(data, "fullDate", "en-US");
				},
			},
			{
				title: "Enrollment End",
				data: "enrollment_end_date",
				render: (data, type, row) => {
					return formatDate(data, "fullDate", "en-US");
				},
			},
			{
				title: "Encoding Start",
				data: "encoding_start_date",
				render: (data, type, row) => {
					return formatDate(data, "fullDate", "en-US");
				},
			},
			{
				title: "Encoding End",
				data: "encoding_end_date",
				render: (data, type, row) => {
					return formatDate(data, "fullDate", "en-US");
				},
			},
		],
		paging: false,
		responsive: true,
		searching: true,
		ordering: true,
		colReorder: true,
		order: [[0, "desc"]],
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
				// customize: (doc) => {
				// 	doc.pageMargins = [38, 120, 38, 38];
				// 	doc.defaultStyle.alignment = "center";
				// 	doc.pageOrientation =
				// 		this.export_setup.page_orientation;
				// 	doc.pageSize = this.export_setup.page_size;
				// 	doc.content[0] = {
				// 		text: this.export_setup.page_title,
				// 		style: { fontSize: 14, bold: true },
				// 		margin: this.export_setup.page_title
				// 			? [0, 0, 0, 15]
				// 			: 0,
				// 	};
				// 	doc.content[1].table.widths = Array(
				// 		doc.content[1].table.body[0].length + 1
				// 	)
				// 		.join("*")
				// 		.split("");
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
				// },
				download: "open",
			},
		],
		columnDefs: [
			// {
			// 	targets: [0],
			// 	visible: false,
			// },
			// { targets: [1, 2, 3, 8], searchable: true },
			// { targets: "_all", searchable: false, visible: true },
			// {
			// 	targets: [9],
			// 	className: "dynamic-text-alignment ion-padding-right",
			// },
		],
		rowCallback: (row: Node, data: SchoolSetting, index: number) => {
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
	table_name = "schoolSettingsTable";
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

	async ionViewWillLeave(): Promise<void> {
		// await this.saveTableSettings();
	}

	async ngOnInit() {
		await this.loadMoreData().then(() => this.checkForScrollbar());
		// await this.loadTableSettings();
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
		school_setting: SchoolSetting,
		index: number
	) {
		const menu = await this.popoverController.create({
			component: RowContextMenuComponent,
			event: e.originalEvent,
			componentProps: {
				subtitle: `AY: ${school_setting.academic_year} TERM: ${school_setting.term.code}`,
				options: [
					{
						label: "View",
						icon_name: "eye-outline",
						callback: () => {
							this.viewSetting(school_setting, index);
						},
					},
					// {
					// 	label: student.deleted_at ? "Activate" : "Deactivate",
					// 	icon_name: student.deleted_at
					// 		? "checkmark-circle-outline"
					// 		: "close-circle-outline",
					// 	callback: () => {
					// 		this.toggleStatus(student, index);
					// 	},
					// },
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
		const settings = await this.apiService
			.getSchoolSettings(true, {
				page,
				limit,
				order,
				search,
				withTrashed: 1,
				settings_status: this.filters.settings_status,
			})
			.catch((er) => {
				return null;
			});
		if (settings) this.addNewRows(settings);
	}

	async filterSettings(event: any = null) {
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

	async loadMoreData(event = null) {
		if (this.isSearching) return;
		this.isSearching = true;
		await this.fetchRecords();
		if (event) event?.target.complete();
		this.isSearching = false;
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

	async showColVisMenu(event: any) {
		if (!this.dataTableElement) return;

		/*prevent the closing of fab on click of an item */
		// event.stopPropagation();
		this.fab.activated = false;

		this.table_columns = [];
		const dtInstance = await this.dataTableElement.dtInstance;
		dtInstance.columns().every((index) => {
			// if (index > 0) {
			const col = dtInstance.column(index);
			const column = {
				label: col.header().textContent,
				checked: col.visible(),
				callback: () => {
					this.toggleColumnVisibility(index);
				},
			};
			this.table_columns.push(column);
			// }
		});
	}

	async showExportMenu(event: Event) {
		if (!this.dataTableElement) return;

		/*prevent the closing of fab on click of an item */
		// event.stopPropagation();
		this.fab.activated = false;
	}

	private async showSchoolSettingForm(
		setting: SchoolSetting = null,
		row_index: number
	) {
		let event_emitter = new EventEmitter();
		event_emitter.subscribe(
			async (res: { new_setting: SchoolSetting; row_index: number }) => {
				if (!res.new_setting) return;
				if (res.row_index > -1) {
					//update row data and redraw
					const dtInstance = await this.dataTableElement.dtInstance;
					const data_index = dtInstance.rows().indexes()[
						res.row_index
					];
					dtInstance.row(data_index).data(res.new_setting);
					dtInstance.row(data_index).invalidate("data").draw();
					this.popoverController.dismiss();
				} else {
					//add new row and redraw
					const dtInstance = await this.dataTableElement.dtInstance;
					dtInstance.row.add(res.new_setting);
					dtInstance.rows().draw();
				}
			}
		);

		const modal = await this.modalController.create({
			component: SchoolSettingsFormComponent,
			componentProps: {
				trigger: "",
				terms: this.terms,
				school_setting: setting,
				row_index: row_index,
				success_setting: event_emitter,
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

	private async viewSetting(setting: SchoolSetting, index: number) {
		await this.showSchoolSettingForm(setting, index);
	}
}
