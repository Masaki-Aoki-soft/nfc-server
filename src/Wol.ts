/* パソコンを起動するAPI */

import { Hono } from 'hono';
import { env } from 'hono/adapter';

export const wol = new Hono().get('/wol', async (c) => {
    const { ADAFRUIT_IO_USERNAME } = env<{ ADAFRUIT_IO_USERNAME: string }>(c);
    const { ADAFRUIT_IO_KEY } = env<{ ADAFRUIT_IO_KEY: string }>(c);
    const { ADAFRUIT_FEED_KEY } = env<{ ADAFRUIT_FEED_KEY: string }>(c);
    const { MACADDRESS } = env<{ MACADDRESS: string }>(c);
    const url = `https://io.adafruit.com/api/v2/${ADAFRUIT_IO_USERNAME}/feeds/${ADAFRUIT_FEED_KEY}/data`;

    const adafruitBody = {
        value: MACADDRESS,
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
                    message: 'パソコンを起動しました！',
                    data: resData,
                },
                200
            );
        } else {
            return c.json({
                success: 'false',
                message: 'パソコンを起動できませんでした。',
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
