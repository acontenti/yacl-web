export type InstructionType = "cook" | "wait" | "prep"

export interface Instruction {
	text: string
	time?: string
	type?: InstructionType
}

export interface IngredientSection {
	[name: string]: string
}

export interface Recipe {
	docId: string
	name?: string
	description?: string
	tags?: string[]
	category?: string
	quantity?: string
	source?: string
	image?: string
	ingredients?: IngredientSection | IngredientSection[]
	instructions?: (Instruction | string)[]
}
