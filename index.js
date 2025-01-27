const pop = e => e.target.popoverTargetElement.showModal()

for (const el of document.querySelectorAll('.dialogpopper')) {
	el.addEventListener('click', pop)
}

document.querySelector('dialog#cookfiles form').addEventListener('submit', e => {
	const path = new FormData(e.target).get('filename')
	fetch(new URL(path, window.location)).then(r => r.text()).then(s => {
		document.querySelector('#editor [contentEditable]').innerText = s
	})
})
