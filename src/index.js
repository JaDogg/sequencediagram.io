import React from 'react';
import ReactDOM from 'react-dom';
import * as ac from './reducers'
import App from './views/App'
import registerServiceWorker from './registerServiceWorker';
import { createStore, bindActionCreators } from 'redux'
import { ActionCreators } from 'redux-undo';
import { serialize, deserialize } from './serialize'

// Useful to track "code coverage", i.e. what actions that automated tests
// dispatch. We want a test suite that dispatches all actions
const trackDispatchedActions = 0

let dispatched = {};

var store = createStore(ac.default);
function dispatch(action) {
    if (!action) {
        console.log('not dispatching: ' + action);
        return;
    }

    if (0) {
        console.log('dispatching ' + JSON.stringify(action));
    }

    if (trackDispatchedActions) {
        const key = action.type;
        if (!(key in dispatched)) {
            dispatched[key] = 0;
        }
        dispatched[key] = dispatched[key] + 1;
        console.log(dispatched);
    }

    return store.dispatch(action);
}
const boundActionCreators = bindActionCreators(ac, dispatch);

const defaultDiagram = '#o1,Foo;o2,Bar;m1,o1,o2,Baz';

function setupFromHash(hash) {
    let { objects, messages } = deserialize(hash.substring(1));
    dispatch(ac.replaceCore(objects, messages));
    dispatch(ActionCreators.clearHistory());
}

const hash = window.location.hash;
if (hash.length > 1) {
    setupFromHash(hash);
} else {
    setupFromHash(defaultDiagram);
}

window.addEventListener('keydown', function(e) {
    const z = 90;
    const Esc = 27;

    if (e.ctrlKey && e.keyCode === z) {
        dispatch(e.shiftKey ? ActionCreators.redo() : ActionCreators.undo());
    } else if (e.keyCode === Esc) {
        dispatch(ac.escapePendingOperation());
    }
});

window.addEventListener('hashchange', e => {
    if (!window.location.hash) {
        return;
    }

    if (window.location.hash.substring(1) !== serializeState()) {
        setupFromHash(window.location.hash);
    }
});

function serializeState() {
    const present = store.getState().core.present;
    let args = [ ...present.objects, ...present.messages ];
    return serialize(args);
}

function render() {
    ReactDOM.render(<App state={store.getState()} dispatch={dispatch} />, document.getElementById('root'));

    const result = serializeState();
    window.location.hash = result;
}
store.subscribe(render);
render();

registerServiceWorker(boundActionCreators.showWorksOffline, boundActionCreators.showNewContentAvailable);
