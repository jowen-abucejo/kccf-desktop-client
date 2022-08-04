import { Component, Input, OnInit } from "@angular/core";

@Component({
	selector: "app-columns-visibility",
	templateUrl: "./columns-visibility.component.html",
	styleUrls: ["./columns-visibility.component.scss"],
})
export class ColumnsVisibilityComponent implements OnInit {
	@Input() columns: {
		label: string;
		checked: boolean;
		column_callback: () => any;
	}[] = [];

	constructor() {}

	ngOnInit() {}
}
