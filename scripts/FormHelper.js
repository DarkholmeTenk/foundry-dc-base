import { getLogger } from "./util.js"

const log = getLogger("FormHelper")

function internalFlatten(data) {
    Object.keys(data).forEach(key=>{
        let val = data[key]
        if(typeof val === "object") {
            let isArr = Object.keys(val).length > 0 && Object.keys(val).every(key=>!isNaN(parseInt(key)))
            if(isArr) {
                data[key] = Object.values(val)
            } else {
                internalFlatten(val)
            }
        }
    })
}

function flattenData(original, formData) {
    let data = mergeObject(original, formData)
    internalFlatten(data)
    return data
}

Handlebars.registerHelper("dc-field", function(title, options) {
    return `<li class="flexrow">
        <strong>${game.i18n.localize(title)}</strong>
        ${options.fn(this)}
    </li>`
})

Handlebars.registerHelper("dc-dump", function(options) {
    log.debug("Dumping", ...arguments)
    return "?"
})

Handlebars.registerHelper("dc-table", function(dataName, options) {
    log.debug("Form Table", ...arguments)
    let data = options.data.root[dataName] || []
    let {rowBuilder, addText="", minusText=""} = options.hash
    return `<ol>
        ${data.map((datum, index)=>{
            let thing = options.fn({data: datum, 
                index: index, 
                prefix:`${dataName}.${index}`,
                minusButton: new Handlebars.SafeString(`<a name="dc-remove-row" data-name="${dataName}" data-row="${index}">
                    <i class="fas fa-minus"></i>${minusText}
                </a>`)
            })
            return thing
        }).join("")}
        <li class="flexrow">
            <a name="dc-add-row" data-name="${dataName}" data-row-builder="${rowBuilder}">
                <i class="fas fa-plus"></i>${addText}
            </a>
        </li>
    </ol>`
})

Handlebars.registerHelper("dc-save", function(options) {
    let {saveText="DCBase.Save"} = options.hash
    return new Handlebars.SafeString(`<footer class="form-footer">
        <button name="dc-submit">
            <i class="fas fa-save"></i> ${game.i18n.localize(saveText)}
        </button>
    </footer>`)
})

export class DCForm extends FormApplication {
	constructor(entity, initialData = {}, staticData = {}) {
		super(entity)
        this.data = initialData
        this.staticData = staticData
    }
    
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
			submitOnChange: true,
			closeOnSubmit: false,
        });
	}

	async _updateObject(_, formData) {
        let data = flattenData({}, formData)
		log("Form data", formData, data)
		this.data = data
    }
    
    getData() {
		return {...this.staticData, ...this.data}
    }

    mutate(mutator) {
        return async (event)=> {
            event.preventDefault()
            await this.submit()
            await mutator(event)
            this.render()
        }
    }

    async onSave() {}
    
    activateListeners(html) {
        super.activateListeners(html)
        html.find("a[name='dc-add-row']").on("click", this.mutate(ev=>{
            let target = ev.currentTarget
            let dataName = target.attributes["data-name"].value
            let rowBuilderName = target.attributes["data-row-builder"].value
            let rowBuilder = this[rowBuilderName]
            let data = this.data[dataName] || []
            data.push(rowBuilder())
            this.data[dataName] = data
        }))
        html.find("a[name='dc-remove-row']").on("click", this.mutate(ev=>{
            let target = ev.currentTarget
            let dataName = target.attributes["data-name"].value
            let row = parseInt(target.attributes["data-row"].value)
            let data = this.data[dataName] || []
            data.splice(row, 1)
            this.data[dataName] = data
        }))
        html.find("button[name='dc-submit']").on("click", async ev=>{
            ev.preventDefault()
            await this.submit()
            log.debug("Saving", this.data)
            await this.onSave()
        })
	}
}