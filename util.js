import {Recipe} from 'https://esm.sh/@cooklang/cooklang-ts'

export const c = t => document.createElement (t)
export const cp = t => props => {
	const e = c (t)
	for (const [k, v] of Object.entries(props)) e.setAttribute(k, v)
	return e
}
export const cc = t => props => children => {
	const e = cp (t) (props)
	for (const child of children) e.append(child)
	return e
}
export const c1c = t => child => {
	const e = c (t)
	e.append(child)
	return e
}
export const input = (name, value) => cp ('input') ({name, type: 'text', id: name, value})
export const field = (name, {value} = {}) => [
	cc ('label') ({for: name, value}) (name),
	input (name, value),
]
export const fieldSet = legend => children =>
	cc ('fieldset') ({id: legend}) ([ cc ('legend') ({}) ([legend]), ...children ])
export const fields = names =>
	[...Object.entries(names)].flatMap(([name, value]) => field(name, {value}))

export const groups = props => [...Object.entries(props)].flatMap(([k, v]) => fieldSet(k) (fields(v)))
export const genId = _ => globalThis.crypto.randomUUID ()
export const idedInput = id => name => rest => cp ('input') ({id: `${id}.${name}`, name: `${id}.${name}`, type: 'text', ...rest})
export const mapKeys = f => o => Object.fromEntries(Object.entries(o).map(([k, v]) => [f(k), v]))
export const prependKeys = s => mapKeys(k => `${s}${k}`)
export const text = r => r.text()
export const recipize = source => new Recipe(source)
