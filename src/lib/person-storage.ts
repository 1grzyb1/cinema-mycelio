export const CURRENT_PERSON_KEY = 'cinema-mycelio:current-person';

export type CurrentPerson = {
	id: string;
	name: string;
	/** DiceBear seed — optional for entries saved before avatars existed */
	avatarSeed?: string;
	/** JSON string of pixel-art options */
	avatarOptions?: string;
};

export function getCurrentPerson(): CurrentPerson | null {
	if (typeof localStorage === 'undefined') return null;
	try {
		const raw = localStorage.getItem(CURRENT_PERSON_KEY);
		if (!raw) return null;
		const data = JSON.parse(raw) as unknown;
		if (!data || typeof data !== 'object') return null;
		if (!('id' in data) || !('name' in data)) return null;
		const id = (data as { id: unknown }).id;
		const name = (data as { name: unknown }).name;
		if (typeof id !== 'string' || typeof name !== 'string' || !id || !name) return null;
		const avatarSeed = (data as { avatarSeed?: unknown }).avatarSeed;
		const avatarOptions = (data as { avatarOptions?: unknown }).avatarOptions;
		const out: CurrentPerson = { id, name };
		if (typeof avatarSeed === 'string' && avatarSeed) out.avatarSeed = avatarSeed;
		if (typeof avatarOptions === 'string') out.avatarOptions = avatarOptions;
		return out;
	} catch {
		return null;
	}
}

export function setCurrentPerson(person: CurrentPerson): void {
	localStorage.setItem(CURRENT_PERSON_KEY, JSON.stringify(person));
}

export function clearCurrentPerson(): void {
	localStorage.removeItem(CURRENT_PERSON_KEY);
}
