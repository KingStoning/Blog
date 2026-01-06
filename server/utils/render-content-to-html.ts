const VOID_TAGS = new Set([
	'area',
	'base',
	'br',
	'col',
	'embed',
	'hr',
	'img',
	'input',
	'link',
	'meta',
	'param',
	'source',
	'track',
	'wbr',
])

function escapeHtml(value: string) {
	return value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;')
}

function normalizeAttrName(name: string) {
	if (name === 'className')
		return 'class'

	return name.replace(/[A-Z]/g, char => `-${char.toLowerCase()}`)
}

function stringifyStyle(style: any) {
	if (!style || typeof style !== 'object')
		return String(style || '')

	return Object.entries(style)
		.map(([key, value]) => `${normalizeAttrName(key)}:${value}`)
		.join(';')
}

function renderAttributes(props?: Record<string, any>) {
	if (!props)
		return ''

	return Object.entries(props)
		.flatMap(([rawKey, rawValue]) => {
			if (rawValue === false || rawValue === undefined || rawValue === null)
				return []

			const key = normalizeAttrName(rawKey)

			if (rawValue === true)
				return [` ${key}`]

			if (key === 'style')
				rawValue = stringifyStyle(rawValue)

			const value = Array.isArray(rawValue) ? rawValue.join(' ') : String(rawValue)
			return [` ${key}="${escapeHtml(value)}"`]
		})
		.join('')
}

type MdcNode = {
	type?: string
	tag?: string
	tagName?: string
	value?: string
	props?: Record<string, any>
	properties?: Record<string, any>
	children?: MdcNode[]
}

function renderNode(node?: MdcNode | null): string {
	if (!node)
		return ''

	if (node.type === 'text')
		return escapeHtml(String(node.value ?? ''))

	if (node.type === 'comment')
		return ''

	if (node.type === 'root')
		return (node.children || []).map(renderNode).join('')

	const tag = node.tag || node.tagName
	if (!tag)
		return ''

	const attributes = renderAttributes(node.props || node.properties)
	const children = (node.children || []).map(renderNode).join('')

	if (VOID_TAGS.has(tag))
		return `<${tag}${attributes} />`

	return `<${tag}${attributes}>${children}</${tag}>`
}

export function renderContentToHtml(body?: MdcNode) {
	return renderNode(body)
}
