import { Component, Input, OnInit } from "@angular/core";

@Component({
	selector: "app-table-export",
	templateUrl: "./table-export.component.html",
	styleUrls: ["./table-export.component.scss"],
})
export class TableExportComponent implements OnInit {
	@Input() buttons: {
		label: string;
		callback: () => any;
	}[] = [];

	constructor() {}

	ngOnInit() {}
}
