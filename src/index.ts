import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { csrf } from 'hono/csrf';
import { lightOn } from './LightOn';
import { lightOff } from './LightOff';
import { lightNight } from './LightNight';

const app = new Hono();

app.use('*', cors());
app.use('*', logger());
app.use('*', csrf());

const MargedApp = app.route('/', lightOn).route('/', lightOff).route('/', lightNight);

export default MargedApp;
