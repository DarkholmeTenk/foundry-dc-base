import { getLogger } from "./util.js"

const log = getLogger("FolderHelper")
let thePromise = Promise.resolve()

export async function setupFolder(path, type = "Item") {
	let x = thePromise.then(async () => {
		let parts = path.split("/")
		let folderSoFar = null
		await parts.forEachAsyncOrdered(async part => {
			let folder;
			if(folderSoFar) {
				folder = folderSoFar.children.find(i => i.data.name == part && i.data.type == type)
			} else {
				folder = game.folders.find(i => i.data.name == part && i.data.type == type)
			}
			if (!folder) {
				log("Creating new folder", path, part)
				folder = await Folder.create({
					name: part,
					type: type,
					parent: folderSoFar? folderSoFar.id : null
				})
			}
			folderSoFar = folder
		})
		return folderSoFar.id
	})
	thePromise = x
	return await x
}

export function findFolder(path, type = "Item") {
	let parts = path.split("/")
	let searching = true
	let retFolder = null
	parts.forEach(async part => {
		if (!searching) return
		let folder;
		if (retFolder == null) {
			folder = game.folders.find(i => i.data.name == part && i.data.type == type)
		} else {
			folder = retFolder.children.find(i => i.data.name == part && i.data.type == type)
		}
		if (!folder) {
			searching = false;
			retFolder = null
		} else {
			retFolder = folder
		}
	})
	return retFolder
}

function explore(folder, onExplore) {
	onExplore(folder)
	folder.children.forEach(f => explore(f, onExplore))
}

export function getSubFolders(path) {
	let parent = findFolder(path)
	let results = []
	if (parent) {
		explore(parent, (f) => results.push(f.id))
	}
	return results
}