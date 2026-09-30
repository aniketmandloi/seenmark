import { crc32, deflateSync } from "node:zlib";

import { PGlite } from "@electric-sql/pglite";
import { createAuth } from "@seenmark/auth";
import type { Database } from "@seenmark/db";
import { migrationsFolder } from "@seenmark/db/migrations-folder";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";

import { appRouter } from "./routers/index";
import { createSignUpLimit, type SignUpLimit } from "./sign-up-limit";

const authEnv = {
	BETTER_AUTH_URL: "http://localhost:3000",
	BETTER_AUTH_SECRET: "test-secret-at-least-32-characters-long",
	CORS_ORIGIN: "http://localhost:3000",
};

export type TestAuth = ReturnType<typeof createAuth>;

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

function pngChunk(type: string, data: Buffer) {
	const length = Buffer.alloc(4);
	length.writeUInt32BE(data.length);
	const typeAndData = Buffer.concat([Buffer.from(type, "latin1"), data]);
	const crc = Buffer.alloc(4);
	crc.writeUInt32BE(crc32(typeAndData));
	return Buffer.concat([length, typeAndData, crc]);
}

/** A readable 1×1 PNG that carries the label in a text chunk, so each test photo is distinct. */
export function testPhoto(label: string) {
	const header = Buffer.alloc(13);
	header.writeUInt32BE(1, 0);
	header.writeUInt32BE(1, 4);
	header[8] = 8;
	header[9] = 2;
	// One scanline: filter type 0, then one RGB pixel.
	const pixels = Buffer.from([0, 0x80, 0x60, 0x40]);
	return Buffer.concat([
		Buffer.from(PNG_SIGNATURE),
		pngChunk("IHDR", header),
		pngChunk("tEXt", Buffer.from(`Comment\0${label}`, "latin1")),
		pngChunk("IDAT", deflateSync(pixels)),
		pngChunk("IEND", Buffer.alloc(0)),
	]).toString("base64");
}

export async function openTestDatabase(): Promise<{
	client: PGlite;
	db: Database;
	auth: TestAuth;
}> {
	const client = new PGlite();
	const db = drizzle({ client });
	await migrate(db, { migrationsFolder });
	const auth = createAuth(authEnv, db);
	return { client, db, auth };
}

type CallerOptions = {
	paidLinkDestination?: string | null;
	now?: () => Date;
	signUpLimit?: SignUpLimit;
};

export function createPublicCaller(
	db: Database,
	auth: TestAuth,
	options: CallerOptions = {},
) {
	return appRouter.createCaller({
		session: null,
		db,
		auth,
		paidLinkDestination: options.paidLinkDestination ?? null,
		now: options.now ?? (() => new Date()),
		clientAddress: null,
		signUpLimit: options.signUpLimit ?? createSignUpLimit(),
	});
}

export function createMemberCaller(
	db: Database,
	auth: TestAuth,
	input: {
		userId: string;
		name: string;
		email: string;
	},
	options: CallerOptions = {},
) {
	return appRouter.createCaller({
		session: {
			session: {
				id: `session-${input.userId}`,
				userId: input.userId,
				expiresAt: new Date(Date.now() + 60_000),
				token: `token-${input.userId}`,
				createdAt: new Date(),
				updatedAt: new Date(),
			},
			user: {
				id: input.userId,
				name: input.name,
				email: input.email,
				emailVerified: false,
				createdAt: new Date(),
				updatedAt: new Date(),
			},
		},
		db,
		auth,
		paidLinkDestination: options.paidLinkDestination ?? null,
		now: options.now ?? (() => new Date()),
		clientAddress: null,
		signUpLimit: options.signUpLimit ?? createSignUpLimit(),
	});
}
