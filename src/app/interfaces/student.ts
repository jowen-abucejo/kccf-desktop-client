import { Course } from "./course";
import { Level } from "./level";
import { SchoolSetting } from "./school-setting";

export interface Student {
	created_at: string;
	created_by: number;
	deleted_at: string;
	deleted_by: number;
	id: number;
	level?: Level;
	level_id: number;
	program?: Course;
	program_id: number;
	registration?: any;
	regular: boolean;
	school_setting?: SchoolSetting;
	school_setting_id: number;
	student_number: string;
	student_type_id: number;
	updated_at: string;
	updated_by: number;
	user_id: number;
}
