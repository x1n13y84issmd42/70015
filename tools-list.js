class Tools {

	constructor(tw, th, container) {
		this.tx = 0;
		this.ty = 0;
		this.tw = tw;
		this.th = th;
		this.container = container;
		this.tools = [];
	}

	add(tileID) {
		let eTool = document.getElementById(tileID);
		this.tools.push(eTool);
	}
	
	unfocus(id) {
		let eTool = document.getElementById(id);
		if (eTool) {
			eTool.classList.replace('focused', 'unfocused')
		}
	}

	filter(s) {
		for (let tool of this.tools) {

			if (s) {
				for (let sch of s) {
					if (tool.dataset.tag.includes(sch)) {
						tool.classList.add("matched");
						tool.classList.remove("filteredOut");
					} else {
						tool.classList.add("filteredOut");
						tool.classList.remove("matched");
						break;
					}
				}
			} else {
				tool.classList.remove("filteredOut");
				tool.classList.remove("matched");
			}
		}
	}
}