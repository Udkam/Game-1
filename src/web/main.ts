import './styles.css';
import { LEVELS } from '../engine/levels.js';
import { App } from './ui.js';

const root = document.getElementById('app');
if (root) new App(root, LEVELS).start();
