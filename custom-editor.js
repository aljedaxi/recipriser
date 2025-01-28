import {Recipe} from 'https://esm.sh/@cooklang/cooklang-ts'
import set from 'https://esm.sh/lodash.set'
import {c, cp, cc, c1c, input, field, fieldSet, fields, groups, genId, idedInput, prependKeys, text, recipize} from './util.js'
const hasValue = (s = '') => s.trim().length > 0

const source = `
>> source: https://www.dinneratthezoo.com/wprm_print/6796
>> total time: 6 minutes
>> servings: 2

Place the @apple juice{1.5%cups}, @banana{one sliced}, @frozen mixed berries{1.5%cups} and @vanilla greek yogurt{3/4%cup} in a #blender{}; blend until smooth. If the smoothie seems too thick, add a little more liquid (1/4 cup).

Taste and add @honey{} if desired. Pour into two glasses and garnish with fresh berries and mint sprigs if desired.
`;

class Comp extends HTMLElement {
	a = (...ks) => Object.fromEntries(ks.map(k => [k, this.getAttribute(k)]))
	constructor() { super() }
}
class Text extends Comp {
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
		const {id} = this
		const name = `${id}.value`
		this.input = cc ('textarea') ({name, id: name, rows: 1}) ([value?.trim() ?? ''])
		this.input.addEventListener('input', this.handleInput)
		this.append(this.input)
	}
}
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
			...measure.split(';').map(c1c ('option'))
		]))
	}
	handleInput = e => {
		const {data, inputType} = e
		if (inputType !== 'insertReplacementText') return
		this.populateFoodId(data)
	}
	connectedCallback() {
		const {name = '', quantity = '', units = ''} = this.dataset
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
		const {id} = this
		const nameInput = idedInput (id) ('name') ({value: name?.trim() ?? ''})
		const quantityInput = idedInput (id) ('quantity') ({value: quantity?.trim() ?? ''})
		this.append ('#', nameInput, '{', quantityInput, '}')
	}
}
class Editor extends Comp {
	fetchRecipe = path => fetch(new URL(path, window.location)).then(text).then(recipize)
	stepVerb = (step, i) => {
		const id = `step[${i}]`
		const steps = step.map(
			({type, ...rest}, j) => cp (`step-${type}`) ({
				id: `step[${i}][${j}]`,
				...prependKeys ('data-') (rest),
			})
		)
		return cc ('fieldset') ({id}) ([
			c1c ('legend') (`step ${i + 1}`),
			...steps,
		])
	}
	form2json = formdata => {
		const steps = {}
		const metadata = {}
		for (const k of formdata.keys()) {
			if (/step/i.test(k)) {
				set(steps, k, formdata.get(k))
			} else {
				metadata[k] = formdata.get(k)
			}
		}
		const {step} = steps
		return {metadata, steps: step}
	}
	form2recipe = formdata => {
		const recipe = new Recipe()
		const {metadata, steps} = this.form2json(formdata)
		recipe.metadata = metadata
		recipe.steps = steps.map((s, i) => s.map((x, j) => {
			const {tagName} = this.querySelector (`#step\\[${i}\\]\\[${j}\\]`)
			const type = tagName.replace(/STEP-/, '').toLowerCase()
			return {type, ...x}
		}))
		return recipe
	}
	entries = o => [...Object.entries(o)]
	formatMeta = r => this.entries(r.metadata).map(([k, v]) => `>> ${k}: ${v}`).join('\n')
	formatIngredient = ({name, quantity, units}) =>
		hasValue(units) ? `@${name}{${quantity}%${units}}` : `@${name}{${quantity}}`
	formatSteps = r => r.steps
		.map(s => s
			 .map(({type, value, name, quantity, units}) =>
				 type === 'text'       ? value
			   : type === 'ingredient' ? this.formatIngredient({name, quantity, units})
			   :                         value ?? name
			 )
			 .join(' '))
		.join('\n\n')
	format = r => [this.formatMeta(r), '\n', this.formatSteps(r)].join('\n')
	dlString = s => download => {
		const href = `data:text/plain;charset=utf-8,${encodeURIComponent(s)}`
		const anchor = cp ('a') ({href, download})
		anchor.click()
	}
	handleSubmit = e => {
		e.preventDefault()
		const recipe = this.form2recipe (new FormData(e.target))
		const {metadata: {title}} = recipe
		this.dlString (this.format(recipe)) (`${title}.cook`)
	}
	buildUi = ({metadata, steps}) => {
		const form = cc ('form') ({}) ([
			fieldSet ('actions') ([
				cc ('button') ({type: 'button'}) (['fetch']),
				cc ('button') ({type: 'submit'}) (['submit']),
			]),
			...groups({metadata}),
			...steps.map(this.stepVerb)
		])
		form.addEventListener('submit', this.handleSubmit)
		this.append(form)
	}
	connectedCallback() {
		this.fetchRecipe('./cook/Vegan_Spaghetti_ai_Funghi_(Spaghetti_and_Mushrooms_in_Vegan_Cream_Sauce).cook')
			.then(this.buildUi)
	}
}

customElements.define('custom-editor', Editor)
customElements.define('step-text', Text)
customElements.define('step-ingredient', Ingredient)
customElements.define('step-cookware', Cookware)
