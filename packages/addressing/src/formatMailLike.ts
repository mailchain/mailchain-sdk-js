export function formatMailLike(username: string, ...otherParts: string[]): string {
	if (otherParts.length === 0) return username;
	return `${username}@${otherParts.join('.')}`;
}
