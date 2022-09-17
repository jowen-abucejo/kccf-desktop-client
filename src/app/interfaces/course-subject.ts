export interface CourseSubject {
	code: string;
	comments: string | null;
	created_at: string;
	created_by: number | null;
	deleted_at: string | null;
	deleted_by: number | null;
	description: string;
	id: number;
	lab_units: number;
	lec_units: number;
	offer_subjects_count?: number;
	pivot?: {
		level_id;
		program_id: number;
		subject_id: number;
		term_id: number;
	};
	updated_at: string;
	updated_by: number;
}
