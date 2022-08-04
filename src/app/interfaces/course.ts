export interface Course {
	code: string;
	comments: string | null;
	created_at: string;
	created_by: number | null;
	deleted_at: string | null;
	deleted_by: number | null;
	description: string;
	id: number;
	program_level_id: number;
	updated_at: string;
	updated_by: number;
}
