function createDemoExplorerApp(mountPoint) {
    const { appList, exposition, exposition2, topTitle } = createComponent(
        mountPoint,
        `<div style="padding:10px;" class="explorer-app">
<style scoped>
    .explorer-app {
        font-family: "Arial", sans-serif;
    }
    .section {
        padding: 10px 100px;
        padding-bottom: 25px;
    }
    .section.one {
        padding: 10px 100px;
        padding-bottom: 25px;
        padding-top: 75px;
    }
    .weird-square {
        position:absolute;
        top: 0;
        left: 0;
        background: rgb(131,58,180);
        background: linear-gradient(90deg, rgba(131,58,180,1) 0%, rgba(29,253,175,1) 27%, rgba(252,176,69,1) 100%);
        height: 300px;
        width: 300vw;
        transform-origin: bottom left;
        transform: translate(-400px, -100px) rotate(-10deg); 
        z-index: -1;
    }
    .title {
        z-index: 2;
        font-size: 72px;
        font-weight: 700;
    }
    .abs{
        position: absolute;
        top:0;
        left:0;
    }
</style>
            <div class="section one">
                <div class="title"style="position:relative;height:2.5em;">
                    <div class="title abs" style="z-index:-2;opacity:1;">A minimal JavaScript framework</div>
                    <canvas class="weird-square" style="z-index:-1;opacity:1;"></canvas>
                    <div class="title abs" style="z-index:0;opacity:0.3" --id="topTitle">A minimal JavaScript framework</div>
                </div>
                <div --id="exposition"></div>
            </div>
            <div class="section">
                <div --id="exposition2"></div>
                <div --id="appList"></div>
            </div>
        </div>`
    );

    exposition.innerText = `Lately, I have been hacking away on random things using HTML and Javascript. As fun as it is, there comes a point where I can't really add more functionality to the program. This is usually because all of my state is global, and all my code is contained within a single <script></script> block. Frameworks like React and Solid allow programmers to separate their program into several re-useable components, and also provide primitives for reactivity, which can make app development much simpler. However, you would need to install NodeJS, onto your computer if you wanted to use those frameworks, since they rely on bundlers and other stuff to convert the JSX into normal javascript that can be run on a browser. All of these levels of indirection that frameworks add can also make debugging certain bugs a nightmare.
    
    This 'framework' is not really a framework, but more like a couple of helper functions and a pattern that can make writing apps in vanilla-JS just as scaleable as any of those frameworks, without the need for build steps or any complicated setups.s`;

    exposition2.innerText = `Even though I believe that this framework can be used to make scaleable single page apps to the same extent as something like React, I would need to actually make some things in order to know for sure. The following are some examples of what can be done, though I intend to make some more complicated things in the near future.`

    let h = 0;
    const animateTitle = createAnimation((dt) => {
        h = (h + dt * 100) % 240;

        topTitle.style.color = `hsl(${h}, 100%, 50%)`;
    })
    animateTitle();

    const { component: physicsSimContainer } = createComponent(appList, "<div style=\"position: relative; height:400px;\"></div>");
    createPhysicsSimApp(physicsSimContainer);
    createColorListBenchmarkApp(appList);
    createCounterApp(appList);
}

createDemoExplorerApp(document.getElementById("app"));