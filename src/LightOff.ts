/* 電気を消すAPI */

import { Hono } from 'hono';
import { env } from 'hono/adapter';

export const lightOff = new Hono().get('/LightOff', async (c) => {
    const { ADAFRUIT_IO_USERNAME } = env<{ ADAFRUIT_IO_USERNAME: string }>(c);
    const { ADAFRUIT_IO_KEY } = env<{ ADAFRUIT_IO_KEY: string }>(c);
    const { ADAFRUIT_FEED_KEY } = env<{ ADAFRUIT_FEED_KEY: string }>(c);
    const url = `https://io.adafruit.com/api/v2/${ADAFRUIT_IO_USERNAME}/feeds/${ADAFRUIT_FEED_KEY}/data`;

    const adafruitBody = {
        value: 'LIGHT_OFF',
    };

    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-AIO-Key': ADAFRUIT_IO_KEY,
            },
            body: JSON.stringify(adafruitBody),
        });

        const resData = await res.json();

        if (res.ok) {
            return c.json(
                {
                    success: 'success',
                    message: '電気をオフにしました！',
                    data: resData,
                },
                200
            );
        } else {
            return c.json({
                success: 'false',
                message: '電気をオフにできませんでした。',
            });
        }
    } catch (e) {
        return c.json(
            {
                success: 'success',
                message: 'サーバーエラーが発生しました。',
            },
            500
        );
    }
});
