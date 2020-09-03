import { Map, Vessels, Popup } from './viewer';
import { MainControl } from './control';

const divMap = document.getElementById('map');
const vessels = new Vessels();

const divPopup = document.getElementById('popup');
const popup = new Popup(divPopup);

const map = new Map(divMap);

const mainControl = new MainControl(divMap, vessels, map.olMap);

vessels.addToMap(map.olMap);
popup.addToMap(map.olMap);
mainControl.addToMap(map.olMap);

vessels.connect();
