import { getLogger } from "./util.js"

const log = getLogger("FolderHelper")

export async function setupFolder(path, type = "Item") {
	let parts = path.split("/")
	let folderId = null
	await parts.forEachAsyncOrdered(async part=>{
		let folder = game.folders.find(i=>i.data.name == part && i.data.type == type && (folderId === null || i.data.parent === folderId))
		if(!folder) {
			log("Creating new folder", path, part)
			folder = await Folder.create({
				name: part,
				type: type,
				parent: folderId
			})
		}
		folderId = folder.id
	})
	return folderId
}