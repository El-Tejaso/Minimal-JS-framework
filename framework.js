/* __IF_DEBUG

const renderCounts = new Map();
function logRenders() {
    for(const [key, value] of renderCounts.entries()) {
        console.log(`Rendered ${key} ${value} times`);
    }
}

//*/

// ---- helpers
function asComponent(component) {
    if (!(component instanceof Component)) throw new Error("can only append Components here");
    return component
}
function max(a, b) { return a > b ? a : b; }
function min(a, b) { return a < b ? a : b; }
function swapRemove(arr, obj) {
    const index = arr.indexOf(obj);
    if (index === -1) return null;

    arr[index] = arr[arr.length - 1];
    arr.splice(arr.length - 1, 1);
    return obj;
}
function remove(arr, obj) {
    const index = arr.indexOf(obj);
    if (index === -1) return null;

    arr.splice(index, 1);
    return obj;
}
function removeIndexed(arr, obj) {
    const index = obj.index;
    assert(arr[index] === obj, "obj no longer present in array so it cant be removed");

    arr.splice(index, 1);
    return obj;
}
function array(len) { return [...Array(len)].map((x, i) => i); }
function assert(trueVal, msg) { if (!trueVal) { throw new Error(msg); } }

// ---- framework
const createDiv = document.createElement("div");
const TEMP_DIV = document.createElement("div");

function makeErr(message, snippet) {
    const component = createComponent("ErrorNode::" + message, `<div style="background-color:white; border: 1px red solid; color: red; padding:10px; margin: 10px;"><div style="font-weight: bold">${message}</div><div --id="snippet"></div></div>`);
    component.selectedNodes.snippet.domNode.innerText = snippet; // to render HTML as code and not as HTML
    return component;
};

/**
 * @param {String} html 
 * @returns {Component}
 */
function createComponent(name, html) {
    if (!html) {
        return makeErr("createComponent(name, html) expects both arguments, you may have forgotten to specify a name", name);
    }

    createDiv.innerHTML = html;
    if (createDiv.children.length !== 1) {
        return makeErr("Templates must have exactly 1 root node", html);
    }

    const node = newComponent(name, createDiv.children[0]);
    createDiv.removeChild(node.domNode);
    return node;
}
const idComponents = {};
function getElementByIdWrapped(id) {
    const existing = idComponents[id];
    if (existing) {
        return asComponent(existing);
    }

    const domNode = document.getElementById(id);
    assert(domNode !== null, "ID wasn't present: #" + id);

    const component = newComponent("#" + id, domNode, () => {}, () => {});
    idComponents[id] = component;
    return component;
}

function newComponent(name, domNode) { return new Component(name, domNode); }

class Component {
    constructor(name, domNode) {
        if (!(domNode instanceof Element)) throw new Error("can only create components from dom nodes");

        this.name = name;

        /** @type { Element } */
        this.domNode = domNode;
        /** @type { Array<Component> } */
        this.childComponents = [];
        this.detachHandlers = [];
        this.init = () => {};
        this.destroy = () => {};
        this.onRerender = () => {};
        this.afterRender = () => {};
        this.onResize = () => {};
        this.suspendNode = null;

        this.index = -1;
        this.data = {};
        this.__isRendering = false;

        // find all children with --id
        const nodes = domNode.querySelectorAll("[--id]");
        const selectedDomNodes = {};
        for(const node of nodes) {
            const name = node.getAttribute("--id");
            selectedDomNodes[name] = node;
            // make sure it can never be selected by this loop again
            node.removeAttribute("--id");
        }

        // wrap them in a component in the second loop.
        // this is so that stuff like <div --id="outer">< --id="inner" span></span></div>
        // will still work

        /** @type { Object.<string, Component> } */
        this.selectedNodes = { };
        for(const name in selectedDomNodes) {
            const component = new Component(this.name + "." + name, selectedDomNodes[name]);
            this.selectedNodes[name] = component;
            component.index = this.childComponents.length;
            this.childComponents.push(component);
        }
    }

    /**
     * 
     * @param  {...Component} components 
     * @returns {Array<Component>}
     */
    appendChildren(...components) {
        for(const componentIn of components) {
            this.insertChild(this.domNode.children.length, componentIn);
        }

        return components;
    }

    addDetatchHandler(fn) {
        this.detachHandlers.push(fn);
    }

    removeChild(componentIn) {
        if (this.childCount() === 0) return;

        const component = asComponent(componentIn);

        this.domNode.removeChild(component.domNode);

        let removed = removeIndexed(this.childComponents, component);

        assert(removed !== null);

        component.invokeDetatchEvent();

        component.destroy && component.destroy();
    }

