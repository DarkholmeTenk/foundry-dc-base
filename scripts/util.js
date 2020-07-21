export function replace(owner, methodName, newMethod) {
	let method = owner[methodName]
	owner[methodName] = function() {
		return newMethod.bind(this)(method.bind(this), arguments)
	}
}

export function getLoggerFactory(modName) {
	return (feature)=>{
		let prefix = `${modName.toUpperCase()} | ${feature.toUpperCase()} | `
		let logger = function(message, ...args) {console.log(prefix + message, ...args)}
		logger.error = function(message, ...args) {console.error(prefix + message, ...args)}
		logger.warn = function(message, ...args) {console.warn(prefix + message, ...args)}
		logger.debug = function(message, ...args) {console.debug(prefix + message, ...args)}
		return logger
	}
}

Array.prototype.forEachAsync = function(fun) {
	return Promise.all(this.map(function() {
		return fun(...arguments)
	}))
}

Array.prototype.forEachAsyncOrdered = async function(fun) {
	for (let i in this) {
		if(isNaN(parseInt(i))) { continue }
		let value = this[i]
		await fun(value, i, this)
	}
}

Array.prototype.mapAsync = Array.prototype.forEachAsync

export const getLogger = getLoggerFactory("DC-Core")
const log = getLogger("Util")

export function isEqual(a, b, ignore = {}) {
	//log.debug("Comparing", a, b)
	if(typeof(a) !== typeof(b)) return false
	if(a === b) return true
	if(a === null || a === undefined) { return b === null || b === undefined }
	let aEqual = Object.keys(a).every(key=>{
		if(ignore[key] === true) { return true }
		let aVal = a[key]
		let bVal = b[key]
		if(typeof(aVal) !== typeof(bVal)) {
			return false
		} else if(typeof(aVal) === "object") {
			return isEqual(aVal, bVal, ignore[key] || {})
		} else {
			return aVal == bVal
		}
	})
	let bNewKey = Object.keys(b).some(key=>!(ignore[key] === true) && !(key in a))
	return aEqual && !bNewKey
}

export function clone(i) {
	if(i !== null) {
		if(Array.isArray(i)) {
			return i.map(i=>clone(i))
		} else if(typeof(i) === "object") {
			let newObj = {}
			Object.keys(i).forEach(key=>{
				newObj[key] = clone(i[key])
			})
			return newObj
		} else {
			return i
		}
	}
}