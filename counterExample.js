// This doesn't need to be global state.
// We can just as easily create this in the root element and pass it down to every child.
// And devoid of React's Context, that is exactly how I would go about giving
// deep child access to root state
const ctx = {
    counterState: createState(0)
}


function createCounterApp(mountPoint) {
    const { counterContainer, btn, progressBar, progressHead, progressContainer } = createComponent(
        mountPoint,
        `<h1>Event primitive</h1>
        <style scoped>
            // .progress-inner, .progress-remaining {
            //     height: 20px;
            // }

            .progress-inner {
                background-color: green;
                opacity: 0.6;
            }

            .progress-remaining {
                background-color: yellow;
                opacity: 0.3;
            }

            .progress-head {
                width: 20px;
                background-color: blue;
                opacity: 0.3;
                cursor: col-resize;
            }
            .progress-head:hover {
                opacity: 1;
            }
            .progress-container{
                display:flex;
                flex-direction:row;
                height:20px;
                background-color: yellow;
            }
        </style>
        <div>Drag the progress bar. Or click 'add'</div>
        <div --id="progressContainer" class="progress-container">
            <div --id="progressBar" class="progress-inner"></div>
            <div --id="progressHead" class="progress-head"></div>
        </div>
        <div --id="counterContainer"></div>
        <button --id="btn">Add</button>`
    );

    const [getCount, setCount, onCountChange] = ctx.counterState;

    onCountChange(progressBar, (count) => {
        progressBar.style.width = `${(count / 200) * 100}%`;
    })

    let start;
    onDrag(progressHead, {
        onDragStart(x) {
            start = x - progressContainer.getBoundingClientRect().left;
        },
        onDrag(dx, dy) {
            const newVal = Math.floor(((start + dx) / progressContainer.getBoundingClientRect().width) * 200);
            setCount(newVal);
        }
    })

    btn.addEventListener("click", () => {
        setCount(getCount() + 1);
    })

    setInterval(() => {
        setCount(getCount() + 1);
    }, 1000)

    for(let i = 0; i < 60; i++) {
        const { component:row } = createComponent(counterContainer, `<div></div>`);
        for(let j = 0; j < 40; j++) {
            createCounter(row, ctx);
        }
    }
}

function createCounter(mountPoint, ctx) {
    const { text } = createComponent(
        mountPoint,
        `<span --id="text"></span>`
    )

    const [_, __, onCountChange] = ctx.counterState;

    onCountChange(text, (count) => text.textContent = count);
}
