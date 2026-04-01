(function () {
    const REACT_SRC = 'https://unpkg.com/react@18/umd/react.production.min.js';
    const REACT_DOM_SRC = 'https://unpkg.com/react-dom@18/umd/react-dom.production.min.js';
    const SHARED_UTILS_SRC = '/react-page-utils.js';
    const SCRIPT_ATTR = 'data-react-bootstrap-src';
    let mountCounter = 0;

    const runOnDomReady = (callback) => {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', callback, { once: true });
        } else {
            callback();
        }
    };

    const loadScript = (src) => new Promise((resolve, reject) => {
        const existingScript = document.querySelector(`script[${SCRIPT_ATTR}="${src}"]`)
            || Array.from(document.scripts).find((script) => script.src === src);

        if (existingScript) {
            if (existingScript.dataset.loaded === 'true') {
                resolve();
                return;
            }

            existingScript.addEventListener('load', () => resolve(), { once: true });
            existingScript.addEventListener('error', () => reject(new Error(`Failed to load ${src}`)), { once: true });
            return;
        }

        const script = document.createElement('script');
        script.src = src;
        script.async = true;
        script.dataset.loaded = 'false';
        script.setAttribute(SCRIPT_ATTR, src);
        script.addEventListener('load', () => {
            script.dataset.loaded = 'true';
            resolve();
        }, { once: true });
        script.addEventListener('error', () => reject(new Error(`Failed to load ${src}`)), { once: true });
        document.head.appendChild(script);
    });

    const ensureReactLoaded = () => {
        if (window.React && window.ReactDOM && typeof window.ReactDOM.createRoot === 'function') {
            return Promise.resolve();
        }

        return loadScript(REACT_SRC).then(() => loadScript(REACT_DOM_SRC));
    };

    const ensureSharedUtilsLoaded = () => {
        if (window.NibrasShared) {
            return Promise.resolve();
        }
        return loadScript(SHARED_UTILS_SRC).catch(() => Promise.resolve());
    };

    const mountInitializerWithReact = (initializer) => {
        runOnDomReady(() => {
            if (!(window.React && window.ReactDOM && typeof window.ReactDOM.createRoot === 'function')) {
                initializer();
                return;
            }

            mountCounter += 1;
            const rootNode = document.createElement('div');
            rootNode.id = `__react-bootstrap-root-${mountCounter}`;
            rootNode.style.display = 'none';
            document.body.appendChild(rootNode);

            const App = () => {
                window.React.useEffect(() => {
                    initializer();
                }, []);
                return null;
            };

            window.ReactDOM.createRoot(rootNode).render(window.React.createElement(App));
        });
    };

    window.bootstrapReactPage = (initializer) => {
        if (typeof initializer !== 'function') {
            return;
        }

        ensureReactLoaded()
            .then(() => ensureSharedUtilsLoaded())
            .then(() => mountInitializerWithReact(initializer))
            .catch(() => runOnDomReady(initializer));
    };

    window.NibrasReact = {
        run(initializer) {
            window.bootstrapReactPage(initializer);
        },
        get shared() {
            return window.NibrasShared || {};
        }
    };
})();
