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

export const getLogger = getLoggerFactory("DC-Core")