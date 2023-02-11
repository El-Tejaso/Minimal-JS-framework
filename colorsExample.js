function createColorListBenchmarkApp(mountPoint) {
    const ctx = {
        colors: createState(initialColors),
    }

    const [getColors, setColors, onColorsChange] = ctx.colors;

    const { component, colorsList, shuffleBtn, sortBtn, infoText, startBtn } = createComponent(
        mountPoint,
        `<div>
            <style scoped>
                .color-box {
                    font-size: 4px;
                    color: #FFF;
                    display:inline-block; 
                    padding:2px;
                }
                .color-box-container {
                    line-height: 0px;
                }
            </style>
            <div>
                The following is a demo that shuffles a bunch of divs around inside another div.
                5000 or so divs are initialized to some color, which never changes, but the order is always randomized, so 
                a list rendering algorithm based on keys can be used.
                It is surprisingly difficult to do this at 60FPS.
                In the meantime, click the 'Start' button below, and enjoy the loud spinning of your computer fan
            </div>
            <div --id="colorsList" class="color-box-container"></div>
            <div>
            <button --id="shuffleBtn">Shuffle</button>
            <button --id="sortBtn">Sort</button>
            <button --id="startBtn"></button>
            </div>
            <div --id="infoText" style="font-family:monospace"></div>
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
                return createComponent(mountPoint, `<div class="color-box" style="background-color:rgb(${csRGB(color)});">${csRGB(color)}</div>`);
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

    let paused = true;
    const shuffleColorsAnimation = createAnimation((dt) => {
        const fps = Math.floor(1/dt);
        if (paused) {
            infoText.textContent = `Doing nothing at ${fps} FPS`
            return;
        }
        
        shuffleColors();
        infoText.textContent = `Shuffling ${colorsList.childNodes.length} colors at ${fps} FPS`
    })
    shuffleColorsAnimation();

    startBtn.addEventListener("click", () => {
        paused = !paused;
        startBtn.textContent = paused ? "Start" : "Stop";
    })
    startBtn.textContent = paused ? "Start" : "Stop";

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
