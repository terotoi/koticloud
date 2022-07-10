
/**
 * Sort nodes by name, with directories first in the list.
 */
export function sortNodes(ls) {
	return [...ls].sort((a, b) => {
		if (a.type === 'directory' && b.type !== 'directory')
			return -1
		if (b.type === 'directory' && a.type !== 'directory')
			return 1
		else
			return a.name.localeCompare(b.name)
	})
}
