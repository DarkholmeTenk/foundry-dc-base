import { getLogger, isEqual, clone } from "./util.js"

const log = getLogger("ItemMerger")

const ignorableProperties = ["_id", "isStack", "hasUses", "hasTarget", "isOnCooldown", "isDepleted", "sort", "labels", "totalWeight"]
const ignorableDataProperties = ["quantity"]

let ignore = {data:{}}
ignorableProperties.forEach(p=>ignore[p] = true)
ignorableDataProperties.forEach(p=>ignore.data[p] = true)

export function mergeItemData(items) {
	log.debug("Merging Items", items)
	let nameArrs = {}
	items.forEach(i=>{
		let name = i.name
		let qty = parseInt(i.data.quantity || 1)
		let nameArr = nameArrs[name] || []
		let found = nameArr.find(({item})=>{
			let val = isEqual(i, item, ignore)
			log("Found", val, item)
			return val
		})
		if(found) {
			log.debug("Found item for " + name, nameArr, i)
			found.qty += qty
		} else {
			log.debug("Not found item for " + name, nameArr, i)
			nameArr.push({item: i, qty})
		}
		nameArrs[name] = nameArr
	})
	let mergedItems = Object.values(nameArrs).flatMap(nameArr=>{
		return nameArr.map(({item, qty})=>{
			if(qty == item.data.quantity || qty == 1) {
				return item
			} else {
				let newItem = clone(item)
				delete newItem._id
				newItem.data.quantity = qty
				newItem.isStack = qty > 1
				return newItem
			}
		})
	})
	log.debug("Merged items", mergedItems)
	return mergedItems
}

Hooks.on("actorSheetMenuItems", (add, app)=>{
	let actor = app.object
	if(actor.owner && !actor.isToken && actor.isPC) {
		add({
			name: "Merge Items",
			icon: '<i class="fas fa-sort-amount-up"></i>',
			callback: async ()=>{
				let itemData = actor.items.map(i=>i.data)
				let merged = mergeItemData(itemData)
				let remove = itemData.filter(i=>!merged.includes(i))
				let add = merged.filter(i=>!itemData.includes(i))
				log("Merging", itemData, remove, add)
				await actor.deleteOwnedItem(remove.map(i=>i._id))
				await actor.createOwnedItem(add)
			}
		})
	}
})