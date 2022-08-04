export interface TablePage {
	/**
	 * The name of table use as suffix key for storing settings
	 */
	table_name: string;

	/**
	 * The configuration options for the data table
	 */
	dtOptions: {};

	/**
	 * Cached settings of table
	 */
	table_settings: {
		/**
		 * The saved visibility of table columns in original order
		 */
		visibility: boolean[];

		/**
		 * The recent saved order of table columns
		 */
		reorder: number[];
	};

	/**
	 * Add new rows to table
	 * @param data array of records to be added in the table
	 */
	addNewRows(data: any[]): void;

	/**
	 * Fetch records from the server
	 * @param page page number of records to fetch
	 * @param limit total number of records for each page
	 * @param order sorting of records ('ASC' or 'DESC')
	 * @param search the word or phrase to search
	 * @param start_date minimum date to filter the records
	 * @param end_date maximum date to filter the records
	 */
	fetchRecords(
		page: number,
		limit: number,
		order: string,
		search: string,
		start_date?: string,
		end_date?: string
	): void;

	/**
	 * Load the last saved state of table
	 */
	loadTableSettings(): void;

	/**
	 * Save the current state of table
	 */
	saveTableSettings(): void;

	/**
	 * Show the toggles for table columns' visibility
	 * @param event the event that trigger this function. Use to position the popup menu correctly.
	 */
	showColVisMenu(event: any): void;

	/**
	 * Show the context menu for the record in table row
	 * @param event the event that trigger this function. Use to position the popup menu correctly.
	 */
	// showRowContextMenu(event: any): void;

	/**
	 * Hide/show the table column
	 * @param index the index of column to be toggle
	 */
	toggleColumnVisibility(index): void;
}
