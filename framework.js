// ---- helpers
function remove(arr, obj) {
    const index = arr.indexOf(obj);
    if (index === -1) return null;

    arr.splice(index, 1);
    return obj;
}
function array(len) { return [...Array(len)].map((x, i) => i); }
function assert(trueVal, msg) { if (!trueVal) { throw new Error(msg); } }

// ---- framework
const TEMP_DIV = document.createElement("div");

function createComponent(mountPoint, html) {
    const createDiv = document.createElement("div");
    createDiv.innerHTML = html;

    const selectedNodes = {};
    createDiv.querySelectorAll("[--id]")
        .forEach(sel => selectedNodes[sel.getAttribute("--id")] = sel);
    
    selectedNodes["component"] = createDiv.children[0];

    createDiv.childNodes.forEach(c => mountPoint.appendChild(c))
    
    return selectedNodes;
}


function createState(initialState) {
    let state = initialState, invokingEvent = false;
    const handlers = [];

    const get = () => state;

    const set = (val) => {
        if (invokingEvent) {
            // prevent infinite loops.
            return;
        }

        state = val;

        invokingEvent = true;
        try {
            // remove events for dom nodes that have disconnected themselves
            for(let i = handlers.length - 1; i >= 0; i--) {
                if (!handlers[i][0].isConnected) {
                    handlers.splice(i, 1);
                    continue;
                }

                handlers[i][1](state);
            }
        } finally {
            invokingEvent = false;
        }
    }

    // if several dom nodes get unsubscribed but this event is never invoked later, then we have leaked memory
    const subscribe = (domNode, callback) => {
        assert(domNode instanceof Element, "events must be subscribed to dom elements, so they can be automatically unsubscribed");

        handlers.push([domNode, callback]);
        invokingEvent = true;
        try {
            callback(state);
        } finally {
            invokingEvent = false;
        }
    }

    return [get, set, subscribe];
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