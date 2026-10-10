/* 部屋の温度・湿度を取得するAPI */

import { Hono } from 'hono';
import { env } from 'hono/adapter';

type AdafruitData = {
    value: string;
    created_at: string;
};

export const roomEnv = new Hono().get('/roomEnv', async (c) => {
    const { ADAFRUIT_IO_USERNAME } = env<{ ADAFRUIT_IO_USERNAME: string }>(c);
    const { ADAFRUIT_IO_KEY } = env<{ ADAFRUIT_IO_KEY: string }>(c);

    // ESP32 側で送信しているフィード名
    const temperatureUrl = `https://io.adafruit.com/api/v2/${ADAFRUIT_IO_USERNAME}/feeds/temperature/data/last`;
    const humidityUrl = `https://io.adafruit.com/api/v2/${ADAFRUIT_IO_USERNAME}/feeds/humidity/data/last`;

    const headers = {
        'X-AIO-Key': ADAFRUIT_IO_KEY,
    };

    try {
        // 温度と湿度を並列で取得
        const [temperatureRes, humidityRes] = await Promise.all([
            fetch(temperatureUrl, { method: 'GET', headers }),
            fetch(humidityUrl, { method: 'GET', headers }),
        ]);

        if (temperatureRes.ok && humidityRes.ok) {
            const temperatureData = (await temperatureRes.json()) as AdafruitData;
            const humidityData = (await humidityRes.json()) as AdafruitData;

            return c.json(
                {
                    success: 'success',
                    message: '温度・湿度を取得しました！',
                    data: {
                        temperature: Number(temperatureData.value), // ℃
                        humidity: Number(humidityData.value), // %
                        updatedAt: temperatureData.created_at, // 最終更新時刻 (UTC, ISO 8601)
                    },
                },
                200
            );
        } else {
            return c.json(
                {
                    success: 'false',
                    message: '温度・湿度を取得できませんでした。',
                },
                502
            );
        }
    } catch (e) {
        return c.json(
            {
                success: 'false',
                message: 'サーバーエラーが発生しました。',
            },
            500
        );
    }
});