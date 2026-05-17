export const EVENT_CATEGORY_OPTIONS = ['Konser', 'Eğitim', 'Teknoloji', 'Spor', 'Sosyal', 'Diğer'] as const;

export const OTHER_CATEGORY_OPTION = 'Diğer';

export function splitCategoryValue(category: string) {
	if (EVENT_CATEGORY_OPTIONS.includes(category as (typeof EVENT_CATEGORY_OPTIONS)[number])) {
		return {
			categoryOption: category,
			customCategory: '',
		};
	}

	return {
		categoryOption: OTHER_CATEGORY_OPTION,
		customCategory: category,
	};
}

export function resolveCategoryValue(categoryOption: string, customCategory: string) {
	if (categoryOption === OTHER_CATEGORY_OPTION) {
		return customCategory.trim();
	}

	return categoryOption;
}