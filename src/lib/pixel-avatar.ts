import { createAvatar } from '@dicebear/core';
import * as pixelArt from '@dicebear/pixel-art';
import type { Options } from '@dicebear/pixel-art';

export type { Options as PixelArtOptions } from '@dicebear/pixel-art';

/** Curated UI choices — full enums are huge; these give solid variety */
export const PIXEL_HAIR = [
	'short03',
	'short08',
	'short12',
	'short18',
	'long02',
	'long08',
	'long14',
	'long18'
] as const;
export const PIXEL_EYES = [
	'variant02',
	'variant04',
	'variant06',
	'variant08',
	'variant10',
	'variant12'
] as const;
export const PIXEL_MOUTH = ['happy03', 'happy07', 'happy10', 'sad02', 'sad05', 'sad08'] as const;
export const PIXEL_CLOTHING = [
	'variant04',
	'variant08',
	'variant12',
	'variant16',
	'variant20',
	'variant23'
] as const;
export const PIXEL_HAT = ['variant02', 'variant05', 'variant08', 'variant10'] as const;

/** DiceBear default skin palette — single entry in `skinColor` locks the swatch */
export const PIXEL_SKIN = [
	'ffdbac',
	'f5cfa0',
	'eac393',
	'e0b687',
	'cb9e6e',
	'b68655',
	'a26d3d',
	'8d5524'
] as const;

/** Single source for the pixel avatar editor UI + saved JSON */
export type PixelEditorFields = {
	hair: (typeof PIXEL_HAIR)[number];
	eyes: (typeof PIXEL_EYES)[number];
	mouth: (typeof PIXEL_MOUTH)[number];
	clothing: (typeof PIXEL_CLOTHING)[number];
	hat: (typeof PIXEL_HAT)[number];
	skin: (typeof PIXEL_SKIN)[number];
};

function pickIn<T extends string>(list: readonly T[], value: string | undefined, fallback: T): T {
	if (value && (list as readonly string[]).includes(value)) return value as T;
	return fallback;
}

export function cyclePixelChoice<T extends string>(
	arr: readonly T[],
	current: T,
	delta: -1 | 1
): T {
	let i = arr.indexOf(current);
	if (i < 0) i = 0;
	const n = arr.length;
	return arr[(i + delta + n) % n]!;
}

export function hydrateEditorFromOptionsJson(json: string): PixelEditorFields {
	const o = parseAvatarOptionsJson(json);
	return {
		hair: pickIn(PIXEL_HAIR, o.hair?.[0], 'short12'),
		eyes: pickIn(PIXEL_EYES, o.eyes?.[0], 'variant06'),
		mouth: pickIn(PIXEL_MOUTH, o.mouth?.[0], 'happy07'),
		clothing: pickIn(PIXEL_CLOTHING, o.clothing?.[0], 'variant12'),
		hat: pickIn(PIXEL_HAT, o.hat?.[0], 'variant05'),
		skin: pickIn(PIXEL_SKIN, o.skinColor?.[0], 'ffdbac')
	};
}

export function buildPixelAvatarOptions(fields: PixelEditorFields): Partial<Options> {
	return {
		hair: [fields.hair],
		eyes: [fields.eyes],
		mouth: [fields.mouth],
		clothing: [fields.clothing],
		hat: [fields.hat],
		hatProbability: 100,
		skinColor: [fields.skin]
	};
}

const OPTION_KEYS = new Set([
	'accessories',
	'accessoriesProbability',
	'clothing',
	'eyes',
	'glasses',
	'glassesProbability',
	'beard',
	'beardProbability',
	'mouth',
	'hair',
	'hat',
	'hatProbability',
	'accessoriesColor',
	'clothingColor',
	'eyesColor',
	'glassesColor',
	'hairColor',
	'hatColor',
	'mouthColor',
	'skinColor',
	'size',
	'backgroundColor',
	'backgroundType',
	'flip',
	'rotate',
	'scale',
	'radius'
]);

const MAX_JSON_CHARS = 12_000;
const SEED_RE = /^[a-zA-Z0-9_-]{8,128}$/;

