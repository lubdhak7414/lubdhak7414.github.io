import { execSync } from 'node:child_process'

/** Short hash of the commit this build came from, for the footer's build stamp. Read from
 * the CI environment (Cloudflare Pages, GitHub Actions) or local git; null when neither
 * is available, and the stamp is simply left out. */
function readCommit(): string | null {
	const fromEnv = process.env.CF_PAGES_COMMIT_SHA || process.env.GITHUB_SHA
	if (fromEnv) return fromEnv.slice(0, 7)
	try {
		return execSync('git rev-parse --short=7 HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
			.toString()
			.trim()
	} catch {
		return null
	}
}

export const buildCommit = readCommit()
