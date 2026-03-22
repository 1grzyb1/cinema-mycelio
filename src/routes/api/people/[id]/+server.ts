import { json } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import {
	assertAvatarPayloadSize,
	isValidAvatarSeed,
	sanitizePixelAvatarOptions
} from '$lib/pixel-avatar';
import { db } from '$lib/server/db';
import { person } from '$lib/server/db/schema';
import type { RequestHandler } from './$types';

export const PATCH: RequestHandler = async ({ params, request }) => {
	const id = params.id?.trim();
	if (!id) {
		return json({ error: 'Brak identyfikatora' }, { status: 400 });
	}

	const [existing] = await db.select({ id: person.id }).from(person).where(eq(person.id, id));
	if (!existing) {
		return json({ error: 'Nie znaleziono osoby' }, { status: 404 });
	}

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Nieprawidłowe żądanie' }, { status: 400 });
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

	const [row] = await db
		.update(person)
		.set({ avatarSeed, avatarOptions: avatarOptionsJson })
		.where(eq(person.id, id))
		.returning({
			id: person.id,
			name: person.name,
			avatarSeed: person.avatarSeed,
			avatarOptions: person.avatarOptions
		});

	return json(row);
};
