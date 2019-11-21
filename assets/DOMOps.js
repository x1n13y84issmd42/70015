class DOMOps {
	constructor(E) {
		this.E = E;
		this.ID = E.id;
	}

	$(s) {
		return this.E.querySelectorAll(s);
	}

	$$(id, v) {
		if (v) {
			this.T([document.getElementById(`${this.ID}-${id}`)], v);
		} else {
			return document.getElementById(`${this.ID}-${id}`);
		}
	}

	removeChildren(e) {
		while (e.firstChild)
			e.removeChild(e.firstChild);
	}

	T(nodes, v) {
		for (let e of nodes) {
			switch (e.tagName) {
				case "INPUT":
				case "TEXTAREA":
					e.value = v;
				break;
	
				default:
					e.innerHTML = v;
				break;
			}
		}
	}
}