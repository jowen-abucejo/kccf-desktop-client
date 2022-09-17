import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";
import { Course } from "src/app/interfaces/course";
import { Level } from "src/app/interfaces/level";
import { StudentType } from "src/app/interfaces/student-type";

@Component({
	selector: "app-row-filter",
	templateUrl: "./row-filter.component.html",
	styleUrls: ["./row-filter.component.scss"],
})
export class RowFilterComponent implements OnInit {
	@Input() active_filters: any = null;
	@Input() categories: {
		name: string;
		filter_key: string;
		items: Level[] | Course[] | StudentType[];
	}[] = [];
	@Output() apply_new_filter: EventEmitter<any> = new EventEmitter<any>();

	private pending_filters: any = null;

	constructor() {}

	ngOnInit() {
		//copy active filters
		this.pending_filters = JSON.parse(JSON.stringify(this.active_filters));
	}

	//send the new filters to the student page
	submitNewFilters() {
		this.apply_new_filter.emit(this.pending_filters);
	}

	/**
	 * Add or remove item from the pending filters
	 * @param category_index index of the filter category where the item belongs
	 * @param item_id the id of item to add or remove
	 */
	updatePendingFilters(category_index: number, item_id: number) {
		let index_of_item: number =
			this.pending_filters[
				this.categories[category_index].filter_key
			].indexOf(item_id);
		if (index_of_item > -1) {
			this.pending_filters[
				this.categories[category_index].filter_key
			].splice(index_of_item, 1);
		} else {
			this.pending_filters[
				this.categories[category_index].filter_key
			].push(item_id);
		}
	}
}