function isStrArray(v: unknown, maxLen: number): v is string[] {
	return (
		Array.isArray(v) &&
		v.length <= maxLen &&
		v.every(
			(x) => typeof x === 'string' && x.length > 0 && x.length <= 32 && /^[a-zA-Z0-9]+$/.test(x)
		)
	);
}

function isColorArray(v: unknown): v is string[] {
	return (
		Array.isArray(v) &&
		v.length <= 32 &&
		v.every(
			(x) =>
				typeof x === 'string' &&
				(x === 'transparent' || /^[a-fA-F0-9]{6}$/.test(x)) &&
				x.length <= 11
		)
	);
}

/**
 * Strips unknown keys and invalid values so API/storage cannot be abused.
 * Returns null if the payload is unusable.
 */
export function sanitizePixelAvatarOptions(raw: unknown): Partial<Options> | null {
	if (raw === null || raw === undefined) return {};
	if (typeof raw !== 'object' || Array.isArray(raw)) return null;
	const out: Record<string, unknown> = {};
	for (const [k, v] of Object.entries(raw)) {
		if (!OPTION_KEYS.has(k)) continue;
		if (k.endsWith('Probability')) {
			if (typeof v === 'number' && Number.isInteger(v) && v >= 0 && v <= 100) out[k] = v;
			continue;
		}
		if (
			k === 'accessories' ||
			k === 'clothing' ||
			k === 'eyes' ||
			k === 'glasses' ||
			k === 'beard' ||
			k === 'mouth' ||
			k === 'hair' ||
			k === 'hat'
		) {
			if (isStrArray(v, 48)) out[k] = v;
			continue;
		}
		if (k.endsWith('Color') || k === 'backgroundColor') {
			if (isColorArray(v)) out[k] = v;
			continue;
		}
		if (k === 'backgroundType') {
			if (
				Array.isArray(v) &&
				v.length <= 4 &&
				v.every((x) => x === 'solid' || x === 'gradientLinear')
			) {
				out[k] = v;
			}
			continue;
		}
		if (k === 'flip' && typeof v === 'boolean') out[k] = v;
		if (k === 'rotate' && typeof v === 'number' && Number.isFinite(v)) out[k] = v;
		if (k === 'scale' && typeof v === 'number' && Number.isFinite(v) && v > 0 && v <= 200)
			out[k] = v;
		if (k === 'radius' && typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 100)
			out[k] = v;
		if (k === 'size' && typeof v === 'number' && Number.isInteger(v) && v >= 16 && v <= 512)
			out[k] = v;
	}
	return out as Partial<Options>;
}

export function parseAvatarOptionsJson(json: string | null | undefined): Partial<Options> {
	if (!json || json === '{}') return {};
	try {
		const parsed: unknown = JSON.parse(json);
		const s = sanitizePixelAvatarOptions(parsed);
		return s ?? {};
	} catch {
		return {};
	}
}

export function isValidAvatarSeed(seed: string): boolean {
	return SEED_RE.test(seed);
}

export function assertAvatarPayloadSize(json: string): boolean {
	return json.length <= MAX_JSON_CHARS;
}

export function defaultPixelOptionsForForm(): Partial<Options> {
	return {
		hair: ['short12'],
		eyes: ['variant06'],
		mouth: ['happy07'],
		clothing: ['variant12'],
		hat: ['variant05'],
		/** Hat is gated by probability in DiceBear; 100% so variant changes are visible */
		hatProbability: 100,
		skinColor: ['ffdbac']
	};
}

export function pixelAvatarToDataUri(seed: string, options: Partial<Options> = {}): string {
	const merged: Partial<Options> = { ...options };
	/** DiceBear hides the hat layer unless this passes; saved avatars need a visible hat when `hat` is set */
	if (merged.hat?.length && merged.hatProbability === undefined) {
		merged.hatProbability = 100;
	}
	const avatar = createAvatar(pixelArt, {
		seed,
		size: 128,
		...merged
	});
	return avatar.toDataUri();
}
