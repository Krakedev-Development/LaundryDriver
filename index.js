import { registerRootComponent } from 'expo';
// Define la tarea de ubicación en segundo plano antes de montar la app: el sistema puede abrir
// la app solo para entregarle ubicaciones y la tarea debe existir en ese momento.
import './src/features/driver/model/backgroundLocation';
import App from './App';

registerRootComponent(App);
