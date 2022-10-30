import { OfferSubject, ProgramSubject } from "./subject-pivot";

export interface CourseSubject {
	code: string;
	comments: string | null;
	created_at: string;
	created_by: number | null;
	deleted_at: string | null;
	deleted_by: number | null;
	description: string;
	equivalent_newer_subjects?: CourseSubject[];
	equivalent_previous_subjects?: CourseSubject[];
	id: number;
	lab_units: number;
	lec_units: number;
	school_settings_count?: number;
	pivot?: OfferSubject | ProgramSubject;
	pre_requisite_for_subjects_count?: number;
	pre_requisite_subjects?: CourseSubject[];
	programs_count?: number;
	updated_at: string;
	updated_by: number;
}