    invokeDetatchEvent() {
        for(const childComponent of this.childComponents) {
            childComponent.invokeDetatchEvent(childComponent);
        }
        this.detachHandlers.forEach(fn => fn());
    }

    /** @returns {number} */
    childCount() { return this.childComponents.length; }
    /** @returns {Component} */
    childAt(index) { return this.childComponents[index]; }
    insertChild(index, componentIn) {
        const component = asComponent(componentIn);

        assert(index >= 0 && index <= this.domNode.children.length, "insertion index out of bounds: " + index);

        if (this.domNode.children.length === index) {
            this.domNode.appendChild(component.domNode);
        } else {
            this.domNode.children[index].insertAdjacentElement("beforebegin", component.domNode)
        }

        component.index = this.childComponents.length;
        this.childComponents.push(component);

        // rerender
        this.__resize();

        component.init && component.init();
    }

    rerenderNextFrame() {
        window.requestAnimationFrame(() => this.rerender());
    }

    rerender() {
        if (this.domNode.ownerDocument === null) return;
        if (this.__isRendering) return;
        this.__isRendering = true;

/* __IF_DEBUG

        if (!renderCounts.has(this.name)) {
            renderCounts.set(this.name, 0)
        }
        renderCounts.set(this.name, renderCounts.get(this.name) + 1);

//*/

        this.onRerender();
        for(const child of this.childComponents) {
            child.rerender();
        }
        this.afterRender();

        this.__isRendering = false;
    }

    __resize() {
        this.onResize();
        for(const c of this.childComponents) {
            c.__resize();
        }

        this.rerender();
    }

    subscribe(event, fn) {
        event.subscribe(this, fn);
        fn();
    }

    // Actually super slow if only one or two things have changed.
    renderList(listData, listMap, keyFn, renderFn) {
        const toDelete = new Map();
        for(const [k, v] of listMap.entries()) {
            if (v.domNode.parentElement !== this.domNode) continue;
            toDelete.set(k, v);
        }

        const newComponents = [];

        for(let i = 0; i < listData.length; i++) {
            const key = keyFn(listData[i], i);
            let component = listMap.get(key);
            if (!component) {
                component = renderFn(listData[i], i);
                listMap.set(key, component);
                this.insertChild(this.domNode.children.length, component);
            }

            newComponents.push(component);
            toDelete.delete(key);
        }

        // do DOM replacements when the node is detatched from the document, and then
        // swap the node back in once it is ready

        const parent = this.domNode.parentElement;
        if (parent !== null) {
            parent.replaceChild(TEMP_DIV, this.domNode);
        }
        
        for(const [key, value] of toDelete.entries()) {
            this.removeChild(value);
            listMap.delete(key);
        }

        this.domNode.replaceChildren(...newComponents.map(c => c.domNode));

        if(parent !== null) {
            parent.replaceChild(this.domNode, TEMP_DIV);
        }
    }
}

class ObservableEvent{
    constructor() {
        this.handlers = [];
    }
    subscribe(component, fn) {
        this.handlers.push(fn);
        
        component.addDetatchHandler(() => {
            swapRemove(this.handlers, fn);
        });
    }
    invoke(...args) {
        console.log("invoking an event wtih this many handlers: ", this.handlers.length)
        for(let i = 0; i < this.handlers.length; i++) {
            this.handlers[i](...args);
        }
    }
}

function createEvent() {
    return new ObservableEvent();
}

function createObservableState(initState) { 
    let state = initState;
    const event = new ObservableEvent(); 

    return [
        () => state,
        (newState) => {
            state = newState;
            event.invoke(newState);
        },
        event
    ]
}

function initApp(id, app) {
    const onResize = () => {
        app.__resize();
    };
    window.addEventListener("resize", onResize);
    app.addDetatchHandler(() => {
        window.removeEventListener("resize", onResize);
    })

    return getElementByIdWrapped(id).appendChildren(
        app
    )[0];
}

function createAnimation(animateFunc) {
    let t0, started = false;

    const animate = (t) => {
        if (t0 === null) {
            t0 = t;
        } else {
            let deltaTimeSeconds = (t - t0) / 1000;
            t0 = t;
    
            if (animateFunc(deltaTimeSeconds)) {
                started = false;
                console.log("||| Stopped animation");
                return;
            }
        }

        window.requestAnimationFrame(animate);
    }
    
    const startAnimation = () => {
        if (started) return;
        started = true;
        t0 = null;
        console.log(">>> Started animation");

        window.requestAnimationFrame(animate);
    }

    return startAnimation;
}