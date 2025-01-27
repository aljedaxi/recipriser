import {Recipe} from 'https://esm.sh/@cooklang/cooklang-ts'

const source = `
>> source: https://www.dinneratthezoo.com/wprm_print/6796
>> total time: 6 minutes
>> servings: 2

Place the @apple juice{1.5%cups}, @banana{one sliced}, @frozen mixed berries{1.5%cups} and @vanilla greek yogurt{3/4%cup} in a #blender{}; blend until smooth. If the smoothie seems too thick, add a little more liquid (1/4 cup).

Taste and add @honey{} if desired. Pour into two glasses and garnish with fresh berries and mint sprigs if desired.
`;

const c = t => document.createElement (t)
const cp = t => props => {
	const e = c (t)
	for (const [k, v] of Object.entries(props)) e.setAttribute(k, v)
	return e
}
const cc = t => props => children => {
	const e = cp (t) (props)
	for (const child of children) e.append(child)
	return e
}
const c1c = t => child => {
	const e = c (t)
	e.append(child)
	return e
}
const input = (name, value) => cp ('input') ({name, id: name, value})
const field = (name, {value} = {}) => [
	cc ('label') ({for: name, value}) (name),
	input (name, value),
]
const fieldSet = (legend, children) =>
	cc ('fieldset') ({id: legend}) ([ cc ('legend') ({}) ([legend]), ...children ])
const fields = names =>
	[...Object.entries(names)].flatMap(([name, value]) => field(name, {value}))

const groups = props => [...Object.entries(props)].flatMap(([k, v]) => fieldSet(k, fields(v)))
class Comp extends HTMLElement {
	a = (...ks) => Object.fromEntries(ks.map(k => [k, this.getAttribute(k)]))
	constructor() { super() }
}
class Step extends Comp {
	connectedCallback() {
		const {idx} = this.dataset
		const set = fieldSet(`step ${idx}`, [])
		for (const e of this.querySelectorAll('*')) {
			set.appendChild(e)
		}
		this.append(set)
	}
}
class Text extends Comp {
	get step() {
		return this.closest('recipe-step')
	}
	handleInput = e => {
		const {inputType, data, target} = e
		if (inputType === 'insertText' && data === '@') {
			this.insertIngredient()
			if (target.value.endsWith('@')) {
				target.value = target.value.slice(0, -1)
			}
		}
	}
	insertIngredient = () => {
		const ingredient = cp ('step-ingredient') ({})
		this.insertAdjacentElement('afterend', ingredient)
		ingredient.nameInput.focus()
		if (ingredient.nextELementSibling?.tagName === 'STEP-TEXT') {
			return
		}
		const furtherText = cp ('step-text') ({})
		ingredient.insertAdjacentElement('afterend', furtherText)
	}
	connectedCallback() {
		const {value} = this.dataset
		const id = 'uhhhh'
		this.input = cc ('textarea') ({name: id, id, rows: 1}) ([value?.trim() ?? ''])
		this.input.addEventListener('input', this.handleInput)
		this.append(this.input)
	}
}
const genId = _ => globalThis.crypto.randomUUID ()
const idedInput = id => name => rest => cp ('input') ({id: `${id}.${name}`, name: `${id}.${name}`, ...rest})
class Ingredient extends HTMLElement {
	constructor() {super()}
	a = (...ks) => Object.fromEntries(ks.map(k => [k, this.getAttribute(k)]))
	foodOption = data => document.querySelector(`datalist#food-names option[value="${data}"]`)
	populateFoodId = data => {
		const option = this.foodOption(data)
		if (!option) return
		const {id, dataset: {measure}} = option
		this.setAttribute('data-food-id', id)
		this.querySelector('datalist')?.remove()
		this.append(cc ('datalist') ({id: `${this.id}-measures`}) ([
			...measure.split(';').map(cc ('option') ({}))
		]))
	}
	handleInput = e => {
		const {data, inputType} = e
		if (inputType !== 'insertReplacementText') return
		this.populateFoodId(data)
	}
	connectedCallback() {
		const {name = '', quantity = '', units = ''} = this.dataset
		this.setAttribute('id', genId())
		const {id} = this
		this.nameInput = idedInput (id) ('name') ({value: name?.trim() ?? '', list: 'food-names'})
		this.unitsInput = idedInput (id) ('units') ({value: units?.trim() ?? '', list: `${id}-measures`})
		this.quantityInput = input(`${id}.quantity`, quantity?.trim() ?? 'some')
		const {nameInput, unitsInput, quantityInput} = this
		nameInput.addEventListener('input', this.handleInput)
		this.populateFoodId(name)
		this.append('@', nameInput, '{', quantityInput, '%', unitsInput, '}')
	}
}
class Cookware extends Comp {
	connectedCallback() {
		const {name, quantity} = this.dataset
		this.setAttribute('id', genId())
		const {id} = this
		const nameInput = idedInput (id) ('name') ({value: name?.trim() ?? ''})
		const quantityInput = idedInput (id) ('quantity') ({value: quantity?.trim() ?? ''})
		this.append ('#', nameInput, '{', quantityInput, '}')
	}
}
const mapKeys = f => o => Object.fromEntries(Object.entries(o).map(([k, v]) => [f(k), v]))
const appendToKeys = s => mapKeys(k => `${s}${k}`)
class Editor extends Comp {
	connectedCallback() {
		const recipe = new Recipe(source)
		const {metadata, steps} = recipe
		console.log({steps})
		this.prepend(cc ('style') ({}) ([`
			fieldset {
				display: flex;
				gap: 4px;
				flex-flow: wrap;
				align-items: center;
			}
			fieldset#metadata {
				display: grid;
				grid-template-columns: 1fr 2.4142135623730950488016887fr;
			}
		`]))
		this.append(...groups({metadata}))
		this.append(...steps.map((step, idx) => cc ('recipe-step') ({'data-idx': idx + 1}) (
			step.map(({type, ...rest}) => cp (`step-${type}`) (appendToKeys ('data-') (rest)))
		)))
	}
}

customElements.define('custom-editor', Editor)
customElements.define('recipe-step', Step)
customElements.define('step-text', Text)
customElements.define('step-ingredient', Ingredient)
customElements.define('step-cookware', Cookware)
