function renderList(mountPoint, wantedCount, renderFn, ...args) {
    while (mountPoint.childNodes.length < wantedCount) {
        renderFn(mountPoint, ...args);
    }
    
    while (mountPoint.childNodes.length > wantedCount) {
        mountPoint.removeChild(mountPoint.childNodes[mountPoint.childNodes.length - 1])
    }
}

function renderKeyedList(mountPoint, listElements, newElementsBuffer, keyNodeMap, keyFn, renderFn, ...args) {
    for(const data of keyNodeMap.values()) {
        data.shouldDelete = true;
    }

    newElementsBuffer.splice(0, newElementsBuffer.length);

    for(const obj of listElements) {
        const key = keyFn(obj);
        if (!keyNodeMap.has(key)) {
            const { component: newEl } = renderFn(mountPoint, obj, ...args);
            keyNodeMap.set(key, {
                el: newEl,
                shouldDelete: false,
            });
        }
        
        const data = keyNodeMap.get(key);
        data.shouldDelete = false;
        newElementsBuffer.push(data.el);
    }

    for(const [key, data] of keyNodeMap.entries()) {
        if (data.shouldDelete) {
            keyNodeMap.delete(key);
        }
    }

    mountPoint.replaceChildren();
    mountPoint.replaceChildren(...newElementsBuffer);
    newElementsBuffer.splice(0, newElementsBuffer.length);
}

function createColorList(mountPoint, ctx) {
    const [getColors, setColors, onColorsChange] = ctx.colors;

    const { component, colorsList, shuffleBtn, sortBtn, infoText } = createComponent(
        mountPoint,
        `<div>
            <button --id="shuffleBtn">Shuffle</button>
            <button --id="sortBtn">Sort</button>
            <div>
                The following is a demo that shuffles a bunch of divs around inside another div.
                5000 or so divs are initialized to some color, which never changes, but the order is always randomized, so 
                a list rendering algorithm based on keys can be used.
                It is surprisingly difficult to do this at 60FPS - 
                if you know how to speed it up, you will be rich (seeing as this demo made by _me_ prompted you to figure it out, how about telling me how you dit it? eh? ol buddy ol pal?).
                In the meantime, enjoy the loud spinning of your computer fan
            </div>
            <div --id="infoText"></div>
            <div --id="colorsList"></div>
        </div>`
    );


    const csRGB = (col) => `${col[0]},${col[1]},${col[2]}`;
    const tempDiv = document.createElement("div");

    const keyNodeMap = new Map();
    const newElementsBuffer = [];

    onColorsChange(component, (colors) => {
        // This is really fast actually.
        // colorsList.innerHTML = colors.map(color => {
        //     return `<div style="background-color:rgb(${csRGB(color)});color: #FFF; display:inline-block; padding:10px;">
        //         ${csRGB(color)}
        //     </div>`; 
        // }).join('')

        // renderList(colorsList, getColors().length, (mountPoint) => createComponent(mountPoint, `<div style="color: #FFF; display:inline-block; padding:10px;"></div>`));
        // newElementsBuffer.splice(0, newElementsBuffer.length);
        // for(let i = 0; i < colorsList.childNodes.length; i++) {
        //     newElementsBuffer.push(colorsList.childNodes[i]);
        // }
        // colorsList.replaceChildren()
        // for(let i = 0; i < colors.length; i++) {
        //     const node = newElementsBuffer[i];
        //     node.style.backgroundColor = `rgb(${csRGB(colors[i])})`;
        //     node.textContent = csRGB(colors[i]);
        // }
        // colorsList.replaceChildren(...newElementsBuffer);

        renderKeyedList(
            colorsList, 
            getColors(), 
            newElementsBuffer,
            keyNodeMap, 
            csRGB, 
            (mountPoint, color) => {
                return createComponent(mountPoint, `<div style="background-color:rgb(${csRGB(color)});color: #FFF; display:inline-block; padding:10px;">${csRGB(color)}</div>`);
            }
        );
    })

    const shuffleColors = () => {
        const colors = getColors();
        for(let i = 0; i < colors.length; i++) {
            const idx = Math.floor(Math.random() * colors.length);
            [colors[i], colors[idx]] = [colors[idx], colors[i]];
        }

        setColors(colors);
    }

    shuffleBtn.addEventListener("click", shuffleColors);

    sortBtn.addEventListener("click", () => {
        const sortVal = el => el[0] + el[1] + el[2];
        const colors = getColors();
        colors.sort((a, b) => {
            return sortVal(a) - sortVal(b);
        });
        setColors(colors);
    })

    const shuffleColorsAnimation = createAnimation((dt) => {
        shuffleColors();
        infoText.textContent = `Shuffling ${colorsList.childNodes.length} colors at ${1/dt} FPS`
    })
    shuffleColorsAnimation();

    return component;
}

function min(a, b) { return a < b ? a : b; }
const count = min(255* 255 * 255, 5000)
let initialColors = [];

(() => {
    let i = 0;
    for(let r = 0; r < 255; r+=15) {
        for(let g = 0; g < 255; g+=13) {
            for(let b = 0; b < 255; b+=15) {
                if (i >= count) {
                    return;
                }
                
                initialColors.push([r, g, b]);

                i++;
            }
        }
    }
})();

const ctx = {
    colors: createState(initialColors),
}

createColorList(document.getElementById("app"), ctx)