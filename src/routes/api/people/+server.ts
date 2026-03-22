import { json } from '@sveltejs/kit';
import { asc } from 'drizzle-orm';
import {
	assertAvatarPayloadSize,
	isValidAvatarSeed,
	sanitizePixelAvatarOptions
} from '$lib/pixel-avatar';
import { getDb } from '$lib/server/db';
import { person } from '$lib/server/db/schema';
import type { RequestHandler } from './$types';

const MAX_NAME_LEN = 64;

function isUniqueConstraintError(e: unknown): boolean {
	if (!(e instanceof Error)) return false;
	return e.message.includes('UNIQUE constraint failed');
}

export const GET: RequestHandler = async () => {
	const db = getDb();
	const people = await db
		.select({
			id: person.id,
			name: person.name,
			avatarSeed: person.avatarSeed,
			avatarOptions: person.avatarOptions
		})
		.from(person)
		.orderBy(asc(person.name));

	return json({ people });
};

export const POST: RequestHandler = async ({ request }) => {
	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Nieprawidłowe żądanie' }, { status: 400 });
	}

	const raw =
		body &&
		typeof body === 'object' &&
		'name' in body &&
		typeof (body as { name: unknown }).name === 'string'
			? (body as { name: string }).name
			: '';

	const name = raw.trim();
	if (!name) {
		return json({ error: 'Nazwa nie może być pusta' }, { status: 400 });
	}
	if (name.length > MAX_NAME_LEN) {
		return json({ error: `Nazwa może mieć maksymalnie ${MAX_NAME_LEN} znaków` }, { status: 400 });
	}

	const avatarSeedRaw =
		body && typeof body === 'object' && 'avatarSeed' in body
			? (body as { avatarSeed?: unknown }).avatarSeed
			: undefined;
	const avatarSeed = typeof avatarSeedRaw === 'string' ? avatarSeedRaw.trim() : '';

	if (!isValidAvatarSeed(avatarSeed)) {
		return json({ error: 'Nieprawidłowy identyfikator awatara' }, { status: 400 });
	}

	const optionsRaw =
		body && typeof body === 'object' && 'avatarOptions' in body
			? (body as { avatarOptions?: unknown }).avatarOptions
			: undefined;

	const sanitized = sanitizePixelAvatarOptions(optionsRaw === undefined ? {} : optionsRaw);
	if (sanitized === null) {
		return json({ error: 'Nieprawidłowe opcje awatara' }, { status: 400 });
	}
	const avatarOptionsJson = JSON.stringify(sanitized);
	if (!assertAvatarPayloadSize(avatarOptionsJson)) {
		return json({ error: 'Opcje awatara są za długie' }, { status: 400 });
	}

	try {
		const db = getDb();
		const [row] = await db
			.insert(person)
			.values({
				name,
				avatarSeed,
				avatarOptions: avatarOptionsJson
			})
			.returning({
				id: person.id,
				name: person.name,
				avatarSeed: person.avatarSeed,
				avatarOptions: person.avatarOptions
			});
		return json(row, { status: 201 });
	} catch (e) {
		if (isUniqueConstraintError(e)) {
			return json({ error: 'Ta nazwa jest już zajęta' }, { status: 409 });
		}
		throw e;
	}
};
