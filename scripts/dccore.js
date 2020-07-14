import { mergeItemData } from "./itemMerger.js"

class FunMenu extends ContextMenu {
	async close() {}
}

function upper(name) {
	return name.charAt(0).toUpperCase() + name.slice(1)
}

function registerMenuButtonsHandler(names) {
	names.forEach(name=>{
		Hooks.on(`render${upper(name)}`, function(_,html) {
			let menuItems = []
			function addMenuItem(itemData) {
				menuItems.push(itemData)
			}
			Hooks.callAll(`${name}MenuItems`, addMenuItem, ...arguments)
			if(menuItems.length > 0) {
				menuItems.forEach(mi=>{
					let clz = mi.name.replace(" ", "-").toLowerCase()
					let dotClz = "." + clz
					let btn = $(`<a class="${clz}" title="${mi.name}">${mi.icon}${mi.name}</a>`)
					if(mi.callback) {
						btn.click(e=>mi.callback(e))
					}
					html.closest('.app').find(dotClz).remove();
					let titleElement = html.closest('.app').find('.window-title');
					btn.insertAfter(titleElement);
				})
			}
		})
	})
}

registerMenuButtonsHandler(["itemSheet", "rollTableConfig", "actorSheet"])

Hooks.on('createToken', async (scene, data)=>{
	let {_id: id, actorId, actorLink} = data
	let actor = game.actors.get(actorId)
	if(actor.owner && !actorLink) {
		let promises = []
		let update = (updateData)=>promises.push(updateData)
		Hooks.callAll("createTokenMutate", update, {scene, actor, token: data})
		let updateDataArray = (await Promise.all(promises.map(p=>p()))).filter(x=>x)
		let updateData = {}
		updateDataArray.forEach(ud=>Object.assign(updateData, ud))
		if(Object.keys(updateData).length !== 0) {
			let tokenEntity = new Token(data)
			tokenEntity.scene = scene

			if(updateData.items) {
				let items = mergeItemData(updateData.items)
				await tokenEntity.actor.createOwnedItem(items)
				delete updateData.items
			}

			await tokenEntity.update(updateData)
		}
	}
})