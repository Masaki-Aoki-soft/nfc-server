import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { csrf } from 'hono/csrf';
import { lightOn } from './LightOn';
import { lightOff } from './LightOff';
import { lightNight } from './LightNight';
import { airHot } from './AirHot';
import { airCold } from './AirCold';
import { airHigh } from './AirHigh';
import { airOff } from './AirOff';
import { wol } from './Wol';

const app = new Hono();

app.use('*', cors());
app.use('*', logger());
app.use('*', csrf());

const MargedApp = app
    .route('/', lightOn)
    .route('/', lightOff)
    .route('/', lightNight)
    .route('/', airHot)
    .route('/', airCold)
    .route('/', airHigh)
    .route('/', airOff)
    .route('/', wol);

export default MargedApp;
