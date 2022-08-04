import { Term } from "./term";

export interface SchoolSetting {
	academic_year: string;
	created_at: string;
	created_by: number | null;
	deleted_at: string | null;
	deleted_by: number | null;
	encoding_end_date: string;
	encoding_start_date: string;
	enrollment_end_date: string;
	enrollment_start_date: string;
	id: number;
	term?: Term;
	term_id: number;
	updated_at: string;
	updated_by: number;
}
