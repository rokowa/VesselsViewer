import { Control as olControl } from 'ol/control';
import { NewGameControl } from './game';

class MainControl {
    constructor(divMap, vessels, olMap) {
        const template = document.querySelector('#mainControlTemplate');
        const clone = document.importNode(template.content, true);

        this.divControl = clone.querySelector('#mainControl');

        this.newGameControl = null;

        clone.querySelector('#newGameButton').addEventListener('click', e => {
            if (this.newGameControl === null) {
                this.newGameControl = new NewGameControl(
                    divMap,
                    vessels,
                    olMap,
                    this
                );
                this.newGameControl.addToMap(olMap);
            }
        });

        this.control = new olControl({
            element: this.divControl,
        });
    }

    addToMap(map) {
        map.addControl(this.control);
    }
}

export { MainControl };
