/**
 * A composition context. Keeps track of some useful bits of data during construction of a Component.
 */
class CompContext {
	constructor(data) {
		this.data = data;
	}

	/**
	 * Creates a child context, keeps parent ID.
	 * @param {HTMLElement} E A parent element, corresponding to the child context being created.
	 */
	child(E) {
		let data = {...this.data, root: null};
		if (E.id) {
			data.parentID = E.id;
			data.stack = [...(this.data.stack || []), E.id];
		}
		return new CompContext(data);
	}

	/**
	 * Creates a hierarchical ID by joining whatever is in the data.stack array.
	 * @param {string} id An ID.
	 */
	id(id) {
		// return [...(this.data.stack || []), id].join('-');
		return [this.data.parentID, id].filter(v=>!!v).join('-');
	}

	/**
	 * Input ID, i.e. ID of a section's main input field. Contains a tool ID, a section ID, and a special input "in" ID.
	 * @param {string} id A section id.
	 */
	iid(id) {
		return [this.data.toolID, id, 'in'].filter(v=>!!v).join('-');
	}

	/**
	 * A data getter.
	 * @param {string} k A key.
	 */
	get(k) {
		return this.data[k];
	}

	/**
	 * A data setter.
	 * @param {string} k A key.
	 * @param {*} v A value to set.
	 */
	set(k, v) {
		return this.data[k] = v;
	}
}
